import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { formatLocalDate } from '@/lib/utils'

export type AnalyticsPeriod =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_quarter'
  | 'last_quarter'
  | 'last_6_months'
  | 'last_12_months'
  | 'ytd'
  | 'last_year'
  | 'all_time'

/** Grouped for the picker — rolling windows / calendar windows / all time. */
export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string; group: 'rolling' | 'calendar' | 'all' }[] = [
  // Calendar windows (start at a real boundary)
  { value: 'this_month',     label: 'This month',     group: 'calendar' },
  { value: 'last_month',     label: 'Last month',     group: 'calendar' },
  { value: 'this_quarter',   label: 'This quarter',   group: 'calendar' },
  { value: 'last_quarter',   label: 'Last quarter',   group: 'calendar' },
  { value: 'ytd',            label: 'Year to date',   group: 'calendar' },
  { value: 'last_year',      label: 'Last year',      group: 'calendar' },
  // Rolling windows (relative to today)
  { value: 'last_3_months',  label: 'Last 3 months',  group: 'rolling' },
  { value: 'last_6_months',  label: 'Last 6 months',  group: 'rolling' },
  { value: 'last_12_months', label: 'Last 12 months', group: 'rolling' },
  // Everything
  { value: 'all_time',       label: 'All time',       group: 'all' },
]

export interface AnalyticsData {
  /** Bars for the monthly revenue chart, oldest → newest, zero-filled per month. */
  revenueByMonth: { key: string; label: string; paid: number; pending: number; total: number }[]
  /** Top 10 clients in the period, sorted by total paid+pending revenue desc. */
  topClients: { client_id: string; client_name: string; total: number }[]
  /** Revenue split by service slug. */
  revenueByService: { service: string; total: number; pct: number }[]
  /** Deliveries shipped per month — retainer + package deliveries plus done gigs. */
  deliveriesByMonth: { key: string; label: string; count: number }[]
  /** "Day's worth" earnings per month — same value model as the dashboard's
   *  Earned card: retainer × unit_price + package × (price/total_units) + gig price.
   *  This is value created, not money received (revenue is the latter). */
  earningsByMonth: { key: string; label: string; amount: number }[]
  /** New clients onboarded per month (clients.created_at). */
  newClientsByMonth: { key: string; label: string; count: number }[]
  /** Leads acquired per month with cohort-based close rate.
   *  closed = how many of THAT month's leads are currently closed (lifetime). */
  newLeadsByMonth: { key: string; label: string; created: number; closed: number; rate: number }[]
  /** Aggregate totals, used for the KPI strip at the top of the page. */
  totals: {
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    monthsCount: number
    avgPerMonth: number
    bestMonth: { label: string; amount: number } | null
    /** Year-over-year change vs the equivalent period one year earlier. null when unavailable (e.g. 'all_time'). */
    yoy: { current: number; prior: number; pct: number | null } | null
    /** Revenue concentration risk: % from top 1 client and from top 3 combined. */
    concentration: { top1Pct: number; top3Pct: number }
    /** Total deliveries shipped in period + per-month average. */
    totalDeliveries: number
    avgDeliveriesPerMonth: number
    /** New clients in period + total all-time client count for context. */
    newClientsCount: number
    /** Leads acquired in period + close rate of that cohort (lifetime). */
    newLeadsCount: number
    leadCohortCloseRate: number
    /** Day's-worth earnings totals — sum of work value created in the window. */
    totalEarned: number
    avgEarnedPerMonth: number
    bestEarnedMonth: { label: string; amount: number } | null
    /** 'daily' for short windows (≤92 days), 'monthly' otherwise. The chart
     *  data above already uses the right buckets; UI labels should adapt to
     *  match (e.g. "Avg per day" vs "Avg per month"). */
    granularity: Granularity
  }
}

interface RawRevenue {
  amount: number
  status: 'paid' | 'pending'
  payment_date: string | null
  client_id: string | null
  service_type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clients: any
}

function periodBounds(period: AnalyticsPeriod): { from: string | null; to: string } {
  const now = new Date()
  const today = formatLocalDate(now)
  const ymd = (d: Date) => formatLocalDate(d)
  // Quarter math: months 0-2 = Q1, 3-5 = Q2, 6-8 = Q3, 9-11 = Q4.
  const qIdx = Math.floor(now.getMonth() / 3)
  switch (period) {
    case 'this_month':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end   = new Date(now.getFullYear(), now.getMonth(), 0) // day 0 of current month = last day of previous
      return { from: ymd(start), to: ymd(end) }
    }
    case 'last_3_months':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: today }
    case 'this_quarter':
      return { from: ymd(new Date(now.getFullYear(), qIdx * 3, 1)), to: today }
    case 'last_quarter': {
      // Roll back one quarter; wraps year boundary cleanly via JS month arithmetic
      const start = new Date(now.getFullYear(), (qIdx - 1) * 3, 1)
      const end   = new Date(now.getFullYear(), qIdx * 3, 0) // last day of quarter before this one
      return { from: ymd(start), to: ymd(end) }
    }
    case 'last_6_months':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: today }
    case 'last_12_months':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 11, 1)), to: today }
    case 'ytd':
      return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: today }
    case 'last_year': {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end   = new Date(now.getFullYear() - 1, 11, 31)
      return { from: ymd(start), to: ymd(end) }
    }
    case 'all_time':
      return { from: null, to: today }
  }
}

export type Granularity = 'daily' | 'monthly'

/**
 * Auto-pick a chart granularity based on the period length.
 * ≤ 92 days → daily bars (a quarter's worth fits readably).
 * > 92 days → monthly bars.
 * 'all_time' (no `from` bound) is always monthly because the dataset can
 * span years.
 */
function pickGranularity(from: string | null, to: string): Granularity {
  if (!from) return 'monthly'
  const fromMs = new Date(from + 'T00:00:00').getTime()
  const toMs   = new Date(to   + 'T00:00:00').getTime()
  const days = Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24)) + 1
  return days <= 92 ? 'daily' : 'monthly'
}

/** Build the bucket keys covering the period, oldest → newest, zero-filled. */
function bucketsInPeriod(
  from: string | null,
  to: string,
  granularity: Granularity,
  allDates: string[],
): string[] {
  // Resolve the effective start date — caller-provided OR the earliest date
  // in the data when `from` is null (i.e. all_time).
  let startD: Date
  const endD = new Date(to + 'T00:00:00')
  if (from) {
    startD = new Date(from + 'T00:00:00')
  } else {
    if (allDates.length === 0) return []
    const sorted = [...allDates].sort()
    startD = new Date(sorted[0] + 'T00:00:00')
  }

  const keys: string[] = []
  if (granularity === 'daily') {
    const cur = new Date(startD)
    while (cur <= endD) {
      keys.push(formatLocalDate(cur))
      cur.setDate(cur.getDate() + 1)
    }
  } else {
    const cur = new Date(startD.getFullYear(), startD.getMonth(), 1)
    while (cur <= endD) {
      keys.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return keys
}

/** Convert any date string (YYYY-MM-DD or timestamp) to its bucket key. */
function bucketKeyOf(dateStr: string, granularity: Granularity): string {
  return dateStr.slice(0, granularity === 'daily' ? 10 : 7)
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function bucketLabel(key: string, granularity: Granularity): string {
  return granularity === 'daily' ? dayLabel(key) : monthLabel(key)
}

export function useAnalytics(period: AnalyticsPeriod) {
  const { data, error, isLoading } = useSWR<AnalyticsData>(
    ['analytics', period],
    async () => {
      const { from, to } = periodBounds(period)

      // Two parallel fetches: the period itself + the same range one year
      // earlier for YoY comparison. For 'all_time' we skip the YoY query.
      const currentQuery = (() => {
        let q = supabase.from('revenue')
          .select('amount, status, payment_date, client_id, service_type, clients(client_name)')
          .lte('payment_date', to)
        if (from) q = q.gte('payment_date', from)
        return q
      })()

      // Prior-year window for YoY
      const priorBounds: { from: string; to: string } | null = (() => {
        if (!from) return null
        const shift = (s: string) => {
          const d = new Date(s + 'T00:00:00')
          return formatLocalDate(new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()))
        }
        return { from: shift(from), to: shift(to) }
      })()
      const priorQuery = priorBounds
        ? supabase.from('revenue')
            .select('amount')
            .gte('payment_date', priorBounds.from)
            .lte('payment_date', priorBounds.to)
        : null

      // Productivity / growth fetches (Phase 2). Each is bounded by the period
      // when applicable; for 'all_time' we drop the lower bound entirely.
      // Deliveries embed their parent project so we can compute value-per-delivery
      // for the Earnings section without an extra fetch.
      const deliveriesQuery = (() => {
        let q = supabase.from('deliveries')
          .select('delivered_at, projects(project_type, price, unit_price, total_units)')
          .lte('delivered_at', to)
        if (from) q = q.gte('delivered_at', from)
        return q
      })()
      const doneGigsQuery = (() => {
        let q = supabase.from('projects')
          .select('done_at, price')
          .eq('project_type', 'gig')
          .eq('status', 'done')
          .not('done_at', 'is', null)
          .lte('done_at', to + 'T23:59:59')
        if (from) q = q.gte('done_at', from)
        return q
      })()
      const newClientsQuery = (() => {
        let q = supabase.from('clients').select('created_at').lte('created_at', to + 'T23:59:59')
        if (from) q = q.gte('created_at', from)
        return q
      })()
      const newLeadsQuery = (() => {
        let q = supabase.from('leads').select('created_at, closed').lte('created_at', to + 'T23:59:59')
        if (from) q = q.gte('created_at', from)
        return q
      })()

      const [currRes, priorRes, deliveriesRes, doneGigsRes, newClientsRes, newLeadsRes] = await Promise.all([
        currentQuery,
        priorQuery ?? Promise.resolve({ data: [], error: null }),
        deliveriesQuery,
        doneGigsQuery,
        newClientsQuery,
        newLeadsQuery,
      ])
      if (currRes.error) throw currRes.error

      const rows = (currRes.data ?? []) as RawRevenue[]
      const granularity = pickGranularity(from, to)

      // --- Revenue aggregation (paid + pending stacked), bucket = day or month ---
      const byBucket = new Map<string, { paid: number; pending: number }>()
      for (const r of rows) {
        if (!r.payment_date) continue
        const key = bucketKeyOf(r.payment_date, granularity)
        const cur = byBucket.get(key) ?? { paid: 0, pending: 0 }
        if (r.status === 'paid') cur.paid += Number(r.amount ?? 0)
        else cur.pending += Number(r.amount ?? 0)
        byBucket.set(key, cur)
      }
      const allDates = rows.map(r => r.payment_date).filter((x): x is string => !!x)
      const bucketKeys = bucketsInPeriod(from, to, granularity, allDates)
      const revenueByMonth = bucketKeys.map(key => {
        const v = byBucket.get(key) ?? { paid: 0, pending: 0 }
        return { key, label: bucketLabel(key, granularity), paid: v.paid, pending: v.pending, total: v.paid + v.pending }
      })

      // --- Top clients (paid + pending) ---
      const byClient = new Map<string, { name: string; total: number }>()
      for (const r of rows) {
        if (!r.client_id) continue
        const c = Array.isArray(r.clients) ? r.clients[0] : r.clients
        const name = c?.client_name ?? 'Unknown'
        const cur = byClient.get(r.client_id) ?? { name, total: 0 }
        cur.total += Number(r.amount ?? 0)
        byClient.set(r.client_id, cur)
      }
      const topClients = [...byClient.entries()]
        .map(([client_id, { name, total }]) => ({ client_id, client_name: name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      // --- Revenue by service ---
      const byService = new Map<string, number>()
      for (const r of rows) {
        const t = Number(r.amount ?? 0)
        byService.set(r.service_type, (byService.get(r.service_type) ?? 0) + t)
      }
      const totalForServiceCalc = [...byService.values()].reduce((s, v) => s + v, 0)
      const revenueByService = [...byService.entries()]
        .map(([service, total]) => ({
          service,
          total,
          pct: totalForServiceCalc > 0 ? Math.round((total / totalForServiceCalc) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)

      // --- Totals ---
      const paidRevenue = rows.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount ?? 0), 0)
      const pendingRevenue = rows.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount ?? 0), 0)
      const totalRevenue = paidRevenue + pendingRevenue
      const bucketsCount = revenueByMonth.length
      const avgPerMonth = bucketsCount > 0 ? totalRevenue / bucketsCount : 0
      const bestMonth = revenueByMonth.length > 0
        ? revenueByMonth.reduce((best, m) => m.total > best.total ? m : best, revenueByMonth[0])
        : null
      const top1 = topClients[0]?.total ?? 0
      const top3 = topClients.slice(0, 3).reduce((s, c) => s + c.total, 0)
      const concentration = {
        top1Pct: totalRevenue > 0 ? Math.round((top1 / totalRevenue) * 100) : 0,
        top3Pct: totalRevenue > 0 ? Math.round((top3 / totalRevenue) * 100) : 0,
      }

      // --- YoY ---
      let yoy: AnalyticsData['totals']['yoy'] = null
      if (priorBounds) {
        const priorRows = (priorRes.data ?? []) as { amount: number }[]
        const prior = priorRows.reduce((s, r) => s + Number(r.amount ?? 0), 0)
        const pct = prior > 0 ? Math.round(((totalRevenue - prior) / prior) * 100) : null
        yoy = { current: totalRevenue, prior, pct }
      }

      // --- Phase 2 monthly aggregates ---

      // Deliveries (retainer + package rows + done gigs all bucketed by month).
      // Done-gig dates are timestamps so we trim to YYYY-MM-DD before bucketing.
      // Same loops also accumulate earnings ("day's worth") using the same
      // value model as the dashboard's Earned card:
      //   retainer delivery → unit_price
      //   package delivery  → price / total_units
      //   gig done          → price
      const deliveryBucket = new Map<string, number>()
      const earningsBucket = new Map<string, number>()
      const bumpDelivery = (dateStr: string) => {
        const k = bucketKeyOf(dateStr, granularity)
        deliveryBucket.set(k, (deliveryBucket.get(k) ?? 0) + 1)
      }
      const bumpEarnings = (dateStr: string, amount: number) => {
        if (amount <= 0) return
        const k = bucketKeyOf(dateStr, granularity)
        earningsBucket.set(k, (earningsBucket.get(k) ?? 0) + amount)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const d of (deliveriesRes.data ?? []) as any[]) {
        if (!d.delivered_at) continue
        bumpDelivery(d.delivered_at)
        const p = Array.isArray(d.projects) ? d.projects[0] : d.projects
        if (!p) continue
        let value = 0
        if (p.project_type === 'retainer') {
          value = Number(p.unit_price ?? 0)
        } else if (p.project_type === 'package') {
          const total = Number(p.total_units ?? 0)
          const price = Number(p.price ?? 0)
          value = total > 0 ? price / total : 0
        }
        bumpEarnings(d.delivered_at, value)
      }
      for (const g of (doneGigsRes.data ?? []) as { done_at: string; price: number }[]) {
        if (!g.done_at) continue
        bumpDelivery(g.done_at)
        bumpEarnings(g.done_at, Number(g.price ?? 0))
      }
      const deliveriesByMonth = bucketKeys.map(key => ({
        key,
        label: bucketLabel(key, granularity),
        count: deliveryBucket.get(key) ?? 0,
      }))
      const earningsByMonth = bucketKeys.map(key => ({
        key,
        label: bucketLabel(key, granularity),
        amount: earningsBucket.get(key) ?? 0,
      }))
      const totalDeliveries = [...deliveryBucket.values()].reduce((s, n) => s + n, 0)
      const avgDeliveriesPerMonth = bucketsCount > 0 ? totalDeliveries / bucketsCount : 0
      const totalEarned = [...earningsBucket.values()].reduce((s, n) => s + n, 0)
      const avgEarnedPerMonth = bucketsCount > 0 ? totalEarned / bucketsCount : 0
      const bestEarnedMonth = earningsByMonth.length > 0
        ? earningsByMonth.reduce((best, m) => m.amount > best.amount ? m : best, earningsByMonth[0])
        : null

      // New clients per bucket (day or month based on granularity).
      const newClientBucket = new Map<string, number>()
      for (const c of (newClientsRes.data ?? []) as { created_at: string }[]) {
        if (!c.created_at) continue
        const k = bucketKeyOf(c.created_at, granularity)
        newClientBucket.set(k, (newClientBucket.get(k) ?? 0) + 1)
      }
      const newClientsByMonth = bucketKeys.map(key => ({
        key,
        label: bucketLabel(key, granularity),
        count: newClientBucket.get(key) ?? 0,
      }))
      const newClientsCount = [...newClientBucket.values()].reduce((s, n) => s + n, 0)

      // New leads per bucket with cohort close rate. We don't have closed_at,
      // so "closed" here means "of the leads acquired in that bucket, how many
      // are now closed (lifetime)". Recent buckets will be artificially low.
      const leadBucket = new Map<string, { created: number; closed: number }>()
      for (const l of (newLeadsRes.data ?? []) as { created_at: string; closed: boolean }[]) {
        if (!l.created_at) continue
        const k = bucketKeyOf(l.created_at, granularity)
        const cur = leadBucket.get(k) ?? { created: 0, closed: 0 }
        cur.created += 1
        if (l.closed) cur.closed += 1
        leadBucket.set(k, cur)
      }
      const newLeadsByMonth = bucketKeys.map(key => {
        const v = leadBucket.get(key) ?? { created: 0, closed: 0 }
        const rate = v.created > 0 ? Math.round((v.closed / v.created) * 100) : 0
        return { key, label: bucketLabel(key, granularity), created: v.created, closed: v.closed, rate }
      })
      const newLeadsCount = [...leadBucket.values()].reduce((s, v) => s + v.created, 0)
      const cohortClosedTotal = [...leadBucket.values()].reduce((s, v) => s + v.closed, 0)
      const leadCohortCloseRate = newLeadsCount > 0
        ? Math.round((cohortClosedTotal / newLeadsCount) * 100)
        : 0

      return {
        revenueByMonth,
        topClients,
        revenueByService,
        deliveriesByMonth,
        earningsByMonth,
        newClientsByMonth,
        newLeadsByMonth,
        totals: {
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          monthsCount: bucketsCount,
          avgPerMonth,
          bestMonth: bestMonth ? { label: bestMonth.label, amount: bestMonth.total } : null,
          yoy,
          concentration,
          totalDeliveries,
          avgDeliveriesPerMonth,
          newClientsCount,
          newLeadsCount,
          leadCohortCloseRate,
          totalEarned,
          avgEarnedPerMonth,
          bestEarnedMonth: bestEarnedMonth
            ? { label: bestEarnedMonth.label, amount: bestEarnedMonth.amount }
            : null,
          granularity,
        },
      }
    },
  )

  return { data, error, isLoading }
}

