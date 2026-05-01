import useSWR from 'swr'
import type { DashboardData } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { formatLocalDate } from '@/lib/utils'

/**
 * Consolidated dashboard fetch.
 *
 * Previously fired 18 separate Supabase requests. Now fires 5 parallel
 * queries and computes all aggregate counts client-side. For the expected
 * data volume (hundreds of rows), this is massively faster than paying
 * round-trip cost per stat.
 */
export function useDashboard() {
  const { data, error, isLoading } = useSWR<DashboardData>('dashboard', async () => {
    const now = new Date()
    const firstOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    // 60 days back covers both the 30-day window and the prior 30-day window
    // (and trivially covers the smaller windows + their priors).
    const sixtyDaysAgo = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60))

    const [leadsRes, projectsRes, clientsRes, monthlyRevenueRes, recentPaymentsRes, deliveriesRes, gigRevenueRes] = await Promise.all([
      // All pipeline booleans in a single payload
      supabase.from('leads').select('thumbnail_sample, before_after_made, followed_engaged, contacted_ig, contacted_email, seen, responded, closed'),
      // Projects + UNBILLED delivery count (retainer owed ignores billed) +
      // paid revenue rows (needed to derive unpaid gig totals)
      supabase.from('projects')
        .select('id, client_id, name, project_type, status, price, unit_price, total_units, created_at, clients(client_name), unbilled:deliveries(count), all_deliveries:deliveries(count), paid_revenue:revenue(amount, status)')
        .eq('unbilled.billed', false)
        .eq('paid_revenue.status', 'paid')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      // This-month revenue with client info so we can compute the top client
      supabase.from('revenue').select('amount, client_id, clients(client_name)').eq('status', 'paid').gte('payment_date', firstOfMonth),
      supabase.from('revenue').select('id, amount, status, payment_date, client_id, clients(client_name)').order('payment_date', { ascending: false }).limit(5),
      // Recent delivered_at dates + project_id for the productivity KPI and
      // the "Today's Worth" earnings calculation — 60-day window covers all
      // displayed periods + their prior-period comparisons in one shot.
      supabase.from('deliveries').select('delivered_at, project_id').gte('delivered_at', sixtyDaysAgo),
      // Paid gig revenue for the last 60 days — gigs have no delivery rows
      // so their "value created" moment is the day they get paid. 60 days
      // covers all earning windows + their priors.
      supabase.from('revenue')
        .select('amount, payment_date, project_id, projects!inner(project_type)')
        .eq('status', 'paid')
        .eq('projects.project_type', 'gig')
        .gte('payment_date', sixtyDaysAgo),
    ])

    if (leadsRes.error) throw leadsRes.error
    if (projectsRes.error) throw projectsRes.error

    const leads = leadsRes.data ?? []
    const projects = projectsRes.data ?? []

    // Pipeline counts derived from the leads payload (no round-trips)
    const pipeline = {
      sample:         leads.filter(l => l.thumbnail_sample).length,
      beforeAfter:    leads.filter(l => l.before_after_made).length,
      followed:       leads.filter(l => l.followed_engaged).length,
      contactedIg:    leads.filter(l => l.contacted_ig).length,
      contactedEmail: leads.filter(l => l.contacted_email).length,
      seen:           leads.filter(l => l.seen).length,
      responded:      leads.filter(l => l.responded).length,
      closed:         leads.filter(l => l.closed).length,
    }

    const totalLeads = leads.length
    const closedLeads = pipeline.closed
    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0.0'

    const monthlyRevenueRows = monthlyRevenueRes.data ?? []
    const monthlyRevenue = monthlyRevenueRows.reduce((sum, r) => sum + Number(r.amount), 0)

    // Top client this month — sum paid revenue per client, pick the leader.
    const monthByClient = new Map<string, { name: string; amount: number }>()
    for (const row of monthlyRevenueRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      if (!r.client_id) continue
      // Supabase types nested joins as arrays even for to-one rels; handle both.
      const c = Array.isArray(r.clients) ? r.clients[0] : r.clients
      const name = c?.client_name ?? 'Unknown'
      const cur = monthByClient.get(r.client_id) ?? { name, amount: 0 }
      cur.amount += Number(r.amount ?? 0)
      monthByClient.set(r.client_id, cur)
    }
    let topClient: { name: string; amount: number } | null = null
    for (const v of monthByClient.values()) {
      if (!topClient || v.amount > topClient.amount) topClient = v
    }

    // Retainer owed (unbilled deliveries × unit_price)
    const retainerOwed = projects
      .filter(p => p.project_type === 'retainer')
      .reduce((sum, p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unbilled = ((p as any).unbilled as { count: number }[] | null)?.[0]?.count ?? 0
        return sum + unbilled * Number(p.unit_price ?? 0)
      }, 0)

    // Gigs owed: for every done gig, (price - sum of paid revenue), floored at 0
    const unpaidGigs = projects.filter(p => {
      if (p.project_type !== 'gig') return false
      if (p.status !== 'done') return false
      const price = Number(p.price ?? 0)
      if (price <= 0) return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paid = (((p as any).paid_revenue as { amount: number }[] | null) ?? [])
        .reduce((s, r) => s + Number(r.amount ?? 0), 0)
      return paid < price
    })
    const gigsOwed = unpaidGigs.reduce((sum, p) => {
      const price = Number(p.price ?? 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paid = (((p as any).paid_revenue as { amount: number }[] | null) ?? [])
        .reduce((s, r) => s + Number(r.amount ?? 0), 0)
      return sum + Math.max(0, price - paid)
    }, 0)

    // Distinct clients with at least one outstanding piece of work:
    //   - retainer (always ongoing)
    //   - package with credits left
    //   - gig in progress
    //   - gig done but not fully paid (we're owed money)
    const activeClientIds = new Set<string>()
    for (const p of projects) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = p as any
      if (!r.client_id) continue
      let active = false
      if (r.project_type === 'retainer') {
        active = true
      } else if (r.project_type === 'package') {
        const allCount = (r.all_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
        const total = Number(r.total_units ?? 0)
        active = total === 0 || allCount < total // credits left
      } else if (r.project_type === 'gig') {
        if (r.status !== 'done') {
          active = true
        } else {
          const price = Number(r.price ?? 0)
          const paid = ((r.paid_revenue as { amount: number }[] | null) ?? [])
            .reduce((s: number, x: { amount: number }) => s + Number(x.amount ?? 0), 0)
          active = price > 0 && paid < price // unpaid gig still active
        }
      }
      if (active) activeClientIds.add(r.client_id)
    }
    const activeClients = activeClientIds.size

    const openProjects = projects.filter(p => {
      if (p.project_type === 'gig') return p.status !== 'done'
      return true // packages + retainers always count as open
    }).length

    // Delivery output stats — count deliveries in 3 windows + their prior
    // equivalents for trend comparison. All derived from the single 60-day
    // payload above.
    const deliveryRows = (deliveriesRes.data ?? []) as { delivered_at: string; project_id: string }[]
    const deliveryDates = deliveryRows.map(d => d.delivered_at)
    function countInRange(fromDaysAgo: number, toDaysAgo: number): number {
      // Inclusive bounds. Day offset 0 = today, 1 = yesterday, etc.
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - fromDaysAgo)
      const to   = new Date(today.getFullYear(), today.getMonth(), today.getDate() - toDaysAgo)
      const fromStr = formatLocalDate(from)
      const toStr   = formatLocalDate(to)
      return deliveryDates.filter(d => d >= fromStr && d <= toStr).length
    }
    // Daily counts for the last 30 days, in chronological order.
    // Used by the sparkline in DeliveriesKpiCard. Includes zero-days so the
    // chart has consistent x-axis spacing even when no deliveries land on a day.
    const today = new Date()
    const dailyMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      dailyMap.set(formatLocalDate(d), 0)
    }
    for (const date of deliveryDates) {
      if (dailyMap.has(date)) {
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1)
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))

    const deliveryStats = {
      today:     { count: countInRange(0, 0),   prior: countInRange(1, 1) },
      yesterday: { count: countInRange(1, 1),   prior: countInRange(2, 2) },
      week:      { count: countInRange(7, 1),   prior: countInRange(14, 8) },
      month30:   { count: countInRange(30, 1),  prior: countInRange(60, 31) },
      daily,
    }

    // "Today's Worth" — value created on a given day. The realised value of
    // each delivery depends on its parent project type:
    //   - Retainer: unit_price (paid in arrears)
    //   - Package:  price / total_units (amortised; payment status irrelevant)
    //   - Gig:      no deliveries, so we credit the gig's revenue rows on
    //               their payment_date instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectMap = new Map<string, any>(projects.map(p => [(p as any).id, p]))
    function valuePerDelivery(projectId: string): number {
      const p = projectMap.get(projectId)
      if (!p) return 0
      if (p.project_type === 'retainer') return Number(p.unit_price ?? 0)
      if (p.project_type === 'package') {
        const total = Number(p.total_units ?? 0)
        const price = Number(p.price ?? 0)
        return total > 0 ? price / total : 0
      }
      return 0
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gigRevenueRows = (gigRevenueRes.data ?? []) as any[]
    function earnedInRange(fromStr: string, toStr: string): number {
      let sum = 0
      for (const row of deliveryRows) {
        if (row.delivered_at >= fromStr && row.delivered_at <= toStr) {
          sum += valuePerDelivery(row.project_id)
        }
      }
      for (const r of gigRevenueRows) {
        const date = r.payment_date as string
        if (date && date >= fromStr && date <= toStr) sum += Number(r.amount ?? 0)
      }
      return sum
    }
    function rangeBoundsFor(fromDaysAgo: number, toDaysAgo: number): [string, string] {
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - fromDaysAgo)
      const to   = new Date(today.getFullYear(), today.getMonth(), today.getDate() - toDaysAgo)
      return [formatLocalDate(from), formatLocalDate(to)]
    }
    function earnedInWindow(fromDaysAgo: number, toDaysAgo: number): number {
      const [from, to] = rangeBoundsFor(fromDaysAgo, toDaysAgo)
      return earnedInRange(from, to)
    }
    // Mirrors the Deliveries card windows so the two cards line up: today vs
    // yesterday; 7 days = yesterday + 6 prior; 30 days = yesterday + 29 prior.
    const earnings = {
      today:     { amount: earnedInWindow(0, 0),   prior: earnedInWindow(1, 1) },
      yesterday: { amount: earnedInWindow(1, 1),   prior: earnedInWindow(2, 2) },
      week:      { amount: earnedInWindow(7, 1),   prior: earnedInWindow(14, 8) },
      month30:   { amount: earnedInWindow(30, 1),  prior: earnedInWindow(60, 31) },
    }

    const recentProjects = projects.slice(0, 5)

    return {
      kpis: {
        totalLeads,
        conversionRate: `${conversionRate}%`,
        activeClients,
        totalClients: clientsRes.count ?? 0,
        topClientThisMonth: topClient,
        monthlyRevenue,
        retainerOwed,
        unpaidGigs: unpaidGigs.length,
        gigsOwed,
        openProjects,
        deliveryStats,
        earnings,
      },
      pipeline,
      recentProjects: recentProjects as unknown as DashboardData['recentProjects'],
      recentPayments: (recentPaymentsRes.data ?? []) as unknown as DashboardData['recentPayments'],
    }
  }, { refreshInterval: 60000 })

  return { data, isLoading, error }
}
