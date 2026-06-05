import { useState } from 'react'
import { Trash2, Pencil, Check, X, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { useDeliveries } from '@/hooks/useDeliveries'
import type { Delivery } from '@/lib/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import MarkDeliveredDialog from './MarkDeliveredDialog'

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
  /** When false, hide the Up-next planning UI (e.g. read-only contexts or gig peeks). Defaults to true. */
  enablePlanning?: boolean
}

export default function DeliveryList({
  projectId,
  showBilledFilter,
  override,
  readOnly,
  hideHeader,
  limit,
  enablePlanning = true,
}: Props) {
  const {
    deliveries: fetched,
    isLoading,
    logDelivery,
    markDone,
    updateDelivery,
    deleteDelivery,
  } = useDeliveries(override ? null : projectId)
  const deliveries = override ?? fetched

  const [showBilled, setShowBilled] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl]   = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Delivery | null>(null)
  const [markingDone, setMarkingDone] = useState<Delivery | null>(null)
  const [quickAdd, setQuickAdd] = useState('')

  // Split into planned / done buckets up front; the hook already sorts within.
  const planned = deliveries.filter(d => d.status === 'planned')
  const done    = deliveries.filter(d => d.status === 'done')

  const filteredDone = showBilledFilter && !showBilled
    ? done.filter(d => !d.billed)
    : done
  const visibleDone = limit ? filteredDone.slice(0, limit) : filteredDone
  const unbilledCount = done.filter(d => !d.billed).length

  const planningAvailable = enablePlanning && !readOnly && !override && !!projectId

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

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const desc = quickAdd.trim()
    if (!desc) return
    setQuickAdd('')
    await logDelivery({ description: desc, status: 'planned' })
  }

  return (
    <div className="space-y-1">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {done.length} deliver{done.length !== 1 ? 'ies' : 'y'}
          </div>
          {showBilledFilter && done.length > unbilledCount && (
            <button
              type="button"
              onClick={() => setShowBilled(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showBilled ? 'Hide billed' : `Show all (${done.length})`}
            </button>
          )}
        </div>
      )}

      {/* Up next — planning queue. Only shown when planning is enabled (i.e.
          retainer/package detail views, not read-only delivery peeks). */}
      {planningAvailable && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Up next{planned.length > 0 && ` · ${planned.length}`}
            </div>
          </div>

          {/* Quick-add stays visible even when the queue is empty so the user
              can plant the first item with one click. */}
          <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 mb-1.5">
            <Input
              value={quickAdd}
              onChange={e => setQuickAdd(e.target.value)}
              placeholder="Plan a delivery..."
              className="h-7 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 px-2"
              disabled={!quickAdd.trim()}
              title="Add to queue"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>

          {planned.map(d => {
            const isEditing = editingId === d.id
            return (
              <div
                key={d.id}
                className="flex items-start gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 group"
              >
                <button
                  type="button"
                  onClick={() => setMarkingDone(d)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border border-border hover:border-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center"
                  title="Mark delivered"
                  aria-label="Mark delivered"
                />
                <div className="min-w-0 flex-1">
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
                    </div>
                  ) : (
                    <div className="text-sm text-foreground break-words">
                      {d.description || <span className="italic text-muted-foreground">Untitled</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700" onClick={() => commitEdit(d.id)} title="Save">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditingId(null)} title="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(d)} title="Rename">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => setConfirmDelete(d)} title="Remove from queue">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {planned.length > 0 && (
            <div className="border-b border-border mt-2" />
          )}
        </div>
      )}

      {/* Delivered subheader — always shown when planning is on so the visual
          divide between Up next and Delivered is clear (otherwise the queue
          would bleed into the log without a label). */}
      {planningAvailable && done.length > 0 && (
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1.5">
          Delivered · {done.length}
        </div>
      )}

      {isLoading && !override && <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>}
      {!isLoading && visibleDone.length === 0 && planned.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          {done.length === 0 ? 'No deliveries logged yet.' : 'Nothing to show — toggle "Show all" to see billed ones.'}
        </div>
      )}

      {visibleDone.map(d => {
        const isEditing = editingId === d.id
        return (
          <div
            key={d.id}
            className={`flex items-start justify-between gap-3 py-2 border-b border-border last:border-0 ${d.billed ? 'opacity-60' : ''}`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                {formatDate(d.delivered_at)}
                {d.billed && (
                  <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
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
                  <div className="text-sm text-foreground break-words">
                    {d.description || <span className="italic text-muted-foreground">No description</span>}
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditingId(null)} title="Cancel">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    {!d.billed && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(d)} title="Edit">
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

      {/* Mark-delivered confirm step — runs when a planned item's checkbox is clicked. */}
      <MarkDeliveredDialog
        delivery={markingDone}
        onCancel={() => setMarkingDone(null)}
        onConfirm={async patch => {
          if (!markingDone) return
          await markDone(markingDone.id, patch)
          setMarkingDone(null)
        }}
      />

      {/* Delete confirmation — extra guardrail for billed deliveries so the audit trail isn't broken casually */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.status === 'planned' ? 'Remove from queue?' : 'Delete this delivery?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.status === 'planned'
                ? 'This planned delivery will be removed.'
                : confirmDelete?.billed
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
              {confirmDelete?.status === 'planned' ? 'Remove' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
