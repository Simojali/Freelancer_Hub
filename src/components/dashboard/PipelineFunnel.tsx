import type { DashboardData } from '@/lib/types'

interface Props {
  pipeline: DashboardData['pipeline']
  total: number
}

const STAGES = [
  { key: 'sample', label: 'Sample Made' },
  { key: 'beforeAfter', label: 'B/A Created' },
  { key: 'followed', label: 'Followed' },
  { key: 'contactedIg', label: 'Contacted (IG)' },
  { key: 'contactedEmail', label: 'Contacted (Email)' },
  { key: 'seen', label: 'Seen' },
  { key: 'responded', label: 'Responded' },
  { key: 'closed', label: 'Closed' },
] as const

export default function PipelineFunnel({ pipeline, total }: Props) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <h3 className="text-sm font-medium text-zinc-700 mb-4">Outreach Pipeline</h3>
      <div className="space-y-2">
        {STAGES.map(({ key, label }) => {
          const count = pipeline[key]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-36 shrink-0">{label}</span>
              <div className="flex-1 bg-zinc-100 rounded-full h-2">
                <div
                  className="bg-zinc-800 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-zinc-700 w-12 text-right">{count} <span className="text-zinc-400 font-normal">({pct}%)</span></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
