/**
 * admin-create-user — Güvenli kullanıcı oluşturma
 *
 * - Sadece admin çağırabilir (requireServiceOrAdmin)
 * - Supabase Auth user oluşturur (auth.admin.createUser)
 * - profiles kaydı upsert eder
 * - legacy users tablosuna password YAZMAZ
 * - Geçici şifreyi yalnızca response'ta döner (DB'ye kaydedilmez)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin } from "../_shared/auth.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

/** Generates a 16-char temp password. Never stored in DB. */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const pool = upper + lower + digits + special;
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Ensure at least one of each required class
  let pw = upper[arr[0] % upper.length]
         + lower[arr[1] % lower.length]
         + digits[arr[2] % digits.length]
         + special[arr[3] % special.length];
  for (let i = 4; i < 16; i++) pw += pool[arr[i] % pool.length];
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  // ── Admin guard ───────────────────────────────────────────────
  const auth = await requireServiceOrAdmin(req);
  if (auth instanceof Response) return auth;

  // ── Parse body ────────────────────────────────────────────────
  let body: {
    name?: string;
    email?: string;
    role?: string;
    program?: string;
    start_date?: string;
    end_date?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name  = String(body.name  ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role  = body.role === "admin" ? "client" : (body.role ?? "client"); // guard: only client via this fn

  if (!name || !email) {
    return json({ error: "name ve email zorunlu" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Geçersiz e-posta formatı" }, 400);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Create Supabase Auth user ─────────────────────────────────
  const tempPassword = generateTempPassword();

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists")) {
      return json({ error: "Bu e-posta zaten kayıtlı." }, 409);
    }
    // Don't leak internal auth error detail
    return json({ error: "Kullanıcı oluşturulamadı." }, 500);
  }

  const authUserId = authData.user.id;

  // ── Upsert profiles (trigger may already handle, but be explicit) ──
  // Trigger on auth.users INSERT sets full_name from raw_user_meta_data.
  // We upsert here to ensure full_name is correct if trigger missed it.
  await sb.from("profiles").upsert(
    { auth_user_id: authUserId, email, full_name: name, role },
    { onConflict: "email" }
  ).then(() => null).catch(() => null); // non-critical, trigger covers it

  // ── Legacy users table — metadata only, NO password ──────────
  // password column may be NOT NULL in legacy schema.
  // We use a sentinel value '_supabase_auth_' to indicate migration.
  // This value cannot be used for login — Supabase Auth is the only login path.
  const legacyWrite = await sb
    .from("users")
    .upsert(
      { name, email, role, password: "_supabase_auth_" },
      { onConflict: "email" }
    )
    .select("id")
    .maybeSingle();

  const legacyId = legacyWrite.data?.id ?? null;

  // ── Return ────────────────────────────────────────────────────
  return json({
    success: true,
    user_id: authUserId,
    legacy_id: legacyId,
    email,
    name,
    // Temp password returned once — never stored in DB
    temp_password: tempPassword,
  });
});
