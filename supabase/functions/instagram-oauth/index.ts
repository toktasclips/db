/**
 * instagram-oauth — Supabase Edge Function
 *
 * Handles the Meta OAuth callback for Instagram Business / Creator account linking.
 * Strategy for instagram_business_account lookup:
 *   1. Bulk: /me/accounts?fields=id,name,access_token,instagram_business_account
 *   2. Per-page with page token: /{page-id}?fields=instagram_business_account
 *   3. Per-page with user token fallback
 *   4. Fetch profile details (username/name) via separate call if needed
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const META_APP_ID          = Deno.env.get("META_APP_ID")               ?? "";
const META_APP_SECRET      = Deno.env.get("META_APP_SECRET")           ?? "";
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")      ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth`;
const GV           = "v20.0";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req: Request) => {
  const url      = new URL(req.url);
  const code     = url.searchParams.get("code");
  const state    = url.searchParams.get("state");
  const oauthErr = url.searchParams.get("error");

  if (oauthErr) {
    return closePopup("error", oauthErr === "access_denied"
      ? "Izin reddedildi."
      : "Yetkilendirme basarisiz oldu.");
  }

  if (!code || !state) {
    return closePopup("error", "Gecersiz istek.");
  }

  // ── Validate state ─────────────────────────────────────────────────
  let userId: string;
  try {
    const decoded = JSON.parse(atob(decodeURIComponent(state)));
    if (!decoded.uid) throw new Error("no uid");
    if (Date.now() - (decoded.ts ?? 0) > 15 * 60 * 1000) {
      return closePopup("error", "Oturum suresi doldu. Lutfen tekrar deneyin.");
    }
    userId = decoded.uid;
  } catch {
    return closePopup("error", "Gecersiz state parametresi.");
  }

  // ── Exchange code → short-lived user token ─────────────────────────
  const tokenRes = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&client_secret=${META_APP_SECRET}` +
    `&code=${code}`,
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error) {
    console.error("[IG OAuth] Token exchange failed:", tokenData.error?.code);
    return closePopup("error", "Token alinamadi.");
  }
  const shortToken: string = tokenData.access_token;

  // ── Exchange short → long-lived user token (60 days) ──────────────
  const longRes  = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${META_APP_ID}` +
    `&client_secret=${META_APP_SECRET}` +
    `&fb_exchange_token=${shortToken}`,
  );
  const longData   = await longRes.json();
  const userToken  = (longData.access_token ?? shortToken) as string;
  const expiresIn  = (longData.expires_in ?? 0) as number;
  const expiresAt  = expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // ── STEP 1: Bulk fetch pages — both iba and connected_instagram_account ──
  // instagram_business_account = Business accounts
  // connected_instagram_account = Creator accounts (and Business too)
  const pagesRes = await fetch(
    `https://graph.facebook.com/${GV}/me/accounts` +
    `?fields=id,name,access_token,instagram_business_account,connected_instagram_account` +
    `&access_token=${userToken}`,
  );
  const pagesData = await pagesRes.json();
  const pages: any[] = pagesData.data ?? [];

  console.log(`[IG OAuth] Fetched ${pages.length} page(s) for user ${userId}`);
  for (const p of pages) {
    console.log(`[IG OAuth]   page ${p.id} (${p.name}) iba=${JSON.stringify(p.instagram_business_account ?? null)} cia=${JSON.stringify(p.connected_instagram_account ?? null)}`);
  }

  let igUserId: string | null   = null;
  let igUsername: string | null = null;
  let igName: string | null     = null;
  let pageId: string | null     = null;
  let pageToken: string | null  = null;

  function extractIg(d: any): { id: string; username: string | null; name: string | null } | null {
    const src = d.instagram_business_account ?? d.connected_instagram_account ?? null;
    if (src?.id) return { id: src.id, username: src.username ?? null, name: src.name ?? null };
    return null;
  }

  // Check bulk result first
  for (const page of pages) {
    const ig = extractIg(page);
    if (ig) {
      igUserId   = ig.id;
      igUsername = ig.username;
      igName     = ig.name;
      pageId     = page.id;
      pageToken  = page.access_token;
      console.log(`[IG OAuth] Found via bulk: ig_id=${igUserId} page=${pageId}`);
      break;
    }
  }

  // ── STEP 2: Per-page query with page token ─────────────────────────
  if (!igUserId) {
    for (const page of pages) {
      const r = await fetch(
        `https://graph.facebook.com/${GV}/${page.id}` +
        `?fields=instagram_business_account,connected_instagram_account` +
        `&access_token=${page.access_token}`,
      );
      const d = await r.json();
      console.log(`[IG OAuth] Per-page (page-token) ${page.id}: iba=${JSON.stringify(d.instagram_business_account ?? null)} cia=${JSON.stringify(d.connected_instagram_account ?? null)}`);
      const ig = extractIg(d);
      if (ig) {
        igUserId  = ig.id;
        igUsername = ig.username;
        igName    = ig.name;
        pageId    = page.id;
        pageToken = page.access_token;
        break;
      }
    }
  }

  // ── STEP 3: Per-page query with user token fallback ────────────────
  if (!igUserId) {
    for (const page of pages) {
      const r = await fetch(
        `https://graph.facebook.com/${GV}/${page.id}` +
        `?fields=instagram_business_account,connected_instagram_account` +
        `&access_token=${userToken}`,
      );
      const d = await r.json();
      console.log(`[IG OAuth] Per-page (user-token) ${page.id}: iba=${JSON.stringify(d.instagram_business_account ?? null)} cia=${JSON.stringify(d.connected_instagram_account ?? null)}`);
      const ig = extractIg(d);
      if (ig) {
        igUserId  = ig.id;
        igUsername = ig.username;
        igName    = ig.name;
        pageId    = page.id;
        pageToken = pages.find(p => p.id === page.id)?.access_token ?? null;
        break;
      }
    }
  }

  // ── STEP 4: Fetch IG profile details if id found but name/username missing
  if (igUserId && (!igUsername || !igName)) {
    const profRes = await fetch(
      `https://graph.facebook.com/${GV}/${igUserId}` +
      `?fields=id,username,name` +
      `&access_token=${pageToken ?? userToken}`,
    );
    const profData = await profRes.json();
    igUsername = igUsername ?? profData.username ?? null;
    igName     = igName     ?? profData.name     ?? null;
    console.log(`[IG OAuth] Profile fetch: username=${igUsername} name=${igName}`);
  }

  if (!igUserId || !pageToken) {
    console.error(`[IG OAuth] No instagram_business_account found across ${pages.length} page(s)`);
    return closePopup("error",
      "Instagram Business hesabi bulunamadi. " +
      "Hesabinizin bir Facebook Sayfasina bagli olduguna emin olun.");
  }

  // ── Encrypt page token ─────────────────────────────────────────────
  const { data: encToken, error: encErr } = await sb.rpc("encrypt_ig_token", {
    plain_token: pageToken,
    secret_key:  TOKEN_ENCRYPTION_KEY,
  });
  if (encErr || !encToken) {
    console.error("[IG OAuth] Encryption RPC failed:", encErr?.code);
    return closePopup("error", "Token sifreleme basarisiz.");
  }

  // ── Upsert connection record ───────────────────────────────────────
  const { error: dbErr } = await sb.from("instagram_connections").upsert({
    user_id:                userId,
    instagram_user_id:      igUserId,
    instagram_username:     igUsername,
    instagram_account_name: igName,
    encrypted_access_token: encToken,
    page_id:                pageId,
    token_expires_at:       expiresAt,
    is_active:              true,
    sync_error:             null,
    updated_at:             new Date().toISOString(),
  }, { onConflict: "user_id,instagram_user_id" });

  if (dbErr) {
    console.error("[IG OAuth] DB upsert failed:", dbErr.code);
    return closePopup("error", "Baglanti kaydedilemedi.");
  }

  return closePopup("success", igUsername ?? igName ?? "Hesap");
});

// ── Helpers ───────────────────────────────────────────────────────────

function closePopup(type: "success" | "error", payload: string): Response {
  const msgData = JSON.stringify({
    type: type === "success" ? "IG_OAUTH_SUCCESS" : "IG_OAUTH_ERROR",
    payload,
  });

  const isSuccess = type === "success";
  const bodyContent = isSuccess
    ? `<div class="icon" style="color:#4caf81">&#10003;</div>
       <div class="title">@${escHtml(payload)} baglandi!</div>
       <div class="sub">Pencere otomatik kapaniyor...</div>`
    : `<div class="icon" style="color:#e57373">&#10007;</div>
       <div class="title" style="color:#e8e8e6">Baglanti basarisiz</div>
       <div class="sub">${escHtml(payload)}</div>`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{background:#191919;color:#9b9a97;min-height:100vh;display:flex;
  align-items:center;justify-content:center;margin:0;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  flex-direction:column;gap:10px;padding:24px;text-align:center}
.icon{font-size:36px;margin-bottom:4px}
.title{font-size:17px;font-weight:700;color:#e8e8e6}
.sub{font-size:13px;color:#6b6963;margin-top:2px}
</style>
</head>
<body>
${bodyContent}
<script>
window.opener&&window.opener.postMessage(${msgData},'*');
setTimeout(function(){window.close()},1800);
</script>
</body>
</html>`;

  const encoded = new TextEncoder().encode(html);
  return new Response(encoded, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
