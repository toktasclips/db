'use client'

import { useState } from 'react'
import { saveDailyEntry } from '@/app/dashboard/actions'
import type { DailyEntry } from '@/types/dashboard'

const MOODS = ['😊', '😐', '😔', '🔥', '😤']

interface DailyEntryFormProps {
  todayEntry?: DailyEntry | null
}

export default function DailyEntryForm({ todayEntry }: DailyEntryFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [mood, setMood] = useState(todayEntry?.mood || MOODS[0])
  const [fields, setFields] = useState({
    takipci: String(todayEntry?.takipci || ''),
    mail: String(todayEntry?.mail || ''),
    icerik: String(todayEntry?.icerik || ''),
    reklam: String(todayEntry?.reklam || ''),
    tpm: String(todayEntry?.tpm || ''),
    teklif: String(todayEntry?.teklif || ''),
    yorum: todayEntry?.yorum || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    const result = await saveDailyEntry({
      entryDate: today,
      mood,
      takipci: Number(fields.takipci) || 0,
      mail: Number(fields.mail) || 0,
      icerik: Number(fields.icerik) || 0,
      reklam: Number(fields.reklam) || 0,
      tpm: Number(fields.tpm) || 0,
      teklif: Number(fields.teklif) || 0,
      yorum: fields.yorum,
    })

    setSaving(false)
    setMsg(result.error || '✅ Kaydedildi!')
    setTimeout(() => setMsg(''), 3000)
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-sm text-[#1A1510] outline-none focus:border-[#6E5E51] transition-colors'

  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <div className="font-medium text-[#1A1510] mb-4">
        Günlük Giriş — {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
        {todayEntry && <span className="ml-2 text-xs text-[#9D9186]">(güncelleniyor)</span>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mood */}
        <div>
          <label className="text-xs text-[#9D9186] mb-1.5 block">Ruh hali</label>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`w-9 h-9 rounded-xl text-lg transition-all ${mood === m ? 'bg-[#6E5E51]/10 ring-1 ring-[#6E5E51]' : 'bg-[#F7F3ED]'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            ['takipci', 'Takipçi'],
            ['mail', 'Mail'],
            ['icerik', 'İçerik'],
            ['reklam', 'Reklam (₺)'],
            ['tpm', 'TPM'],
            ['teklif', 'Teklif'],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-[#9D9186] mb-1 block">{label}</label>
              <input type="number" min="0" className={inputCls} value={fields[k]} onChange={set(k)} placeholder="0" />
            </div>
          ))}
        </div>

        {/* Note */}
        <div>
          <label className="text-xs text-[#9D9186] mb-1 block">Not</label>
          <textarea className={inputCls + ' resize-none'} rows={2} value={fields.yorum} onChange={set('yorum')} placeholder="Bugün ne oldu?" />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#6E5E51] text-white text-sm font-medium hover:bg-[#5C4B38] transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          {msg && <span className="text-sm text-[#9D9186]">{msg}</span>}
        </div>
      </form>
    </div>
  )
}
