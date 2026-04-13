import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Revenue } from '@/lib/types'

interface Props {
  revenue: Revenue[]
}

export default function MonthlyChart({ revenue }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { month: string; thumbnail: number; video_editing: number; both: number }> = {}

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      map[key] = { month: label, thumbnail: 0, video_editing: 0, both: 0 }
    }

    revenue
      .filter(r => r.status === 'paid' && r.payment_date)
      .forEach(r => {
        const key = r.payment_date!.slice(0, 7)
        if (map[key]) {
          map[key][r.service_type] += Number(r.amount)
        }
      })

    return Object.values(map)
  }, [revenue])

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <h3 className="text-sm font-medium text-zinc-700 mb-4">Monthly Revenue (Last 12 Months)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={16}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [`$${value}`, name === 'video_editing' ? 'Video Editing' : name === 'thumbnail' ? 'Thumbnail' : 'Both'] as [string, string]}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e4e4e7' }}
          />
          <Legend formatter={(v) => v === 'video_editing' ? 'Video Editing' : v === 'thumbnail' ? 'Thumbnail' : 'Both'} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="thumbnail" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="video_editing" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
          <Bar dataKey="both" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
