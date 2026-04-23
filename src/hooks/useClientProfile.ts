import useSWR from 'swr'
import type { Client, Project, Revenue } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export interface ClientProfile {
  client: Client
  projects: Project[]
  revenue: Revenue[]
}

export function useClientProfile(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ClientProfile>(
    id ? ['client-profile', id] : null,
    async () => {
      const [clientRes, projectsRes, revenueRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id!).single(),
        // Mirror useProjects: embed both total + unbilled delivery counts
        // and paid revenue so retainer "owed" excludes already-billed
        // deliveries and gigs can be marked unpaid.
        supabase
          .from('projects')
          .select('*, clients(client_name), all_deliveries:deliveries(count), unbilled_deliveries:deliveries(count), paid_revenue:revenue(amount, status)')
          .eq('unbilled_deliveries.billed', false)
          .eq('paid_revenue.status', 'paid')
          .eq('client_id', id!)
          .order('created_at', { ascending: false }),
        supabase
          .from('revenue')
          .select('*, clients(client_name), projects(name), linked_deliveries:deliveries(count)')
          .eq('client_id', id!)
          .order('payment_date', { ascending: false }),
      ])

      const projects = (projectsRes.data ?? []).map(row => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any
        const allCount = (r.all_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
        const unbilledCount = (r.unbilled_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
        const paidAmount = ((r.paid_revenue as { amount: number }[] | null) ?? [])
          .reduce((sum, x) => sum + Number(x.amount ?? 0), 0)
        return {
          ...row,
          delivery_count: r.project_type === 'package' ? allCount : unbilledCount,
          paid_amount: paidAmount,
        }
      }) as Project[]

      const revenue = (revenueRes.data ?? []).map(row => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any
        const count = (r.linked_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
        return { ...row, linked_delivery_count: count }
      }) as Revenue[]

      return {
        client: clientRes.data as Client,
        projects,
        revenue,
      }
    }
  )

  return { profile: data, isLoading, error, mutate }
}
