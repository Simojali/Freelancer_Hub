import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Project } from '@/lib/types'
import { useDeliveries } from '@/hooks/useDeliveries'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import DeliveryLogForm from './DeliveryLogForm'
import DeliveryList from './DeliveryList'

interface Props {
  open: boolean
  onClose: () => void
  project: Project | null
  onDeliveryChange: () => void
  onBill: () => void
}

export default function RetainerDetailModal({ open, onClose, project, onDeliveryChange, onBill }: Props) {
  const { deliveries } = useDeliveries(project?.id)
  const { currency } = useSettings()

  const unitPrice = project?.unit_price ?? 0
  const unbilled = deliveries.filter(d => !d.billed)
  const owed = unbilled.length * unitPrice

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project?.name} — Deliveries</DialogTitle>
        </DialogHeader>

        {/* Owed display — only counts unbilled deliveries */}
        <div className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3 mt-2">
          <span className="text-sm text-zinc-500">
            {unbilled.length} unbilled × {formatCurrency(unitPrice, currency)}
          </span>
          <span className="text-xl font-bold text-teal-600">{formatCurrency(owed, currency)} owed</span>
        </div>

        {/* Log form */}
        <div className="mt-3">
          <DeliveryLogForm projectId={project?.id} onLogged={onDeliveryChange} />
        </div>

        {/* List — with billed filter toggle */}
        <div className="mt-4">
          <DeliveryList projectId={project?.id} showBilledFilter />
        </div>

        {/* Bill button — only enabled when there are unbilled deliveries */}
        <Button
          variant="outline"
          className="w-full mt-4 border-teal-300 text-teal-700 hover:bg-teal-50"
          onClick={onBill}
          disabled={unbilled.length === 0}
        >
          {unbilled.length === 0 ? 'Nothing to bill' : `Bill ${formatCurrency(owed, currency)}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
