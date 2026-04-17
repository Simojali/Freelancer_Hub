import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DashboardView from '@/components/dashboard/DashboardView'
import LeadsTable from '@/components/leads/LeadsTable'
import ClientGrid from '@/components/clients/ClientGrid'
import ClientProfilePage from '@/components/clients/ClientProfilePage'
import ProjectsList, { type TabType, type GroupBy } from '@/components/projects/ProjectsList'
import RevenueTable from '@/components/revenue/RevenueTable'
import SettingsPage from '@/components/settings/SettingsPage'
import { useServices } from '@/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Layers, Users, CheckCheck } from 'lucide-react'
import type { Project } from '@/lib/types'

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

function ProjectsPage() {
  const { services } = useServices()
  const [activeTab, setActiveTab]       = useState<TabType>('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [groupBy, setGroupBy]           = useState<GroupBy>('type')
  const [showCompleted, setShowCompleted] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [formOpen, setFormOpen]         = useState(false)
  const [editProject, setEditProject]   = useState<Project | null>(null)

  // Tab counts come from ProjectsList via onCompletedCount; tabs themselves
  // are rendered here so we need the counts too — ProjectsList passes them back.
  const [tabCounts, setTabCounts] = useState({ all: 0, retainer: 0, package: 0, gig: 0 })

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 shrink-0">Projects</h1>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Group by toggle */}
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

          {/* Show completed toggle */}
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
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
      <div className="flex items-center border-b border-zinc-200">
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
        formOpen={formOpen}           setFormOpen={setFormOpen}
        editProject={editProject}     setEditProject={setEditProject}
        onCompletedCount={setCompletedCount}
        onTabCounts={setTabCounts}
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
