import { useState } from 'react'
import type { Revenue } from '@/lib/types'
import { useRevenue } from '@/hooks/useRevenue'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, serviceLabel } from '@/lib/utils'
import PaymentStatusBadge from './PaymentStatusBadge'
import RevenueFormModal from './RevenueFormModal'
import MonthlyChart from './MonthlyChart'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function RevenueTable() {
  const { revenue, isLoading, createRevenue, updateRevenue, deleteRevenue } = useRevenue()
  const { currency } = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Revenue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Revenue | null>(null)

  const totalPaid = revenue.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = revenue.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  function handleSave(data: Partial<Revenue>) {
    if (editItem) updateRevenue(editItem.id, data)
    else createRevenue(data)
  }

  return (
    <div className="space-y-5">
      <MonthlyChart revenue={revenue} />

      {/* Summary row */}
      <div className="flex items-center gap-6 text-sm">
        <div><span className="text-zinc-500">Total Paid: </span><span className="font-semibold text-zinc-900">{formatCurrency(totalPaid, currency)}</span></div>
        <div><span className="text-zinc-500">Pending: </span><span className="font-semibold text-amber-600">{formatCurrency(totalPending, currency)}</span></div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Log Payment
          </Button>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Date</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500">Client</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500">Project</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500">Service</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500">Description</th>
              <th className="text-right px-3 py-3 font-medium text-zinc-500">Amount</th>
              <th className="text-left px-3 py-3 font-medium text-zinc-500">Status</th>
              <th className="px-3 py-3 font-medium text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-8 text-zinc-400">Loading...</td></tr>
            )}
            {!isLoading && revenue.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-zinc-400">No payments logged yet</td></tr>
            )}
            {revenue.map(item => (
              <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-2.5 text-zinc-600 whitespace-nowrap">{formatDate(item.payment_date)}</td>
                <td className="px-3 py-2.5 text-zinc-700">{item.clients?.client_name ?? '—'}</td>
                <td className="px-3 py-2.5">
                  {item.projects?.name
                    ? <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-zinc-50 text-zinc-600 border-zinc-200">{item.projects.name}</span>
                    : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{serviceLabel(item.service_type)}</td>
                <td className="px-3 py-2.5 text-zinc-500 max-w-[200px] truncate">{item.description ?? '—'}</td>
                <td className="px-3 py-2.5 text-right font-medium text-zinc-900">{formatCurrency(Number(item.amount), currency)}</td>
                <td className="px-3 py-2.5"><PaymentStatusBadge status={item.status} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
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
