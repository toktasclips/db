'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DailyEntryInput } from '@/types/dashboard'

async function getUserEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function saveDailyEntry(input: DailyEntryInput): Promise<{ error?: string }> {
  const email = await getUserEmail()
  if (!email) return { error: 'Oturum bulunamadı.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('daily_entries')
    .select('id')
    .eq('user_id', email)
    .eq('entry_date', input.entryDate)
    .maybeSingle()

  const row = {
    entry_date: input.entryDate,
    mood: input.mood,
    takipci: input.takipci,
    mail: input.mail,
    icerik: input.icerik,
    reklam: input.reklam,
    tpm: input.tpm,
    teklif: input.teklif,
    yorum: input.yorum,
    user_id: email,
  }

  let dbError: unknown
  if (existing) {
    const res = await supabase
      .from('daily_entries')
      .update(row)
      .eq('id', existing.id)
      .eq('user_id', email)
    dbError = res.error
  } else {
    const res = await supabase.from('daily_entries').insert(row)
    dbError = res.error
  }

  if (dbError) return { error: 'Kayıt oluşturulamadı.' }

  revalidatePath('/dashboard')
  return {}
}

export async function saveGoal(name: string, date: string, icon: string): Promise<{ error?: string }> {
  const email = await getUserEmail()
  if (!email) return { error: 'Oturum bulunamadı.' }

  const supabase = await createClient()
  const { error } = await supabase.from('goals').insert({
    name, date, icon: icon || '🎯', done: false, user_id: email,
  })

  if (error) return { error: 'Hedef kaydedilemedi.' }
  revalidatePath('/dashboard')
  return {}
}

export async function toggleGoal(id: string, done: boolean): Promise<{ error?: string }> {
  const email = await getUserEmail()
  if (!email) return { error: 'Oturum bulunamadı.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('goals')
    .update({ done })
    .eq('id', id)
    .eq('user_id', email)

  if (error) return { error: 'İşlem tamamlanamadı.' }
  revalidatePath('/dashboard')
  return {}
}

export async function saveMilestone(title: string, date: string): Promise<{ error?: string }> {
  const email = await getUserEmail()
  if (!email) return { error: 'Oturum bulunamadı.' }

  const supabase = await createClient()
  const { error } = await supabase.from('milestones').insert({
    title, date, status: 'active', user_id: email,
  })

  if (error) return { error: 'Milestone kaydedilemedi.' }
  revalidatePath('/dashboard')
  return {}
}

export async function toggleMilestone(id: string, status: string): Promise<{ error?: string }> {
  const email = await getUserEmail()
  if (!email) return { error: 'Oturum bulunamadı.' }

  const supabase = await createClient()
  const newStatus = status === 'done' ? 'active' : 'done'
  const { error } = await supabase
    .from('milestones')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('user_id', email)

  if (error) return { error: 'İşlem tamamlanamadı.' }
  revalidatePath('/dashboard')
  return {}
}
