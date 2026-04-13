import useSWR from 'swr'
import type { Project } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const { data, error, mutate, isLoading } = useSWR<Project[]>('projects', async () => {
    const result = await supabase
      .from('projects')
      .select('*, clients(client_name), deliveries(count)')
      .order('created_at', { ascending: false })
    return (result.data ?? []).map(row => ({
      ...row,
      delivery_count: (row.deliveries as { count: number }[] | null)?.[0]?.count ?? 0,
    })) as Project[]
  })

  async function createProject(body: Partial<Project>): Promise<string | null> {
    const { delivery_count: _dc, clients: _cl, ...insertBody } = body as Project & { delivery_count?: number }
    const { data } = await supabase.from('projects').insert(insertBody).select('id').single()
    mutate()
    return data?.id ?? null
  }

  async function updateProject(id: string, body: Partial<Project>) {
    const { delivery_count: _dc, clients: _cl, ...updateBody } = body as Project & { delivery_count?: number }
    mutate(
      (projects) => projects?.map(p => p.id === id ? { ...p, ...body } : p),
      false
    )
    await supabase.from('projects').update(updateBody).eq('id', id)
    mutate()
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    mutate()
  }

  return { projects: data ?? [], isLoading, error, mutate, createProject, updateProject, deleteProject }
}
