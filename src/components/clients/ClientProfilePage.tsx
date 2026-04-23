import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClientProfile } from '@/hooks/useClientProfile'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { useRevenue } from '@/hooks/useRevenue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, Pencil, Plus, DollarSign, Briefcase, Wallet, Mail } from 'lucide-react'
import PackageRow from '@/components/projects/PackageRow'
import GigRow from '@/components/projects/GigRow'
import RetainerRow from '@/components/projects/RetainerRow'
import PackageDetailModal from '@/components/projects/PackageDetailModal'
import RetainerDetailModal from '@/components/projects/RetainerDetailModal'
import ProjectFormModal, { type PaymentEntry } from '@/components/projects/ProjectFormModal'
import RevenueFormModal from '@/components/revenue/RevenueFormModal'
import RevenueDeliveriesModal from '@/components/revenue/RevenueDeliveriesModal'
import PaymentStatusBadge from '@/components/revenue/PaymentStatusBadge'
import ClientFormModal from './ClientFormModal'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/shared/EmptyState'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import { isGigUnpaid } from '@/lib/types'
import type { Project, Client, Revenue, PaymentStatus } from '@/lib/types'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Tab = 'overview' | 'projects' | 'payments'

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, isLoading, error, mutate } = useClientProfile(id)
  const { updateClient } = useClients()
  const { createProject, updateProject, deleteProject } = useProjects()
  const { createRevenue } = useRevenue()
  const { currency } = useSettings()

  // Tab state
  const [tab, setTab] = useState<Tab>('overview')

  // Edit / create client
  const [editClientOpen, setEditClientOpen] = useState(false)

  // Project row actions
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [renewTarget, setRenewTarget] = useState<Project | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [detailRetainer, setDetailRetainer] = useState<Project | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Revenue / Bill flow
  const [revenueOpen, setRevenueOpen] = useState(false)
  const [editRevenue, setEditRevenue] = useState<Revenue | null>(null)
  const [revenuePrefill, setRevenuePrefill] = useState<Partial<Revenue> | undefined>(undefined)
  const [isBillFlow, setIsBillFlow] = useState(false)
  const [revenueDeliveriesFor, setRevenueDeliveriesFor] = useState<Revenue | null>(null)

  function toggleExpand(pid: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(pid) ? next.delete(pid) : next.add(pid)
      return next
    })
  }

  // ── Action handlers ─────────────────────────────────────────────────────

  async function handleProjectSave(data: Partial<Project>, payment?: PaymentEntry): Promise<boolean> {
    if (editProject) {
      const ok = await updateProject(editProject.id, data)
      if (ok && payment) {
        await createRevenue({
          amount: payment.amount,
          status: payment.status,
          payment_date: payment.payment_date,
          client_id: data.client_id ?? id,
          project_id: editProject.id,
          service_type: data.service_type ?? editProject.service_type,
        })
      }
      if (ok) mutate()
      return ok
    }
    const newId = await createProject({ ...data, client_id: id })
    if (!newId) return false
    if (payment) {
      await createRevenue({
        amount: payment.amount,
        status: payment.status,
        payment_date: payment.payment_date,
        client_id: id,
        project_id: newId,
        service_type: data.service_type,
      })
    }
    mutate()
    return true
  }

  function handleBill(project: Project) {
    const owed = (project.delivery_count ?? 0) * (project.unit_price ?? 0)
    const count = project.delivery_count ?? 0
    setRevenuePrefill({
      client_id: id ?? undefined,
      project_id: project.id,
      service_type: project.service_type,
      amount: owed,
      description: `${count} deliver${count !== 1 ? 'ies' : 'y'} × ${formatCurrency(project.unit_price ?? 0, currency)}`,
      status: 'pending',
      payment_date: new Date().toISOString().split('T')[0],
    })
    setEditRevenue(null)
    setIsBillFlow(true)
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
    mutate()
  }

  async function handleRevenueSave(data: Partial<Revenue>): Promise<boolean> {
    const ok = editRevenue
      ? false // We don't currently edit revenue from this page — shouldn't hit this branch
      : await createRevenue(data, { billRetainer: isBillFlow && !!data.project_id })
    if (ok) mutate()
    return ok
  }

  async function handleClientSave(data: Partial<Client>): Promise<boolean> {
    if (!id) return true
    const ok = await updateClient(id, data)
    if (ok) mutate()
    return ok
  }

  // ── Loading + error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-zinc-100 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-lg bg-zinc-100" />)}
        </div>
        <div className="h-48 bg-zinc-100 rounded-lg" />
      </div>
    )
  }

  if (error || !profile?.client) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm text-zinc-400">Client not found.</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
        </Button>
      </div>
    )
  }

  const { client, projects, revenue } = profile
  const retainers = projects.filter(p => p.project_type === 'retainer')
  const packages  = projects.filter(p => p.project_type === 'package')
  const gigs      = projects.filter(p => p.project_type === 'gig')
  const totalPaid = revenue.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const retainerOwed = retainers.reduce((s, p) => s + (p.delivery_count ?? 0) * Number(p.unit_price ?? 0), 0)
  const gigsOwed = gigs
    .filter(isGigUnpaid)
    .reduce((s, p) => s + Math.max(0, Number(p.price ?? 0) - Number(p.paid_amount ?? 0)), 0)
  const totalOwed = retainerOwed + gigsOwed
  const activeProjects = retainers.length + packages.length + gigs.filter(g => g.status !== 'done').length

  // Month-grouped payments
  const paymentsByMonth = revenue.reduce<Record<string, Revenue[]>>((acc, r) => {
    const key = (r.payment_date ?? r.created_at).slice(0, 7) // YYYY-MM
    ;(acc[key] ||= []).push(r)
    return acc
  }, {})
  const monthKeys = Object.keys(paymentsByMonth).sort().reverse()

  // ── Row renderers ───────────────────────────────────────────────────────

  function renderRetainer(p: Project) {
    return (
      <RetainerRow
        key={p.id}
        project={p}
        isExpanded={expanded.has(p.id)}
        onToggleExpand={() => toggleExpand(p.id)}
        onView={() => setDetailRetainer(p)}
        onBill={() => handleBill(p)}
        onEdit={() => { setEditProject(p); setProjectFormOpen(true) }}
        onDelete={() => setDeleteTarget(p)}
      />
    )
  }
  function renderPackage(p: Project) {
    return (
      <PackageRow
        key={p.id}
        project={p}
        isExpanded={expanded.has(p.id)}
        onToggleExpand={() => toggleExpand(p.id)}
        onView={() => setDetailProject(p)}
        onEdit={() => { setEditProject(p); setProjectFormOpen(true) }}
        onDelete={() => setDeleteTarget(p)}
        onRenew={() => setRenewTarget(p)}
      />
    )
  }
  function renderGig(p: Project) {
    return (
      <GigRow
        key={p.id}
        project={p}
        onEdit={() => { setEditProject(p); setProjectFormOpen(true) }}
        onDelete={() => setDeleteTarget(p)}
      />
    )
  }

  function ProjectsBlock({ limit }: { limit?: number }) {
    const rList = limit ? retainers.slice(0, limit) : retainers
    const pList = limit ? packages.slice(0, Math.max(0, limit - rList.length)) : packages
    const gList = limit ? gigs.slice(0, Math.max(0, limit - rList.length - pList.length)) : gigs
    return (
      <div className="space-y-3">
        {rList.length > 0 && (
          <div className="space-y-2">
            <SectionLabel color="bg-teal-400">Retainers</SectionLabel>
            {rList.map(renderRetainer)}
          </div>
        )}
        {pList.length > 0 && (
          <div className="space-y-2">
            <SectionLabel color="bg-violet-400">Packages</SectionLabel>
            {pList.map(renderPackage)}
          </div>
        )}
        {gList.length > 0 && (
          <div className="space-y-2">
            <SectionLabel color="bg-zinc-400">Gigs</SectionLabel>
            {gList.map(renderGig)}
          </div>
        )}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="mt-0.5 shrink-0" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-zinc-900">{client.client_name}</h1>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditClientOpen(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditRevenue(null)
                  setIsBillFlow(false)
                  setRevenuePrefill({ client_id: id })
                  setRevenueOpen(true)
                }}
              >
                <DollarSign className="w-4 h-4 mr-1" /> Log Payment
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditProject(null); setProjectFormOpen(true) }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Project
              </Button>
            </div>
          </div>
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="inline-flex items-center gap-1 text-sm text-zinc-500 mt-0.5 hover:text-zinc-900 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> {client.email}
            </a>
          )}
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            {client.channel_link && (
              <a href={client.channel_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Channel 1 <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {client.channel_link_2 && (
              <a href={client.channel_link_2} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Channel 2 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {client.notes && <div className="text-xs text-zinc-400 italic mt-1">{client.notes}</div>}
        </div>
      </div>

      {/* Stats row — now uses KpiCard like the dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Projects"
          value={projects.length}
          sub={`${activeProjects} active`}
          icon={Briefcase}
          iconColor="text-blue-500"
        />
        <KpiCard
          label="Total Paid"
          value={formatCurrency(totalPaid, currency)}
          sub={`${revenue.filter(r => r.status === 'paid').length} payments`}
          icon={DollarSign}
          iconColor="text-emerald-500"
        />
        <KpiCard
          label="Owed"
          value={formatCurrency(totalOwed, currency)}
          sub={`${formatCurrency(retainerOwed, currency)} retainer · ${formatCurrency(gigsOwed, currency)} gigs`}
          icon={Wallet}
          iconColor="text-amber-500"
        />
        <KpiCard
          label="Since"
          value={formatDate(client.created_at)}
          sub="first became a client"
          icon={Mail}
          iconColor="text-zinc-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-200 overflow-x-auto">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'projects', label: `Projects (${projects.length})` },
          { key: 'payments', label: `Payments (${revenue.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.key
                ? 'border-zinc-800 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-700">Recent projects</h2>
              {projects.length > 5 && (
                <button onClick={() => setTab('projects')} className="text-xs text-zinc-500 hover:text-zinc-900">
                  See all {projects.length} →
                </button>
              )}
            </div>
            {projects.length === 0
              ? <EmptyState icon={Briefcase} title="No projects yet" description="Add a project to track work for this client." action={{ label: 'Add Project', onClick: () => { setEditProject(null); setProjectFormOpen(true) }, icon: Plus }} />
              : <ProjectsBlock limit={5} />
            }
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-700">Recent payments</h2>
              {revenue.length > 5 && (
                <button onClick={() => setTab('payments')} className="text-xs text-zinc-500 hover:text-zinc-900">
                  See all {revenue.length} →
                </button>
              )}
            </div>
            {revenue.length === 0
              ? <EmptyState icon={DollarSign} title="No payments yet" description="Log a payment when this client pays you." action={{ label: 'Log Payment', onClick: () => { setEditRevenue(null); setIsBillFlow(false); setRevenuePrefill({ client_id: id }); setRevenueOpen(true) }, icon: DollarSign }} />
              : <PaymentList items={revenue.slice(0, 5)} onViewDeliveries={setRevenueDeliveriesFor} currency={currency} />
            }
          </div>
        </div>
      )}

      {/* ── Projects tab ─────────────────────────────────────── */}
      {tab === 'projects' && (
        projects.length === 0
          ? <EmptyState icon={Briefcase} title="No projects yet" description="Add a project to track work for this client." action={{ label: 'Add Project', onClick: () => { setEditProject(null); setProjectFormOpen(true) }, icon: Plus }} size="lg" />
          : <ProjectsBlock />
      )}

      {/* ── Payments tab (month-grouped) ─────────────────────── */}
      {tab === 'payments' && (
        revenue.length === 0
          ? <EmptyState icon={DollarSign} title="No payments yet" description="Log a payment when this client pays you." action={{ label: 'Log Payment', onClick: () => { setEditRevenue(null); setIsBillFlow(false); setRevenuePrefill({ client_id: id }); setRevenueOpen(true) }, icon: DollarSign }} size="lg" />
          : (
            <div className="space-y-5">
              {monthKeys.map(key => {
                const items = paymentsByMonth[key]
                const monthTotal = items.reduce((s, r) => s + Number(r.amount), 0)
                const label = new Date(key + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</span>
                      <span className="text-xs font-medium text-zinc-700">
                        {formatCurrency(monthTotal, currency)} · {items.length} payment{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <PaymentList items={items} onViewDeliveries={setRevenueDeliveriesFor} currency={currency} />
                  </div>
                )
              })}
            </div>
          )
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <ClientFormModal
        open={editClientOpen}
        onClose={() => setEditClientOpen(false)}
        onSave={handleClientSave}
        client={client}
      />

      <ProjectFormModal
        open={projectFormOpen}
        onClose={() => { setProjectFormOpen(false); setEditProject(null) }}
        onSave={handleProjectSave}
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
        onClose={() => { setRevenueOpen(false); setRevenuePrefill(undefined); setIsBillFlow(false); setEditRevenue(null) }}
        onSave={handleRevenueSave}
        revenue={editRevenue}
        prefill={revenuePrefill}
        titleOverride={isBillFlow && revenuePrefill?.project_id
          ? `Bill ${formatCurrency(Number(revenuePrefill.amount ?? 0), currency)}`
          : undefined}
        saveLabelOverride={isBillFlow && revenuePrefill?.project_id
          ? `Confirm & bill ${formatCurrency(Number(revenuePrefill.amount ?? 0), currency)}`
          : undefined}
      />

      <RevenueDeliveriesModal
        open={!!revenueDeliveriesFor}
        onClose={() => setRevenueDeliveriesFor(null)}
        revenue={revenueDeliveriesFor}
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
              onClick={async () => {
                if (deleteTarget) {
                  await deleteProject(deleteTarget.id)
                  mutate()
                }
                setDeleteTarget(null)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{children}</span>
    </div>
  )
}

interface PaymentListProps {
  items: Revenue[]
  onViewDeliveries: (r: Revenue) => void
  currency: string
}
function PaymentList({ items, onViewDeliveries, currency }: PaymentListProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      {items.map((r, i) => (
        <div
          key={r.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-zinc-100' : ''}`}
        >
          <div className="text-xs text-zinc-400 shrink-0 w-20">{formatDate(r.payment_date)}</div>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            {r.projects?.name && (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-zinc-50 text-zinc-600 border-zinc-200">
                {r.projects.name}
              </span>
            )}
            {r.description && <span className="text-xs text-zinc-400">{r.description}</span>}
            {(r.linked_delivery_count ?? 0) > 0 && (
              <button
                onClick={() => onViewDeliveries(r)}
                className="text-xs text-teal-600 hover:text-teal-800 hover:underline"
              >
                {r.linked_delivery_count} deliver{r.linked_delivery_count !== 1 ? 'ies' : 'y'} →
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(r.amount), currency)}</span>
            <PaymentStatusBadge status={r.status as PaymentStatus} />
          </div>
        </div>
      ))}
    </div>
  )
}
