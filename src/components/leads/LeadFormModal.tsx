import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Lead } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Lead>) => void
  lead?: Lead | null
}

const empty: Partial<Lead> = {
  channel_name: '',
  channel_link: '',
  subs_k: undefined,
  uploads_per_month: undefined,
  service_type: 'thumbnail',
  ig_link: '',
  linkedin: '',
  x_link: '',
  email: '',
  email_2: '',
  notes: '',
}

export default function LeadFormModal({ open, onClose, onSave, lead }: Props) {
  const [form, setForm] = useState<Partial<Lead>>(empty)

  useEffect(() => {
    setForm(lead ?? empty)
  }, [lead, open])

  function set(field: string, value: string | number | null | undefined) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'New Lead'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Channel Name *</label>
            <Input value={form.channel_name ?? ''} onChange={e => set('channel_name', e.target.value)} placeholder="e.g. Sweaty Startup" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Service</label>
            <Select value={form.service_type ?? 'thumbnail'} onValueChange={v => set('service_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thumbnail">Thumbnail</SelectItem>
                <SelectItem value="video_editing">Video Editing</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Subs (K)</label>
              <Input type="number" value={form.subs_k ?? ''} onChange={e => set('subs_k', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 45.5" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Uploads / mo</label>
              <Input type="number" value={form.uploads_per_month ?? ''} onChange={e => set('uploads_per_month', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 8" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">YouTube Link</label>
            <Input value={form.channel_link ?? ''} onChange={e => set('channel_link', e.target.value)} placeholder="https://youtube.com/@..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Email</label>
            <Input value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contact@..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Email #2</label>
            <Input value={form.email_2 ?? ''} onChange={e => set('email_2', e.target.value)} placeholder="alt@..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Instagram</label>
            <Input value={form.ig_link ?? ''} onChange={e => set('ig_link', e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">LinkedIn</label>
            <Input value={form.linkedin ?? ''} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">X (Twitter)</label>
            <Input value={form.x_link ?? ''} onChange={e => set('x_link', e.target.value)} placeholder="https://x.com/..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.channel_name?.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
