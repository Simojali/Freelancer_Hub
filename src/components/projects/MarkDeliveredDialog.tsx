import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Delivery } from '@/lib/types'
import { formatLocalDate } from '@/lib/utils'

interface Props {
  delivery: Delivery | null
  onCancel: () => void
  onConfirm: (patch: { delivered_at: string; work_url: string | null; description: string | null }) => Promise<void> | void
}

/**
 * Lightweight confirm step shown when checking off a planned delivery.
 * Defaults delivered_at to today (the user is doing it now), exposes
 * work_url so they can paste the link they just copied without bouncing
 * back into edit-mode afterwards. Description pre-fills from the planned
 * row but is editable in case "video 1" needs a real title at handoff.
 */
export default function MarkDeliveredDialog({ delivery, onCancel, onConfirm }: Props) {
  const [date, setDate] = useState('')
  const [url, setUrl]   = useState('')
  const [desc, setDesc] = useState('')

  // Reset whenever the dialog opens for a different planned row.
  useEffect(() => {
    if (delivery) {
      setDate(formatLocalDate())
      setUrl(delivery.work_url ?? '')
      setDesc(delivery.description ?? '')
    }
  }, [delivery])

  if (!delivery) return null

  async function submit() {
    await onConfirm({
      delivered_at: date || formatLocalDate(),
      work_url: url.trim() || null,
      description: desc.trim() || null,
    })
  }

  return (
    <Dialog open={!!delivery} onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark delivered</DialogTitle>
          <DialogDescription>
            Confirm the details and this will move from <span className="text-foreground font-medium">Up next</span> to <span className="text-foreground font-medium">Delivered</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <Input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What did you deliver?"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Delivered on</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Link (optional)</label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit}>Mark delivered</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
