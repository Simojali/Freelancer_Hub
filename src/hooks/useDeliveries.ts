import useSWR from 'swr'
import type { Delivery } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useDeliveries(projectId: string | null | undefined) {
  const key = projectId ? ['deliveries', projectId] : null

  const { data, error, mutate, isLoading } = useSWR<Delivery[]>(key, async () => {
    const result = await supabase
      .from('deliveries')
      .select('*')
      .eq('project_id', projectId!)
      .order('delivered_at', { ascending: false })
    return (result.data ?? []) as Delivery[]
  })

  async function logDelivery(body: { description?: string; delivered_at: string }) {
    await supabase.from('deliveries').insert({ ...body, project_id: projectId })
    mutate()
  }

  async function deleteDelivery(id: string) {
    await supabase.from('deliveries').delete().eq('id', id)
    mutate()
  }

  return { deliveries: data ?? [], isLoading, error, logDelivery, deleteDelivery }
}
