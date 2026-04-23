import { useState } from 'react'
import { Trash2, Pencil, Check, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { useDeliveries } from '@/hooks/useDeliveries'
import type { Delivery } from '@/lib/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Props {
  projectId: string | undefined
  /** When true, show a "Show billed" toggle above the list (retainer view). */
  showBilledFilter?: boolean
  /** Override deliveries (e.g. when showing deliveries for a specific revenue row). Disables billed filter + editing. */
  override?: Delivery[]
  readOnly?: boolean
  /** Hide the "N deliveries" header row (used when the container already labels the section). */
  hideHeader?: boolean
  /** Cap the visible rows — shows at most N most-recent; useful for compact peeks. */
  limit?: number
}

export default function DeliveryList({ projectId, showBilledFilter, override, readOnly, hideHeader, limit }: Props) {
  const { deliveries: fetched, isLoading, updateDelivery, deleteDelivery } = useDeliveries(override ? null : projectId)
  const deliveries = override ?? fetched

  const [showBilled, setShowBilled] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl]   = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Delivery | null>(null)

  const filteredByBilled = showBilledFilter && !showBilled
    ? deliveries.filter(d => !d.billed)
    : deliveries
  const visible = limit ? filteredByBilled.slice(0, limit) : filteredByBilled
  const unbilledCount = deliveries.filter(d => !d.billed).length

  function startEdit(d: Delivery) {
    setEditingId(d.id)
    setEditDesc(d.description ?? '')
    setEditUrl(d.work_url ?? '')
  }

  async function commitEdit(id: string) {
    await updateDelivery(id, {
      description: editDesc.trim() || null,
      work_url:    editUrl.trim()  || null,
    })
    setEditingId(null)
  }

  async function doDelete(d: Delivery) {
    setConfirmDelete(null)
    await deleteDelivery(d.id)
  }

  return (
    <div className="space-y-1">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {deliveries.length} deliver{deliveries.length !== 1 ? 'ies' : 'y'}
          </div>
          {showBilledFilter && deliveries.length > unbilledCount && (
            <button
              type="button"
              onClick={() => setShowBilled(v => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-800"
            >
              {showBilled ? 'Hide billed' : `Show all (${deliveries.length})`}
            </button>
          )}
        </div>
      )}

      {isLoading && !override && <div className="text-sm text-zinc-400 py-4 text-center">Loading...</div>}
      {!isLoading && visible.length === 0 && (
        <div className="text-sm text-zinc-400 py-4 text-center">
          {deliveries.length === 0 ? 'No deliveries logged yet.' : 'Nothing to show — toggle "Show all" to see billed ones.'}
        </div>
      )}

      {visible.map(d => {
        const isEditing = editingId === d.id
        return (
          <div
            key={d.id}
            className={`flex items-start justify-between gap-3 py-2 border-b border-zinc-100 last:border-0 ${d.billed ? 'opacity-60' : ''}`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs text-zinc-400 mb-0.5 flex items-center gap-1.5">
                {formatDate(d.delivered_at)}
                {d.billed && (
                  <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium">
                    Billed
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-1.5">
                  <Input
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(d.id); if (e.key === 'Escape') setEditingId(null) }}
                    placeholder="Description"
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Input
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(d.id); if (e.key === 'Escape') setEditingId(null) }}
                    placeholder="Link to work (optional)"
                    className="h-7 text-sm"
                  />
                </div>
              ) : (
                <>
                  <div className="text-sm text-zinc-700 break-words">
                    {d.description || <span className="italic text-zinc-400">No description</span>}
                  </div>
                  {d.work_url && (
                    <a
                      href={d.work_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {d.work_url.replace(/^https?:\/\//, '').slice(0, 48)}
                    </a>
                  )}
                </>
              )}
            </div>

            {!readOnly && (
              <div className="flex items-center gap-0.5 shrink-0">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700" onClick={() => commitEdit(d.id)} title="Save">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700" onClick={() => setEditingId(null)} title="Cancel">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    {!d.billed && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700" onClick={() => startEdit(d)} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      onClick={() => setConfirmDelete(d)}
                      title={d.billed ? 'Delete (already billed)' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Delete confirmation — extra guardrail for billed deliveries so the audit trail isn't broken casually */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.billed
                ? 'This delivery has already been billed — removing it will break the link to the revenue record. Consider editing instead.'
                : 'This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDelete) doDelete(confirmDelete) }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
