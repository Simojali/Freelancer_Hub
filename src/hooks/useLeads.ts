import useSWR from 'swr'
import type { Lead } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useLeads(service?: string, search?: string) {
  const { data, error, mutate, isLoading } = useSWR<Lead[]>(
    ['leads', service, search],
    async ([, s, q]: [string, string | undefined, string | undefined]) => {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (s && s !== 'all') query = query.eq('service_type', s)
      if (q) query = query.ilike('channel_name', `%${q}%`)
      const { data } = await query
      return data ?? []
    }
  )

  async function toggleField(id: string, field: string, currentValue: boolean) {
    mutate(
      (leads) => leads?.map(l => l.id === id ? { ...l, [field]: !currentValue } : l),
      false
    )
    await supabase.from('leads').update({ [field]: !currentValue }).eq('id', id)
    mutate()
  }

  async function createLead(body: Partial<Lead>) {
    await supabase.from('leads').insert(body)
    mutate()
  }

  async function updateLead(id: string, body: Partial<Lead>) {
    await supabase.from('leads').update(body).eq('id', id)
    mutate()
  }

  async function deleteLead(id: string) {
    await supabase.from('leads').delete().eq('id', id)
    mutate()
  }

  return { leads: data ?? [], isLoading, error, toggleField, createLead, updateLead, deleteLead, mutate }
}
