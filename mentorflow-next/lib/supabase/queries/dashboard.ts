import { createClient } from '@/lib/supabase/server'
import type { DailyEntry, Goal, Milestone, KPIData } from '@/types/dashboard'

// user_id in DB is the user's email (legacy system)
async function getUserEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

type RawEntry = {
  id: unknown; entry_date: string | null; mood: string | null
  takipci: number | null; mail: number | null; icerik: number | null
  reklam: number | null; tpm: number | null; hotlist: number | null
  musteri: number | null; teklif: number | null; alinan: number | null
  anlasma: number | null; yorum: string | null; win: string | null
}

type RawGoal = {
  id: unknown; name: string | null; date: string | null
  icon: string | null; done: boolean | null; notes: unknown
}

type RawMilestone = {
  id: unknown; title: string | null; date: string | null
  status: string | null; notes: unknown
}

export async function getDailyEntries(): Promise<DailyEntry[]> {
  const email = await getUserEmail()
  if (!email) return []

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', email)
    .order('entry_date', { ascending: false })
    .limit(90) as unknown as Promise<{ data: RawEntry[] | null; error: unknown }>)

  if (error || !data) return []

  return data.map(d => ({
    id: String(d.id),
    entryDate: d.entry_date ?? '',
    mood: d.mood ?? '',
    takipci: d.takipci ?? 0,
    mail: d.mail ?? 0,
    icerik: d.icerik ?? 0,
    reklam: d.reklam ?? 0,
    tpm: d.tpm ?? 0,
    hotlist: d.hotlist ?? 0,
    musteri: d.musteri ?? 0,
    teklif: d.teklif ?? 0,
    alinan: d.alinan ?? 0,
    anlasma: d.anlasma ?? 0,
    yorum: d.yorum ?? '',
    win: d.win ?? '',
  }))
}

export async function getGoals(): Promise<Goal[]> {
  const email = await getUserEmail()
  if (!email) return []

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('goals')
    .select('*')
    .eq('user_id', email)
    .order('created_at', { ascending: true }) as unknown as Promise<{ data: RawGoal[] | null; error: unknown }>)

  if (error || !data) return []

  return data.map(g => ({
    id: String(g.id),
    name: g.name ?? '',
    date: g.date ?? '',
    icon: g.icon ?? '🎯',
    done: g.done ?? false,
    notes: Array.isArray(g.notes) ? g.notes : [],
  }))
}

export async function getMilestones(): Promise<Milestone[]> {
  const email = await getUserEmail()
  if (!email) return []

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('milestones')
    .select('*')
    .eq('user_id', email)
    .order('created_at', { ascending: true }) as unknown as Promise<{ data: RawMilestone[] | null; error: unknown }>)

  if (error || !data) return []

  return data.map(m => ({
    id: String(m.id),
    title: m.title ?? '',
    date: m.date ?? '',
    status: m.status ?? 'active',
    notes: Array.isArray(m.notes) ? m.notes : [],
  }))
}

export async function getKPIData(entries: DailyEntry[]): Promise<KPIData> {
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate))
  const last30 = sorted.slice(-30)

  const takipci = [...sorted].reverse().find(d => d.takipci > 0)?.takipci ?? 0
  const mail = [...sorted].reverse().find(d => d.mail > 0)?.mail ?? 0
  const totalAlinan = last30.reduce((s, d) => s + d.alinan, 0)
  const teklif30 = last30.reduce((s, d) => s + d.teklif, 0)
  const musteri30 = last30.reduce((s, d) => s + d.musteri, 0)

  return { takipci, mail, totalAlinan, teklif30, musteri30 }
}
