import type { ProjectStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<ProjectStatus, { label: string; className: string }> = {
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  review: { label: 'Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  done: { label: 'Done', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, className } = config[status] ?? config.in_progress
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {label}
    </span>
  )
}
