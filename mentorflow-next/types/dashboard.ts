export interface DailyEntry {
  id: string
  entryDate: string
  mood: string
  takipci: number
  mail: number
  icerik: number
  reklam: number
  tpm: number
  hotlist: number
  musteri: number
  teklif: number
  alinan: number
  anlasma: number
  yorum: string
  win: string
}

export interface Goal {
  id: string
  name: string
  date: string
  icon: string
  done: boolean
  notes: string[]
}

export interface Milestone {
  id: string
  title: string
  date: string
  status: string
  notes: string[]
}

export interface KPIData {
  takipci: number
  mail: number
  totalAlinan: number
  teklif30: number
  musteri30: number
}

export interface DailyEntryInput {
  entryDate: string
  mood: string
  takipci: number
  mail: number
  icerik: number
  reklam: number
  tpm: number
  teklif: number
  yorum: string
}
