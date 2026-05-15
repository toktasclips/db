'use client'

import { useState } from 'react'
import { saveGoal, toggleGoal } from '@/app/dashboard/actions'
import type { Goal } from '@/types/dashboard'

export default function GoalsCard({ goals }: { goals: Goal[] }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    const res = await saveGoal(name.trim(), date, '🎯')
    setAdding(false)
    if (res.error) { setErr(res.error); return }
    setName(''); setDate(''); setErr('')
  }

  const active = goals.filter(g => !g.done)
  const done = goals.filter(g => g.done)

  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <div className="font-medium text-[#1A1510] mb-4">Hedefler</div>

      <div className="space-y-2 mb-4">
        {active.length === 0 && <p className="text-sm text-[#9D9186]">Henüz hedef yok.</p>}
        {active.map(g => (
          <div key={g.id} className="flex items-center gap-2.5">
            <button
              onClick={() => toggleGoal(g.id, true)}
              className="w-5 h-5 rounded-full border border-black/15 flex-shrink-0 hover:border-[#6E5E51] transition-colors"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#1A1510] truncate">{g.icon} {g.name}</div>
              {g.date && <div className="text-xs text-[#9D9186]">{g.date}</div>}
            </div>
          </div>
        ))}
        {done.length > 0 && (
          <div className="text-xs text-[#9D9186] mt-2">{done.length} hedef tamamlandı</div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border border-black/10 text-sm outline-none focus:border-[#6E5E51] transition-colors"
          placeholder="Yeni hedef..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="date"
          className="px-2 py-2 rounded-xl border border-black/10 text-sm outline-none focus:border-[#6E5E51] transition-colors"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="px-3 py-2 rounded-xl bg-[#6E5E51] text-white text-sm hover:bg-[#5C4B38] transition-colors disabled:opacity-50"
        >
          +
        </button>
      </form>
      {err && <div className="text-xs text-red-500 mt-1">{err}</div>}
    </div>
  )
}
