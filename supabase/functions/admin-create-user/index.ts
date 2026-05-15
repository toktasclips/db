import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return jsonRes({ error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[admin-create-user] env vars eksik')
    return jsonRes({ error: 'CREATE_USER_AUTH_FAILED' })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonRes({ error: 'CREATE_USER_INVALID_PAYLOAD' })
  }

  const { name, email, temporaryPassword, role = 'client' } = body as {
    name?: string
    email?: string
    temporaryPassword?: string
    role?: string
  }

  if (!name || !email || !temporaryPassword) {
    return jsonRes({ error: 'CREATE_USER_INVALID_PAYLOAD' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Duplicate email kontrolü (users tablosu)
  const { data: existingUser } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    return jsonRes({ error: 'CREATE_USER_DUPLICATE_EMAIL' })
  }

  // Supabase Auth kullanıcısı oluştur
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message?.toLowerCase() ?? ''
    if (msg.includes('already') || msg.includes('exists') || authError.status === 422) {
      return jsonRes({ error: 'CREATE_USER_DUPLICATE_EMAIL' })
    }
    console.error('[admin-create-user] auth.admin.createUser:', authError.message)
    return jsonRes({ error: 'CREATE_USER_AUTH_FAILED' })
  }

  // users tablosuna ekle — password alanı YOK
  const { data: userData, error: userErr } = await admin
    .from('users')
    .insert({ name, email, role })
    .select()
    .single()

  if (userErr) {
    console.error('[admin-create-user] users insert:', userErr.message)
    // Tutarsızlığı önlemek için auth user'ı geri al
    await admin.auth.admin.deleteUser(authData.user!.id)
    return jsonRes({ error: 'CREATE_USER_LEGACY_USERS_FAILED' })
  }

  return jsonRes({ success: true, userId: userData.id, authId: authData.user?.id })
})
