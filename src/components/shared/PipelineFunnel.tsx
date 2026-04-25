import type { DashboardData } from '@/lib/types'

interface Props {
  pipeline: DashboardData['pipeline']
  total: number
}

const STAGES = [
  { key: 'sample',        label: 'Sample Made',       color: '#6366f1' },
  { key: 'beforeAfter',   label: 'B/A Created',        color: '#8b5cf6' },
  { key: 'followed',      label: 'Followed',            color: '#a855f7' },
  { key: 'contactedIg',   label: 'Contacted (IG)',      color: '#ec4899' },
  { key: 'contactedEmail',label: 'Contacted (Email)',   color: '#f43f5e' },
  { key: 'seen',          label: 'Seen',                color: '#f97316' },
  { key: 'responded',     label: 'Responded',           color: '#eab308' },
  { key: 'closed',        label: 'Closed',              color: '#22c55e' },
] as const

export default function PipelineFunnel({ pipeline, total }: Props) {
  // Base percentages off the total leads pool (prospects + outreach)
  const base = total > 0 ? total : 1

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-zinc-700">Outreach Pipeline</h3>
        <span className="text-xs text-zinc-400">{total} in outreach</span>
      </div>

      <div className="space-y-1">
        {STAGES.map(({ key, label, color }, i) => {
          const count = pipeline[key]
          // % of total leads for the bar width
          const pct = Math.round((count / base) * 100)
          // drop-off vs previous stage
          const prev = i === 0 ? base : pipeline[STAGES[i - 1].key]
          const dropped = prev - count
          const dropPct = prev > 0 ? Math.round((dropped / prev) * 100) : 0

          return (
            <div key={key}>
              <div className="flex items-center gap-3 py-1.5">
                {/* Label + step */}
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <span
                    className="w-1.5 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-zinc-600 truncate">{label}</span>
                </div>

                {/* Bar */}
                <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }}
                  />
                </div>

                {/* Count */}
                <div className="w-16 text-right shrink-0">
                  <span className="text-sm font-semibold text-zinc-800">{count}</span>
                  <span className="text-xs text-zinc-400 ml-1">({pct}%)</span>
                </div>

                {/* Drop-off (skip first stage) */}
                <div className="w-14 text-right shrink-0">
                  {i > 0 && dropped > 0 && (
                    <span className="text-xs text-red-400">−{dropPct}%</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom summary */}
      <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-end text-xs">
        <span className="font-medium text-green-600">
          {pipeline.closed} closed
          {pipeline.sample > 0 && (
            <span className="text-zinc-400 font-normal ml-1">
              ({Math.round((pipeline.closed / pipeline.sample) * 100)}% close rate)
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
