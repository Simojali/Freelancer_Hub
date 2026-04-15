import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Revenue } from '@/lib/types'
import { useSettings } from '@/hooks/useSettings'
import { useServices } from '@/hooks/useServices'
import { formatCurrency } from '@/lib/utils'

interface Props {
  revenue: Revenue[]
}

export default function MonthlyChart({ revenue }: Props) {
  const { currency } = useSettings()
  const { services } = useServices()

  const data = useMemo(() => {
    const map: Record<string, Record<string, number | string>> = {}

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const entry: Record<string, number | string> = { month: label }
      services.forEach(s => { entry[s.slug] = 0 })
      map[key] = entry
    }

    revenue
      .filter(r => r.status === 'paid' && r.payment_date)
      .forEach(r => {
        const key = r.payment_date!.slice(0, 7)
        if (map[key]) {
          if (map[key][r.service_type] !== undefined) {
            (map[key][r.service_type] as number) += Number(r.amount)
          } else {
            map[key][r.service_type] = Number(r.amount)
          }
        }
      })

    return Object.values(map)
  }, [revenue, services])

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <h3 className="text-sm font-medium text-zinc-700 mb-4">Monthly Revenue (Last 12 Months)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={16}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatCurrency(v, currency)} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const service = services.find(s => s.slug === name)
              return [formatCurrency(value, currency), service?.name ?? name] as [string, string]
            }}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e4e4e7' }}
          />
          <Legend
            formatter={(v) => services.find(s => s.slug === v)?.name ?? v}
            wrapperStyle={{ fontSize: 12 }}
          />
          {services.map((s, i) => (
            <Bar
              key={s.slug}
              dataKey={s.slug}
              stackId="a"
              fill={s.color}
              radius={i === services.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
