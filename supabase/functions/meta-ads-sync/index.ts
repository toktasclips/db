/**
 * meta-ads-sync — Supabase Edge Function
 * Fetches daily ad spend & metrics from Meta Ads API and stores them.
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
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")   return json({ error: "method_not_allowed" }, 405);

  const body   = await req.json().catch(() => ({}));
  const userId: string | undefined = body.user_id;
  if (!userId) return json({ error: "user_id required" }, 400);

  console.log(`[ads-sync] Starting for user: ${userId}`);

  // ── Fetch encrypted user token ────────────────────────────────────────
  const { data: conn, error: connErr } = await sb
    .from("instagram_connections")
    .select("encrypted_user_token")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (connErr) {
    console.error("[ads-sync] DB error:", connErr.message);
    return json({ error: "db_error" }, 500);
  }
  if (!conn?.encrypted_user_token) {
    console.warn("[ads-sync] No user token — user must reconnect with ads_read scope");
    return json({ error: "no_ads_token", accounts_found: 0, total_spend: 0 }, 200);
  }

  // ── Decrypt token ─────────────────────────────────────────────────────
  const { data: plainToken, error: decErr } = await sb.rpc("decrypt_ig_token", {
    encrypted_token: conn.encrypted_user_token,
    secret_key:      TOKEN_ENCRYPTION_KEY,
  });
  if (decErr || !plainToken) {
    console.error("[ads-sync] Decrypt failed:", decErr?.message);
    return json({ error: "decrypt_failed" }, 500);
  }
  const token = plainToken as string;
  const today = new Date().toISOString().split("T")[0];
  const since = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0]; // 7 days incl. today

  // ── Fetch ad accounts ─────────────────────────────────────────────────
  const acctRes  = await fetch(
    `https://graph.facebook.com/${GV}/me/adaccounts` +
    `?fields=id,name,account_status,currency&limit=25&access_token=${token}`,
  );
  const acctData = await acctRes.json();

  if (acctData.error) {
    console.error("[ads-sync] Ad accounts error:", JSON.stringify(acctData.error));
    return json({ error: "ads_api_error", detail: acctData.error.message, code: acctData.error.code }, 502);
  }

  const accounts: any[] = acctData.data ?? [];
  console.log(`[ads-sync] ${accounts.length} ad account(s) found`);
  if (accounts.length === 0) return json({ success: true, accounts_found: 0, total_spend: 0 });

  let todaySpend = 0;
  const syncedAccounts: any[] = [];

  for (const acct of accounts) {
    const acctId   = acct.id as string;
    const currency = acct.currency ?? "TRY";

    // Fetch last 7 days broken down by day (time_increment=1)
    const insRes = await fetch(
      `https://graph.facebook.com/${GV}/${acctId}/insights` +
      `?fields=spend,impressions,reach,clicks,date_start` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until: today }))}` +
      `&time_increment=1` +
      `&level=account` +
      `&access_token=${token}`,
    );
    const insData = await insRes.json();

    if (insData.error) {
      console.warn(`[ads-sync] Insights error ${acctId}:`, insData.error.code, insData.error.message);
      continue;
    }

    const rows: any[] = insData.data ?? [];
    console.log(`[ads-sync] ${acctId} (${acct.name}): ${rows.length} day(s) returned`);

    for (const row of rows) {
      const spend       = parseFloat(row.spend       ?? "0");
      const impressions = parseInt(row.impressions    ?? "0");
      const reach       = parseInt(row.reach          ?? "0");
      const clicks      = parseInt(row.clicks         ?? "0");
      const date        = (row.date_start as string)  ?? today;

      if (date === today) todaySpend += spend;

      const { error: upsertErr } = await sb.from("meta_ad_insights").upsert({
        user_id:      userId,
        account_id:   acctId,
        account_name: acct.name ?? null,
        insight_date: date,
        spend,
        impressions,
        reach,
        clicks,
        currency,
        raw_payload:  row,
        updated_at:   new Date().toISOString(),
      }, { onConflict: "user_id,account_id,insight_date" });

      if (upsertErr) console.error(`[ads-sync] Upsert error ${acctId} ${date}:`, upsertErr.message);
    }

    const acctTotal = rows.reduce((s, r) => s + parseFloat(r.spend ?? "0"), 0);
    syncedAccounts.push({ account_id: acctId, account_name: acct.name, spend_7d: acctTotal, currency });
  }

  const total7d = syncedAccounts.reduce((s, a) => s + a.spend_7d, 0);
  console.log(`[ads-sync] Done. today=${todaySpend} 7d=${total7d}`);
  return json({ success: true, accounts_found: accounts.length, total_spend: todaySpend, total_spend_7d: total7d, accounts: syncedAccounts });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
