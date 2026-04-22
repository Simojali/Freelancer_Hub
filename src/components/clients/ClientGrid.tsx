import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '@/lib/types'
import { useClients } from '@/hooks/useClients'
import ClientCard from './ClientCard'
import ClientFormModal from './ClientFormModal'
import { Button } from '@/components/ui/button'
import { Plus, UserCheck } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import EmptyState from '@/components/shared/EmptyState'

export default function ClientGrid() {
  const navigate = useNavigate()
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients()
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  async function handleSave(data: Partial<Client>): Promise<boolean> {
    return editClient ? updateClient(editClient.id, data) : createClient(data)
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
        <EmptyState
          icon={UserCheck}
          title="No clients yet"
          description="Add clients you're working with to track their projects and payments in one place."
          action={{ label: 'Add your first client', onClick: () => { setEditClient(null); setFormOpen(true) }, icon: Plus }}
          size="lg"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onView={() => navigate('/clients/' + client.id)}
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
