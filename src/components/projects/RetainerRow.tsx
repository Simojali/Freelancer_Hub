import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, ChevronDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useSettings } from '@/hooks/useSettings'
import DeliveryPeek from './DeliveryPeek'
import { Money } from '@/components/ui/money'

interface Props {
  project: Project
  onView: () => void
  onBill: () => void
  onEdit: () => void
  onDelete: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function RetainerRow({ project, onView, onBill, onEdit, onDelete, isExpanded, onToggleExpand }: Props) {
  const { currency } = useSettings()
  const delivered = project.delivery_count ?? 0
  const unitPrice = project.unit_price ?? 0
  const owed = delivered * unitPrice

  return (
    <div className="bg-card border border-border rounded-lg hover:border-border transition-colors overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Expand chevron */}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="shrink-0 p-1 -m-1 text-muted-foreground hover:text-foreground rounded"
            aria-label={isExpanded ? 'Collapse deliveries' : 'Expand deliveries'}
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        )}

        {/* Type indicator */}
        <div className="shrink-0 w-1.5 h-8 rounded-full bg-teal-400" />

        {/* Name + client */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground text-sm truncate">{project.name}</div>
          {project.clients?.client_name && (
            <div className="text-xs text-muted-foreground mt-0.5">{project.clients.client_name}</div>
          )}
        </div>

        {/* Service badge */}
        <ServiceBadge slug={project.service_type} />

        {/* Unit price */}
        {unitPrice > 0 && (
          <span className="text-sm text-muted-foreground shrink-0">{<Money>{formatCurrency(unitPrice, currency)}</Money>} / unit</span>
        )}

        {/* Unbilled deliveries & owed */}
        <div className="shrink-0 flex items-center gap-2">
          <span className={`text-sm font-semibold ${owed > 0 ? 'text-teal-600' : 'text-muted-foreground'}`}>
            {delivered} unbilled → {<Money>{formatCurrency(owed, currency)}</Money>} owed
          </span>
          <button
            type="button"
            onClick={onBill}
            disabled={delivered === 0}
            className="text-xs px-2 py-0.5 rounded-full border font-medium bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Bill
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onView}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Inline peek */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/40/50 px-4 py-3">
          <DeliveryPeek projectId={project.id} onViewAll={onView} />
        </div>
      )}
    </div>
  )
}
