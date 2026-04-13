import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Revenue, Client } from '@/lib/types'
import { useClients } from '@/hooks/useClients'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Revenue>) => void
  revenue?: Revenue | null
}

const today = new Date().toISOString().split('T')[0]

const empty: Partial<Revenue> = {
  service_type: 'thumbnail',
  amount: undefined,
  status: 'pending',
  payment_date: today,
  description: '',
  client_id: undefined,
}

export default function RevenueFormModal({ open, onClose, onSave, revenue }: Props) {
  const [form, setForm] = useState<Partial<Revenue>>(empty)
  const { clients } = useClients()

  useEffect(() => {
    setForm(revenue ?? empty)
  }, [revenue, open])

  function set(field: string, value: string | number | null | undefined) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    const payload = { ...form }
    if (!payload.client_id) delete payload.client_id
    onSave(payload)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{revenue ? 'Edit Payment' : 'Log Payment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Amount ($) *</label>
            <Input type="number" value={form.amount ?? ''} onChange={e => set('amount', e.target.value ? Number(e.target.value) : undefined)} placeholder="150" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Client</label>
            <Select value={form.client_id ?? 'none'} onValueChange={v => set('client_id', v === 'none' ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c: Client) => (
                  <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <label className="text-xs text-zinc-500 mb-1 block">Status</label>
            <Select value={form.status ?? 'pending'} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Date</label>
            <Input type="date" value={form.payment_date ?? today} onChange={e => set('payment_date', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Description</label>
            <Input value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="e.g. April thumbnails x5" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.amount}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
