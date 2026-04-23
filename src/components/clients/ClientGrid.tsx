import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Client, Project, Revenue } from '@/lib/types'
import { isGigUnpaid } from '@/lib/types'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { useRevenue } from '@/hooks/useRevenue'
import ClientCard, { type ClientStats } from './ClientCard'
import ClientFormModal from './ClientFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, UserCheck, Search, ArrowUpDown } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import EmptyState from '@/components/shared/EmptyState'

type SortKey = 'name' | 'newest' | 'paid_desc' | 'owed_desc' | 'projects_desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name',          label: 'Name (A–Z)' },
  { value: 'newest',        label: 'Newest' },
  { value: 'paid_desc',     label: 'Highest paying' },
  { value: 'owed_desc',     label: 'Most owed' },
  { value: 'projects_desc', label: 'Most projects' },
]

export default function ClientGrid() {
  const navigate = useNavigate()
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients()
  const { projects } = useProjects()
  const { revenue } = useRevenue()

  const [searchParams, setSearchParams] = useSearchParams()
  const search  = searchParams.get('q') ?? ''
  const sortKey = (searchParams.get('sort') as SortKey | null) ?? 'name'

  function updateParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams)
    if (value === defaultValue) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }
  const setSearch = (q: string)      => updateParam('q', q, '')
  const setSort   = (s: SortKey)     => updateParam('sort', s, 'name')

  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  async function handleSave(data: Partial<Client>): Promise<boolean> {
    return editClient ? updateClient(editClient.id, data) : createClient(data)
  }

  // Build a stats map: clientId → { totalPaid, owed, activeProjects, totalProjects }
  const statsByClient = useMemo(() => computeClientStats(clients, projects, revenue), [clients, projects, revenue])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = !q ? clients : clients.filter(c => {
      return c.client_name.toLowerCase().includes(q)
        || (c.email ?? '').toLowerCase().includes(q)
        || (c.notes ?? '').toLowerCase().includes(q)
    })
    const sorted = [...filtered]
    const getStats = (id: string) => statsByClient[id] ?? { totalPaid: 0, owed: 0, activeProjects: 0, totalProjects: 0 }
    switch (sortKey) {
      case 'name':          sorted.sort((a, b) => a.client_name.localeCompare(b.client_name)); break
      case 'newest':        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'paid_desc':     sorted.sort((a, b) => getStats(b.id).totalPaid - getStats(a.id).totalPaid); break
      case 'owed_desc':     sorted.sort((a, b) => getStats(b.id).owed - getStats(a.id).owed); break
      case 'projects_desc': sorted.sort((a, b) => getStats(b.id).totalProjects - getStats(a.id).totalProjects); break
    }
    return sorted
  }, [clients, search, sortKey, statsByClient])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="h-8 pl-8 w-56 text-xs"
            />
          </div>
          <Select value={sortKey} onValueChange={v => v && setSort(v as SortKey)}>
            <SelectTrigger className="w-40 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => { setEditClient(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4 mr-1" /> Add Client
        </Button>
      </div>

      {isLoading && <div className="text-sm text-zinc-400 py-8 text-center">Loading...</div>}

      {!isLoading && clients.length === 0 && (
        <EmptyState
          icon={UserCheck}
          title="No clients yet"
          description="Add clients you're working with to track their projects and payments in one place."
          action={{ label: 'Add your first client', onClick: () => { setEditClient(null); setFormOpen(true) }, icon: Plus }}
          size="lg"
        />
      )}

      {!isLoading && clients.length > 0 && filteredSorted.length === 0 && (
        <EmptyState
          icon={Search}
          title="No clients match"
          description="Try a different search term or clear the filter."
          size="lg"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSorted.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            stats={statsByClient[client.id]}
            onView={() => navigate('/clients/' + client.id)}
            onEdit={() => { setEditClient(client); setFormOpen(true) }}
            onDelete={() => setDeleteTarget(client)}
          />
        ))}
      </div>

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        client={editClient}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.client_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) deleteClient(deleteTarget.id); setDeleteTarget(null) }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function computeClientStats(clients: Client[], projects: Project[], revenue: Revenue[]): Record<string, ClientStats> {
  const out: Record<string, ClientStats> = {}
  for (const c of clients) {
    out[c.id] = { totalPaid: 0, owed: 0, activeProjects: 0, totalProjects: 0 }
  }
  // Paid revenue per client
  for (const r of revenue) {
    if (!r.client_id || !out[r.client_id]) continue
    if (r.status === 'paid') out[r.client_id].totalPaid += Number(r.amount ?? 0)
  }
  // Projects per client (total, active, owed amount)
  for (const p of projects) {
    if (!p.client_id || !out[p.client_id]) continue
    out[p.client_id].totalProjects += 1

    const isActive = p.project_type === 'gig'
      ? p.status !== 'done'
      : true // retainers + packages always "active" for this purpose
    if (isActive) out[p.client_id].activeProjects += 1

    // Owed: retainer (unbilled × unit_price) + unpaid gig (price - paid_amount)
    if (p.project_type === 'retainer') {
      out[p.client_id].owed += (p.delivery_count ?? 0) * Number(p.unit_price ?? 0)
    } else if (p.project_type === 'gig' && isGigUnpaid(p)) {
      out[p.client_id].owed += Math.max(0, Number(p.price ?? 0) - Number(p.paid_amount ?? 0))
    }
  }
  return out
}
