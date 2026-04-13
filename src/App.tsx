import { Routes, Route } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DashboardView from '@/components/dashboard/DashboardView'
import LeadsTable from '@/components/leads/LeadsTable'
import ClientGrid from '@/components/clients/ClientGrid'
import ProjectsList from '@/components/projects/ProjectsList'
import RevenueTable from '@/components/revenue/RevenueTable'

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

function ProjectsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Projects</h1>
      <ProjectsList />
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

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
      </Routes>
    </AppShell>
  )
}
