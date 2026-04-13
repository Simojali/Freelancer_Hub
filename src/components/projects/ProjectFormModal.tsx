import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Project, Client, ProjectType } from '@/lib/types'
import { useClients } from '@/hooks/useClients'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Project>) => void
  project?: Project | null
}

const emptyGig: Partial<Project> = {
  name: '',
  project_type: 'gig',
  service_type: 'thumbnail',
  status: 'pending',
  price: undefined,
  notes: '',
  client_id: undefined,
}

const emptyPackage: Partial<Project> = {
  name: '',
  project_type: 'package',
  service_type: 'thumbnail',
  status: null,
  price: undefined,
  total_units: undefined,
  notes: '',
  client_id: undefined,
}

export default function ProjectFormModal({ open, onClose, onSave, project }: Props) {
  const [form, setForm] = useState<Partial<Project>>(emptyGig)
  const { clients } = useClients()

  useEffect(() => {
    if (project) {
      setForm(project)
    } else {
      setForm(emptyGig)
    }
  }, [project, open])

  function set(field: string, value: string | number | null | undefined) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleTypeChange(type: ProjectType) {
    setForm(f => ({
      ...(type === 'package' ? emptyPackage : emptyGig),
      name: f.name,
      client_id: f.client_id,
      service_type: f.service_type,
      price: f.price,
      notes: f.notes,
      project_type: type,
    }))
  }

  function handleSave() {
    const payload = { ...form }
    if (!payload.client_id) delete payload.client_id
    if (payload.project_type === 'package') {
      delete payload.status
    }
    onSave(payload)
    onClose()
  }

  const isPackage = form.project_type === 'package'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Type toggle */}
          {!project && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Type</label>
              <div className="flex rounded-md border border-zinc-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleTypeChange('gig')}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${!isPackage ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Gig
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('package')}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${isPackage ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Package
                </button>
              </div>
            </div>
          )}

          {/* Common fields */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Name *</label>
            <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder={isPackage ? 'e.g. 12 Thumbnails' : 'e.g. Channel banner'} />
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
            <label className="text-xs text-zinc-500 mb-1 block">Price ($)</label>
            <Input type="number" value={form.price ?? ''} onChange={e => set('price', e.target.value ? Number(e.target.value) : undefined)} placeholder="150" />
          </div>

          {/* Package-only */}
          {isPackage && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Total Units *</label>
              <Input type="number" value={form.total_units ?? ''} onChange={e => set('total_units', e.target.value ? Number(e.target.value) : undefined)} placeholder="12" />
            </div>
          )}

          {/* Gig-only */}
          {!isPackage && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Status</label>
              <Select value={form.status ?? 'pending'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!form.name?.trim() || (isPackage && !form.total_units)}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
