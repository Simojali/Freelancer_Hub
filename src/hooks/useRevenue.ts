import useSWR from 'swr'
import type { Revenue } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useRevenue() {
  const { data, error, mutate, isLoading } = useSWR<Revenue[]>('revenue', async () => {
    const result = await supabase.from('revenue').select('*, clients(client_name), projects(name)').order('payment_date', { ascending: false })
    return (result.data ?? []) as Revenue[]
  })

  async function createRevenue(body: Partial<Revenue>) {
    const { projects: _p, clients: _c, ...insertBody } = body as Revenue
    await supabase.from('revenue').insert(insertBody)
    mutate()
  }

  async function updateRevenue(id: string, body: Partial<Revenue>) {
    const { projects: _p, clients: _c, ...updateBody } = body as Revenue
    await supabase.from('revenue').update(updateBody).eq('id', id)
    mutate()
  }

  async function deleteRevenue(id: string) {
    await supabase.from('revenue').delete().eq('id', id)
    mutate()
  }

  return { revenue: data ?? [], isLoading, error, createRevenue, updateRevenue, deleteRevenue }
}
