/**
 * _shared/auth.ts — Edge Function JWT & Role Helper
 *
 * Usage:
 *   import { requireAuth, requireServiceOrAdmin, forbidden, unauthorized } from "../_shared/auth.ts";
 *
 * All helpers return Response on failure, caller object on success.
 * Pattern:
 *   const result = await requireAuth(req);
 *   if (result instanceof Response) return result;
 *   // result is the authenticated user
 *
 * Rate-limiting hooks (TODO — implement when needed):
 *   - IP-based: parse req.headers.get("x-forwarded-for"), store in KV with sliding window
 *   - User-based: count per user_id in DB or Deno KV, reject if > N per minute
 *   - Chatbot spam: track session_id + timestamp, reject burst > 10 req/min
 *   - Onboarding abuse: IP + email fingerprint, max 3 submissions per hour
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export type AuthUser = { id: string; email: string };

// ── Token extraction ──────────────────────────────────────────────────

function extractBearer(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

/** True if the request carries the service-role key (trusted internal/cron caller). */
export function isServiceRole(req: Request): boolean {
  return extractBearer(req) === SUPABASE_SERVICE_KEY;
}

// ── User resolution ───────────────────────────────────────────────────

/**
 * Verifies the bearer JWT and returns the Supabase user.
 * Returns null on any failure — never throws, never leaks error detail.
 */
async function resolveUser(req: Request): Promise<AuthUser | null> {
  const token = extractBearer(req);
  if (!token) return null;
  if (token === SUPABASE_SERVICE_KEY) return null; // service role has no "user"

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user?.email) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

/** Returns true if the user's email has role='admin' in profiles. */
async function checkAdminRole(email: string): Promise<boolean> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data } = await sb
      .from("profiles")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

// ── Guard helpers ─────────────────────────────────────────────────────

/** Standard 401 response — no internal detail. */
export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/** Standard 403 response — no internal detail. */
export function forbidden(): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Requires a valid user JWT.
 * Returns AuthUser on success, 401 Response on failure.
 */
export async function requireAuth(req: Request): Promise<AuthUser | Response> {
  const user = await resolveUser(req);
  if (!user) return unauthorized();
  return user;
}

/**
 * Requires service-role key OR an authenticated admin user.
 * Returns AuthUser | null (null = service role) on success.
 * Returns 401/403 Response on failure.
 */
export async function requireServiceOrAdmin(
  req: Request,
): Promise<AuthUser | null | Response> {
  if (isServiceRole(req)) return null; // trusted cron/internal

  const user = await resolveUser(req);
  if (!user) return unauthorized();

  const admin = await checkAdminRole(user.email);
  if (!admin) return forbidden();

  return user;
}
