import type { DailyEntry } from '@/types/dashboard'

export default function RecentEntriesTable({ entries }: { entries: DailyEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-black/5 p-5">
        <div className="font-medium text-[#1A1510] mb-3">Son Girişler</div>
        <p className="text-sm text-[#9D9186]">Henüz kayıt yok.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <div className="font-medium text-[#1A1510] mb-4">Son Girişler</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#9D9186] border-b border-black/5">
              <th className="pb-2 pr-4">Tarih</th>
              <th className="pb-2 pr-4">Ruh Hali</th>
              <th className="pb-2 pr-4">Takipçi</th>
              <th className="pb-2 pr-4">Mail</th>
              <th className="pb-2 pr-4">Teklif</th>
              <th className="pb-2 pr-4">Gelir</th>
              <th className="pb-2">Not</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 10).map(e => (
              <tr key={e.id} className="border-b border-black/3 last:border-0">
                <td className="py-2 pr-4 text-[#1A1510] whitespace-nowrap">{e.entryDate}</td>
                <td className="py-2 pr-4">{e.mood}</td>
                <td className="py-2 pr-4 text-[#9D9186]">{e.takipci.toLocaleString('tr-TR')}</td>
                <td className="py-2 pr-4 text-[#9D9186]">{e.mail.toLocaleString('tr-TR')}</td>
                <td className="py-2 pr-4 text-[#9D9186]">{e.teklif}</td>
                <td className="py-2 pr-4 text-[#9D9186]">₺{e.alinan.toLocaleString('tr-TR')}</td>
                <td className="py-2 text-[#9D9186] max-w-[200px] truncate">{e.yorum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
