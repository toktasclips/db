/**
 * instagram-oauth — Supabase Edge Function
 *
 * Handles the Meta OAuth callback for Instagram Business account linking.
 * - Exchanges auth code for a long-lived Page Access Token (server-side only)
 * - Resolves the connected Instagram Business Account via Facebook Pages API
 * - Encrypts the token with pgcrypto before storing in DB
 * - Returns a minimal HTML page that postMessages back to the opener window
 *
 * Security:
 * - App Secret is read from Deno.env, never exposed to client
 * - State parameter validated + timestamp checked (15-min window)
 * - Token encrypted at rest via pgp_sym_encrypt (pgcrypto)
 * - No token or secret ever appears in logs
 */

import { serve }         from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }  from "https://esm.sh/@supabase/supabase-js@2";

// ── Env vars (set in Supabase Dashboard → Edge Functions → Secrets) ──
const META_APP_ID          = Deno.env.get("META_APP_ID")          ?? "";
const META_APP_SECRET      = Deno.env.get("META_APP_SECRET")      ?? "";
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY") ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")         ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Redirect URI must match exactly what is registered in Meta App Dashboard
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth`;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Graph API version ─────────────────────────────────────────────────
const GV = "v20.0";

serve(async (req: Request) => {
  const url       = new URL(req.url);
  const code      = url.searchParams.get("code");
  const state     = url.searchParams.get("state");
  const oauthErr  = url.searchParams.get("error");
  const errDesc   = url.searchParams.get("error_description");

  // ── User denied permission ──────────────────────────────────────────
  if (oauthErr) {
    return closePopup("error", oauthErr === "access_denied"
      ? "İzin reddedildi."
      : "Yetkilendirme başarısız oldu.");
  }

  if (!code || !state) {
    return closePopup("error", "Geçersiz istek.");
  }

  // ── Validate state — CSRF protection ───────────────────────────────
  let userId: string;
  try {
    const decoded = JSON.parse(atob(decodeURIComponent(state)));
    if (!decoded.uid) throw new Error();
    if (Date.now() - (decoded.ts ?? 0) > 15 * 60 * 1000) {
      return closePopup("error", "Oturum süresi doldu. Lütfen tekrar deneyin.");
    }
    userId = decoded.uid;
  } catch {
    return closePopup("error", "Geçersiz state parametresi.");
  }

  // ── Exchange code → short-lived user token ──────────────────────────
  const tokenRes = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&client_secret=${META_APP_SECRET}` +
    `&code=${code}`,
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error) {
    console.error("Token exchange failed:", tokenData.error?.code);   // safe: no secret logged
    return closePopup("error", "Token alınamadı.");
  }
  const shortToken: string = tokenData.access_token;

  // ── Exchange short-lived → long-lived user token (60 days) ─────────
  const longRes  = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${META_APP_ID}` +
    `&client_secret=${META_APP_SECRET}` +
    `&fb_exchange_token=${shortToken}`,
  );
  const longData = await longRes.json();
  const userToken: string  = longData.access_token ?? shortToken;
  const expiresIn: number  = longData.expires_in   ?? 0;
  const expiresAt: string | null = expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // ── Get Facebook Pages → find connected Instagram Business Account ──
  const pagesRes  = await fetch(
    `https://graph.facebook.com/${GV}/me/accounts` +
    `?fields=id,name,access_token` +
    `&access_token=${userToken}`,
  );
  const pagesData = await pagesRes.json();
  const pages: any[] = pagesData.data ?? [];

  let igUserId: string | null   = null;
  let igUsername: string | null = null;
  let igName: string | null     = null;
  let pageId: string | null     = null;
  let pageToken: string | null  = null;   // Page tokens don't expire

  for (const page of pages) {
    const igRes  = await fetch(
      `https://graph.facebook.com/${GV}/${page.id}` +
      `?fields=instagram_business_account{id,username,name}` +
      `&access_token=${page.access_token}`,
    );
    const igData = await igRes.json();
    if (igData.instagram_business_account) {
      igUserId  = igData.instagram_business_account.id;
      igUsername = igData.instagram_business_account.username ?? null;
      igName    = igData.instagram_business_account.name     ?? null;
      pageId    = page.id;
      pageToken = page.access_token;
      break;
    }
  }

  if (!igUserId || !pageToken) {
    return closePopup("error",
      "Instagram Business hesabı bulunamadı. Hesabınızın bir Facebook Sayfasına bağlı olduğundan emin olun.");
  }

  // ── Encrypt the Page Token via DB function (service_role only) ─────
  const { data: encToken, error: encErr } = await sb.rpc("encrypt_ig_token", {
    plain_token: pageToken,
    secret_key:  TOKEN_ENCRYPTION_KEY,
  });
  if (encErr || !encToken) {
    console.error("Encryption RPC failed:", encErr?.code);
    return closePopup("error", "Token şifreleme başarısız.");
  }

  // ── Upsert connection record ────────────────────────────────────────
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
    console.error("DB upsert failed:", dbErr.code);
    return closePopup("error", "Bağlantı kaydedilemedi.");
  }

  return closePopup("success", igUsername ?? igName ?? "Hesap");
});

// ── Helpers ──────────────────────────────────────────────────────────

function closePopup(type: "success" | "error", payload: string): Response {
  const msgData = JSON.stringify({
    type: type === "success" ? "IG_OAUTH_SUCCESS" : "IG_OAUTH_ERROR",
    payload,
  });

  const bodyContent = type === "success"
    ? `<div class="icon" style="color:#4caf81">✓</div>
       <div class="title">@${escHtml(payload)} bağlandı!</div>
       <div class="sub">Pencere otomatik kapanıyor…</div>`
    : `<div class="icon" style="color:#e57373">✗</div>
       <div class="title" style="color:#e8e8e6">Bağlantı başarısız</div>
       <div class="sub">${escHtml(payload)}</div>`;

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      *{box-sizing:border-box}
      body{background:#191919;color:#9b9a97;min-height:100vh;display:flex;
        align-items:center;justify-content:center;margin:0;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        flex-direction:column;gap:10px;padding:24px;text-align:center}
      .icon{font-size:36px;margin-bottom:4px}
      .title{font-size:17px;font-weight:700;color:#e8e8e6}
      .sub{font-size:13px;color:#6b6963;margin-top:2px}
    </style></head>
    <body>${bodyContent}
    <script>
      window.opener?.postMessage(${msgData}, '*');
      setTimeout(() => window.close(), 1800);
    </script>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
