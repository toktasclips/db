/**
 * instagram-research — Supabase Edge Function
 * Uses Instagram Business Discovery API to fetch public Business/Creator account data.
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")       ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")               ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")  ?? "";

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
  const userId: string | undefined         = body.user_id;
  const targetUsername: string | undefined = body.target_username;

  if (!userId)          return json({ error: "user_id required" }, 400);
  if (!targetUsername)  return json({ error: "target_username required" }, 400);

  const cleanUsername = targetUsername.replace(/^@/, "").trim().toLowerCase();
  console.log(`[research] user=${userId} target=@${cleanUsername}`);

  // ── Fetch user's connection ────────────────────────────────────────────
  const { data: conn, error: connErr } = await sb
    .from("instagram_connections")
    .select("instagram_user_id, page_id, encrypted_access_token, token_expires_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (connErr) {
    console.error("[research] DB read failed:", connErr.message);
    return json({ error: "db_error" }, 500);
  }
  if (!conn) {
    console.error("[research] No active connection for user:", userId);
    return json({ error: "no_active_connection" }, 404);
  }

  // ── Token expiry check ────────────────────────────────────────────────
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    return json({ error: "token_expired" }, 401);
  }

  // ── Decrypt token ─────────────────────────────────────────────────────
  const { data: plainToken, error: decErr } = await sb.rpc("decrypt_ig_token", {
    encrypted_token: conn.encrypted_access_token,
    secret_key:      TOKEN_ENCRYPTION_KEY,
  });
  if (decErr || !plainToken) {
    console.error("[research] Decrypt failed:", decErr?.message);
    return json({ error: "decrypt_failed" }, 500);
  }
  const token: string = plainToken as string;
  const igId: string  = conn.instagram_user_id;

  console.log(`[research] Token decrypted. Querying Business Discovery for @${cleanUsername}`);

  // ── Business Discovery API ────────────────────────────────────────────
  const fields = [
    "business_discovery.fields(",
    "username,name,biography,followers_count,follows_count,media_count,",
    "profile_picture_url,website,",
    "media.limit(12){id,media_type,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count,caption}",
    ")",
  ].join("");

  const url =
    `https://graph.facebook.com/${GV}/${igId}` +
    `?fields=${encodeURIComponent(fields)}` +
    `&username=${encodeURIComponent(cleanUsername)}` +
    `&access_token=${token}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (data.error) {
    const code = data.error.code;
    const msg  = data.error.message ?? "";
    console.warn(`[research] API error code=${code}:`, msg);

    // 100: "Param username is not supported" or non-business account
    if (code === 100 || msg.includes("business")) {
      return json({ error: "not_business_account", detail: msg }, 422);
    }
    // 803: account not found / no matching IG account for that username
    if (code === 803) {
      return json({ error: "account_not_found" }, 404);
    }
    return json({ error: "api_error", detail: msg, code }, 502);
  }

  const bd = data.business_discovery;
  if (!bd) {
    console.warn("[research] No business_discovery in response");
    return json({ error: "not_business_account" }, 422);
  }

  console.log(`[research] Found @${bd.username} followers=${bd.followers_count}`);

  const profile = {
    username:            bd.username          ?? cleanUsername,
    name:                bd.name              ?? null,
    biography:           bd.biography         ?? null,
    followers_count:     bd.followers_count   ?? 0,
    follows_count:       bd.follows_count     ?? 0,
    media_count:         bd.media_count       ?? 0,
    profile_picture_url: bd.profile_picture_url ?? null,
    website:             bd.website           ?? null,
  };

  const media: unknown[] = (bd.media?.data ?? []).map((m: any) => ({
    id:             m.id,
    media_type:     m.media_type,
    thumbnail_url:  m.thumbnail_url  ?? null,
    media_url:      m.media_url      ?? null,
    permalink:      m.permalink      ?? null,
    published_at:   m.timestamp      ?? null,
    like_count:     m.like_count     ?? 0,
    comments_count: m.comments_count ?? 0,
    caption:        (m.caption ?? "").slice(0, 500),
  }));

  return json({ profile, media });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
