import { useState } from 'react'
import { Routes, Route, useSearchParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DashboardView from '@/components/dashboard/DashboardView'
import LeadsTable from '@/components/leads/LeadsTable'
import ClientGrid from '@/components/clients/ClientGrid'
import ClientProfilePage from '@/components/clients/ClientProfilePage'
import ProjectsList, { type TabType, type GroupBy } from '@/components/projects/ProjectsList'
import RevenueTable from '@/components/revenue/RevenueTable'
import SettingsPage from '@/components/settings/SettingsPage'
import { useServices } from '@/hooks/useServices'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Layers, Users, CheckCheck, Search, ArrowUpDown } from 'lucide-react'
import type { Project } from '@/lib/types'

export type SortKey = 'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'due_date' | 'name'

function DashboardPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Dashboard</h1>
      <DashboardView />
    </div>
  )
}

function LeadsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Leads</h1>
      <LeadsTable />
    </div>
  )
}

function ClientsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Clients</h1>
      <ClientGrid />
    </div>
  )
}

const TABS: { key: TabType; label: string; color: string; activeClass: string }[] = [
  { key: 'all',      label: 'All',       color: 'bg-zinc-400',   activeClass: 'border-zinc-800 text-zinc-900' },
  { key: 'retainer', label: 'Retainers', color: 'bg-teal-400',   activeClass: 'border-teal-500 text-teal-700' },
  { key: 'package',  label: 'Packages',  color: 'bg-violet-400', activeClass: 'border-violet-500 text-violet-700' },
  { key: 'gig',      label: 'Gigs',      color: 'bg-zinc-300',   activeClass: 'border-zinc-500 text-zinc-700' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',     label: 'Newest' },
  { value: 'oldest',     label: 'Oldest' },
  { value: 'name',       label: 'Name (A–Z)' },
  { value: 'price_desc', label: 'Price (high → low)' },
  { value: 'price_asc',  label: 'Price (low → high)' },
  { value: 'due_date',   label: 'Due date' },
]

function ProjectsPage() {
  const { services } = useServices()
  const { projects } = useProjects()
  const [searchParams, setSearchParams] = useSearchParams()

  // Hydrate filters from URL (fall back to defaults)
  const activeTab     = (searchParams.get('tab') as TabType | null) ?? 'all'
  const serviceFilter = searchParams.get('service') ?? 'all'
  const groupBy       = (searchParams.get('group') as GroupBy | null) ?? 'type'
  const showCompleted = searchParams.get('completed') === '1'
  const search        = searchParams.get('q') ?? ''
  const sortKey       = (searchParams.get('sort') as SortKey | null) ?? 'newest'

  function updateParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams)
    if (value === defaultValue) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }
  const setActiveTab     = (t: TabType)  => updateParam('tab', t, 'all')
  const setServiceFilter = (s: string)   => updateParam('service', s, 'all')
  const setGroupBy       = (g: GroupBy)  => updateParam('group', g, 'type')
  const setSearch        = (q: string)   => updateParam('q', q, '')
  const setSort          = (s: SortKey)  => updateParam('sort', s, 'newest')
  const setShowCompleted = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(showCompleted) : v
    updateParam('completed', next ? '1' : '0', '0')
  }

  const [formOpen, setFormOpen]       = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  // Tab counts + completed count derived directly from the hook data — no
  // child-to-parent callback plumbing needed. Respects current search +
  // service filter so counts stay meaningful.
  const visibleForCounts = projects.filter(p => {
    if (serviceFilter !== 'all' && p.service_type !== serviceFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !(p.clients?.client_name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
  const completedCount = visibleForCounts.filter(p => p.project_type === 'gig' && p.status === 'done').length
  const countablePool = showCompleted
    ? visibleForCounts
    : visibleForCounts.filter(p => !(p.project_type === 'gig' && p.status === 'done'))
  const tabCounts = {
    all:      countablePool.length,
    retainer: countablePool.filter(p => p.project_type === 'retainer').length,
    package:  countablePool.filter(p => p.project_type === 'package').length,
    gig:      countablePool.filter(p => p.project_type === 'gig').length,
  }

  return (
    <div className="space-y-4">
      {/* Title row — wraps gracefully on narrow screens */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 shrink-0">Projects</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-8 pl-8 w-44 text-xs"
            />
          </div>

          {/* Sort */}
          <Select value={sortKey} onValueChange={v => v && setSort(v as SortKey)}>
            <SelectTrigger className="w-36 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Group by */}
          <div className="flex items-center rounded-md border border-zinc-200 overflow-hidden text-xs">
            <button onClick={() => setGroupBy('type')}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 transition-colors', groupBy === 'type' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50')}>
              <Layers className="w-3 h-3" /> Type
            </button>
            <button onClick={() => setGroupBy('client')}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 transition-colors border-l border-zinc-200', groupBy === 'client' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50')}>
              <Users className="w-3 h-3" /> Client
            </button>
          </div>

          {/* Show completed */}
          {completedCount > 0 && (
            <button onClick={() => setShowCompleted(v => !v)}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors',
                showCompleted ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50')}>
              <CheckCheck className="w-3 h-3" />
              Completed
              <span className={cn('px-1 rounded-full', showCompleted ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500')}>
                {completedCount}
              </span>
            </button>
          )}

          {/* Service filter */}
          <Select value={serviceFilter} onValueChange={v => v && setServiceFilter(v)}>
            <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" onClick={() => { setEditProject(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Add Project
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-200 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === tab.key ? tab.activeClass : 'border-transparent text-zinc-400 hover:text-zinc-600')}>
            {tab.key !== 'all' && <span className={cn('w-2 h-2 rounded-full shrink-0', tab.color)} />}
            {tab.label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-normal',
              activeTab === tab.key ? 'bg-zinc-100 text-zinc-600' : 'text-zinc-400')}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <ProjectsList
        activeTab={activeTab}         setActiveTab={setActiveTab}
        serviceFilter={serviceFilter} setServiceFilter={setServiceFilter}
        groupBy={groupBy}             setGroupBy={setGroupBy}
        showCompleted={showCompleted} setShowCompleted={setShowCompleted}
        search={search}
        sortKey={sortKey}
        formOpen={formOpen}           setFormOpen={setFormOpen}
        editProject={editProject}     setEditProject={setEditProject}
      />
    </div>
  )
}

function RevenuePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Revenue</h1>
      <RevenueTable />
    </div>
  )
}

function SettingsPageWrapper() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Settings</h1>
      <SettingsPage />
    </div>
  )
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientProfilePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/settings" element={<SettingsPageWrapper />} />
      </Routes>
    </AppShell>
  )
}
