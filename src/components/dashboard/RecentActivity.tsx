import type { DashboardData, GigStatus, PaymentStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import GigStatusBadge from '@/components/projects/GigStatusBadge'
import PaymentStatusBadge from '@/components/revenue/PaymentStatusBadge'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  recentProjects: DashboardData['recentProjects']
  recentPayments: DashboardData['recentPayments']
}

export default function RecentActivity({ recentProjects, recentPayments }: Props) {
  const { currency } = useSettings()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Open Projects</h3>
        {recentProjects.length === 0 ? (
          <p className="text-sm text-zinc-400">No open projects</p>
        ) : (
          <div className="space-y-2">
            {recentProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-zinc-800 font-medium truncate">{p.name}</div>
                  {p.clients?.client_name && <div className="text-xs text-zinc-400">{p.clients.client_name}</div>}
                </div>
                <div className="shrink-0">
                  {p.project_type === 'package'
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">Package</span>
                    : <GigStatusBadge status={p.status as GigStatus} />
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Recent Payments</h3>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-zinc-400">No payments logged yet</p>
        ) : (
          <div className="space-y-2">
            {recentPayments.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-zinc-800 font-medium">{r.clients?.client_name ?? 'Unknown'}</div>
                  <div className="text-xs text-zinc-400">{formatDate(r.payment_date)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(r.amount), currency)}</span>
                  <PaymentStatusBadge status={r.status as PaymentStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
