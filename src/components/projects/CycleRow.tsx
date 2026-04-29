import { Eye, Package as PackageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BilledCycle } from '@/hooks/useBilledCycles'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import ServiceBadge from '@/components/shared/ServiceBadge'

interface Props {
  cycle: BilledCycle
  onView: () => void
}

/**
 * Read-only row representing one completed retainer billing cycle.
 * Visually styled like a project row but slightly muted to communicate
 * "this is history, not active work."
 */
export default function CycleRow({ cycle, onView }: Props) {
  const { currency } = useSettings()

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors opacity-90">
      {/* Type indicator — muted teal to signal "completed retainer cycle" */}
      <div className="shrink-0 w-1.5 h-8 rounded-full bg-teal-200" />

      {/* Project + client */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <PackageIcon className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="font-medium text-zinc-700 text-sm truncate">{cycle.project_name}</span>
          <span className="text-xs text-zinc-400">cycle</span>
        </div>
        {cycle.client_name && (
          <div className="text-xs text-zinc-400 mt-0.5">{cycle.client_name}</div>
        )}
      </div>

      <ServiceBadge slug={cycle.service_type} />

      {/* Delivery count */}
      <span className="text-xs text-zinc-500 shrink-0">
        {cycle.delivery_count} deliver{cycle.delivery_count !== 1 ? 'ies' : 'y'}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold text-zinc-700 shrink-0">
        {formatCurrency(cycle.amount, currency)}
      </span>

      {/* Paid date */}
      <span className="text-xs text-zinc-400 shrink-0 whitespace-nowrap">
        {cycle.status === 'paid' ? 'paid' : 'billed'} {formatDate(cycle.payment_date)}
      </span>

      {/* View deliveries */}
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900"
          onClick={onView}
          title="View deliveries in this cycle"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
