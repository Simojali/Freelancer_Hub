import useSWR from 'swr'
import type { Project } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useProjects() {
  const { data, error, mutate, isLoading } = useSWR<Project[]>('projects', async () => {
    // For packages we want total delivery count (capacity tracker).
    // For retainers we only want UNBILLED deliveries so the "owed" amount
    // doesn't include deliveries that have already been billed.
    const result = await supabase
      .from('projects')
      .select('*, clients(client_name), all_deliveries:deliveries(count), unbilled_deliveries:deliveries(count)')
      .eq('unbilled_deliveries.billed', false)
      .order('created_at', { ascending: false })
    if (result.error) throw result.error
    return (result.data ?? []).map(row => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      const allCount = (r.all_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
      const unbilledCount = (r.unbilled_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
      return {
        ...row,
        // Packages use the total (lifetime capacity). Retainers use unbilled.
        delivery_count: r.project_type === 'package' ? allCount : unbilledCount,
      }
    }) as Project[]
  })

  async function createProject(body: Partial<Project>): Promise<string | null> {
    const { delivery_count: _dc, clients: _cl, ...insertBody } = body as Project & { delivery_count?: number }
    const res = await runMutation('Create project', () =>
      supabase.from('projects').insert(insertBody).select('id').single()
    )
    mutate()
    return res.ok ? (res.data as { id: string } | null)?.id ?? null : null
  }

  async function updateProject(id: string, body: Partial<Project>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { delivery_count: _dc, clients: _cl, deliveries: _dv, id: _id, created_at: _ca, updated_at: _ua, ...updateBody } = body as any
    const prev = data
    mutate(projects => projects?.map(p => p.id === id ? { ...p, ...body } : p), false)
    const res = await runMutation('Update project', () =>
      supabase.from('projects').update(updateBody).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteProject(id: string): Promise<boolean> {
    const prev = data
    mutate(projects => projects?.filter(p => p.id !== id), false)
    const res = await runMutation('Delete project', () =>
      supabase.from('projects').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  return { projects: data ?? [], isLoading, error, mutate, createProject, updateProject, deleteProject }
}
