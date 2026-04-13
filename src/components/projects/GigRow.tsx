import type { Project, GigStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { serviceLabel, formatCurrency } from '@/lib/utils'
import GigStatusBadge from './GigStatusBadge'

const SERVICE_COLORS: Record<string, string> = {
  thumbnail:     'bg-blue-50 text-blue-700 border-blue-200',
  video_editing: 'bg-purple-50 text-purple-700 border-purple-200',
  both:          'bg-emerald-50 text-emerald-700 border-emerald-200',
}

interface Props {
  project: Project
  onEdit: () => void
  onDelete: () => void
}

export default function GigRow({ project, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors">
      {/* Type indicator */}
      <div className="shrink-0 w-1.5 h-8 rounded-full bg-zinc-300" />

      {/* Name + client */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 text-sm truncate">{project.name}</div>
        {project.clients?.client_name && (
          <div className="text-xs text-zinc-400 mt-0.5">{project.clients.client_name}</div>
        )}
      </div>

      {/* Service badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${SERVICE_COLORS[project.service_type]}`}>
        {serviceLabel(project.service_type)}
      </span>

      {/* Price */}
      {project.price != null && (
        <span className="text-sm text-zinc-600 shrink-0">{formatCurrency(project.price)}</span>
      )}

      {/* Status */}
      <div className="shrink-0">
        {project.status && <GigStatusBadge status={project.status as GigStatus} />}
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
