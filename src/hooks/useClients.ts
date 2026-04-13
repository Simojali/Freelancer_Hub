import useSWR from 'swr'
import type { Client } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useClients() {
  const { data, error, mutate, isLoading } = useSWR<Client[]>('clients', async () => {
    const result = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    return (result.data ?? []) as Client[]
  })

  async function createClient(body: Partial<Client>) {
    await supabase.from('clients').insert(body)
    mutate()
  }

  async function updateClient(id: string, body: Partial<Client>) {
    await supabase.from('clients').update(body).eq('id', id)
    mutate()
  }

  async function deleteClient(id: string) {
    await supabase.from('clients').delete().eq('id', id)
    mutate()
  }

  return { clients: data ?? [], isLoading, error, createClient, updateClient, deleteClient }
}
