import type { Profile } from '@/types/profile'

interface TopbarProps {
  profile: Profile
}

export default function Topbar({ profile }: TopbarProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between bg-white border-b border-black/5 flex-shrink-0">
      <div className="text-sm text-[#9D9186]">
        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#6E5E51] flex items-center justify-center text-white text-xs font-medium">
          {(profile.fullName || profile.email).charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
