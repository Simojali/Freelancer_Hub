import useSWR from 'swr'
import type { DashboardData } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [leadsRes, projectsRes, clientsRes, monthlyRevenueRes, recentPaymentsRes] = await Promise.all([
      // All pipeline booleans in a single payload
      supabase.from('leads').select('thumbnail_sample, before_after_made, followed_engaged, contacted_ig, contacted_email, seen, responded, closed'),
      // Projects + UNBILLED delivery count (retainer owed should ignore already-billed deliveries)
      supabase.from('projects')
        .select('id, name, project_type, status, unit_price, created_at, clients(client_name), unbilled:deliveries(count)')
        .eq('unbilled.billed', false)
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('revenue').select('amount').eq('status', 'paid').gte('payment_date', firstOfMonth),
      supabase.from('revenue').select('id, amount, status, payment_date, clients(client_name)').order('payment_date', { ascending: false }).limit(5),
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

    const monthlyRevenue = (monthlyRevenueRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

    // Retainer owed (unbilled deliveries × unit_price)
    const retainerOwed = projects
      .filter(p => p.project_type === 'retainer')
      .reduce((sum, p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unbilled = ((p as any).unbilled as { count: number }[] | null)?.[0]?.count ?? 0
        return sum + unbilled * Number(p.unit_price ?? 0)
      }, 0)

    const openProjects = projects.filter(p => {
      if (p.project_type === 'gig') return p.status !== 'done'
      return true // packages + retainers always count as open
    }).length

    const recentProjects = projects.slice(0, 5)

    return {
      kpis: {
        totalLeads,
        conversionRate: `${conversionRate}%`,
        activeClients: clientsRes.count ?? 0,
        monthlyRevenue,
        retainerOwed,
        openProjects,
      },
      pipeline,
      recentProjects: recentProjects as unknown as DashboardData['recentProjects'],
      recentPayments: (recentPaymentsRes.data ?? []) as unknown as DashboardData['recentPayments'],
    }
  }, { refreshInterval: 60000 })

  return { data, isLoading, error }
}
