import type { PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-orange-50 text-orange-600 border-orange-200' },
}

export default function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = config[status] ?? config.pending
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {label}
    </span>
  )
}
