import type { DashboardData, GigStatus } from '@/lib/types'
import GigStatusBadge from '@/components/projects/GigStatusBadge'
import { useNavigate } from 'react-router-dom'

interface Props {
  recentProjects: DashboardData['recentProjects']
}

export default function LatestProjectsCard({ recentProjects }: Props) {
  const navigate = useNavigate()

  // Click → client profile when there's a client; otherwise fall back to the
  // projects page filtered by name.
  function openProject(p: DashboardData['recentProjects'][number]) {
    if (p.client_id) navigate(`/clients/${p.client_id}`)
    else navigate(`/projects?q=${encodeURIComponent(p.name)}`)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">Latest Projects</h3>
      {recentProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet</p>
      ) : (
        <div className="space-y-1 -mx-2">
          {recentProjects.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => openProject(p)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <div className="text-sm text-foreground font-medium truncate">{p.name}</div>
                {p.clients?.client_name && <div className="text-xs text-muted-foreground">{p.clients.client_name}</div>}
              </div>
              <div className="shrink-0">
                {p.project_type === 'package'
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">Package</span>
                  : p.project_type === 'retainer'
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">Retainer</span>
                  : <GigStatusBadge status={p.status as GigStatus} />
                }
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
