import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import DeliveryList from '@/components/projects/DeliveryList'
import type { Delivery, Revenue } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  open: boolean
  onClose: () => void
  revenue: Revenue | null
}

export default function RevenueDeliveriesModal({ open, onClose, revenue }: Props) {
  const { currency } = useSettings()
  const key = open && revenue ? ['revenue-deliveries', revenue.id] : null

  const { data: deliveries = [], isLoading } = useSWR<Delivery[]>(key, async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('revenue_id', revenue!.id)
      .order('delivered_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Delivery[]
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Deliveries billed on this payment
          </DialogTitle>
        </DialogHeader>

        {revenue && (
          <div className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3 mt-2 text-sm">
            <div className="text-zinc-500">
              {revenue.projects?.name ?? 'Unknown project'} · {formatDate(revenue.payment_date ?? '')}
            </div>
            <div className="font-semibold text-zinc-900">
              {formatCurrency(Number(revenue.amount), currency)}
            </div>
          </div>
        )}

        <div className="mt-3">
          {isLoading && <div className="text-sm text-zinc-400 py-4 text-center">Loading...</div>}
          {!isLoading && (
            <DeliveryList
              projectId={revenue?.project_id ?? undefined}
              override={deliveries}
              readOnly
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
