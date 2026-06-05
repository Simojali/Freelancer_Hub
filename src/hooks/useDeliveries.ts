import useSWR from 'swr'
import type { Delivery, DeliveryStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useDeliveries(projectId: string | null | undefined) {
  const key = projectId ? ['deliveries', projectId] : null

  const { data, error, mutate, isLoading } = useSWR<Delivery[]>(key, async () => {
    // Fetch every row — the UI splits planned vs done. Done is sorted newest
    // first (most-recent delivery at top, matches existing behaviour); planned
    // is sorted oldest first so the queue reads top-to-bottom in execution
    // order ("video 1, video 2, video 3"). We do a single query and resort
    // client-side to keep the round-trip cheap.
    const result = await supabase
      .from('deliveries')
      .select('*')
      .eq('project_id', projectId!)
    if (result.error) throw result.error
    const rows = (result.data ?? []) as Delivery[]
    return rows.sort((a, b) => {
      // Planned bubbles above done. Within each group, order naturally:
      //   planned → by created_at ASC (queue position)
      //   done    → by delivered_at DESC (most-recent first)
      if (a.status !== b.status) return a.status === 'planned' ? -1 : 1
      if (a.status === 'planned') {
        return a.created_at < b.created_at ? -1 : 1
      }
      return a.delivered_at > b.delivered_at ? -1 : 1
    })
  })

  async function logDelivery(body: {
    description?: string
    delivered_at?: string
    work_url?: string
    status?: DeliveryStatus
  }) {
    const res = await runMutation('Log delivery', () =>
      supabase.from('deliveries').insert({ ...body, project_id: projectId })
    )
    mutate()
    return res.ok
  }

  /**
   * Batch-log `count` identical deliveries in a single request — used when
   * the user delivers (or plans) multiple units of the same thing.
   */
  async function logDeliveries(
    count: number,
    body: {
      description?: string
      delivered_at?: string
      work_url?: string
      status?: DeliveryStatus
    },
  ): Promise<boolean> {
    if (count <= 0) return false
    if (count === 1) return logDelivery(body)
    const rows = Array.from({ length: count }, () => ({ ...body, project_id: projectId }))
    const res = await runMutation(`Log ${count} deliveries`, () =>
      supabase.from('deliveries').insert(rows)
    )
    mutate()
    return res.ok
  }

  /**
   * Flip a planned delivery → done in a single round-trip. Lets the user fill
   * in work_url at the moment of completion (which is when they typically have
   * the link copied). delivered_at defaults to today.
   */
  async function markDone(
    id: string,
    patch?: { delivered_at?: string; work_url?: string | null; description?: string | null },
  ): Promise<boolean> {
    const prev = data
    mutate(list => list?.map(d => d.id === id ? { ...d, ...patch, status: 'done' } : d), false)
    const res = await runMutation('Mark delivered', () =>
      supabase.from('deliveries').update({ status: 'done', ...patch }).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function updateDelivery(
    id: string,
    patch: { description?: string | null; delivered_at?: string; work_url?: string | null },
  ): Promise<boolean> {
    const prev = data
    mutate(list => list?.map(d => d.id === id ? { ...d, ...patch } : d), false)
    const res = await runMutation('Update delivery', () =>
      supabase.from('deliveries').update(patch).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteDelivery(id: string) {
    const prev = data
    mutate(list => list?.filter(d => d.id !== id), false)
    const res = await runMutation('Delete delivery', () =>
      supabase.from('deliveries').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  /**
   * Mark every currently-unbilled DELIVERED delivery on this project as billed.
   * Planned rows are excluded — they can't be billed (CHECK constraint enforces
   * this; the filter here is for clarity and to dodge an avoidable PostgREST
   * error when the constraint would fire).
   */
  async function markAllBilled(revenueId?: string | null): Promise<boolean> {
    if (!projectId) return false
    const res = await runMutation('Mark billed', () =>
      supabase.from('deliveries')
        .update({ billed: true, revenue_id: revenueId ?? null })
        .eq('project_id', projectId)
        .eq('billed', false)
        .eq('status', 'done')
    )
    mutate()
    return res.ok
  }

  return {
    deliveries: data ?? [],
    isLoading,
    error,
    logDelivery,
    logDeliveries,
    markDone,
    updateDelivery,
    deleteDelivery,
    markAllBilled,
  }
}
