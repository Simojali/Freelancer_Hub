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
        supabase
          .from('projects')
          .select('*, clients(client_name), deliveries(count)')
          .eq('client_id', id!)
          .order('created_at', { ascending: false }),
        supabase
          .from('revenue')
          .select('*, clients(client_name), projects(name)')
          .eq('client_id', id!)
          .order('payment_date', { ascending: false }),
      ])

      const projects = (projectsRes.data ?? []).map(row => ({
        ...row,
        delivery_count: (row.deliveries as { count: number }[] | null)?.[0]?.count ?? 0,
      })) as Project[]

      return {
        client: clientRes.data as Client,
        projects,
        revenue: (revenueRes.data ?? []) as Revenue[],
      }
    }
  )

  return { profile: data, isLoading, error, mutate }
}
