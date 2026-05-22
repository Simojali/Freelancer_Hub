import type { DashboardData, PaymentStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import PaymentStatusBadge from '@/components/revenue/PaymentStatusBadge'
import { useSettings } from '@/hooks/useSettings'
import { useNavigate } from 'react-router-dom'

interface Props {
  recentPayments: DashboardData['recentPayments']
}

export default function RecentPaymentsCard({ recentPayments }: Props) {
  const { currency } = useSettings()
  const navigate = useNavigate()

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">Recent Payments</h3>
      {recentPayments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments logged yet</p>
      ) : (
        <div className="space-y-1 -mx-2">
          {recentPayments.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => r.client_id ? navigate(`/clients/${r.client_id}`) : navigate('/revenue')}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <div className="text-sm text-foreground font-medium">{r.clients?.client_name ?? 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{formatDate(r.payment_date)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(r.amount), currency)}</span>
                <PaymentStatusBadge status={r.status as PaymentStatus} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
