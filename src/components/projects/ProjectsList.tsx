import { useState, useEffect } from 'react'
import type { Project, Revenue } from '@/lib/types'
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
  /** Parent sets this to open the add form; ProjectsList resets it after opening */
  formOpen: boolean
  setFormOpen: (v: boolean) => void
  editProject: Project | null
  setEditProject: (p: Project | null) => void
  onCompletedCount: (n: number) => void
  onTabCounts: (c: { all: number; retainer: number; package: number; gig: number }) => void
}

export default function ProjectsList({
  activeTab, setActiveTab,
  serviceFilter, setServiceFilter,
  groupBy, setGroupBy,
  showCompleted, setShowCompleted,
  formOpen, setFormOpen,
  editProject, setEditProject,
  onCompletedCount,
  onTabCounts,
}: Props) {
  const { projects, isLoading, mutate, createProject, updateProject, deleteProject } = useProjects()
  const { createRevenue } = useRevenue()
  const { currency } = useSettings()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
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

  // Base pool: service filter, then optionally hide done gigs
  const serviceFiltered = projects.filter(p =>
    serviceFilter === 'all' || p.service_type === serviceFilter
  )
  const pool = showCompleted
    ? serviceFiltered
    : serviceFiltered.filter(p => !(p.project_type === 'gig' && p.status === 'done'))

  // Tab counts always reflect current showCompleted state
  const counts = {
    all:      pool.length,
    retainer: pool.filter(p => p.project_type === 'retainer').length,
    package:  pool.filter(p => p.project_type === 'package').length,
    gig:      pool.filter(p => p.project_type === 'gig').length,
  }

  // Number of done gigs in the full service-filtered set (for toggle badge)
  const completedCount = serviceFiltered.filter(p =>
    p.project_type === 'gig' && p.status === 'done'
  ).length

  // Inform parent of counts so tabs + completed button stay in sync
  useEffect(() => { onCompletedCount(completedCount) }, [completedCount])
  useEffect(() => { onTabCounts(counts) }, [counts.all, counts.retainer, counts.package, counts.gig])

  const filtered = pool.filter(p => activeTab === 'all' || p.project_type === activeTab)

  const retainers = filtered.filter(p => p.project_type === 'retainer')
  const packages = filtered.filter(p => p.project_type === 'package')
  const gigs = filtered.filter(p => p.project_type === 'gig')

  // Build client groups for the "by client" view
  const clientGroups: { key: string; label: string; projects: Project[] }[] = []
  if (groupBy === 'client') {
    const map = new Map<string, { label: string; projects: Project[] }>()
    for (const p of filtered) {
      const key = p.client_id ?? '__none__'
      const label = p.clients?.client_name ?? 'No Client'
      if (!map.has(key)) map.set(key, { label, projects: [] })
      map.get(key)!.projects.push(p)
    }
    // Named clients first (sorted), then "No Client"
    const named = [...map.entries()].filter(([k]) => k !== '__none__').sort((a, b) => a[1].label.localeCompare(b[1].label))
    const none = map.get('__none__')
    for (const [key, val] of named) clientGroups.push({ key, ...val })
    if (none) clientGroups.push({ key: '__none__', ...none })
  }

  function renderProjectRow(p: Project) {
    if (p.project_type === 'retainer') {
      return <RetainerRow key={p.id} project={p} onView={() => setDetailRetainer(p)} onBill={() => handleBill(p)} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} />
    }
    if (p.project_type === 'package') {
      return <PackageRow key={p.id} project={p} onView={() => setDetailProject(p)} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} onRenew={() => handleRenew(p)} />
    }
    return <GigRow key={p.id} project={p} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} />
  }

  async function handleSave(data: Partial<Project>, payment?: PaymentEntry): Promise<boolean> {
    if (editProject) {
      return updateProject(editProject.id, data)
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

  function handleRenew(project: Project) {
    createProject({
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
          title={activeTab === 'all' ? 'No projects yet' : `No ${activeTab}s in this view`}
          description={activeTab === 'all'
            ? 'Projects you create will appear here. Start by adding a gig, package, or retainer.'
            : 'Try another tab, clear the service filter, or toggle Show Completed.'}
          size="lg"
        />
      )}

      {/* ── Group by Client ── */}
      {groupBy === 'client' && clientGroups.map(group => (
        <div key={group.key} className="space-y-2">
          {/* Client header */}
          <button
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
                <RetainerRow key={p.id} project={p} onView={() => setDetailRetainer(p)} onBill={() => handleBill(p)} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} />
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
                <PackageRow key={p.id} project={p} onView={() => setDetailProject(p)} onEdit={() => { setEditProject(p); setFormOpen(true) }} onDelete={() => setDeleteTarget(p)} onRenew={() => handleRenew(p)} />
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
        onSave={data => createRevenue(data)}
        prefill={billPrefill}
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
    </div>
  )
}
