import { useEffect, useMemo, useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useSettings } from '@/hooks/useSettings'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DeliveryLogForm from '@/components/projects/DeliveryLogForm'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Modal version of the quick-log flow. Opened from a button in the dashboard
 * header. The picker resets to empty every time the modal opens — the user
 * always picks the project explicitly (or it auto-picks when there's just one).
 */
export default function QuickLogModal({ open, onClose }: Props) {
  const { projects } = useProjects()
  const { currency } = useSettings()

  // Eligible = retainers + packages with credits left.
  const eligible = useMemo(() => {
    return projects
      .filter(p => {
        if (p.project_type === 'retainer') return true
        if (p.project_type === 'package') {
          const total = Number(p.total_units ?? 0)
          const delivered = Number(p.delivery_count ?? 0)
          return total === 0 || delivered < total
        }
        return false
      })
      .sort((a, b) => {
        if (a.project_type !== b.project_type) {
          return a.project_type === 'retainer' ? -1 : 1
        }
        const aClient = a.clients?.client_name ?? ''
        const bClient = b.clients?.client_name ?? ''
        if (aClient !== bClient) return aClient.localeCompare(bClient)
        return a.name.localeCompare(b.name)
      })
  }, [projects])

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  // Reset selection every time the modal opens. Auto-pick when there's only
  // one eligible project; otherwise leave empty so the user explicitly chooses.
  useEffect(() => {
    if (!open) return
    if (eligible.length === 1) setSelectedId(eligible[0].id)
    else setSelectedId(undefined)
  }, [open, eligible])

  const selectedProject = selectedId ? eligible.find(p => p.id === selectedId) : undefined

  let context: React.ReactNode = null
  if (selectedProject) {
    if (selectedProject.project_type === 'retainer') {
      const unbilled = selectedProject.delivery_count ?? 0
      const owed = unbilled * Number(selectedProject.unit_price ?? 0)
      context = (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-medium">RETAINER</span>
          <span className="text-zinc-500">
            {unbilled} unbilled · <span className="font-semibold text-teal-600">{formatCurrency(owed, currency)}</span> owed
          </span>
        </div>
      )
    } else {
      const total = Number(selectedProject.total_units ?? 0)
      const delivered = Number(selectedProject.delivery_count ?? 0)
      const left = total - delivered
      context = (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-medium">PACKAGE</span>
          <span className="text-zinc-500">{left} of {total} credits left</span>
        </div>
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Log Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {context && <div>{context}</div>}

          {eligible.length === 0 ? (
            <div className="text-xs text-zinc-400 py-2">
              No retainers or active packages yet. Once you have one, log deliveries here without leaving the dashboard.
            </div>
          ) : (
            <>
              <Select value={selectedId ?? ''} onValueChange={v => v && setSelectedId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a project to log to...">
                    {selectedProject
                      ? `${selectedProject.clients?.client_name ?? 'No client'} — ${selectedProject.name}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {eligible.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-3 rounded-full shrink-0 ${p.project_type === 'retainer' ? 'bg-teal-400' : 'bg-violet-400'}`} />
                        <span>{p.clients?.client_name ?? 'No client'} — {p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProject && (
                <DeliveryLogForm
                  key={selectedProject.id}
                  projectId={selectedProject.id}
                  hideQuantity={selectedProject.project_type === 'package'}
                  onLogged={onClose}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
