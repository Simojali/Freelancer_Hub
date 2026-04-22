import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClientProfile } from '@/hooks/useClientProfile'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import PackageRow from '@/components/projects/PackageRow'
import GigRow from '@/components/projects/GigRow'
import RetainerRow from '@/components/projects/RetainerRow'
import PaymentStatusBadge from '@/components/revenue/PaymentStatusBadge'
import ClientFormModal from './ClientFormModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import type { Project, Client, PaymentStatus } from '@/lib/types'

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, isLoading, error, mutate } = useClientProfile(id)
  const { updateClient } = useClients()
  const { createProject } = useProjects()
  const [editOpen, setEditOpen] = useState(false)
  const { currency } = useSettings()

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

  async function handleClientSave(data: Partial<Client>): Promise<boolean> {
    if (!id) return true
    const ok = await updateClient(id, data)
    mutate()
    return ok
  }

  if (isLoading) {
    return <div className="text-sm text-zinc-400 py-16 text-center">Loading...</div>
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
  const packages = projects.filter(p => p.project_type === 'package')
  const gigs = projects.filter(p => p.project_type === 'gig')
  const totalPaid = revenue.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const retainerOwed = retainers.reduce((s, p) => s + (p.delivery_count ?? 0) * Number(p.unit_price ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="mt-0.5 shrink-0" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{client.client_name}</h1>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
          {client.email && <div className="text-sm text-zinc-500 mt-0.5">{client.email}</div>}
          <div className="flex items-center gap-4 mt-1">
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

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-center">
          <div className="text-xl font-semibold text-zinc-900">{projects.length}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Projects</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-center">
          <div className="text-xl font-semibold text-emerald-600">{formatCurrency(totalPaid, currency)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Total Paid</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-center">
          <div className="text-xl font-semibold text-amber-500">{formatCurrency(retainerOwed, currency)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Retainer Owed</div>
        </div>
      </div>

      {/* Projects section */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-700">Projects</h2>
          {retainers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Retainers</span>
              </div>
              {retainers.map(p => (
                <RetainerRow
                  key={p.id}
                  project={p}
                  onView={() => {}}
                  onBill={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
          {packages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Packages</span>
              </div>
              {packages.map(p => (
                <PackageRow
                  key={p.id}
                  project={p}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onRenew={() => handleRenew(p)}
                />
              ))}
            </div>
          )}
          {gigs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Gigs</span>
              </div>
              {gigs.map(p => (
                <GigRow
                  key={p.id}
                  project={p}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-sm text-zinc-400 text-center py-6">No projects for this client yet.</div>
      )}

      {/* Revenue section */}
      {revenue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-700">Payments</h2>
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            {revenue.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${i < revenue.length - 1 ? 'border-b border-zinc-100' : ''}`}
              >
                <div className="text-xs text-zinc-400 shrink-0 w-20">{formatDate(r.payment_date)}</div>
                <div className="flex-1 min-w-0">
                  {r.projects?.name && (
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-zinc-50 text-zinc-600 border-zinc-200">
                      {r.projects.name}
                    </span>
                  )}
                  {r.description && (
                    <span className="text-xs text-zinc-400 ml-2">{r.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(r.amount), currency)}</span>
                  <PaymentStatusBadge status={r.status as PaymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenue.length === 0 && (
        <div className="text-sm text-zinc-400 text-center py-6">No payments logged for this client yet.</div>
      )}

      <ClientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleClientSave}
        client={client}
      />
    </div>
  )
}
