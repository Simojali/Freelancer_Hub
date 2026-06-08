import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useProjects } from '@/hooks/useProjects'
import { useSettings } from '@/hooks/useSettings'
import { useDeliveries } from '@/hooks/useDeliveries'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import DeliveryLogForm from '@/components/projects/DeliveryLogForm'
import DeliveryList from '@/components/projects/DeliveryList'
import { formatCurrency, cn } from '@/lib/utils'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import type { Project } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  /** Called when the user clicks "See all" in the recent deliveries list */
  onViewAll?: (project: Project) => void
}

/**
 * Quick Log Delivery modal — two-step flow:
 *
 *   1. Picker (tile grid)         ← visible only when no project selected
 *   2. Log mode (form + recent)   ← visible once a project is picked
 *
 * The picker replaces the old dropdown: every eligible project is shown as a
 * one-click tile with its context (owed / credits left) baked in, sorted so
 * the most-recently-logged project comes first. Goal: zero scrolling for the
 * common case (1-5 active retainers/packages) and one tap to start typing.
 *
 * When there's only one eligible project we skip the picker entirely.
 */
export default function QuickLogModal({ open, onClose, onViewAll }: Props) {
  const { projects } = useProjects()
  const { currency } = useSettings()

  // Eligible = retainers (always) + packages with credits left.
  const eligible = useMemo(() => {
    return projects.filter(p => {
      if (p.project_type === 'retainer') return true
      if (p.project_type === 'package') {
        const total = Number(p.total_units ?? 0)
        const delivered = Number(p.delivery_count ?? 0)
        return total === 0 || delivered < total
      }
      return false
    })
  }, [projects])

  // Per-project last-logged-at, used to surface the "Recently logged" group.
  // Tiny query (one row per project) — only fires when the modal is open.
  const { data: lastLoggedMap } = useSWR<Record<string, string>>(
    open ? 'last-logged-per-project' : null,
    async () => {
      const result = await supabase
        .from('deliveries')
        .select('project_id, created_at')
        .order('created_at', { ascending: false })
      if (result.error) throw result.error
      const map: Record<string, string> = {}
      for (const row of (result.data ?? []) as { project_id: string; created_at: string }[]) {
        if (!map[row.project_id]) map[row.project_id] = row.created_at
      }
      return map
    },
  )

  // Split eligible into "Recently logged" (top 4 by last-log time, must have
  // logged at least once) and "All" (the rest). Within each group: retainers
  // first, then alphabetical by client. Without log history every project
  // ends up in "All" — clean fallback for new users.
  const { recent, others } = useMemo(() => {
    const withLog = eligible.filter(p => lastLoggedMap?.[p.id])
    const sortedByRecent = [...withLog].sort((a, b) =>
      (lastLoggedMap![b.id] ?? '').localeCompare(lastLoggedMap![a.id] ?? ''),
    )
    const recent = sortedByRecent.slice(0, 4)
    const recentIds = new Set(recent.map(p => p.id))
    const others = eligible.filter(p => !recentIds.has(p.id)).sort((a, b) => {
      if (a.project_type !== b.project_type) {
        return a.project_type === 'retainer' ? -1 : 1
      }
      const ac = a.clients?.client_name ?? ''
      const bc = b.clients?.client_name ?? ''
      if (ac !== bc) return ac.localeCompare(bc)
      return a.name.localeCompare(b.name)
    })
    return { recent, others }
  }, [eligible, lastLoggedMap])

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  // Reset selection when the modal opens. Auto-pick when there's only one
  // eligible project (single-retainer users skip the picker entirely).
  useEffect(() => {
    if (!open) return
    if (eligible.length === 1) setSelectedId(eligible[0].id)
    else setSelectedId(undefined)
  }, [open, eligible])

  const selectedProject = selectedId ? eligible.find(p => p.id === selectedId) : undefined

  // Fetch deliveries for the selected project so we can show the recent 5 +
  // the planned queue. Filtered to done for the count meta (planned items
  // belong in the Up Next subsection rendered by DeliveryList itself).
  const { deliveries: allDeliveries } = useDeliveries(selectedProject?.id)
  const projectDeliveries = allDeliveries.filter(d => d.status === 'done')

  // Whether we can offer a "← switch project" affordance. False when the
  // user only has one eligible project (no point switching to itself).
  const canSwitch = eligible.length > 1

  let context: React.ReactNode = null
  if (selectedProject) {
    if (selectedProject.project_type === 'retainer') {
      const unbilled = selectedProject.delivery_count ?? 0
      const owed = unbilled * Number(selectedProject.unit_price ?? 0)
      context = (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-medium">RETAINER</span>
          <span className="text-muted-foreground">
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
          <span className="text-muted-foreground">{left} of {total} credits left</span>
        </div>
      )
    }
  }

  // Auto-focus the description field once we enter log mode. Small UX win —
  // saves the user a tab. We delegate to a query inside the form's auto-mount
  // by stamping the form key with selectedProject.id (already done below).
  // Plus a one-shot focus on the first text input when selection lands.
  useEffect(() => {
    if (!selectedProject) return
    const t = window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-quick-log-form] input[type=text], [data-quick-log-form] input:not([type])',
      )
      input?.focus()
    }, 50)
    return () => window.clearTimeout(t)
  }, [selectedProject?.id])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedProject && canSwitch && (
              <button
                type="button"
                onClick={() => setSelectedId(undefined)}
                className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                title="Switch project"
                aria-label="Switch project"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span>
              {selectedProject
                ? `Log to ${selectedProject.name}`
                : 'Quick Log Delivery'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {eligible.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              No retainers or active packages yet. Once you have one, log deliveries here without leaving the dashboard.
            </div>
          ) : !selectedProject ? (
            // Picker view — tile grid
            <PickerGrid
              recent={recent}
              others={others}
              currency={currency}
              onPick={id => setSelectedId(id)}
            />
          ) : (
            // Log view — context badge + log form + planning queue + delivered list
            <>
              {context && <div>{context}</div>}

              <div data-quick-log-form>
                <DeliveryLogForm
                  key={selectedProject.id}
                  projectId={selectedProject.id}
                  hideQuantity={selectedProject.project_type === 'package'}
                />
              </div>

              {/* Planning + recent deliveries. DeliveryList renders its own
                  "Up next" + "Delivered" subheadings; the line below is just
                  a tiny count meta + the See All CTA. */}
              <div className="border-t border-border pt-3 mt-1">
                {projectDeliveries.length > 0 && (
                  <div className="flex items-center justify-end mb-1.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {projectDeliveries.length > 5
                        ? `Showing 5 of ${projectDeliveries.length}`
                        : `${projectDeliveries.length} deliver${projectDeliveries.length !== 1 ? 'ies' : 'y'}`}
                    </div>
                  </div>
                )}
                <DeliveryList projectId={selectedProject.id} limit={5} hideHeader />
                {projectDeliveries.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onViewAll?.(selectedProject)}
                  >
                    See all {projectDeliveries.length} deliver{projectDeliveries.length !== 1 ? 'ies' : 'y'}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */

interface PickerProps {
  recent: Project[]
  others: Project[]
  currency: string
  onPick: (id: string) => void
}

function PickerGrid({ recent, others, currency, onPick }: PickerProps) {
  return (
    <div className="space-y-4">
      {recent.length > 0 && (
        <Section title="Recently logged">
          <Grid projects={recent} currency={currency} onPick={onPick} />
        </Section>
      )}
      {others.length > 0 && (
        <Section title={recent.length > 0 ? 'All retainers + packages' : 'Pick a project'}>
          <Grid projects={others} currency={currency} onPick={onPick} />
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({
  projects,
  currency,
  onPick,
}: {
  projects: Project[]
  currency: string
  onPick: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {projects.map(p => (
        <ProjectTile key={p.id} project={p} currency={currency} onPick={onPick} />
      ))}
    </div>
  )
}

function ProjectTile({
  project,
  currency,
  onPick,
}: {
  project: Project
  currency: string
  onPick: (id: string) => void
}) {
  const isRetainer = project.project_type === 'retainer'
  // Tile meta varies by project type — owed for retainers, credits left for packages.
  let meta: React.ReactNode = null
  if (isRetainer) {
    const unbilled = project.delivery_count ?? 0
    const owed = unbilled * Number(project.unit_price ?? 0)
    meta = unbilled > 0 ? (
      <span className="text-teal-600 font-medium">
        {unbilled} unbilled · {formatCurrency(owed, currency)}
      </span>
    ) : (
      <span className="text-muted-foreground">No unbilled work</span>
    )
  } else {
    const total = Number(project.total_units ?? 0)
    const delivered = Number(project.delivery_count ?? 0)
    const left = total - delivered
    meta = total > 0 ? (
      <span className="text-violet-600 font-medium">
        {left} / {total} credits left
      </span>
    ) : (
      <span className="text-muted-foreground">No quota set</span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onPick(project.id)}
      className={cn(
        'group text-left border border-border rounded-lg p-3 transition-all',
        'hover:border-foreground/30 hover:bg-muted/40 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn('w-1.5 h-3 rounded-full shrink-0', isRetainer ? 'bg-teal-400' : 'bg-violet-400')} />
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {project.name}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">
        {project.clients?.client_name ?? 'No client'}
      </div>
      <div className="text-[11px] mt-1.5 truncate">
        {meta}
      </div>
    </button>
  )
}
