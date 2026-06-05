import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useUpcomingDeliveries, type UpcomingDelivery } from '@/hooks/useUpcomingDeliveries'
import MarkDeliveredDialog from '@/components/projects/MarkDeliveredDialog'

interface Props {
  /** Maximum rows shown before collapsing into "+ N more". Defaults to 6 to fit
   *  comfortably next to Recent Payments / Latest Projects without scrolling. */
  limit?: number
}

/**
 * Dashboard card listing every planned delivery across every retainer + package,
 * oldest-first so the longest-waiting work bubbles up.
 *
 * Each row's checkbox opens the same MarkDeliveredDialog used inside DeliveryList,
 * so finishing work from the dashboard works exactly like finishing it inside the
 * project view. Clicking the row body (anywhere but the checkbox) opens the
 * project for editing / reordering / context.
 */
export default function UpNextCard({ limit = 6 }: Props) {
  const navigate = useNavigate()
  const { upcoming, markDone } = useUpcomingDeliveries()
  const [markingDone, setMarkingDone] = useState<UpcomingDelivery | null>(null)

  const visible = upcoming.slice(0, limit)
  const overflow = Math.max(0, upcoming.length - visible.length)

  function openProject(row: UpcomingDelivery) {
    const p = row.projects
    if (!p) return
    if (p.client_id) navigate(`/clients/${p.client_id}`)
    else navigate(`/projects?q=${encodeURIComponent(p.name)}`)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">
          Up Next{upcoming.length > 0 && ` · ${upcoming.length}`}
        </h3>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing queued. Plan a delivery on any retainer or package to see it here.
        </p>
      ) : (
        <div className="space-y-1 -mx-2">
          {visible.map(d => {
            const p = d.projects
            const clientName = p?.clients?.client_name ?? 'No client'
            const projectName = p?.name ?? 'Unknown project'
            const typeColor = p?.project_type === 'retainer' ? 'bg-teal-400' : 'bg-violet-400'
            return (
              <div
                key={d.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/40 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => setMarkingDone(d)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border border-border hover:border-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center"
                  title="Mark delivered"
                  aria-label="Mark delivered"
                />
                <button
                  type="button"
                  onClick={() => openProject(d)}
                  className="min-w-0 flex-1 text-left"
                  title="Open project"
                >
                  <div className="text-sm text-foreground truncate">
                    {d.description || <span className="italic text-muted-foreground">Untitled</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeColor}`} />
                    <span className="truncate">{clientName} · {projectName}</span>
                  </div>
                </button>
              </div>
            )
          })}

          {overflow > 0 && (
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 mt-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              + {overflow} more <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <MarkDeliveredDialog
        delivery={markingDone}
        onCancel={() => setMarkingDone(null)}
        onConfirm={async patch => {
          if (!markingDone) return
          await markDone(markingDone.id, patch)
          setMarkingDone(null)
        }}
      />
    </div>
  )
}
