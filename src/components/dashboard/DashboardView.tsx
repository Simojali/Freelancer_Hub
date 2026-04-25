import { useState } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import { useNavigate } from 'react-router-dom'
import KpiCard from './KpiCard'
import QuickLogModal from './QuickLogModal'
import LatestProjectsCard from './LatestProjectsCard'
import RecentPaymentsCard from './RecentPaymentsCard'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, DollarSign, FolderKanban, TrendingUp, Wallet, Package as PackageIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

export default function DashboardView() {
  const { data, isLoading } = useDashboard()
  const { currency } = useSettings()
  const navigate = useNavigate()
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  // Header is rendered even during loading so the Quick Log button stays
  // accessible while data is being fetched.
  const header = (
    <div className="flex items-center justify-between gap-3 mb-6">
      <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
      <Button size="sm" onClick={() => setQuickLogOpen(true)}>
        <PackageIcon className="w-4 h-4 mr-1" /> Quick Log Delivery
      </Button>
    </div>
  )

  if (isLoading || !data) {
    return (
      <div>
        {header}
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-zinc-100 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-zinc-100 animate-pulse" />
        </div>
      </div>
    )
  }

  const { kpis, pipeline, recentProjects, recentPayments } = data

  return (
    <div>
      {header}
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
          <KpiCard
            label="Active Clients"
            value={
              <span>
                {kpis.activeClients}
                <span className="text-zinc-400 text-lg font-normal ml-1.5">/ {kpis.totalClients}</span>
              </span>
            }
            sub={kpis.topClientThisMonth
              ? `Top: ${kpis.topClientThisMonth.name} · ${formatCurrency(kpis.topClientThisMonth.amount, currency)} this month`
              : kpis.activeClients > 0
                ? `${kpis.activeClients} with open work`
                : 'No active engagements'}
            icon={UserCheck}
            iconColor="text-blue-500"
            onClick={() => navigate('/clients?sort=owed_desc')}
          />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentPaymentsCard recentPayments={recentPayments} />
          <LatestProjectsCard recentProjects={recentProjects} />
        </div>
      </div>

      <QuickLogModal
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onViewAll={p => {
          // "See all deliveries" → close the modal and navigate to the project's
          // client profile (where the user can expand the project for the full
          // delivery list, billing, etc). Fallback to the projects page when
          // a project somehow has no client.
          setQuickLogOpen(false)
          if (p.client_id) navigate(`/clients/${p.client_id}`)
          else navigate(`/projects?q=${encodeURIComponent(p.name)}`)
        }}
      />
    </div>
  )
}
