/**
 * migrate-users-to-auth — Supabase Edge Function (run once)
 *
 * Reads all rows from the `users` table and creates a Supabase Auth account
 * for each user using the Admin API (service role key).
 *
 * HOW TO RUN:
 *   curl -X POST https://<your-project>.supabase.co/functions/v1/migrate-users-to-auth \
 *     -H "Authorization: Bearer <your-service-role-key>"
 *
 * SAFE TO RUN MULTIPLE TIMES — skips users that already exist in Auth.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Only allow service role — reject anon calls
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== SERVICE_ROLE_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Admin client (service role — never expose this key in frontend)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Read all users from the custom users table
  const { data: userRows, error: fetchErr } = await admin
    .from('users')
    .select('id, name, email, password, role');

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  const results: { email: string; status: string; detail?: string }[] = [];

  for (const u of userRows ?? []) {
    if (!u.email || !u.password) {
      results.push({ email: u.email ?? '?', status: 'skipped', detail: 'missing email or password' });
      continue;
    }

    // Create Auth account with admin API — does NOT send confirmation email
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,           // mark as confirmed immediately
      user_metadata: { name: u.name, role: u.role ?? 'client' },
    });

    if (createErr) {
      // User already exists in Auth — not an error, just skip
      const alreadyExists = createErr.message?.toLowerCase().includes('already registered')
        || createErr.message?.toLowerCase().includes('already exists');
      results.push({
        email: u.email,
        status: alreadyExists ? 'already_exists' : 'error',
        detail: createErr.message,
      });
      continue;
    }

    results.push({ email: u.email, status: 'created' });
  }

  const created  = results.filter(r => r.status === 'created').length;
  const skipped  = results.filter(r => r.status === 'already_exists').length;
  const errors   = results.filter(r => r.status === 'error').length;

  return new Response(JSON.stringify({
    summary: { total: userRows?.length ?? 0, created, skipped, errors },
    details: results,
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
