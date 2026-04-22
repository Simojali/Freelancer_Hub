import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  project: Project
  onView: () => void
  onBill: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function RetainerRow({ project, onView, onBill, onEdit, onDelete }: Props) {
  const { currency } = useSettings()
  const delivered = project.delivery_count ?? 0
  const unitPrice = project.unit_price ?? 0
  const owed = delivered * unitPrice

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors">
      {/* Type indicator */}
      <div className="shrink-0 w-1.5 h-8 rounded-full bg-teal-400" />

      {/* Name + client */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 text-sm truncate">{project.name}</div>
        {project.clients?.client_name && (
          <div className="text-xs text-zinc-400 mt-0.5">{project.clients.client_name}</div>
        )}
      </div>

      {/* Service badge */}
      <ServiceBadge slug={project.service_type} />

      {/* Unit price */}
      {unitPrice > 0 && (
        <span className="text-sm text-zinc-500 shrink-0">{formatCurrency(unitPrice, currency)} / unit</span>
      )}

      {/* Unbilled deliveries & owed */}
      <div className="shrink-0 flex items-center gap-2">
        <span className={`text-sm font-semibold ${owed > 0 ? 'text-teal-600' : 'text-zinc-400'}`}>
          {delivered} unbilled → {formatCurrency(owed, currency)} owed
        </span>
        <button
          onClick={onBill}
          disabled={delivered === 0}
          className="text-xs px-2 py-0.5 rounded-full border font-medium bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Bill
        </button>
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
  )
}
