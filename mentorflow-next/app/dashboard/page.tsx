import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/helpers'
import { getDailyEntries, getGoals, getMilestones, getKPIData } from '@/lib/supabase/queries/dashboard'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import KPIGrid from '@/components/dashboard/KPIGrid'
import DailyEntryForm from '@/components/dashboard/DailyEntryForm'
import GoalsCard from '@/components/dashboard/GoalsCard'
import MilestonesCard from '@/components/dashboard/MilestonesCard'
import RecentEntriesTable from '@/components/dashboard/RecentEntriesTable'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const [entries, goals, milestones] = await Promise.all([
    getDailyEntries(),
    getGoals(),
    getMilestones(),
  ])

  const kpi = await getKPIData(entries)
  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find(e => e.entryDate === today) ?? null

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto bg-[#F7F3ED] p-6">
          <div className="max-w-5xl mx-auto space-y-5">

            <div>
              <h1 className="text-lg font-semibold text-[#1A1510]">Dashboard</h1>
              <p className="text-sm text-[#9D9186] mt-0.5">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <KPIGrid data={kpi} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DailyEntryForm todayEntry={todayEntry} />
              <div className="space-y-5">
                <GoalsCard goals={goals} />
                <MilestonesCard milestones={milestones} />
              </div>
            </div>

            <RecentEntriesTable entries={entries} />

          </div>
        </main>
      </div>
    </div>
  )
}
