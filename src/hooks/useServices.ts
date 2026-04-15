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
    // Optimistically add to cache immediately so all dropdowns update at once
    mutate(
      current => [...(current ?? []), { id: crypto.randomUUID(), name, slug, color, sort_order, created_at: new Date().toISOString() }],
      false
    )
    await supabase.from('services').insert({ name, slug, color, sort_order })
    mutate() // revalidate to get server-assigned ID
  }

  async function updateService(id: string, body: Partial<Service>) {
    // Optimistically update name/color in cache
    mutate(
      current => current?.map(s => s.id === id ? { ...s, ...body } : s),
      false
    )
    await supabase.from('services').update(body).eq('id', id)
    mutate()
  }

  async function deleteService(id: string) {
    // Optimistically remove from cache
    mutate(
      current => current?.filter(s => s.id !== id),
      false
    )
    await supabase.from('services').delete().eq('id', id)
    mutate()
  }

  return { services: data ?? [], isLoading, mutate, createService, updateService, deleteService }
}
