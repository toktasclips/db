/**
 * instagram-sync-all — Supabase Edge Function
 *
 * Batch sync job: iterates all active Instagram connections
 * and calls instagram-sync for each user.
 *
 * Called by pg_cron daily (see migration SQL for setup).
 * Can also be triggered manually by a super-admin.
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async () => {
  // Get all active connections
  const { data: connections, error } = await sb
    .from("instagram_connections")
    .select("user_id")
    .eq("is_active", true);

  if (error || !connections?.length) {
    return json({ synced: 0, message: "no active connections" });
  }

  const results: Record<string, unknown> = {};

  for (const { user_id } of connections) {
    try {
      const headers = {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      };
      const body = JSON.stringify({ user_id });

      const [igRes, adsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/instagram-sync`,  { method: "POST", headers, body }),
        fetch(`${SUPABASE_URL}/functions/v1/meta-ads-sync`,   { method: "POST", headers, body }),
      ]);

      const [igData, adsData] = await Promise.all([igRes.json(), adsRes.json()]);
      results[user_id] = {
        ig:  igData.success  ? "ok" : (igData.error  ?? "failed"),
        ads: adsData.success ? "ok" : (adsData.error ?? "failed"),
      };
    } catch (e) {
      results[user_id] = "exception";
      console.error(`Sync failed for user (masked):`, (e as Error).message);
    }
  }

  return json({ synced: Object.keys(results).length, results });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
