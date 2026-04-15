import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  sub?: string
}

export default function KpiCard({ label, value, icon: Icon, iconColor = 'text-zinc-400', sub }: Props) {
  return (
    <Card className="border border-zinc-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="text-2xl font-semibold text-zinc-900">{value}</div>
        {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  )
}
