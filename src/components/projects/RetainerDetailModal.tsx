import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import type { Project } from '@/lib/types'
import { useDeliveries } from '@/hooks/useDeliveries'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  open: boolean
  onClose: () => void
  project: Project | null
  onDeliveryChange: () => void
  onBill: () => void
}

const today = new Date().toISOString().split('T')[0]

export default function RetainerDetailModal({ open, onClose, project, onDeliveryChange, onBill }: Props) {
  const [description, setDescription] = useState('')
  const [deliveredAt, setDeliveredAt] = useState(today)
  const { deliveries, isLoading, logDelivery, deleteDelivery } = useDeliveries(project?.id)
  const { currency } = useSettings()

  const unitPrice = project?.unit_price ?? 0
  const unbilled = deliveries.filter(d => !d.billed)
  const owed = unbilled.length * unitPrice

  async function handleLog() {
    if (!project) return
    await logDelivery({ description: description || undefined, delivered_at: deliveredAt })
    onDeliveryChange()
    setDescription('')
    setDeliveredAt(today)
  }

  async function handleDelete(id: string) {
    await deleteDelivery(id)
    onDeliveryChange()
  }

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

        {/* Log delivery form */}
        <div className="space-y-2 mt-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Log a delivery</div>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional, e.g. Episode #24 edit)"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={deliveredAt}
              onChange={e => setDeliveredAt(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleLog}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* Delivery list */}
        <div className="mt-4 space-y-1">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            {deliveries.length} deliver{deliveries.length !== 1 ? 'ies' : 'y'}
          </div>
          {isLoading && <div className="text-sm text-zinc-400 py-4 text-center">Loading...</div>}
          {!isLoading && deliveries.length === 0 && (
            <div className="text-sm text-zinc-400 py-4 text-center">No deliveries logged yet.</div>
          )}
          {deliveries.map(d => (
            <div
              key={d.id}
              className={`flex items-center justify-between gap-3 py-2 border-b border-zinc-100 last:border-0 ${d.billed ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0">
                <div className="text-xs text-zinc-400 mb-0.5 flex items-center gap-1.5">
                  {formatDate(d.delivered_at)}
                  {d.billed && (
                    <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium">
                      Billed
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-700">{d.description || <span className="italic text-zinc-400">No description</span>}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0"
                onClick={() => handleDelete(d.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
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
