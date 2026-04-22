import useSWR from 'swr'
import type { Lead } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useLeads(service?: string, search?: string) {
  const { data, error, mutate, isLoading } = useSWR<Lead[]>(
    ['leads', service, search],
    async ([, s, q]: [string, string | undefined, string | undefined]) => {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: true })
      if (s && s !== 'all') query = query.eq('service_type', s)
      if (q) query = query.ilike('channel_name', `%${q}%`)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    }
  )

  async function toggleField(id: string, field: string, currentValue: boolean): Promise<boolean> {
    const prev = data
    mutate(leads => leads?.map(l => l.id === id ? { ...l, [field]: !currentValue } : l), false)
    const res = await runMutation('Update lead', () =>
      supabase.from('leads').update({ [field]: !currentValue }).eq('id', id)
    , { onError: () => mutate(prev, false) })
    return res.ok
  }

  async function createLead(body: Partial<Lead>): Promise<boolean> {
    const res = await runMutation('Create lead', () =>
      supabase.from('leads').insert(body)
    )
    mutate()
    return res.ok
  }

  async function updateLead(id: string, body: Partial<Lead>): Promise<boolean> {
    const { id: _id, created_at: _ca, updated_at: _ua, ...updateBody } = body as Lead
    const prev = data
    mutate(leads => leads?.map(l => l.id === id ? { ...l, ...body } : l), false)
    const res = await runMutation('Update lead', () =>
      supabase.from('leads').update(updateBody).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteLead(id: string): Promise<boolean> {
    const prev = data
    mutate(leads => leads?.filter(l => l.id !== id), false)
    const res = await runMutation('Delete lead', () =>
      supabase.from('leads').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  return { leads: data ?? [], isLoading, error, toggleField, createLead, updateLead, deleteLead, mutate }
}
