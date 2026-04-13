import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import { formatDate, serviceLabel } from '@/lib/utils'

const SERVICE_COLORS: Record<string, string> = {
  thumbnail: 'bg-blue-50 text-blue-700 border-blue-200',
  video_editing: 'bg-purple-50 text-purple-700 border-purple-200',
  both: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

interface Props {
  project: Project
  onEdit: () => void
  onDelete: () => void
}

export default function ProjectCard({ project, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
    >
      <Card className="border border-zinc-200 shadow-none bg-white">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-zinc-300 hover:text-zinc-500 shrink-0">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-zinc-900 text-sm truncate">{project.title}</div>
              {project.clients?.client_name && (
                <div className="text-xs text-zinc-400 mt-0.5">{project.clients.client_name}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${SERVICE_COLORS[project.service_type]}`}>
                  {serviceLabel(project.service_type)}
                </span>
                {project.due_date && (
                  <span className="text-xs text-zinc-400">{formatDate(project.due_date)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
