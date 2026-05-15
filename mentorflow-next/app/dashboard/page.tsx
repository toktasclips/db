import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/helpers'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto bg-[#F7F3ED] p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-[#1A1510]">
                Hoş geldin, {profile.fullName || profile.email} 👋
              </h1>
              <p className="text-sm text-[#9D9186] mt-1">
                {profile.role === 'admin' ? 'Admin Paneli' : 'Üye Paneli'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div className="text-xs text-[#9D9186] mb-1">Versiyon</div>
                <div className="text-lg font-semibold text-[#1A1510]">V3.0</div>
                <div className="text-xs text-[#9D9186] mt-0.5">Next.js Foundation</div>
              </div>
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div className="text-xs text-[#9D9186] mb-1">Auth</div>
                <div className="text-lg font-semibold text-[#4CAF81]">Aktif</div>
                <div className="text-xs text-[#9D9186] mt-0.5">Supabase Auth</div>
              </div>
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div className="text-xs text-[#9D9186] mb-1">Rol</div>
                <div className="text-lg font-semibold text-[#1A1510] capitalize">{profile.role}</div>
                <div className="text-xs text-[#9D9186] mt-0.5">profiles tablosundan</div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-black/5 p-5">
              <div className="text-sm font-medium text-[#1A1510] mb-2">Migration Durumu</div>
              <div className="space-y-2">
                {[
                  { label: 'Auth + Middleware', done: true },
                  { label: 'Login / Logout', done: true },
                  { label: 'Route Protection', done: true },
                  { label: 'Role System', done: true },
                  { label: 'Dashboard Logic', done: false },
                  { label: 'CRM / Müşteriler', done: false },
                  { label: 'Dersler', done: false },
                  { label: 'Chatbot', done: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span className={item.done ? 'text-[#4CAF81]' : 'text-[#9D9186]'}>
                      {item.done ? '✓' : '○'}
                    </span>
                    <span className={item.done ? 'text-[#1A1510]' : 'text-[#9D9186]'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
