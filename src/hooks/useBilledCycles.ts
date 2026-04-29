import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

/**
 * A "billed cycle" is a snapshot of one retainer billing event:
 * one revenue row + its linked deliveries. We synthesise this on the
 * fly from the existing `revenue` + `deliveries` data — no new tables.
 *
 * Used to surface completed billing cycles alongside done gigs in the
 * Projects archive view.
 */
export interface BilledCycle {
  id: string                     // revenue.id (used as the row key)
  revenue_id: string
  project_id: string
  project_name: string
  client_id: string | null
  client_name: string | null
  service_type: string
  amount: number
  payment_date: string | null
  status: 'paid' | 'pending'
  delivery_count: number
  created_at: string
}

export function useBilledCycles() {
  const { data, error, isLoading } = useSWR<BilledCycle[]>('billed-cycles', async () => {
    const { data, error } = await supabase
      .from('revenue')
      // !inner ensures we only get revenue rows whose project is a retainer.
      // We can then filter that join with .eq('projects.project_type', 'retainer').
      .select(`
        id, amount, status, payment_date, client_id, project_id, service_type, created_at,
        clients(client_name),
        projects!inner(name, project_type),
        deliveries(count)
      `)
      .eq('projects.project_type', 'retainer')
      .order('payment_date', { ascending: false })
    if (error) throw error
    return (data ?? [])
      .map(row => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any
        const count = (r.deliveries as { count: number }[] | null)?.[0]?.count ?? 0
        const c = Array.isArray(r.clients) ? r.clients[0] : r.clients
        const p = Array.isArray(r.projects) ? r.projects[0] : r.projects
        const cycle: BilledCycle = {
          id: r.id,
          revenue_id: r.id,
          project_id: r.project_id,
          project_name: p?.name ?? 'Unknown project',
          client_id: r.client_id ?? null,
          client_name: c?.client_name ?? null,
          service_type: r.service_type,
          amount: Number(r.amount ?? 0),
          payment_date: r.payment_date,
          status: r.status,
          delivery_count: count,
          created_at: r.created_at,
        }
        return cycle
      })
      // Only count it as a "cycle" when there are actually linked deliveries.
      // Naked retainer payments without deliveries shouldn't show here.
      .filter(c => c.delivery_count > 0)
  })

  return { cycles: data ?? [], isLoading, error }
}
