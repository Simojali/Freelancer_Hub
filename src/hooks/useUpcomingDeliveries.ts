import useSWR, { mutate as globalMutate } from 'swr'
import type { Delivery } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

/**
 * A planned delivery with its parent project + client context embedded so
 * the Up Next card can show "monsef · Tajek vlogs · vlog 1" without a
 * second round-trip per row.
 */
export interface UpcomingDelivery extends Delivery {
  projects: {
    id: string
    name: string
    project_type: 'package' | 'retainer' | 'gig'
    client_id: string | null
    clients: { client_name: string } | null
  } | null
}

/** SWR key for the cross-project planned-deliveries fetch. */
export const UPCOMING_DELIVERIES_KEY = 'planned-deliveries'

export function useUpcomingDeliveries() {
  const { data, error, mutate, isLoading } = useSWR<UpcomingDelivery[]>(
    UPCOMING_DELIVERIES_KEY,
    async () => {
      // Single query, oldest-planned first so the longest-waiting work
      // surfaces at the top — the dashboard's "what should I do next?" answer.
      // We embed the project + client so the card can render full context
      // without N additional fetches.
      const result = await supabase
        .from('deliveries')
        .select('*, projects(id, name, project_type, client_id, clients(client_name))')
        .eq('status', 'planned')
        .order('created_at', { ascending: true })
      if (result.error) throw result.error
      return (result.data ?? []) as UpcomingDelivery[]
    },
  )

  /**
   * Flip a planned row → done, then refresh:
   *   - this aggregate cache, so the row disappears from Up Next
   *   - the per-project deliveries cache, so the project's own list shows the new delivered row
   *   - the projects cache, so retainer "owed" and package "credits" badges update
   * SWR pattern-matches across keys so we hit all `['deliveries', anyId]` entries.
   */
  async function markDone(
    id: string,
    patch?: { delivered_at?: string; work_url?: string | null; description?: string | null },
  ): Promise<boolean> {
    const prev = data
    // Optimistic: drop the row from the aggregate immediately.
    mutate(list => list?.filter(d => d.id !== id), false)
    const res = await runMutation('Mark delivered', () =>
      supabase.from('deliveries').update({ status: 'done', ...patch }).eq('id', id),
      { onError: () => mutate(prev, false) },
    )
    // Refresh everything that depends on delivery state.
    mutate()
    globalMutate(key => Array.isArray(key) && key[0] === 'deliveries')
    globalMutate('projects')
    globalMutate('dashboard')
    return res.ok
  }

  return { upcoming: data ?? [], isLoading, error, mutate, markDone }
}
