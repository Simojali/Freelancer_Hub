import type { GigStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<GigStatus, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  done:        { label: 'Done',        className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function GigStatusBadge({ status }: { status: GigStatus }) {
  const { label, className } = config[status] ?? config.pending
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {label}
    </span>
  )
}
