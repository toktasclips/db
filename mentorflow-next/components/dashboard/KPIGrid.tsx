import type { KPIData } from '@/types/dashboard'

interface KPIGridProps {
  data: KPIData
}

const ITEMS = [
  { key: 'takipci', label: 'Takipçi', format: (v: number) => v.toLocaleString('tr-TR'), icon: '📈' },
  { key: 'mail', label: 'Mail', format: (v: number) => v.toLocaleString('tr-TR'), icon: '📧' },
  { key: 'totalAlinan', label: 'Gelir (30g)', format: (v: number) => '₺' + v.toLocaleString('tr-TR'), icon: '💰' },
  { key: 'teklif30', label: 'Teklif (30g)', format: (v: number) => String(v), icon: '📋' },
  { key: 'musteri30', label: 'Müşteri (30g)', format: (v: number) => String(v), icon: '👤' },
] as const

export default function KPIGrid({ data }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {ITEMS.map(item => (
        <div key={item.key} className="bg-white rounded-2xl border border-black/5 p-4">
          <div className="text-lg mb-1">{item.icon}</div>
          <div className="text-xl font-semibold text-[#1A1510]">
            {item.format(data[item.key])}
          </div>
          <div className="text-xs text-[#9D9186] mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
