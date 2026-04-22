import useSWR from 'swr'
import type { Revenue } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useRevenue() {
  const { data, error, mutate, isLoading } = useSWR<Revenue[]>('revenue', async () => {
    const result = await supabase.from('revenue').select('*, clients(client_name), projects(name)').order('payment_date', { ascending: false })
    if (result.error) throw result.error
    return (result.data ?? []) as Revenue[]
  })

  async function createRevenue(body: Partial<Revenue>): Promise<boolean> {
    const { projects: _p, clients: _c, ...insertBody } = body as Revenue
    const res = await runMutation('Log payment', () =>
      supabase.from('revenue').insert(insertBody)
    )
    mutate()
    return res.ok
  }

  async function updateRevenue(id: string, body: Partial<Revenue>): Promise<boolean> {
    const { projects: _p, clients: _c, id: _id, created_at: _ca, updated_at: _ua, ...updateBody } = body as Revenue
    const prev = data
    mutate(rows => rows?.map(r => r.id === id ? { ...r, ...body } : r), false)
    const res = await runMutation('Update payment', () =>
      supabase.from('revenue').update(updateBody).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteRevenue(id: string): Promise<boolean> {
    const prev = data
    mutate(rows => rows?.filter(r => r.id !== id), false)
    const res = await runMutation('Delete payment', () =>
      supabase.from('revenue').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  return { revenue: data ?? [], isLoading, error, createRevenue, updateRevenue, deleteRevenue }
}
