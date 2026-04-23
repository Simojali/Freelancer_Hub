import { ArrowRight } from 'lucide-react'
import DeliveryLogForm from './DeliveryLogForm'
import DeliveryList from './DeliveryList'
import { useDeliveries } from '@/hooks/useDeliveries'

interface Props {
  projectId: string | undefined
  /** Maximum rows shown in the peek (defaults to 5). */
  limit?: number
  /** Called when the user clicks "See all" — caller opens the full-detail modal. */
  onViewAll: () => void
  /** When true, hide the "Log delivery" form (used for out-of-credits packages). */
  disabled?: boolean
  disabledReason?: string
  /** Hide the quantity input (packages are 1 credit per delivery). */
  hideQuantity?: boolean
}

/**
 * Compact inline peek for a project's deliveries. Designed to be rendered
 * directly below a project row when the user expands it — shows the log
 * form and the last N deliveries, then a "See all →" link that opens the
 * full detail modal for deeper work.
 */
export default function DeliveryPeek({ projectId, limit = 5, onViewAll, disabled, disabledReason, hideQuantity }: Props) {
  const { deliveries } = useDeliveries(projectId)
  const hasMore = deliveries.length > limit

  return (
    <div className="space-y-3">
      <DeliveryLogForm
        projectId={projectId}
        disabled={disabled}
        disabledReason={disabledReason}
        hideQuantity={hideQuantity}
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            {deliveries.length === 0
              ? 'No deliveries yet'
              : hasMore
                ? `Recent — showing ${Math.min(limit, deliveries.length)} of ${deliveries.length}`
                : `${deliveries.length} deliver${deliveries.length !== 1 ? 'ies' : 'y'}`}
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <DeliveryList projectId={projectId} limit={limit} hideHeader />
      </div>
    </div>
  )
}
