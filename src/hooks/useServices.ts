import useSWR from 'swr'
import type { Service } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useServices() {
  const { data, mutate, isLoading } = useSWR<Service[]>('services', async () => {
    const { data } = await supabase.from('services').select('*').order('sort_order')
    return data ?? []
  })

  async function createService(name: string, slug: string, color: string) {
    const sort_order = data?.length ?? 0
    await supabase.from('services').insert({ name, slug, color, sort_order })
    mutate()
  }

  async function updateService(id: string, body: Partial<Service>) {
    await supabase.from('services').update(body).eq('id', id)
    mutate()
  }

  async function deleteService(id: string) {
    await supabase.from('services').delete().eq('id', id)
    mutate()
  }

  return { services: data ?? [], isLoading, mutate, createService, updateService, deleteService }
}
