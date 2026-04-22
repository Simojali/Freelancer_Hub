import useSWR from 'swr'
import type { Delivery } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useDeliveries(projectId: string | null | undefined) {
  const key = projectId ? ['deliveries', projectId] : null

  const { data, error, mutate, isLoading } = useSWR<Delivery[]>(key, async () => {
    const result = await supabase
      .from('deliveries')
      .select('*')
      .eq('project_id', projectId!)
      .order('delivered_at', { ascending: false })
    if (result.error) throw result.error
    return (result.data ?? []) as Delivery[]
  })

  async function logDelivery(body: { description?: string; delivered_at: string }) {
    const res = await runMutation('Log delivery', () =>
      supabase.from('deliveries').insert({ ...body, project_id: projectId })
    )
    mutate()
    return res.ok
  }

  async function deleteDelivery(id: string) {
    const prev = data
    mutate(list => list?.filter(d => d.id !== id), false)
    const res = await runMutation('Delete delivery', () =>
      supabase.from('deliveries').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  /**
   * Mark every currently-unbilled delivery on this project as billed,
   * optionally linking them to the revenue record that captured them.
   * Call this after creating a revenue row from a "Bill" action.
   */
  async function markAllBilled(revenueId?: string | null): Promise<boolean> {
    if (!projectId) return false
    const res = await runMutation('Mark billed', () =>
      supabase.from('deliveries')
        .update({ billed: true, revenue_id: revenueId ?? null })
        .eq('project_id', projectId)
        .eq('billed', false)
    )
    mutate()
    return res.ok
  }

  return { deliveries: data ?? [], isLoading, error, logDelivery, deleteDelivery, markAllBilled }
}
