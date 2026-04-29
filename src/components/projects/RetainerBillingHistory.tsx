import { useState } from 'react'
import useSWR from 'swr'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Delivery, Revenue } from '@/lib/types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  projectId: string
  /** All deliveries for this project — we filter to billed + revenue_id ourselves. */
  deliveries: Delivery[]
}

/**
 * Collapsible "previous billing cycles" list shown beneath the active
 * retainer state. Each cycle = one revenue row + the deliveries that were
 * billed onto it. Lets the user audit historical bills without leaving the
 * retainer modal.
 *
 * Hides itself entirely when there's nothing to show (no deliveries with
 * a revenue_id pointer = retainer has never been billed).
 */
export default function RetainerBillingHistory({ projectId, deliveries }: Props) {
  const { currency } = useSettings()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Group billed deliveries by their revenue_id BEFORE we even decide whether
  // to fetch — saves a request when the retainer has never been billed.
  const cyclesByRevenueId = new Map<string, Delivery[]>()
  for (const d of deliveries) {
    if (!d.billed || !d.revenue_id) continue
    const list = cyclesByRevenueId.get(d.revenue_id) ?? []
    list.push(d)
    cyclesByRevenueId.set(d.revenue_id, list)
  }

  const hasAnyCycles = cyclesByRevenueId.size > 0

  // Fetch only when there's actually billing history. Caches per-project.
  const { data: revenues = [] } = useSWR<Revenue[]>(
    hasAnyCycles && projectId ? ['retainer-revenue', projectId] : null,
    async () => {
      const { data, error } = await supabase
        .from('revenue')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Revenue[]
    }
  )

  if (!hasAnyCycles) return null

  // Order cycles by the linked revenue's payment_date (most recent first).
  // Skip revenue rows that didn't end up with linked deliveries (defensive).
  const cycles = revenues
    .filter(r => cyclesByRevenueId.has(r.id))
    .map(r => ({ revenue: r, deliveries: cyclesByRevenueId.get(r.id) ?? [] }))

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        Billing history — {cycles.length} cycle{cycles.length !== 1 ? 's' : ''}
      </div>
      <div className="space-y-1.5">
        {cycles.map(({ revenue: rev, deliveries: cycleDeliveries }) => {
          const isExpanded = expanded.has(rev.id)
          return (
            <div key={rev.id} className="border border-zinc-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(rev.id)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-400 transition-transform shrink-0', isExpanded && 'rotate-180')} />
                  <span className="text-xs text-zinc-500">{formatDate(rev.payment_date ?? rev.created_at)}</span>
                  <span className="text-xs text-zinc-300">·</span>
                  <span className="text-xs text-zinc-500">
                    {cycleDeliveries.length} deliver{cycleDeliveries.length !== 1 ? 'ies' : 'y'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-zinc-700 shrink-0">
                  {formatCurrency(Number(rev.amount), currency)}
                </span>
              </button>
              {isExpanded && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 space-y-1">
                  {cycleDeliveries.map(d => (
                    <div key={d.id} className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-400 shrink-0 w-20">{formatDate(d.delivered_at)}</span>
                      <span className="text-zinc-700 break-words">
                        {d.description ?? <span className="italic text-zinc-400">No description</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
