import type { Client } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { serviceLabel } from '@/lib/utils'

const SERVICE_COLORS: Record<string, string> = {
  thumbnail: 'bg-blue-50 text-blue-700 border-blue-200',
  video_editing: 'bg-purple-50 text-purple-700 border-purple-200',
  both: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function creditColor(left: number, total: number): string {
  if (total === 0) return 'text-zinc-400'
  const ratio = left / total
  if (ratio > 0.3) return 'text-emerald-600'
  if (ratio > 0) return 'text-amber-500'
  return 'text-red-500'
}

interface Props {
  client: Client
  onEdit: () => void
  onDelete: () => void
}

export default function ClientCard({ client, onEdit, onDelete }: Props) {
  const progress = client.package_total > 0 ? Math.round((client.credit_left / client.package_total) * 100) : 0

  return (
    <Card className="border border-zinc-200 shadow-none hover:border-zinc-300 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-zinc-900">{client.client_name}</div>
            {client.email && <div className="text-xs text-zinc-400 mt-0.5">{client.email}</div>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SERVICE_COLORS[client.service_type]}`}>
          {serviceLabel(client.service_type)}
        </span>

        {client.package_name && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-zinc-500">{client.package_name}</span>
              <span className={`text-sm font-semibold ${creditColor(client.credit_left, client.package_total)}`}>
                {client.credit_left} / {client.package_total} credits
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
          <span>{client.purchases} purchase{client.purchases !== 1 ? 's' : ''}</span>
          {client.channel_link && (
            <a href={client.channel_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-600 transition-colors">
              Channel <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {client.notes && (
          <div className="mt-2 text-xs text-zinc-400 italic">{client.notes}</div>
        )}
      </CardContent>
    </Card>
  )
}
