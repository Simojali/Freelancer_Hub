import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Client>) => void
  client?: Client | null
}

const empty: Partial<Client> = {
  client_name: '',
  channel_link: '',
  channel_link_2: '',
  email: '',
  service_type: 'thumbnail',
  package_name: '',
  package_price: undefined,
  package_units: undefined,
  purchases: 0,
  credit_left: 0,
  package_total: 0,
  notes: '',
}

export default function ClientFormModal({ open, onClose, onSave, client }: Props) {
  const [form, setForm] = useState<Partial<Client>>(empty)

  useEffect(() => {
    setForm(client ?? empty)
  }, [client, open])

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
          <DialogTitle>{client ? 'Edit Client' : 'New Client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Client Name *</label>
            <Input value={form.client_name ?? ''} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Leigh Brown" />
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
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Email</label>
            <Input value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="client@email.com" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Channel Link</label>
            <Input value={form.channel_link ?? ''} onChange={e => set('channel_link', e.target.value)} placeholder="https://youtube.com/@..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Channel Link #2</label>
            <Input value={form.channel_link_2 ?? ''} onChange={e => set('channel_link_2', e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Package Name</label>
            <Input value={form.package_name ?? ''} onChange={e => set('package_name', e.target.value)} placeholder="e.g. 150$ for 12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Package Price ($)</label>
              <Input type="number" value={form.package_price ?? ''} onChange={e => set('package_price', e.target.value ? Number(e.target.value) : undefined)} placeholder="150" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Package Units</label>
              <Input type="number" value={form.package_units ?? ''} onChange={e => set('package_units', e.target.value ? Number(e.target.value) : undefined)} placeholder="12" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Purchases</label>
              <Input type="number" value={form.purchases ?? 0} onChange={e => set('purchases', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Credits Left</label>
              <Input type="number" value={form.credit_left ?? 0} onChange={e => set('credit_left', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Package Total</label>
              <Input type="number" value={form.package_total ?? 0} onChange={e => set('package_total', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.client_name?.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
