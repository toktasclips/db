import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/profile'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle() as { data: { id: string; email: string | null; full_name: string | null; role: string | null } | null }

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? '',
    fullName: profile.full_name ?? '',
    role: (profile.role as Profile['role']) ?? 'client',
  }
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin'
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('UNAUTHORIZED')
  }
  return profile
}
