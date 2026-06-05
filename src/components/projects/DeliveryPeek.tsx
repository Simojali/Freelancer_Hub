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
  // Peek summarises completed work; planning lives inside DeliveryList itself.
  const done = deliveries.filter(d => d.status === 'done')
  const hasMore = done.length > limit
  const countLabel = done.length === 0
    ? 'No deliveries yet'
    : hasMore
      ? `Showing ${Math.min(limit, done.length)} of ${done.length}`
      : `${done.length} deliver${done.length !== 1 ? 'ies' : 'y'}`

  return (
    <div className="space-y-3">
      <DeliveryLogForm
        projectId={projectId}
        disabled={disabled}
        disabledReason={disabledReason}
        hideQuantity={hideQuantity}
      />

      <div>
        <div className="flex items-center justify-end mb-1.5">
          <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>{countLabel}</span>
            <button
              type="button"
              onClick={onViewAll}
              className="hover:text-foreground inline-flex items-center gap-1 normal-case tracking-normal text-xs"
            >
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Planning enabled so the user can queue work right next to where
            they log it — the expanded project row is the natural surface.
            DeliveryList renders its own "Up next" + "Delivered" subheadings. */}
        <DeliveryList projectId={projectId} limit={limit} hideHeader />
      </div>
    </div>
  )
}
