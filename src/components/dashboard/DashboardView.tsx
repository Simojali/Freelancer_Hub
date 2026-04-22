import { useDashboard } from '@/hooks/useDashboard'
import KpiCard from './KpiCard'
import PipelineFunnel from './PipelineFunnel'
import RecentActivity from './RecentActivity'
import { Users, UserCheck, DollarSign, FolderKanban, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

export default function DashboardView() {
  const { data, isLoading } = useDashboard()
  const { currency } = useSettings()

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-zinc-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    )
  }

  const { kpis, pipeline, recentProjects, recentPayments } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Prospects"
          value={kpis.totalLeads - pipeline.sample}
          sub={`${pipeline.sample} in outreach`}
          icon={Users}
          iconColor="text-zinc-400"
        />
        <KpiCard
          label="Close Rate"
          value={pipeline.sample > 0 ? `${Math.round((pipeline.closed / pipeline.sample) * 100)}%` : '0%'}
          sub={`${pipeline.closed} closed`}
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />
        <KpiCard label="Active Clients" value={kpis.activeClients} icon={UserCheck} iconColor="text-blue-500" />
        <KpiCard label="This Month" value={formatCurrency(kpis.monthlyRevenue, currency)} icon={DollarSign} iconColor="text-emerald-500" />
        <KpiCard
          label="Owed to you"
          value={formatCurrency(kpis.retainerOwed + kpis.gigsOwed, currency)}
          sub={`${formatCurrency(kpis.retainerOwed, currency)} retainers · ${formatCurrency(kpis.gigsOwed, currency)} gigs`}
          icon={Wallet}
          iconColor="text-amber-500"
        />
        <KpiCard label="Open Projects" value={kpis.openProjects} icon={FolderKanban} iconColor="text-amber-500" />
      </div>

      <PipelineFunnel pipeline={pipeline} total={pipeline.sample} />

      <RecentActivity recentProjects={recentProjects} recentPayments={recentPayments} />
    </div>
  )
}
