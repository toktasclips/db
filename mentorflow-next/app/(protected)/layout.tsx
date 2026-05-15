import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/helpers'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-full">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto bg-[#F7F3ED] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
