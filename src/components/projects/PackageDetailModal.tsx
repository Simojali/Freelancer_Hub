import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import type { Project } from '@/lib/types'
import { useDeliveries } from '@/hooks/useDeliveries'
import { formatDate } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  project: Project | null
  onDeliveryChange: () => void
}

const today = new Date().toISOString().split('T')[0]

function creditsColor(left: number, total: number): string {
  if (total === 0) return 'text-zinc-400'
  const ratio = left / total
  if (ratio > 0.3) return 'text-emerald-600'
  if (ratio > 0) return 'text-amber-500'
  return 'text-red-500'
}

export default function PackageDetailModal({ open, onClose, project, onDeliveryChange }: Props) {
  const [description, setDescription] = useState('')
  const [deliveredAt, setDeliveredAt] = useState(today)
  const { deliveries, isLoading, logDelivery, deleteDelivery } = useDeliveries(project?.id)

  const total = project?.total_units ?? 0
  const delivered = deliveries.length
  const creditsLeft = total - delivered

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

        {/* Credits display */}
        <div className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3 mt-2">
          <span className="text-sm text-zinc-500">Credits remaining</span>
          <span className={`text-xl font-bold ${creditsColor(creditsLeft, total)}`}>
            {creditsLeft} / {total}
          </span>
        </div>

        {/* Log delivery form */}
        <div className="space-y-2 mt-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Log a delivery</div>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional, e.g. Episode #24 thumbnail)"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={deliveredAt}
              onChange={e => setDeliveredAt(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleLog} disabled={creditsLeft <= 0}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {creditsLeft <= 0 && (
            <p className="text-xs text-red-500">No credits remaining. Ask client to renew.</p>
          )}
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
            <div key={d.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 last:border-0">
              <div className="min-w-0">
                <div className="text-xs text-zinc-400 mb-0.5">{formatDate(d.delivered_at)}</div>
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
      </DialogContent>
    </Dialog>
  )
}
