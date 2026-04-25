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
import { Plus, Layers, Users, CheckCheck, Search, ArrowUpDown, AlertTriangle, Wallet } from 'lucide-react'
import DateRangePicker from '@/components/shared/DateRangePicker'
import type { Project } from '@/lib/types'
import { isGigUnpaid } from '@/lib/types'

export type SortKey = 'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'due_date' | 'name'
export type DateRange = 'all' | 'today' | 'week' | 'month' | 'last_month' | 'last_3_months' | 'year' | 'custom'

/** Resolve a preset DateRange to [from, to] (inclusive, YYYY-MM-DD). */
export function rangeBounds(preset: DateRange, customFrom?: string, customTo?: string): { from?: string; to?: string } {
  if (preset === 'all') return {}
  if (preset === 'custom') return { from: customFrom || undefined, to: customTo || undefined }
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'week': {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      return { from: fmt(start), to: today }
    }
    case 'month':
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
    case 'last_month':
      return {
        from: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to:   fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    case 'last_3_months':
      return { from: fmt(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())), to: today }
    case 'year':
      return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: today }
  }
}

function DashboardPage() {
  // Title + Quick Log button are rendered inside DashboardView so the button
  // can sit beside the title without prop-drilling state up here.
  return <DashboardView />
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
  const dateRange     = (searchParams.get('dateRange') as DateRange | null) ?? 'all'
  const customFrom    = searchParams.get('from') ?? ''
  const customTo      = searchParams.get('to') ?? ''
  const overdueOnly   = searchParams.get('overdue') === '1'
  const unpaidOnly    = searchParams.get('unpaid') === '1'

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
  // When a preset is picked, write both the range marker AND the computed
  // from/to bounds so the inputs stay in sync.
  const setDateRange = (r: DateRange) => {
    const next = new URLSearchParams(searchParams)
    if (r === 'all') {
      next.delete('dateRange'); next.delete('from'); next.delete('to')
    } else if (r === 'custom') {
      next.set('dateRange', 'custom')
      // leave from/to as-is
    } else {
      const { from, to } = rangeBounds(r)
      next.set('dateRange', r)
      if (from) next.set('from', from); else next.delete('from')
      if (to)   next.set('to', to);     else next.delete('to')
    }
    setSearchParams(next, { replace: true })
  }
  // Editing a date input directly flips the range to 'custom' and saves the value.
  const setCustomFrom = (d: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('dateRange', 'custom')
    if (d) next.set('from', d); else next.delete('from')
    setSearchParams(next, { replace: true })
  }
  const setCustomTo = (d: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('dateRange', 'custom')
    if (d) next.set('to', d); else next.delete('to')
    setSearchParams(next, { replace: true })
  }
  const setShowCompleted = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(showCompleted) : v
    updateParam('completed', next ? '1' : '0', '0')
  }
  const setOverdueOnly   = (v: boolean) => updateParam('overdue', v ? '1' : '0', '0')
  const setUnpaidOnly    = (v: boolean) => updateParam('unpaid',  v ? '1' : '0', '0')

  // Resolved date bounds applied to the filter
  const { from: dateFrom, to: dateTo } = rangeBounds(dateRange, customFrom, customTo)

  const [formOpen, setFormOpen]       = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  // Tab counts + completed count derived directly from the hook data — no
  // child-to-parent callback plumbing needed. Respects current search +
  // service + date filters so counts stay meaningful.
  const todayStr = new Date().toISOString().split('T')[0]
  const visibleForCounts = projects.filter(p => {
    if (serviceFilter !== 'all' && p.service_type !== serviceFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !(p.clients?.client_name ?? '').toLowerCase().includes(q)) return false
    }
    if (dateFrom && p.created_at.slice(0, 10) < dateFrom) return false
    if (dateTo   && p.created_at.slice(0, 10) > dateTo)   return false
    if (overdueOnly) {
      if (p.project_type !== 'gig') return false
      if (!p.due_date || p.due_date >= todayStr || p.status === 'done') return false
    }
    if (unpaidOnly && !isGigUnpaid(p)) return false
    return true
  })
  const completedCount = visibleForCounts.filter(p => p.project_type === 'gig' && p.status === 'done').length
  // Count unpaid gigs across the *unfiltered-by-unpaid* pool so the badge
  // still reflects real totals even while the user is toggling it on/off.
  const unpaidCount = projects.filter(isGigUnpaid).length
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

          {/* Date range — opens a popover with presets + custom range */}
          <DateRangePicker
            dateRange={dateRange}
            from={dateFrom}
            to={dateTo}
            onPreset={setDateRange}
            onFromChange={setCustomFrom}
            onToChange={setCustomTo}
          />

          {/* Overdue pill — only meaningful when gigs are in view */}
          {(activeTab === 'all' || activeTab === 'gig') && (
            <button
              type="button"
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors',
                overdueOnly
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50')}
            >
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </button>
          )}

          {/* Unpaid pill — only meaningful when gigs are in view; auto-hides when nothing unpaid */}
          {(activeTab === 'all' || activeTab === 'gig') && unpaidCount > 0 && (
            <button
              type="button"
              onClick={() => setUnpaidOnly(!unpaidOnly)}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors',
                unpaidOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50')}
            >
              <Wallet className="w-3 h-3" />
              Unpaid
              <span className={cn('px-1 rounded-full text-[10px]', unpaidOnly ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700')}>
                {unpaidCount}
              </span>
            </button>
          )}

          {/* Group by */}
          <div className="flex items-center rounded-md border border-zinc-200 overflow-hidden text-xs">
            <button type="button" onClick={() => setGroupBy('type')}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 transition-colors', groupBy === 'type' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50')}>
              <Layers className="w-3 h-3" /> Type
            </button>
            <button type="button" onClick={() => setGroupBy('client')}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 transition-colors border-l border-zinc-200', groupBy === 'client' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50')}>
              <Users className="w-3 h-3" /> Client
            </button>
          </div>

          {/* Show completed */}
          {completedCount > 0 && (
            <button type="button" onClick={() => setShowCompleted(v => !v)}
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
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
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
        dateFrom={dateFrom}
        dateTo={dateTo}
        overdueOnly={overdueOnly}
        unpaidOnly={unpaidOnly}
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
