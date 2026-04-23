import type { Client } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ExternalLink, Mail } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

export interface ClientStats {
  totalPaid: number
  owed: number
  activeProjects: number
  totalProjects: number
}

interface Props {
  client: Client
  stats?: ClientStats
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

export default function ClientCard({ client, stats, onEdit, onDelete, onView }: Props) {
  const { currency } = useSettings()

  // Stop card-level navigation when the user clicks an action button or a link inside the card.
  function stop(e: React.MouseEvent) { e.stopPropagation() }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView() } }}
      className="border border-zinc-200 shadow-none hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1"
    >
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 truncate">{client.client_name}</div>
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                onClick={stop}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mt-0.5 truncate"
              >
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
            )}
          </div>
          <div className="flex gap-1 shrink-0" onClick={stop}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-100 mb-3">
            <Stat label="Projects" value={`${stats.activeProjects}/${stats.totalProjects}`} hint="active / total" />
            <Stat label="Paid" value={formatCurrency(stats.totalPaid, currency)} tone="positive" />
            <Stat label="Owed" value={formatCurrency(stats.owed, currency)} tone={stats.owed > 0 ? 'warning' : 'muted'} />
          </div>
        )}

        {/* Channels + notes */}
        <div className="flex items-center gap-3 text-xs text-zinc-400" onClick={stop}>
          {client.channel_link && (
            <a href={client.channel_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-600 transition-colors">
              Channel 1 <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {client.channel_link_2 && (
            <a href={client.channel_link_2} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-600 transition-colors">
              Channel 2 <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {client.notes && (
          <div className="mt-2 text-xs text-zinc-400 italic line-clamp-2">{client.notes}</div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'positive' | 'warning' | 'muted' }) {
  const valueClass =
    tone === 'positive' ? 'text-emerald-600' :
    tone === 'warning'  ? 'text-amber-600'   :
    tone === 'muted'    ? 'text-zinc-400'    :
                          'text-zinc-900'
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold truncate ${valueClass}`} title={hint ?? value}>{value}</div>
    </div>
  )
}
