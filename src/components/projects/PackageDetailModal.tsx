import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Project } from '@/lib/types'
import { useDeliveries } from '@/hooks/useDeliveries'
import DeliveryLogForm from './DeliveryLogForm'
import DeliveryList from './DeliveryList'

interface Props {
  open: boolean
  onClose: () => void
  project: Project | null
  onDeliveryChange: () => void
}

function creditsColor(left: number, total: number): string {
  if (total === 0) return 'text-zinc-400'
  const ratio = left / total
  if (ratio > 0.3) return 'text-emerald-600'
  if (ratio > 0) return 'text-amber-500'
  return 'text-red-500'
}

export default function PackageDetailModal({ open, onClose, project, onDeliveryChange }: Props) {
  const { deliveries } = useDeliveries(project?.id)

  const total = project?.total_units ?? 0
  const delivered = deliveries.length
  const creditsLeft = total - delivered
  const outOfCredits = creditsLeft <= 0 && total > 0

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

        {/* Log form */}
        <div className="mt-3">
          <DeliveryLogForm
            projectId={project?.id}
            onLogged={onDeliveryChange}
            disabled={outOfCredits}
            disabledReason="No credits remaining. Ask client to renew."
          />
        </div>

        {/* List */}
        <div className="mt-4">
          <DeliveryList projectId={project?.id} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
