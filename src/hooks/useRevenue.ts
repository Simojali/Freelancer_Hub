import useSWR, { mutate as globalMutate } from 'swr'
import type { Revenue } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { runMutation } from '@/lib/db'

export function useRevenue() {
  const { data, error, mutate, isLoading } = useSWR<Revenue[]>('revenue', async () => {
    const result = await supabase
      .from('revenue')
      .select('*, clients(client_name), projects(name), linked_deliveries:deliveries(count)')
      .order('payment_date', { ascending: false })
    if (result.error) throw result.error
    return (result.data ?? []).map(row => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      const count = (r.linked_deliveries as { count: number }[] | null)?.[0]?.count ?? 0
      return { ...row, linked_delivery_count: count }
    }) as Revenue[]
  })

  /**
   * Create a revenue row. When `billRetainer` is true, also mark every
   * currently-unbilled delivery on `body.project_id` as billed and link
   * those deliveries to this new revenue row. This is how we avoid
   * double-billing a retainer.
   */
  async function createRevenue(
    body: Partial<Revenue>,
    opts?: { billRetainer?: boolean }
  ): Promise<boolean> {
    const {
      projects: _p, clients: _c,
      linked_deliveries: _ld, linked_delivery_count: _ldc,
      ...insertBody
    } = body as Revenue & { linked_deliveries?: unknown; linked_delivery_count?: number }
    const res = await runMutation('Log payment', () =>
      supabase.from('revenue').insert(insertBody).select('id').single()
    )
    mutate()
    if (res.ok && opts?.billRetainer && body.project_id) {
      const revenueId = (res.data as { id: string } | null)?.id ?? null
      await runMutation('Mark billed', () =>
        supabase.from('deliveries')
          .update({ billed: true, revenue_id: revenueId })
          .eq('project_id', body.project_id!)
          .eq('billed', false)
      )
      // Refresh projects list + per-project deliveries so counts update everywhere
      globalMutate('projects')
      globalMutate(['deliveries', body.project_id])
      globalMutate('dashboard')
    }
    return res.ok
  }

  async function updateRevenue(id: string, body: Partial<Revenue>): Promise<boolean> {
    // Strip every non-column field before PATCHing — PostgREST 400s on any
    // unknown column. linked_deliveries is the deliveries(count) embed alias
    // and linked_delivery_count is the derived value we add in the mapper.
    const {
      projects: _p, clients: _c,
      id: _id, created_at: _ca, updated_at: _ua,
      linked_deliveries: _ld, linked_delivery_count: _ldc,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...updateBody
    } = body as Revenue & { linked_deliveries?: unknown; linked_delivery_count?: number }
    const prev = data
    mutate(rows => rows?.map(r => r.id === id ? { ...r, ...body } : r), false)
    const res = await runMutation('Update payment', () =>
      supabase.from('revenue').update(updateBody).eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  async function deleteRevenue(id: string): Promise<boolean> {
    const prev = data
    mutate(rows => rows?.filter(r => r.id !== id), false)
    const res = await runMutation('Delete payment', () =>
      supabase.from('revenue').delete().eq('id', id)
    , { onError: () => mutate(prev, false) })
    mutate()
    return res.ok
  }

  return { revenue: data ?? [], isLoading, error, createRevenue, updateRevenue, deleteRevenue }
}
