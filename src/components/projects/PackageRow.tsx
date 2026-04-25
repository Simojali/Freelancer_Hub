import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, ChevronDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useSettings } from '@/hooks/useSettings'
import DeliveryPeek from './DeliveryPeek'

function creditsColor(left: number, total: number): string {
  if (total === 0) return 'text-zinc-400'
  const ratio = left / total
  if (ratio > 0.3) return 'text-emerald-600'
  if (ratio > 0) return 'text-amber-500'
  return 'text-red-500'
}

interface Props {
  project: Project
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onRenew?: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function PackageRow({ project, onView, onEdit, onDelete, onRenew, isExpanded, onToggleExpand }: Props) {
  const { currency } = useSettings()
  const total = project.total_units ?? 0
  const delivered = project.delivery_count ?? 0
  const creditsLeft = total - delivered
  const isEmpty = creditsLeft <= 0 && total > 0

  return (
    <div className="bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Expand chevron */}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="shrink-0 p-1 -m-1 text-zinc-400 hover:text-zinc-700 rounded"
            aria-label={isExpanded ? 'Collapse deliveries' : 'Expand deliveries'}
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        )}

        {/* Type indicator */}
        <div className="shrink-0 w-1.5 h-8 rounded-full bg-violet-400" />

        {/* Name + client */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-zinc-900 text-sm truncate">{project.name}</div>
          {project.clients?.client_name && (
            <div className="text-xs text-zinc-400 mt-0.5">{project.clients.client_name}</div>
          )}
        </div>

        {/* Service badge */}
        <ServiceBadge slug={project.service_type} />

        {/* Price */}
        {project.price != null && (
          <span className="text-sm text-zinc-600 shrink-0">{formatCurrency(project.price, currency)}</span>
        )}

        {/* Credits */}
        <div className="shrink-0 flex items-center gap-2">
          <span className={`text-sm font-semibold ${creditsColor(creditsLeft, total)}`}>
            {creditsLeft} / {total} credits
          </span>
          {isEmpty && (
            <button
              type="button"
              onClick={onRenew}
              className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
            >
              Renew
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900" onClick={onView}>
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
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
          <DeliveryPeek
            projectId={project.id}
            onViewAll={onView}
            disabled={isEmpty}
            disabledReason="No credits remaining. Ask client to renew."
            hideQuantity
          />
        </div>
      )}
    </div>
  )
}
