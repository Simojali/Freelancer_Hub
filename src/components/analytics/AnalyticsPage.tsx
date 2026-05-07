import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Trophy, BarChart3, AlertTriangle, Package as PackageIcon, UserPlus, Target } from 'lucide-react'
import AnalyticsPeriodPicker from './AnalyticsPeriodPicker'
import { useAnalytics, ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/hooks/useAnalytics'
import { useServices } from '@/hooks/useServices'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/lib/utils'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/shared/EmptyState'

// Donut palette — fallback when a service doesn't have an explicit color in DB
const FALLBACK_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#64748b']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('last_12_months')
  const { data, isLoading } = useAnalytics(period)
  const { services } = useServices()
  const { currency } = useSettings()
  const navigate = useNavigate()

  const periodLabel = ANALYTICS_PERIODS.find(p => p.value === period)?.label ?? ''
  const serviceMeta = (slug: string) => services.find(s => s.slug === slug)
  // Adapt "month" / "day" copy based on the chart granularity the hook chose.
  const granularity = data?.totals.granularity ?? 'monthly'
  const unitWord = granularity === 'daily' ? 'day' : 'month'
  const unitLabel = (n: number) => `${unitWord}${n !== 1 ? 's' : ''}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">Analytics</h1>
        <AnalyticsPeriodPicker period={period} onChange={setPeriod} />
      </div>

      {isLoading || !data ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-lg bg-zinc-100" />)}
          </div>
          <div className="h-72 rounded-lg bg-zinc-100" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-72 rounded-lg bg-zinc-100" />
            <div className="h-72 rounded-lg bg-zinc-100" />
          </div>
        </div>
      ) : data.totals.totalRevenue === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No revenue in this range"
          description="Once you log payments, charts and trends will populate here. Try widening the period selector."
          size="lg"
        />
      ) : (
        <>
          {/* KPI strip — period totals + comparisons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total revenue"
              value={formatCurrency(data.totals.totalRevenue, currency)}
              sub={`${formatCurrency(data.totals.paidRevenue, currency)} paid · ${formatCurrency(data.totals.pendingRevenue, currency)} pending`}
              icon={BarChart3}
              iconColor="text-emerald-500"
            />
            <KpiCard
              label={`Avg per ${unitWord}`}
              value={formatCurrency(data.totals.avgPerMonth, currency)}
              sub={`across ${data.totals.monthsCount} ${unitLabel(data.totals.monthsCount)}`}
              icon={BarChart3}
              iconColor="text-blue-500"
            />
            <KpiCard
              label={`Best ${unitWord}`}
              value={data.totals.bestMonth ? formatCurrency(data.totals.bestMonth.amount, currency) : '—'}
              sub={data.totals.bestMonth?.label ?? 'no data'}
              icon={Trophy}
              iconColor="text-amber-500"
            />
            {data.totals.yoy && data.totals.yoy.pct !== null ? (
              <KpiCard
                label="YoY change"
                value={
                  <span className={data.totals.yoy.pct >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                    {data.totals.yoy.pct > 0 ? '+' : ''}{data.totals.yoy.pct}%
                  </span>
                }
                sub={`vs ${formatCurrency(data.totals.yoy.prior, currency)} a year ago`}
                icon={data.totals.yoy.pct >= 0 ? TrendingUp : TrendingDown}
                iconColor={data.totals.yoy.pct >= 0 ? 'text-emerald-500' : 'text-red-500'}
              />
            ) : (
              <KpiCard
                label="Concentration"
                value={`${data.totals.concentration.top1Pct}%`}
                sub={`top 3 clients = ${data.totals.concentration.top3Pct}% of revenue`}
                icon={AlertTriangle}
                iconColor={data.totals.concentration.top1Pct >= 50 ? 'text-amber-500' : 'text-zinc-400'}
              />
            )}
          </div>

          {/* Monthly revenue chart */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-700">Revenue by {unitWord}</h3>
              <span className="text-xs text-zinc-400">{periodLabel}</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByMonth} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: 6 }}
                    formatter={((v: number, name: string) => [formatCurrency(v, currency), name === 'paid' ? 'Paid' : 'Pending']) as never}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(v: string) => v === 'paid' ? 'Paid' : 'Pending'}
                  />
                  <Bar dataKey="paid"    stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top clients */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="text-sm font-medium text-zinc-700 mb-3">Top clients</h3>
              {data.topClients.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No client revenue in this range</p>
              ) : (
                <div className="space-y-2">
                  {data.topClients.map(c => {
                    const pct = data.totals.totalRevenue > 0
                      ? (c.total / data.totals.totalRevenue) * 100
                      : 0
                    return (
                      <button
                        key={c.client_id}
                        type="button"
                        onClick={() => navigate(`/clients/${c.client_id}`)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-zinc-700 group-hover:text-zinc-900 truncate">{c.client_name}</span>
                          <span className="text-zinc-500 shrink-0 ml-2">{formatCurrency(c.total, currency)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 group-hover:bg-emerald-500 transition-colors rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Service mix donut */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="text-sm font-medium text-zinc-700 mb-3">Revenue by service</h3>
              {data.revenueByService.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No service revenue in this range</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-44 h-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.revenueByService}
                          dataKey="total"
                          nameKey="service"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={1}
                        >
                          {data.revenueByService.map((entry, idx) => {
                            const meta = serviceMeta(entry.service)
                            return (
                              <Cell
                                key={entry.service}
                                fill={meta?.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                              />
                            )
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: 6 }}
                          formatter={((v: number, _name: string, item: { payload: { service: string } }) => {
                            const meta = serviceMeta(item.payload.service)
                            return [formatCurrency(v, currency), meta?.name ?? item.payload.service]
                          }) as never}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    {data.revenueByService.map((entry, idx) => {
                      const meta = serviceMeta(entry.service)
                      return (
                        <div key={entry.service} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: meta?.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
                            />
                            <span className="text-zinc-700 truncate">{meta?.name ?? entry.service}</span>
                          </div>
                          <div className="shrink-0 text-zinc-500">
                            <span className="font-medium text-zinc-700">{formatCurrency(entry.total, currency)}</span>
                            <span className="ml-1.5">{entry.pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Productivity (deliveries + earnings combined) ─── */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Productivity</h2>
              <span className="text-xs text-zinc-400">
                {data.totals.totalDeliveries} deliveries · {formatCurrency(data.totals.totalEarned, currency)} earned · avg {data.totals.avgDeliveriesPerMonth.toFixed(1)}/{granularity === 'daily' ? 'day' : 'mo'}
              </span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <PackageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <h3 className="text-sm font-medium text-zinc-700">Deliveries &amp; earnings per {unitWord}</h3>
                <span className="text-[10px] text-zinc-400 ml-auto">
                  bars = deliveries · line = earned (value created)
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.deliveriesByMonth.map((d, i) => ({
                      ...d,
                      earned: data.earningsByMonth[i]?.amount ?? 0,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#e4e4e7' }} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: 6 }}
                      formatter={((v: number, name: string) => {
                        if (name === 'count')  return [`${v} deliver${v !== 1 ? 'ies' : 'y'}`, 'Deliveries']
                        if (name === 'earned') return [formatCurrency(v, currency), 'Earned']
                        return [v, name]
                      }) as never}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(v: string) => v === 'count' ? 'Deliveries' : 'Earned'}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="earned"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ─── Growth ─── */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Growth</h2>
              <span className="text-xs text-zinc-400">
                {data.totals.newClientsCount} new clients · {data.totals.newLeadsCount} leads · {data.totals.leadCohortCloseRate}% cohort close rate
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* New clients per bucket */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="text-sm font-medium text-zinc-700">New clients per {unitWord}</h3>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.newClientsByMonth} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#e4e4e7' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: 6 }}
                        formatter={((v: number) => [`${v} new client${v !== 1 ? 's' : ''}`, '']) as never}
                        separator=""
                      />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lead cohort close rate */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="text-sm font-medium text-zinc-700">Lead cohort close rate</h3>
                  <span className="text-[10px] text-zinc-400 ml-auto">
                    bars = leads acquired · line = % closed (lifetime)
                  </span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.newLeadsByMonth} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#e4e4e7' }} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: 6 }}
                        formatter={((v: number, name: string) => {
                          if (name === 'rate')    return [`${v}%`, 'Close rate']
                          if (name === 'created') return [`${v} acquired`, 'Leads']
                          if (name === 'closed')  return [`${v} closed`, 'Closed']
                          return [v, name]
                        }) as never}
                      />
                      <Bar yAxisId="left" dataKey="created" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
