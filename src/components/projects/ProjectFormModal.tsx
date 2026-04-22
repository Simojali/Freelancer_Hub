import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Project, Client, ProjectType, PaymentStatus } from '@/lib/types'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'

export interface PaymentEntry {
  amount: number
  status: PaymentStatus
  payment_date: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Project>, payment?: PaymentEntry) => Promise<boolean | void>
  project?: Project | null
}

const today = new Date().toISOString().split('T')[0]

const emptyGig: Partial<Project> = {
  name: '',
  project_type: 'gig',
  service_type: '',
  status: 'pending',
  price: undefined,
  notes: '',
  client_id: undefined,
  due_date: null,
}

const emptyPackage: Partial<Project> = {
  name: '',
  project_type: 'package',
  service_type: '',
  status: null,
  price: undefined,
  total_units: undefined,
  notes: '',
  client_id: undefined,
}

const emptyRetainer: Partial<Project> = {
  name: '',
  project_type: 'retainer',
  service_type: '',
  status: null,
  price: undefined,
  unit_price: undefined,
  notes: '',
  client_id: undefined,
}

export default function ProjectFormModal({ open, onClose, onSave, project }: Props) {
  const [form, setForm] = useState<Partial<Project>>(emptyGig)
  const [logPayment, setLogPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [paymentDate, setPaymentDate] = useState(today)
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const { clients } = useClients()
  const { services } = useServices()

  // Default to first service when creating a new project
  useEffect(() => {
    if (!project && !form.service_type && services.length > 0) {
      setForm(f => ({ ...f, service_type: services[0].slug }))
    }
  }, [services, project])

  useEffect(() => {
    if (project) {
      setForm(project)
    } else {
      setForm(emptyGig)
    }
    setLogPayment(false)
    setPaymentStatus('pending')
    setPaymentDate(today)
    setPaymentAmount(undefined)
    setSaving(false)
  }, [project, open])

  // Keep payment amount in sync with price when user hasn't touched it yet
  useEffect(() => {
    if (logPayment && paymentAmount === undefined && form.price != null) {
      setPaymentAmount(form.price)
    }
  }, [form.price, logPayment])

  function set(field: string, value: string | number | null | undefined) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleTypeChange(type: ProjectType) {
    const base = type === 'package' ? emptyPackage : type === 'retainer' ? emptyRetainer : emptyGig
    setForm(f => ({
      ...base,
      name: f.name,
      client_id: f.client_id,
      service_type: f.service_type,
      price: f.price,
      notes: f.notes,
      project_type: type,
    }))
  }

  function handleTogglePayment() {
    const next = !logPayment
    setLogPayment(next)
    if (next && paymentAmount === undefined) {
      setPaymentAmount(form.price ?? undefined)
    }
  }

  async function handleSave() {
    if (saving) return
    if (!form.name?.trim()) return
    const payload = { ...form }
    if (!payload.client_id) delete payload.client_id
    if (payload.project_type !== 'gig') delete payload.status

    const payment: PaymentEntry | undefined =
      !project && logPayment && paymentAmount
        ? { amount: paymentAmount, status: paymentStatus, payment_date: paymentDate }
        : undefined

    setSaving(true)
    const ok = await onSave(payload, payment)
    setSaving(false)
    if (ok !== false) onClose()
  }

  const isPackage = form.project_type === 'package'
  const isGig = form.project_type === 'gig'
  const isNew = !project

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Type toggle — new projects only */}
          {isNew && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Type</label>
              <div className="flex rounded-md border border-zinc-200 overflow-hidden">
                {(['gig', 'package', 'retainer'] as ProjectType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 py-1.5 text-sm font-medium transition-colors ${form.project_type === t ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
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
              <SelectTrigger>
                <SelectValue placeholder="Select client">
                  {form.client_id
                    ? (clients.find((c: Client) => c.id === form.client_id)?.client_name ?? '…')
                    : undefined}
                </SelectValue>
              </SelectTrigger>
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
            <Select value={form.service_type ?? ''} onValueChange={v => set('service_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                ))}
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

          {/* Retainer-only */}
          {form.project_type === 'retainer' && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Rate per unit *</label>
              <Input
                type="number"
                value={form.unit_price ?? ''}
                onChange={e => set('unit_price', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 200"
              />
            </div>
          )}

          {/* Gig-only */}
          {isGig && (
            <>
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
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Due Date (optional)</label>
                <Input
                  type="date"
                  value={form.due_date ?? ''}
                  onChange={e => set('due_date', e.target.value || null)}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>

          {/* Log Payment toggle — new projects only */}
          {isNew && (
            <div className="border-t border-zinc-100 pt-3 space-y-3">
              <button
                type="button"
                onClick={handleTogglePayment}
                className="flex items-center gap-2 w-full text-left"
              >
                <div className={`w-8 h-4 rounded-full transition-colors shrink-0 ${logPayment ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${logPayment ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-zinc-600">Log a payment for this project</span>
              </button>

              {logPayment && (
                <div className="space-y-3 pl-1">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Amount ($) *</label>
                    <Input
                      type="number"
                      value={paymentAmount ?? ''}
                      onChange={e => setPaymentAmount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="150"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                      <Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as PaymentStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">Date</label>
                      <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name?.trim() || (isPackage && !form.total_units) || (form.project_type === 'retainer' && !form.unit_price) || (logPayment && !paymentAmount)}
          >
            {saving ? 'Saving…' : `Save${logPayment ? ' & Log Payment' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
