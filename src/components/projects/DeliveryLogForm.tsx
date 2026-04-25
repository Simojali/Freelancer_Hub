import { useState } from 'react'
import { Plus, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDeliveries } from '@/hooks/useDeliveries'

interface Props {
  projectId: string | undefined
  onLogged?: () => void
  /** Disable the form (e.g. package is out of credits). */
  disabled?: boolean
  /** Message shown under the form when disabled. */
  disabledReason?: string
  /** Hide the quantity input (e.g. when each delivery is one credit). */
  hideQuantity?: boolean
}

const todayStr = () => new Date().toISOString().split('T')[0]

// Warn when a date is more than 30 days old or in the future — helps catch
// typos like "2025" (next year) or "2020" (copy-pasted).
function backdateWarning(dateStr: string): string | null {
  if (!dateStr) return null
  const picked = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diffDays = (now.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < -1) return 'This date is in the future'
  if (diffDays > 30) return 'This date is more than 30 days ago'
  return null
}

export default function DeliveryLogForm({ projectId, onLogged, disabled, disabledReason, hideQuantity }: Props) {
  const { logDeliveries } = useDeliveries(projectId)

  // Keep date across submits — only reset it when the user changes it themselves.
  const [date, setDate] = useState(todayStr())
  const [description, setDescription] = useState('')
  const [workUrl, setWorkUrl] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)

  const warning = backdateWarning(date)

  async function handleLog() {
    if (!projectId || saving || disabled) return
    const n = Math.max(1, Number(quantity) || 1)
    setSaving(true)
    const ok = await logDeliveries(n, {
      description: description.trim() || undefined,
      delivered_at: date,
      work_url: workUrl.trim() || undefined,
    })
    setSaving(false)
    if (ok) {
      // Reset only the per-item fields; keep the date so same-day batching is easy.
      setDescription('')
      setWorkUrl('')
      setQuantity(1)
      onLogged?.()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Enter anywhere in the form submits (except when inside a textarea, which we don't use here)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleLog()
    }
  }


  return (
    <div className="space-y-2" onKeyDown={handleKeyDown}>
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Log a delivery</div>

      <Input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional, e.g. Episode #24 thumbnail)"
        disabled={disabled || saving}
      />

      <div className="relative">
        <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <Input
          value={workUrl}
          onChange={e => setWorkUrl(e.target.value)}
          placeholder="Link to work (optional) — https://..."
          className="pl-8"
          disabled={disabled || saving}
        />
      </div>

      <div className="flex gap-2">
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1"
          disabled={disabled || saving}
          aria-label="Delivery date"
        />
        {!hideQuantity && (
          <div className="flex items-center gap-1 border border-zinc-200 rounded-md px-2">
            <span className="text-xs text-zinc-400">Qty</span>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 border-0 focus-visible:ring-0 px-1 text-center"
              disabled={disabled || saving}
              aria-label="Quantity"
            />
          </div>
        )}
        <Button type="button" size="sm" onClick={handleLog} disabled={disabled || saving}>
          <Plus className="w-4 h-4 mr-1" />
          {saving ? 'Adding…' : quantity > 1 ? `Add ${quantity}` : 'Add'}
        </Button>
      </div>

      {warning && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      {disabled && disabledReason && (
        <p className="text-xs text-red-500">{disabledReason}</p>
      )}
    </div>
  )
}
