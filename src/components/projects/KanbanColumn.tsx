import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { ProjectStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const HEADER_COLORS: Record<ProjectStatus, string> = {
  in_progress: 'bg-amber-50 border-amber-200 text-amber-700',
  review: 'bg-blue-50 border-blue-200 text-blue-700',
  done: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

interface Props {
  id: ProjectStatus
  label: string
  count: number
  children: ReactNode
}

export default function KanbanColumn({ id, label, count, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-zinc-200 bg-zinc-50 min-h-[200px] transition-colors',
        isOver && 'border-zinc-400 bg-zinc-100'
      )}
    >
      <div className={cn('flex items-center justify-between px-4 py-2.5 rounded-t-lg border-b', HEADER_COLORS[id])}>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <span className="text-xs font-medium opacity-70">{count}</span>
      </div>
      <div className="p-2 space-y-2">
        {children}
      </div>
    </div>
  )
}
