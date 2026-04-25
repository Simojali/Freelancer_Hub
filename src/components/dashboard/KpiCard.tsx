import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  /** Accepts a ReactNode so callers can style sub-parts of the value (e.g. a smaller "/ total"). */
  value: ReactNode
  icon: LucideIcon
  iconColor?: string
  sub?: string
  /** When provided, the whole card becomes clickable + keyboard-focusable. */
  onClick?: () => void
}

export default function KpiCard({ label, value, icon: Icon, iconColor = 'text-zinc-400', sub, onClick }: Props) {
  const interactive = !!onClick
  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } }
        : undefined}
      className={`border border-zinc-200 shadow-none ${interactive ? 'cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="text-2xl font-semibold text-zinc-900">{value}</div>
        {sub && <div className="text-xs text-zinc-400 mt-1 truncate">{sub}</div>}
      </CardContent>
    </Card>
  )
}
