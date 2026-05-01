import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { DashboardData } from '@/lib/types'

type Period = 'today' | 'yesterday' | 'week' | 'month30'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: '7 days' },
  { key: 'month30',   label: '30 days' },
]

const LABEL_FOR_PRIOR: Record<Period, string> = {
  today:     'yesterday',
  yesterday: 'day before',
  week:      'prior 7 days',
  month30:   'prior 30 days',
}

interface Props {
  earnings: DashboardData['kpis']['earnings']
  currency: string
}

/**
 * Money-focused twin to DeliveriesKpiCard. Same period toggle, same trend
 * language. Shows the realised value of work in the selected window:
 * retainer + package deliveries × per-unit rate, plus paid gig revenue
 * dated within the window.
 */
export default function EarningsKpiCard({ earnings, currency }: Props) {
  const [period, setPeriod] = useState<Period>('today')
  const { amount, prior } = earnings[period]

  // Same trend math as DeliveriesKpiCard so the two cards feel paired.
  let trendNode: React.ReactNode
  if (prior === 0 && amount === 0) {
    trendNode = <span className="text-zinc-400">no earnings {LABEL_FOR_PRIOR[period]}</span>
  } else if (prior === 0) {
    trendNode = (
      <>
        <span className="text-zinc-500">{formatCurrency(0, currency)} {LABEL_FOR_PRIOR[period]} · </span>
        <span className="text-emerald-600 inline-flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />new</span>
      </>
    )
  } else {
    const pct = Math.round(((amount - prior) / prior) * 100)
    const arrow = pct > 0
      ? <span className="text-emerald-600 inline-flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />{pct}%</span>
      : pct < 0
        ? <span className="text-red-500 inline-flex items-center gap-0.5"><ArrowDown className="w-3 h-3" />{Math.abs(pct)}%</span>
        : <span className="text-zinc-400 inline-flex items-center gap-0.5"><Minus className="w-3 h-3" />flat</span>
    trendNode = (
      <>
        <span className="text-zinc-500">{formatCurrency(prior, currency)} {LABEL_FOR_PRIOR[period]} · </span>
        {arrow}
      </>
    )
  }

  return (
    <Card className="border border-zinc-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide shrink-0">Earned</span>
            {/* Period selector inline with the title — matches DeliveriesKpiCard */}
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
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>

        <div className="text-2xl font-semibold text-zinc-900">{formatCurrency(amount, currency)}</div>
        <div className="text-xs text-zinc-400 mt-1 truncate">{trendNode}</div>
      </CardContent>
    </Card>
  )
}
