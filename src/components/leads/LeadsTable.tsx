import { useState } from 'react'
import type { Lead } from '@/lib/types'
import { useLeads } from '@/hooks/useLeads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react'
import LeadFormModal from './LeadFormModal'
import LeadDeleteDialog from './LeadDeleteDialog'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useServices } from '@/hooks/useServices'

const PIPELINE_COLS: { field: keyof Lead; label: string }[] = [
  { field: 'thumbnail_sample', label: 'Sample' },
  { field: 'before_after_made', label: 'B/A' },
  { field: 'followed_engaged', label: 'Followed' },
  { field: 'contacted_ig', label: 'IG' },
  { field: 'followup_ig', label: 'IG FU' },
  { field: 'contacted_email', label: 'Email' },
  { field: 'followup_email', label: 'Email FU' },
  { field: 'seen', label: 'Seen' },
  { field: 'responded', label: 'Replied' },
  { field: 'closed', label: 'Closed' },
]

export default function LeadsTable() {
  const [service, setService] = useState('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)

  const { leads, isLoading, toggleField, createLead, updateLead, deleteLead: doDelete } = useLeads(service, search)
  const { services } = useServices()

  function handleSave(data: Partial<Lead>) {
    if (editLead) updateLead(editLead.id, data)
    else createLead(data)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search channels..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56"
        />
        <Select value={service} onValueChange={(v) => setService(v ?? 'all')}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map(s => (
              <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditLead(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-4 py-3 font-medium text-zinc-500 whitespace-nowrap w-48">Channel</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Service</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Subs</th>
              {PIPELINE_COLS.map(c => (
                <th key={c.field} className="px-2 py-3 font-medium text-zinc-500 whitespace-nowrap text-center">{c.label}</th>
              ))}
              <th className="px-3 py-3 font-medium text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={14} className="text-center py-8 text-zinc-400">Loading...</td></tr>
            )}
            {!isLoading && leads.length === 0 && (
              <tr><td colSpan={14} className="text-center py-8 text-zinc-400">No leads found</td></tr>
            )}
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-900 truncate max-w-[160px]" title={lead.channel_name}>{lead.channel_name}</span>
                    {lead.channel_link && (
                      <a href={lead.channel_link} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {lead.email && <div className="text-xs text-zinc-400 truncate max-w-[160px]">{lead.email}</div>}
                </td>
                <td className="px-3 py-2.5">
                  <ServiceBadge slug={lead.service_type} />
                </td>
                <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">
                  {lead.subs_k != null ? `${lead.subs_k}K` : '—'}
                </td>
                {PIPELINE_COLS.map(c => (
                  <td key={c.field} className="px-2 py-2.5 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={lead[c.field] as boolean}
                        onCheckedChange={() => toggleField(lead.id, c.field, lead[c.field] as boolean)}
                        className="data-[state=checked]:bg-zinc-800 data-[state=checked]:border-zinc-800"
                      />
                    </div>
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditLead(lead); setFormOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteLead(lead)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-zinc-400">{leads.length} lead{leads.length !== 1 ? 's' : ''}</div>

      <LeadFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        lead={editLead}
      />
      <LeadDeleteDialog
        open={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={() => { if (deleteLead) doDelete(deleteLead.id); setDeleteLead(null) }}
        name={deleteLead?.channel_name ?? ''}
      />
    </div>
  )
}
