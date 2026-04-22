import type { Project, GigStatus } from '@/lib/types'
import { isGigUnpaid } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import GigStatusBadge from './GigStatusBadge'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  project: Project
  onEdit: () => void
  onDelete: () => void
}

export default function GigRow({ project, onEdit, onDelete }: Props) {
  const { currency } = useSettings()
  const isOverdue =
    project.due_date != null &&
    project.status !== 'done' &&
    new Date(project.due_date) < new Date()
  const unpaid = isGigUnpaid(project)

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors',
      isOverdue && 'bg-red-50 border-red-200'
    )}>
      {/* Type indicator */}
      <div className="shrink-0 w-1.5 h-8 rounded-full bg-zinc-300" />

      {/* Name + client */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 text-sm truncate">{project.name}</div>
        {project.clients?.client_name && (
          <div className="text-xs text-zinc-400 mt-0.5">{project.clients.client_name}</div>
        )}
        {project.due_date && (
          <div className="text-xs text-zinc-400 mt-0.5">Due {formatDate(project.due_date)}</div>
        )}
      </div>

      {/* Service badge */}
      <ServiceBadge slug={project.service_type} />

      {/* Price */}
      {project.price != null && (
        <span className="text-sm text-zinc-600 shrink-0">{formatCurrency(project.price, currency)}</span>
      )}

      {/* Status + Overdue + Unpaid */}
      <div className="shrink-0 flex items-center gap-1.5">
        {project.status && <GigStatusBadge status={project.status as GigStatus} />}
        {isOverdue && (
          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-50 text-red-600 border-red-200">
            Overdue
          </span>
        )}
        {unpaid && (
          <span
            className="text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-50 text-amber-700 border-amber-200"
            title={(project.paid_amount ?? 0) > 0
              ? `${formatCurrency(project.paid_amount ?? 0, currency)} of ${formatCurrency(project.price ?? 0, currency)} paid`
              : 'No payment logged for this gig'}
          >
            Unpaid
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
