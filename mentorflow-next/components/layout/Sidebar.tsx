'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'

interface SidebarProps {
  profile: Profile
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
]

const ADMIN_NAV_ITEMS = [
  { label: 'Kullanıcılar', href: '/dashboard/users', icon: '👥' },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const items = profile.role === 'admin'
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  return (
    <aside className="w-56 h-full bg-[#1A1510] flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="text-sm font-semibold text-white">Dijital Barista</div>
        <div className="text-xs text-white/40 mt-0.5">V3.0</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <div className="px-3 py-2 mb-1">
          <div className="text-xs font-medium text-white truncate">{profile.fullName || profile.email}</div>
          <div className="text-xs text-white/40 capitalize">{profile.role}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>↩</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
