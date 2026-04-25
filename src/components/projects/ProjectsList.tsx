import { useState, useEffect, useMemo } from 'react'
import type { Project, Revenue } from '@/lib/types'
import { isGigUnpaid } from '@/lib/types'
import { useProjects } from '@/hooks/useProjects'
import { useRevenue } from '@/hooks/useRevenue'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, cn } from '@/lib/utils'
import { ChevronDown, FolderKanban } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import PackageRow from './PackageRow'
import GigRow from './GigRow'
import RetainerRow from './RetainerRow'
import ProjectFormModal, { type PaymentEntry } from './ProjectFormModal'
import PackageDetailModal from './PackageDetailModal'
import RetainerDetailModal from './RetainerDetailModal'
import RevenueFormModal from '@/components/revenue/RevenueFormModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { SortKey } from '@/App'

export type TabType = 'all' | 'retainer' | 'package' | 'gig'
export type GroupBy = 'type' | 'client'

interface Props {
  activeTab: TabType
  setActiveTab: (t: TabType) => void
  serviceFilter: string
  setServiceFilter: (s: string) => void
  groupBy: GroupBy
  setGroupBy: (g: GroupBy) => void
  showCompleted: boolean
  setShowCompleted: (v: boolean | ((prev: boolean) => boolean)) => void
  search: string
  sortKey: SortKey
  /** Inclusive YYYY-MM-DD bounds applied to project.created_at */
  dateFrom?: string
  dateTo?: string
  /** If true, only gigs that are past their due date and not done */
  overdueOnly?: boolean
  /** If true, only gigs that are done but not fully paid */
  unpaidOnly?: boolean
  formOpen: boolean
  setFormOpen: (v: boolean) => void
  editProject: Project | null
  setEditProject: (p: Project | null) => void
}

function sortProjects(list: Project[], key: SortKey): Project[] {
  const sorted = [...list]
  switch (key) {
    case 'newest':     sorted.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    case 'oldest':     sorted.sort((a, b) => a.created_at.localeCompare(b.created_at)); break
    case 'name':       sorted.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'price_desc': sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break
    case 'price_asc':  sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break
    case 'due_date':
      // Gigs with due_date first, ascending; then items without a date
      sorted.sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
        if (a.due_date) return -1
        if (b.due_date) return 1
        return 0
      })
      break
  }
  return sorted
}

export default function ProjectsList({
  activeTab,
  serviceFilter,
  groupBy,
  showCompleted,
  search,
  sortKey,
  dateFrom,
  dateTo,
  overdueOnly = false,
  unpaidOnly = false,
  formOpen, setFormOpen,
  editProject, setEditProject,
}: Props) {
  const { projects, isLoading, mutate, createProject, updateProject, deleteProject } = useProjects()
  const { createRevenue } = useRevenue()
  const { currency } = useSettings()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [renewTarget, setRenewTarget] = useState<Project | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [detailRetainer, setDetailRetainer] = useState<Project | null>(null)
  const [billPrefill, setBillPrefill] = useState<Partial<Revenue> | undefined>(undefined)
  const [revenueOpen, setRevenueOpen] = useState(false)

  function toggleCollapse(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /**
   * Compute everything in one memoised pass:
   *   projects → serviceFilter+search+showCompleted+activeTab+sort
   *            → buckets (retainers/packages/gigs) OR clientGroups
   */
  const { filtered, retainers, packages, gigs, clientGroups } = useMemo(() => {
    const q = search.trim().toLowerCase()
    const today = new Date().toISOString().split('T')[0]
    // Single iteration: apply service, search, date, overdue, showCompleted, and tab at once.
    const filtered: Project[] = []
    for (const p of projects) {
      if (serviceFilter !== 'all' && p.service_type !== serviceFilter) continue
      if (q) {
        const nameHit   = p.name.toLowerCase().includes(q)
        const clientHit = (p.clients?.client_name ?? '').toLowerCase().includes(q)
        if (!nameHit && !clientHit) continue
      }
      // Date range on created_at (inclusive)
      const created = p.created_at.slice(0, 10)
      if (dateFrom && created < dateFrom) continue
      if (dateTo   && created > dateTo)   continue
      // Overdue: only gigs past their due_date and not done
      if (overdueOnly) {
        if (p.project_type !== 'gig') continue
        if (!p.due_date || p.due_date >= today || p.status === 'done') continue
      }
      // Unpaid: only gigs marked done but not fully paid.
      // When the user is actively looking for unpaid work we always show
      // those gigs, even if "Show completed" is off.
      if (unpaidOnly) {
        if (!isGigUnpaid(p)) continue
      } else if (!showCompleted && p.project_type === 'gig' && p.status === 'done') {
        continue
      }
      if (activeTab !== 'all' && p.project_type !== activeTab) continue
      filtered.push(p)
    }

    const sorted = sortProjects(filtered, sortKey)
    const retainers: Project[] = []
    const packages: Project[]  = []
    const gigs: Project[]      = []
    for (const p of sorted) {
      if (p.project_type === 'retainer') retainers.push(p)
      else if (p.project_type === 'package') packages.push(p)
      else gigs.push(p)
    }

    // Build client groups lazily — only needed in "by client" view
    const clientGroups: { key: string; label: string; projects: Project[] }[] = []
    if (groupBy === 'client') {
      const map = new Map<string, { label: string; projects: Project[] }>()
      for (const p of sorted) {
        const key = p.client_id ?? '__none__'
        const label = p.clients?.client_name ?? 'No Client'
        if (!map.has(key)) map.set(key, { label, projects: [] })
        map.get(key)!.projects.push(p)
      }
      const named = [...map.entries()].filter(([k]) => k !== '__none__').sort((a, b) => a[1].label.localeCompare(b[1].label))
      const none = map.get('__none__')
      for (const [key, val] of named) clientGroups.push({ key, ...val })
      if (none) clientGroups.push({ key: '__none__', ...none })
    }

    return { filtered: sorted, retainers, packages, gigs, clientGroups }
  }, [projects, serviceFilter, search, showCompleted, activeTab, sortKey, groupBy, dateFrom, dateTo, overdueOnly, unpaidOnly])

  // Prune stale keys from the collapsed set whenever groups change.
  // Keeps the set from growing unbounded as clients come and go.
  useEffect(() => {
    if (groupBy !== 'client') return
    const validKeys = new Set(clientGroups.map(g => g.key))
    setCollapsed(prev => {
      const pruned = new Set<string>()
      for (const k of prev) if (validKeys.has(k)) pruned.add(k)
      return pruned.size === prev.size ? prev : pruned
    })
  }, [clientGroups, groupBy])

  function renderProjectRow(p: Project) {
    if (p.project_type === 'retainer') {
      return <RetainerRow key={p.id} project={p}
        isExpanded={expanded.has(p.id)} onToggleExpand={() => toggleExpand(p.id)}
        onView={() => setDetailRetainer(p)} onBill={() => handleBill(p)}
        onEdit={() => { setEditProject(p); setFormOpen(true) }}
        onDelete={() => setDeleteTarget(p)} />
    }
    if (p.project_type === 'package') {
      return <PackageRow key={p.id} project={p}
        isExpanded={expanded.has(p.id)} onToggleExpand={() => toggleExpand(p.id)}
        onView={() => setDetailProject(p)}
        onEdit={() => { setEditProject(p); setFormOpen(true) }}
        onDelete={() => setDeleteTarget(p)}
        onRenew={() => setRenewTarget(p)} />
    }
    return <GigRow key={p.id} project={p} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} />
  }

  async function handleSave(data: Partial<Project>, payment?: PaymentEntry): Promise<boolean> {
    if (editProject) {
      const ok = await updateProject(editProject.id, data)
      if (ok && payment) {
        // Nudge flow: user flipped a gig to done and opted to log the
        // payment in the same dialog. Link it to the existing project.
        await createRevenue({
          amount: payment.amount,
          status: payment.status,
          payment_date: payment.payment_date,
          client_id: data.client_id ?? editProject.client_id ?? undefined,
          project_id: editProject.id,
          service_type: data.service_type ?? editProject.service_type,
        })
      }
      return ok
    }
    const newId = await createProject(data)
    if (!newId) return false
    if (payment) {
      await createRevenue({
        amount: payment.amount,
        status: payment.status,
        payment_date: payment.payment_date,
        client_id: data.client_id,
        project_id: newId,
        service_type: data.service_type,
      })
    }
    return true
  }

  function handleBill(project: Project) {
    const owed = (project.delivery_count ?? 0) * (project.unit_price ?? 0)
    const count = project.delivery_count ?? 0
    setBillPrefill({
      client_id: project.client_id ?? undefined,
      project_id: project.id,
      service_type: project.service_type,
      amount: owed,
      description: `${count} deliver${count !== 1 ? 'ies' : 'y'} × ${formatCurrency(project.unit_price ?? 0, currency)}`,
      status: 'pending',
      payment_date: new Date().toISOString().split('T')[0],
    })
    setRevenueOpen(true)
  }

  async function handleRenewConfirm(project: Project) {
    await createProject({
      name: project.name + ' (Renewed)',
      client_id: project.client_id,
      service_type: project.service_type,
      project_type: 'package',
      price: project.price,
      total_units: project.total_units,
      notes: project.notes,
    })
  }

  return (
    <div className="space-y-4">

      {isLoading && <div className="text-sm text-zinc-400 py-8 text-center">Loading...</div>}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={
            unpaidOnly
              ? 'Nothing unpaid'
              : overdueOnly
                ? 'Nothing overdue'
                : (dateFrom || dateTo)
                  ? 'No projects in this range'
                  : activeTab === 'all' ? 'No projects yet' : `No ${activeTab}s in this view`
          }
          description={
            unpaidOnly
              ? 'Every finished gig has been paid for. Nicely done.'
              : overdueOnly
                ? 'No gigs are past their due date. Nice work keeping up.'
                : (dateFrom || dateTo)
                  ? 'Try broadening the date range or clearing other filters.'
                  : activeTab === 'all'
                    ? 'Projects you create will appear here. Start by adding a gig, package, or retainer.'
                    : 'Try another tab, clear the service filter, or toggle Show Completed.'
          }
          size="lg"
        />
      )}

      {/* ── Group by Client ── */}
      {groupBy === 'client' && clientGroups.map(group => (
        <div key={group.key} className="space-y-2">
          {/* Client header */}
          <button
            type="button"
            onClick={() => toggleCollapse(group.key)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-400 transition-transform shrink-0', collapsed.has(group.key) && '-rotate-90')} />
            <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
              {group.label}
            </span>
            <span className="text-xs text-zinc-400 font-normal">
              {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-px bg-zinc-100 ml-1" />
          </button>

          {/* Rows */}
          {!collapsed.has(group.key) && (
            <div className="space-y-2 pl-5">
              {group.projects.map(p => renderProjectRow(p))}
            </div>
          )}
        </div>
      ))}

      {/* ── Group by Type ── */}
      {groupBy === 'type' && (
        <>
          {/* Retainers section */}
          {retainers.length > 0 && (
            <div className="space-y-2">
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Retainers</span>
                </div>
              )}
              {retainers.map(p => (
                <RetainerRow key={p.id} project={p}
                  isExpanded={expanded.has(p.id)} onToggleExpand={() => toggleExpand(p.id)}
                  onView={() => setDetailRetainer(p)} onBill={() => handleBill(p)}
                  onEdit={() => { setEditProject(p); setFormOpen(true) }}
                  onDelete={() => setDeleteTarget(p)} />
              ))}
            </div>
          )}

          {/* Packages section */}
          {packages.length > 0 && (
            <div className="space-y-2">
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Packages</span>
                </div>
              )}
              {packages.map(p => (
                <PackageRow key={p.id} project={p}
                  isExpanded={expanded.has(p.id)} onToggleExpand={() => toggleExpand(p.id)}
                  onView={() => setDetailProject(p)}
                  onEdit={() => { setEditProject(p); setFormOpen(true) }}
                  onDelete={() => setDeleteTarget(p)}
                  onRenew={() => setRenewTarget(p)} />
              ))}
            </div>
          )}

          {/* Gigs section */}
          {gigs.length > 0 && (
            <div className="space-y-2">
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Gigs</span>
                </div>
              )}
              {gigs.map(p => (
                <GigRow key={p.id} project={p} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} />
              ))}
            </div>
          )}
        </>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProject(null) }}
        onSave={handleSave}
        project={editProject}
      />

      <PackageDetailModal
        open={!!detailProject}
        onClose={() => setDetailProject(null)}
        project={detailProject}
        onDeliveryChange={() => mutate()}
      />

      <RetainerDetailModal
        open={!!detailRetainer}
        onClose={() => setDetailRetainer(null)}
        project={detailRetainer}
        onDeliveryChange={() => mutate()}
        onBill={() => { const p = detailRetainer; setDetailRetainer(null); if (p) handleBill(p) }}
      />

      <RevenueFormModal
        open={revenueOpen}
        onClose={() => { setRevenueOpen(false); setBillPrefill(undefined) }}
        // billPrefill is only set when the user clicked "Bill" on a retainer —
        // in that case mark all the project's unbilled deliveries as billed.
        onSave={data => createRevenue(data, { billRetainer: !!billPrefill?.project_id })}
        prefill={billPrefill}
        titleOverride={billPrefill?.project_id
          ? `Bill ${formatCurrency(Number(billPrefill.amount ?? 0), currency)}`
          : undefined}
        saveLabelOverride={billPrefill?.project_id
          ? `Confirm & bill ${formatCurrency(Number(billPrefill.amount ?? 0), currency)}`
          : undefined}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>
              {deleteTarget?.project_type !== 'gig' && ' and all its delivery logs'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) deleteProject(deleteTarget.id); setDeleteTarget(null) }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew confirmation — previously a single click instantly cloned the
          package, making accidental duplicates easy. Now it asks first. */}
      <AlertDialog open={!!renewTarget} onOpenChange={() => setRenewTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew this package?</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new package <strong>{renewTarget?.name} (Renewed)</strong> with the same
              rate ({renewTarget?.total_units} units, {formatCurrency(renewTarget?.price ?? 0, currency)}).
              The original will stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const t = renewTarget
                setRenewTarget(null)
                if (t) await handleRenewConfirm(t)
              }}
            >
              Renew
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
