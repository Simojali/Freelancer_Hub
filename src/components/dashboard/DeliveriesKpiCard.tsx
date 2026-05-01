import { useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Package as PackageIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { DashboardData } from '@/lib/types'

type Period = 'today' | 'yesterday' | 'week' | 'month30'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: '7 days' },
  { key: 'month30',   label: '30 days' },
]

interface Props {
  stats: DashboardData['kpis']['deliveryStats']
}

/**
 * Output-focused KPI: how many deliveries shipped in the selected window,
 * plus a trend comparison to the prior equivalent period. Four windows
 * (today, yesterday, last 7 days, last 30 days) selectable via a tiny
 * segmented control inside the card. Not clickable — it's an inspection
 * card, not a navigation surface.
 */
export default function DeliveriesKpiCard({ stats }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const { count, prior } = stats[period]

  // Trend math — render direction + colour based on whether output went
  // up, down, or stayed flat vs the prior equivalent period. When the prior
  // period was zero we can't compute a percentage, so just show "vs 0".
  let trendNode: React.ReactNode
  if (prior === 0 && count === 0) {
    trendNode = <span className="text-zinc-400">no deliveries</span>
  } else if (prior === 0) {
    trendNode = <span className="text-emerald-600 inline-flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />new</span>
  } else {
    const pct = Math.round(((count - prior) / prior) * 100)
    if (pct > 0) {
      trendNode = <span className="text-emerald-600 inline-flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />{pct}%</span>
    } else if (pct < 0) {
      trendNode = <span className="text-red-500 inline-flex items-center gap-0.5"><ArrowDown className="w-3 h-3" />{Math.abs(pct)}%</span>
    } else {
      trendNode = <span className="text-zinc-400 inline-flex items-center gap-0.5"><Minus className="w-3 h-3" />flat</span>
    }
  }

  return (
    <Card className="border border-zinc-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide shrink-0">Deliveries</span>
            {/* Period selector inline with the title */}
            <div className="flex items-center rounded-md border border-zinc-200 overflow-hidden text-[10px]">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'px-1.5 py-0.5 transition-colors whitespace-nowrap',
                    period === p.key
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:bg-zinc-50',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <PackageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-semibold text-zinc-900 leading-none">{count}</div>

          {/* Sparkline — last 30 days of daily counts. Static window
              regardless of selected period: gives stable trend context. */}
          {stats.daily.some(d => d.count > 0) && (
            <div className="w-28 h-9 shrink-0">
              <ResponsiveContainer>
                <BarChart data={stats.daily} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  {/* Hidden XAxis tells Recharts the `date` field is the
                      x-dimension, so the Tooltip's labelFormatter receives
                      the actual date string instead of the row index. */}
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{
                      fontSize: 11,
                      padding: '4px 8px',
                      border: '1px solid #e4e4e7',
                      borderRadius: 6,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    }}
                    // Float the tooltip ABOVE the cursor so it never overlaps
                    // the tiny sparkline bars. allowEscapeViewBox lets it spill
                    // outside the chart bounds; the transform shifts it up by
                    // its own height + 10px gap.
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{
                      outline: 'none',
                      zIndex: 10,
                      transform: 'translateY(calc(-100% - 12px))',
                    }}
                    // Recharts v3 has strict overloaded signatures here; casting
                    // to satisfy both variants without ceremony.
                    labelFormatter={((d: string) => formatDate(d)) as never}
                    formatter={((v: number) => [`${v} deliver${v !== 1 ? 'ies' : 'y'}`, '']) as never}
                    separator=""
                  />
                  <Bar dataKey="count" fill="#71717a" radius={[1.5, 1.5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="text-xs text-zinc-400 mt-1 truncate">
          {prior} prior · {trendNode}
        </div>
      </CardContent>
    </Card>
  )
}
