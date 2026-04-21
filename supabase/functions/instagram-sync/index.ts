/**
 * instagram-sync — Supabase Edge Function
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")        ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")                ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")   ?? "";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const GV = "v20.0";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const userId: string | undefined = body.user_id;

  if (!userId) return json({ error: "user_id required" }, 400);

  console.log(`[sync] Starting sync for user: ${userId}`);

  // ── Fetch connection ──────────────────────────────────────────────────
  const { data: conn, error: connErr } = await sb
    .from("instagram_connections")
    .select("instagram_user_id, instagram_username, page_id, encrypted_access_token, token_expires_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (connErr) {
    console.error("[sync] DB read failed:", connErr.message);
    return json({ error: "db_error" }, 500);
  }
  if (!conn) {
    console.error("[sync] No active connection for user:", userId);
    return json({ error: "no_active_connection" }, 404);
  }

  // ── Token expiry check ────────────────────────────────────────────────
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    await sb.from("instagram_connections")
      .update({ is_active: false, sync_error: "token_expired", updated_at: now() })
      .eq("user_id", userId);
    return json({ error: "token_expired" }, 401);
  }

  // ── Decrypt token ─────────────────────────────────────────────────────
  const { data: plainToken, error: decErr } = await sb.rpc("decrypt_ig_token", {
    encrypted_token: conn.encrypted_access_token,
    secret_key:      TOKEN_ENCRYPTION_KEY,
  });
  if (decErr || !plainToken) {
    console.error("[sync] Decrypt failed:", decErr?.message);
    return json({ error: "decrypt_failed" }, 500);
  }
  const token: string = plainToken as string;
  const igId: string  = conn.instagram_user_id;
  const today: string = new Date().toISOString().split("T")[0];

  console.log(`[sync] Token decrypted. Fetching profile for ig_id=${igId}`);

  // ── 1. Account profile ────────────────────────────────────────────────
  const profileRes = await fetch(
    `https://graph.facebook.com/${GV}/${igId}` +
    `?fields=id,username,name,followers_count,follows_count,media_count` +
    `&access_token=${token}`,
  );
  const profile = await profileRes.json();
  if (profile.error) {
    console.error("[sync] Profile API error:", JSON.stringify(profile.error));
    await sb.from("instagram_connections")
      .update({ sync_error: `api_error:${profile.error.code}:${profile.error.type}`, updated_at: now() })
      .eq("user_id", userId);
    return json({ error: "api_error", detail: profile.error.message, code: profile.error.code }, 502);
  }

  console.log(`[sync] Profile OK: @${profile.username} followers=${profile.followers_count}`);

  // ── 2. Daily account insights ─────────────────────────────────────────
  const since = dateDaysAgo(2);
  let reach = 0, impressions = 0, profileViews = 0;
  let websiteClicks: number | null = null;
  let phoneCallClicks: number | null = null;
  let emailContacts: number | null = null;
  let totalInteractions: number | null = null;
  let insightsRaw: unknown = null;

  try {
    const insMetrics = [
      "impressions", "reach", "profile_views",
      "website_clicks", "phone_call_clicks", "email_contacts", "total_interactions",
    ].join(",");

    const insRes = await fetch(
      `https://graph.facebook.com/${GV}/${igId}/insights` +
      `?metric=${insMetrics}` +
      `&period=day&since=${since}&until=${today}` +
      `&access_token=${token}`,
    );
    const insData = await insRes.json();

    if (insData.error) {
      console.warn("[sync] Insights not available:", insData.error.code, insData.error.message);
    } else {
      insightsRaw = insData;
      for (const metric of (insData.data ?? [])) {
        const todayVal = (metric.values ?? []).find(
          (v: any) => v.end_time?.startsWith(today),
        );
        const val = todayVal?.value ?? 0;
        if (metric.name === "reach")               reach              = val;
        if (metric.name === "impressions")         impressions        = val;
        if (metric.name === "profile_views")       profileViews       = val;
        if (metric.name === "website_clicks")      websiteClicks      = val;
        if (metric.name === "phone_call_clicks")   phoneCallClicks    = val;
        if (metric.name === "email_contacts")      emailContacts      = val;
        if (metric.name === "total_interactions")  totalInteractions  = val;
      }
      console.log(`[sync] Insights OK: reach=${reach} impressions=${impressions} profile_views=${profileViews} website_clicks=${websiteClicks}`);
    }
  } catch (e) {
    console.warn("[sync] Insights fetch threw:", e);
  }

  // Upsert daily snapshot
  const { error: snapErr } = await sb.from("instagram_account_snapshots").upsert({
    user_id:             userId,
    instagram_user_id:   igId,
    snapshot_date:       today,
    follower_count:      profile.followers_count  ?? 0,
    follows_count:       profile.follows_count    ?? 0,
    media_count:         profile.media_count      ?? 0,
    reach,
    impressions,
    profile_views:       profileViews,
    website_clicks:      websiteClicks,
    phone_call_clicks:   phoneCallClicks,
    email_contacts:      emailContacts,
    total_interactions:  totalInteractions,
    raw_payload:         insightsRaw,
    updated_at:          now(),
  }, { onConflict: "user_id,instagram_user_id,snapshot_date" });
  if (snapErr) console.error("[sync] Snapshot upsert error:", snapErr.message);
  else console.log("[sync] Snapshot upserted.");

  // ── 3. Recent media (last 25 posts) ──────────────────────────────────
  const mediaRes  = await fetch(
    `https://graph.facebook.com/${GV}/${igId}/media` +
    `?fields=id,media_type,caption,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count` +
    `&limit=25&access_token=${token}`,
  );
  const mediaData = await mediaRes.json();
  if (mediaData.error) {
    console.warn("[sync] Media fetch error:", mediaData.error.code, mediaData.error.message);
  }
  const mediaItems: any[] = mediaData.data ?? [];
  console.log(`[sync] Media items: ${mediaItems.length}`);
  let mediaSynced = 0;

  for (const item of mediaItems) {
    const metricsForType: Record<string, string[]> = {
      IMAGE:          ["impressions", "reach", "saved", "shares"],
      VIDEO:          ["plays",       "reach", "saved", "shares"],
      CAROUSEL_ALBUM: ["impressions", "reach", "saved", "shares"],
      REELS:          ["plays",       "reach", "saved", "shares"],
    };
    const metrics = metricsForType[item.media_type] ?? ["impressions", "reach"];

    let views = 0, mReach = 0, saves = 0, shares = 0;
    let mediaInsightsRaw: unknown = null;
    try {
      const miRes  = await fetch(
        `https://graph.facebook.com/${GV}/${item.id}/insights` +
        `?metric=${metrics.join(",")}&access_token=${token}`,
      );
      const miData = await miRes.json();
      if (miData.error) {
        console.warn(`[sync] Media insights error for ${item.id}:`, miData.error.code);
      } else {
        mediaInsightsRaw = miData;
        for (const m of (miData.data ?? [])) {
          const val = m.values?.[0]?.value ?? 0;
          if (m.name === "plays" || m.name === "impressions") views  = val;
          if (m.name === "reach")                              mReach = val;
          if (m.name === "saved")                              saves  = val;
          if (m.name === "shares")                             shares = val;
        }
      }
    } catch (e) {
      console.warn(`[sync] Media insights threw for ${item.id}:`, e);
    }

    const likes    = item.like_count     ?? 0;
    const comments = item.comments_count ?? 0;
    const followers = profile.followers_count ?? 1;
    // engagement_rate = (likes + comments + saves) / followers * 100
    const engRate   = followers > 0
      ? parseFloat(((likes + comments + saves) / followers * 100).toFixed(4))
      : 0;
    const viewRatio  = followers > 0 ? views / followers : 0;
    // performance_score: weighted sum of engagement + view ratio
    const perfScore  = parseFloat((engRate * 8 + viewRatio * 100 * 2).toFixed(2));

    const { error: mediaUpsertErr } = await sb.from("instagram_media").upsert({
      user_id:           userId,
      instagram_user_id: igId,
      media_id:          item.id,
      media_type:        item.media_type,
      caption:           (item.caption ?? "").slice(0, 2200),
      thumbnail_url:     item.thumbnail_url  ?? null,
      media_url:         item.media_url      ?? null,
      permalink:         item.permalink      ?? null,
      published_at:      item.timestamp      ?? null,
      like_count:        likes,
      comments_count:    comments,
      views,
      reach:             mReach,
      saves,
      shares,
      engagement_rate:   engRate,
      performance_score: perfScore,
      raw_payload:       mediaInsightsRaw,
      updated_at:        now(),
    }, { onConflict: "media_id" });
    if (mediaUpsertErr) console.error(`[sync] Media upsert error ${item.id}:`, mediaUpsertErr.message);
    else {
      mediaSynced++;
      // Daily stats snapshot for this media
      await sb.from("instagram_media_daily_stats").upsert({
        user_id:            userId,
        media_id:           item.id,
        snapshot_date:      today,
        like_count:         likes,
        comments_count:     comments,
        reach:              mReach,
        impressions:        views,
        views,
        total_interactions: likes + comments + saves + shares,
        raw_payload:        mediaInsightsRaw,
      }, { onConflict: "media_id,snapshot_date" });
    }
  }

  // ── 4. Update connection metadata ─────────────────────────────────────
  await sb.from("instagram_connections").update({
    instagram_username:     profile.username ?? conn.instagram_username,
    instagram_account_name: profile.name     ?? null,
    last_synced_at:         now(),
    sync_error:             null,
    updated_at:             now(),
  }).eq("user_id", userId);

  console.log(`[sync] Done. mediaSynced=${mediaSynced}`);

  return json({
    success:       true,
    followers:     profile.followers_count,
    media_synced:  mediaSynced,
    snapshot_date: today,
  });
});

function now(): string { return new Date().toISOString(); }

function dateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
