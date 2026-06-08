import { useState } from 'react'
import type { Revenue } from '@/lib/types'
import { useRevenue } from '@/hooks/useRevenue'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, DollarSign, Package } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import ServiceBadge from '@/components/shared/ServiceBadge'
import PaymentStatusBadge from './PaymentStatusBadge'
import RevenueFormModal from './RevenueFormModal'
import RevenueDeliveriesModal from './RevenueDeliveriesModal'
import MonthlyChart from './MonthlyChart'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Money } from '@/components/ui/money'

export default function RevenueTable() {
  const { revenue, isLoading, createRevenue, updateRevenue, deleteRevenue } = useRevenue()
  const { currency } = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Revenue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Revenue | null>(null)
  const [deliveriesFor, setDeliveriesFor] = useState<Revenue | null>(null)

  const totalPaid = revenue.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = revenue.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  async function handleSave(data: Partial<Revenue>): Promise<boolean> {
    return editItem ? updateRevenue(editItem.id, data) : createRevenue(data)
  }

  return (
    <div className="space-y-5">
      <MonthlyChart revenue={revenue} />

      {/* Summary row */}
      <div className="flex items-center gap-6 text-sm">
        <div><span className="text-muted-foreground">Total Paid: </span><span className="font-semibold text-foreground">{<Money>{formatCurrency(totalPaid, currency)}</Money>}</span></div>
        <div><span className="text-muted-foreground">Pending: </span><span className="font-semibold text-amber-600">{<Money>{formatCurrency(totalPending, currency)}</Money>}</span></div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Log Payment
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-3 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-3 py-3 font-medium text-muted-foreground">Project</th>
              <th className="text-left px-3 py-3 font-medium text-muted-foreground">Service</th>
              <th className="text-left px-3 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-right px-3 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-3 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && revenue.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={DollarSign}
                    title="No payments logged yet"
                    description="Log a payment whenever a client pays you to keep your revenue history up to date."
                    action={{ label: 'Log your first payment', onClick: () => { setEditItem(null); setFormOpen(true) }, icon: Plus }}
                  />
                </td>
              </tr>
            )}
            {revenue.map(item => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(item.payment_date)}</td>
                <td className="px-3 py-2.5 text-foreground">{item.clients?.client_name ?? '—'}</td>
                <td className="px-3 py-2.5">
                  {item.projects?.name
                    ? <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted/40 text-muted-foreground border-border">{item.projects.name}</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2.5"><ServiceBadge slug={item.service_type} /></td>
                <td className="px-3 py-2.5 text-muted-foreground max-w-[200px] truncate">{item.description ?? '—'}</td>
                <td className="px-3 py-2.5 text-right font-medium text-foreground">{<Money>{formatCurrency(Number(item.amount), currency)}</Money>}</td>
                <td className="px-3 py-2.5"><PaymentStatusBadge status={item.status} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    {(item.linked_delivery_count ?? 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-teal-600 hover:text-teal-700"
                        onClick={() => setDeliveriesFor(item)}
                        title="View deliveries billed on this payment"
                      >
                        <Package className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">{item.linked_delivery_count}</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditItem(item); setFormOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RevenueFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} revenue={editItem} />

      <RevenueDeliveriesModal
        open={!!deliveriesFor}
        onClose={() => setDeliveriesFor(null)}
        revenue={deliveriesFor}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this payment record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) deleteRevenue(deleteTarget.id); setDeleteTarget(null) }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
