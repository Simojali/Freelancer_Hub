import type { Client } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ExternalLink, Eye } from 'lucide-react'

interface Props {
  client: Client
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

export default function ClientCard({ client, onEdit, onDelete, onView }: Props) {
  return (
    <Card className="border border-zinc-200 shadow-none hover:border-zinc-300 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-zinc-900">{client.client_name}</div>
            {client.email && <div className="text-xs text-zinc-400 mt-0.5">{client.email}</div>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900" onClick={onView}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
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
          <div className="mt-2 text-xs text-zinc-400 italic">{client.notes}</div>
        )}
      </CardContent>
    </Card>
  )
}
