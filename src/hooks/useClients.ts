import useSWR from 'swr'
import type { Client } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useClients() {
  const { data, error, mutate, isLoading } = useSWR<Client[]>('clients', async () => {
    const result = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (result.error) throw result.error
    return (result.data ?? []) as Client[]
  })

  async function createClient(body: Partial<Client>): Promise<boolean> {
    const res = await runMutation('Create client', () =>
      supabase.from('clients').insert(body)
    )
    mutate()
    return res.ok
  }

  async function updateClient(id: string, body: Partial<Client>): Promise<boolean> {
    const { id: _id, created_at: _ca, updated_at: _ua, ...updateBody } = body as Client
    const prev = data
    mutate(clients => clients?.map(c => c.id === id ? { ...c, ...body } : c), false)
    const res = await runMutation('Update client', () =>
      supabase.from('clients').update(updateBody).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteClient(id: string): Promise<boolean> {
    const prev = data
    mutate(clients => clients?.filter(c => c.id !== id), false)
    const res = await runMutation('Delete client', () =>
      supabase.from('clients').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  return { clients: data ?? [], isLoading, error, createClient, updateClient, deleteClient }
}
