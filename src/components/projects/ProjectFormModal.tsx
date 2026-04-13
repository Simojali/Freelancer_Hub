import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Project, Client } from '@/lib/types'
import { useClients } from '@/hooks/useClients'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Project>) => void
  project?: Project | null
}

const empty: Partial<Project> = {
  title: '',
  service_type: 'thumbnail',
  status: 'in_progress',
  due_date: '',
  notes: '',
  client_id: undefined,
}

export default function ProjectFormModal({ open, onClose, onSave, project }: Props) {
  const [form, setForm] = useState<Partial<Project>>(empty)
  const { clients } = useClients()

  useEffect(() => {
    setForm(project ?? empty)
  }, [project, open])

  function set(field: string, value: string | null | undefined) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    const payload = { ...form }
    if (!payload.client_id) delete payload.client_id
    if (!payload.due_date) delete payload.due_date
    onSave(payload)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Title *</label>
            <Input value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Q2 thumbnail batch" />
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
            <Select value={form.status ?? 'in_progress'} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Due Date</label>
            <Input type="date" value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title?.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
