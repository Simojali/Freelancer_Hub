import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  notes: '',
}

export default function ClientFormModal({ open, onClose, onSave, client }: Props) {
  const [form, setForm] = useState<Partial<Client>>(empty)

  useEffect(() => {
    setForm(client ?? empty)
  }, [client, open])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'New Client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Client Name *</label>
            <Input value={form.client_name ?? ''} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Leigh Brown" />
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
