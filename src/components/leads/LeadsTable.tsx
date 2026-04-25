import { useState } from 'react'
import type { Lead } from '@/lib/types'
import { useLeads } from '@/hooks/useLeads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, Trash2, Plus, ExternalLink, Users } from 'lucide-react'
import LeadFormModal from './LeadFormModal'
import LeadDeleteDialog from './LeadDeleteDialog'
import ServiceBadge from '@/components/shared/ServiceBadge'
import { useServices } from '@/hooks/useServices'
import EmptyState from '@/components/shared/EmptyState'
import PipelineFunnel from '@/components/shared/PipelineFunnel'

// Pipeline steps shown in the Outreach section (sample already done)
const OUTREACH_COLS: { field: keyof Lead; label: string }[] = [
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

interface ChannelCellProps {
  lead: Lead
}
function ChannelCell({ lead }: ChannelCellProps) {
  return (
    <td className="px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-zinc-900 truncate max-w-[160px]" title={lead.channel_name}>
          {lead.channel_name}
        </span>
        {lead.channel_link && (
          <a href={lead.channel_link} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 shrink-0">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {lead.email && <div className="text-xs text-zinc-400 truncate max-w-[160px]">{lead.email}</div>}
    </td>
  )
}

export default function LeadsTable() {
  const [service, setService] = useState('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)

  const { leads, isLoading, toggleField, createLead, updateLead, deleteLead: doDelete } = useLeads(service, search)
  const { services } = useServices()

  const prospects = leads.filter(l => !l.thumbnail_sample)
  const outreach = leads.filter(l => l.thumbnail_sample)

  // Pipeline counts derived from the currently-loaded leads. Respects the
  // service filter so e.g. "Thumbnails" view shows the thumbnail-only funnel.
  const pipeline = {
    sample:         outreach.length,
    beforeAfter:    leads.filter(l => l.before_after_made).length,
    followed:       leads.filter(l => l.followed_engaged).length,
    contactedIg:    leads.filter(l => l.contacted_ig).length,
    contactedEmail: leads.filter(l => l.contacted_email).length,
    seen:           leads.filter(l => l.seen).length,
    responded:      leads.filter(l => l.responded).length,
    closed:         leads.filter(l => l.closed).length,
  }

  async function handleSave(data: Partial<Lead>): Promise<boolean> {
    return editLead ? updateLead(editLead.id, data) : createLead(data)
  }

  function ActionButtons({ lead }: { lead: Lead }) {
    return (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditLead(lead); setFormOpen(true) }}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteLead(lead)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {isLoading && <div className="text-center py-8 text-zinc-400 text-sm">Loading...</div>}

      {/* Outreach pipeline — visible once at least one lead has reached the sample stage */}
      {!isLoading && pipeline.sample > 0 && (
        <PipelineFunnel pipeline={pipeline} total={pipeline.sample} />
      )}

      {/* Full empty state — only when no leads at all and no filters active */}
      {!isLoading && leads.length === 0 && service === 'all' && !search && (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Add potential clients you want to reach out to. As you contact them, check off each pipeline step to track progress."
          action={{ label: 'Add your first lead', onClick: () => { setEditLead(null); setFormOpen(true) }, icon: Plus }}
          size="lg"
        />
      )}

      {/* ── Prospects ─────────────────────────────── */}
      {!isLoading && (leads.length > 0 || service !== 'all' || search) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Prospects — {prospects.length}
            </span>
            <span className="text-xs text-zinc-400">· Check "Sample" to move to Outreach</span>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 whitespace-nowrap w-48">Channel</th>
                  <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Service</th>
                  <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Subs</th>
                  <th className="px-2 py-3 font-medium text-zinc-500 whitespace-nowrap text-center">Sample</th>
                  <th className="px-3 py-3 font-medium text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-zinc-400">No prospects</td></tr>
                )}
                {prospects.map(lead => (
                  <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <ChannelCell lead={lead} />
                    <td className="px-3 py-2.5"><ServiceBadge slug={lead.service_type} /></td>
                    <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">
                      {lead.subs_k != null ? `${lead.subs_k}K` : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={lead.thumbnail_sample ?? false}
                          onCheckedChange={() => toggleField(lead.id, 'thumbnail_sample', lead.thumbnail_sample ?? false)}
                          className="data-[state=checked]:bg-zinc-800 data-[state=checked]:border-zinc-800"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><ActionButtons lead={lead} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Outreach Pipeline ─────────────────────── */}
      {!isLoading && (leads.length > 0 || service !== 'all' || search) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Outreach Pipeline — {outreach.length}
            </span>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 whitespace-nowrap w-48">Channel</th>
                  <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Service</th>
                  <th className="text-left px-3 py-3 font-medium text-zinc-500 whitespace-nowrap">Subs</th>
                  {OUTREACH_COLS.map(c => (
                    <th key={c.field} className="px-2 py-3 font-medium text-zinc-500 whitespace-nowrap text-center">{c.label}</th>
                  ))}
                  <th className="px-3 py-3 font-medium text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {outreach.length === 0 && (
                  <tr><td colSpan={3 + OUTREACH_COLS.length + 1} className="text-center py-6 text-zinc-400">No active outreach yet</td></tr>
                )}
                {outreach.map(lead => (
                  <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <ChannelCell lead={lead} />
                    <td className="px-3 py-2.5"><ServiceBadge slug={lead.service_type} /></td>
                    <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">
                      {lead.subs_k != null ? `${lead.subs_k}K` : '—'}
                    </td>
                    {OUTREACH_COLS.map(c => (
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
                    <td className="px-3 py-2.5"><ActionButtons lead={lead} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-zinc-400">{leads.length} total lead{leads.length !== 1 ? 's' : ''}</div>

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
