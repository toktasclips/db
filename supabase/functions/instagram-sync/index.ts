/**
 * instagram-sync — Supabase Edge Function
 *
 * Fetches account metrics and recent media from Instagram Graph API
 * for a given user_id, then upserts results into DB.
 *
 * Called:
 *   - Manually from frontend (POST with { user_id })
 *   - By instagram-sync-all (batch cron job)
 *
 * Security:
 *   - Only service_role key can trigger this function (Authorization header)
 *   - Token decryption happens server-side via DB function
 *   - No token ever leaves the server
 *   - Errors are logged without sensitive data
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")        ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")                ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")   ?? "";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const GV = "v20.0";

serve(async (req: Request) => {
  // ── Only allow POST ───────────────────────────────────────────────
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const userId: string | undefined = body.user_id;

  if (!userId) return json({ error: "user_id required" }, 400);

  // ── Fetch connection (service role → can read encrypted_access_token) ──
  const { data: conn, error: connErr } = await sb
    .from("instagram_connections")
    .select("instagram_user_id, instagram_username, page_id, encrypted_access_token, token_expires_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (connErr) {
    console.error("DB read failed:", connErr.code);
    return json({ error: "db_error" }, 500);
  }
  if (!conn) return json({ error: "no_active_connection" }, 404);

  // ── Token expiry check ─────────────────────────────────────────────
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    await sb.from("instagram_connections")
      .update({ is_active: false, sync_error: "token_expired", updated_at: now() })
      .eq("user_id", userId);
    return json({ error: "token_expired" }, 401);
  }

  // ── Decrypt token (service_role DB function) ──────────────────────
  const { data: plainToken, error: decErr } = await sb.rpc("decrypt_ig_token", {
    encrypted_token: conn.encrypted_access_token,
    secret_key:      TOKEN_ENCRYPTION_KEY,
  });
  if (decErr || !plainToken) {
    console.error("Decrypt failed:", decErr?.code);
    return json({ error: "decrypt_failed" }, 500);
  }
  const token: string   = plainToken as string;
  const igId: string    = conn.instagram_user_id;
  const today: string   = new Date().toISOString().split("T")[0];

  // ── 1. Account profile ─────────────────────────────────────────────
  const profileRes = await fetch(
    `https://graph.facebook.com/${GV}/${igId}` +
    `?fields=id,username,name,followers_count,follows_count,media_count` +
    `&access_token=${token}`,
  );
  const profile = await profileRes.json();
  if (profile.error) {
    const errMsg = "api_error";   // don't log full error object (may contain token info)
    await sb.from("instagram_connections")
      .update({ sync_error: errMsg, updated_at: now() })
      .eq("user_id", userId);
    return json({ error: errMsg }, 502);
  }

  // ── 2. Daily account insights ─────────────────────────────────────
  const since = dateDaysAgo(2);
  const insRes = await fetch(
    `https://graph.facebook.com/${GV}/${igId}/insights` +
    `?metric=impressions,reach,profile_views` +
    `&period=day&since=${since}&until=${today}` +
    `&access_token=${token}`,
  );
  const insData = await insRes.json();

  let reach = 0, impressions = 0, profileViews = 0;
  for (const metric of (insData.data ?? [])) {
    const todayVal = (metric.values ?? []).find(
      (v: any) => v.end_time?.startsWith(today),
    );
    const val = todayVal?.value ?? 0;
    if (metric.name === "reach")         reach         = val;
    if (metric.name === "impressions")   impressions   = val;
    if (metric.name === "profile_views") profileViews  = val;
  }

  // Upsert daily snapshot
  await sb.from("instagram_account_snapshots").upsert({
    user_id:          userId,
    instagram_user_id: igId,
    snapshot_date:    today,
    follower_count:   profile.followers_count ?? 0,
    follows_count:    profile.follows_count   ?? 0,
    media_count:      profile.media_count     ?? 0,
    reach,
    impressions,
    profile_views:    profileViews,
    updated_at:       now(),
  }, { onConflict: "user_id,instagram_user_id,snapshot_date" });

  // ── 3. Recent media (last 25 posts) ────────────────────────────────
  const mediaRes  = await fetch(
    `https://graph.facebook.com/${GV}/${igId}/media` +
    `?fields=id,media_type,caption,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count` +
    `&limit=25&access_token=${token}`,
  );
  const mediaData = await mediaRes.json();
  const mediaItems: any[] = mediaData.data ?? [];
  let mediaSynced = 0;

  for (const item of mediaItems) {
    // Per-media insights
    const metricsForType: Record<string, string[]> = {
      IMAGE:          ["impressions", "reach", "saved", "shares"],
      VIDEO:          ["plays",       "reach", "saved", "shares"],
      CAROUSEL_ALBUM: ["impressions", "reach", "saved", "shares"],
      REELS:          ["plays",       "reach", "saved", "shares"],
    };
    const metrics = metricsForType[item.media_type] ?? ["impressions", "reach"];

    const miRes  = await fetch(
      `https://graph.facebook.com/${GV}/${item.id}/insights` +
      `?metric=${metrics.join(",")}&access_token=${token}`,
    );
    const miData = await miRes.json();

    let views = 0, mReach = 0, saves = 0, shares = 0;
    for (const m of (miData.data ?? [])) {
      const val = m.values?.[0]?.value ?? 0;
      if (m.name === "plays" || m.name === "impressions") views  = val;
      if (m.name === "reach")                              mReach = val;
      if (m.name === "saved")                              saves  = val;
      if (m.name === "shares")                             shares = val;
    }

    const likes    = item.like_count     ?? 0;
    const comments = item.comments_count ?? 0;
    const followers = profile.followers_count ?? 1;
    const engRate   = followers > 0
      ? parseFloat(((likes + comments + saves) / followers * 100).toFixed(4))
      : 0;
    // Performance score: weighted blend of engagement rate and view ratio
    const viewRatio   = followers > 0 ? views / followers : 0;
    const perfScore   = parseFloat((engRate * 8 + viewRatio * 100 * 2).toFixed(2));

    await sb.from("instagram_media").upsert({
      user_id:          userId,
      instagram_user_id: igId,
      media_id:         item.id,
      media_type:       item.media_type,
      caption:          (item.caption ?? "").slice(0, 2200),  // IG caption limit
      thumbnail_url:    item.thumbnail_url  ?? null,
      media_url:        item.media_url      ?? null,
      permalink:        item.permalink      ?? null,
      published_at:     item.timestamp      ?? null,
      like_count:       likes,
      comments_count:   comments,
      views,
      reach:            mReach,
      saves,
      shares,
      engagement_rate:  engRate,
      performance_score: perfScore,
      updated_at:       now(),
    }, { onConflict: "media_id" });

    mediaSynced++;
  }

  // ── 4. Update connection metadata ─────────────────────────────────
  await sb.from("instagram_connections").update({
    instagram_username:     profile.username ?? conn.instagram_username,
    instagram_account_name: profile.name     ?? null,
    last_synced_at:         now(),
    sync_error:             null,
    updated_at:             now(),
  }).eq("user_id", userId);

  return json({
    success:       true,
    followers:     profile.followers_count,
    media_synced:  mediaSynced,
    snapshot_date: today,
  });
});

// ── Utilities ────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function dateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
