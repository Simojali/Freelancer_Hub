import useSWR from 'swr'
import type { DashboardData } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useDashboard() {
  const { data, error, isLoading } = useSWR<DashboardData>('dashboard', async () => {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [
      totalLeadsRes,
      closedLeadsRes,
      activeClientsRes,
      monthlyRevenueRes,
      openGigsRes,
      openPackagesRes,
      sampleRes,
      beforeAfterRes,
      followedRes,
      contactedIgRes,
      contactedEmailRes,
      seenRes,
      respondedRes,
      closedPipelineRes,
      recentProjectsRes,
      recentPaymentsRes,
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('closed', true),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('revenue').select('amount').eq('status', 'paid').gte('payment_date', firstOfMonth),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('project_type', 'gig').neq('status', 'done'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('project_type', 'package'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('thumbnail_sample', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('before_after_made', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('followed_engaged', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('contacted_ig', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('contacted_email', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('seen', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('responded', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('closed', true),
      supabase.from('projects').select('id, name, project_type, status, clients(client_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('revenue').select('id, amount, status, payment_date, clients(client_name)').order('payment_date', { ascending: false }).limit(5),
    ])

    const totalLeads = totalLeadsRes.count ?? 0
    const closedLeads = closedLeadsRes.count ?? 0
    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0.0'
    const monthlyRevenue = (monthlyRevenueRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      kpis: {
        totalLeads,
        conversionRate: `${conversionRate}%`,
        activeClients: activeClientsRes.count ?? 0,
        monthlyRevenue,
        openProjects: (openGigsRes.count ?? 0) + (openPackagesRes.count ?? 0),
      },
      pipeline: {
        sample: sampleRes.count ?? 0,
        beforeAfter: beforeAfterRes.count ?? 0,
        followed: followedRes.count ?? 0,
        contactedIg: contactedIgRes.count ?? 0,
        contactedEmail: contactedEmailRes.count ?? 0,
        seen: seenRes.count ?? 0,
        responded: respondedRes.count ?? 0,
        closed: closedPipelineRes.count ?? 0,
      },
      recentProjects: (recentProjectsRes.data ?? []) as unknown as DashboardData['recentProjects'],
      recentPayments: (recentPaymentsRes.data ?? []) as unknown as DashboardData['recentPayments'],
    }
  }, { refreshInterval: 60000 })

  return { data, isLoading, error }
}
