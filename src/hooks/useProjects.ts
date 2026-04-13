import useSWR from 'swr'
import type { Project } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const { data, error, mutate, isLoading } = useSWR<Project[]>('projects', async () => {
    const result = await supabase.from('projects').select('*, clients(client_name)').order('created_at', { ascending: false })
    return (result.data ?? []) as Project[]
  })

  async function createProject(body: Partial<Project>) {
    await supabase.from('projects').insert(body)
    mutate()
  }

  async function updateProject(id: string, body: Partial<Project>) {
    mutate(
      (projects) => projects?.map(p => p.id === id ? { ...p, ...body } : p),
      false
    )
    await supabase.from('projects').update(body).eq('id', id)
    mutate()
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    mutate()
  }

  return { projects: data ?? [], isLoading, error, createProject, updateProject, deleteProject }
}
