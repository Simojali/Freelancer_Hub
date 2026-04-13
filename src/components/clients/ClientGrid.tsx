import { useState } from 'react'
import type { Client } from '@/lib/types'
import { useClients } from '@/hooks/useClients'
import ClientCard from './ClientCard'
import ClientFormModal from './ClientFormModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function ClientGrid() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients()
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  function handleSave(data: Partial<Client>) {
    if (editClient) updateClient(editClient.id, data)
    else createClient(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditClient(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4 mr-1" /> Add Client
        </Button>
      </div>

      {isLoading && <div className="text-sm text-zinc-400 py-8 text-center">Loading...</div>}
      {!isLoading && clients.length === 0 && (
        <div className="text-sm text-zinc-400 py-16 text-center">No clients yet. Add your first client.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onEdit={() => { setEditClient(client); setFormOpen(true) }}
            onDelete={() => setDeleteTarget(client)}
          />
        ))}
      </div>

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        client={editClient}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.client_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) deleteClient(deleteTarget.id); setDeleteTarget(null) }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
