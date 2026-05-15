'use client'

import { useState } from 'react'
import { saveMilestone, toggleMilestone } from '@/app/dashboard/actions'
import type { Milestone } from '@/types/dashboard'

export default function MilestonesCard({ milestones }: { milestones: Milestone[] }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const res = await saveMilestone(title.trim(), date)
    setAdding(false)
    if (res.error) { setErr(res.error); return }
    setTitle(''); setDate(''); setErr('')
  }

  const active = milestones.filter(m => m.status !== 'done')
  const done = milestones.filter(m => m.status === 'done')

  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <div className="font-medium text-[#1A1510] mb-4">Milestone&rsquo;lar</div>

      <div className="space-y-2 mb-4">
        {active.length === 0 && <p className="text-sm text-[#9D9186]">Henüz milestone yok.</p>}
        {active.map(m => (
          <div key={m.id} className="flex items-center gap-2.5">
            <button
              onClick={() => toggleMilestone(m.id, m.status)}
              className="w-5 h-5 rounded border border-black/15 flex-shrink-0 hover:border-[#6E5E51] transition-colors"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#1A1510] truncate">{m.title}</div>
              {m.date && <div className="text-xs text-[#9D9186]">{m.date}</div>}
            </div>
          </div>
        ))}
        {done.length > 0 && (
          <div className="text-xs text-[#9D9186] mt-2">{done.length} tamamlandı</div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border border-black/10 text-sm outline-none focus:border-[#6E5E51] transition-colors"
          placeholder="Yeni milestone..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="px-2 py-2 rounded-xl border border-black/10 text-sm outline-none focus:border-[#6E5E51] transition-colors"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="px-3 py-2 rounded-xl bg-[#6E5E51] text-white text-sm hover:bg-[#5C4B38] transition-colors disabled:opacity-50"
        >
          +
        </button>
      </form>
      {err && <div className="text-xs text-red-500 mt-1">{err}</div>}
    </div>
  )
}
