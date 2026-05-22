import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  /** Accepts a ReactNode so callers can style sub-parts of the value (e.g. a smaller "/ total"). */
  value: ReactNode
  icon: LucideIcon
  iconColor?: string
  /** Accepts a ReactNode so callers can render colored trend arrows / pills. */
  sub?: ReactNode
  /** When provided, the whole card becomes clickable + keyboard-focusable. */
  onClick?: () => void
}

export default function KpiCard({ label, value, icon: Icon, iconColor = 'text-muted-foreground', sub, onClick }: Props) {
  const interactive = !!onClick
  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } }
        : undefined}
      className={`border border-border shadow-none ${interactive ? 'cursor-pointer hover:border-border hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>}
      </CardContent>
    </Card>
  )
}
