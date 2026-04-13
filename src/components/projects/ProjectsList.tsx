import { useState } from 'react'
import type { Project } from '@/lib/types'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import PackageRow from './PackageRow'
import GigRow from './GigRow'
import ProjectFormModal from './ProjectFormModal'
import PackageDetailModal from './PackageDetailModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function ProjectsList() {
  const { projects, isLoading, mutate, createProject, updateProject, deleteProject } = useProjects()
  const [typeFilter, setTypeFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)

  const filtered = projects.filter(p => {
    if (typeFilter !== 'all' && p.project_type !== typeFilter) return false
    if (serviceFilter !== 'all' && p.service_type !== serviceFilter) return false
    return true
  })

  const packages = filtered.filter(p => p.project_type === 'package')
  const gigs = filtered.filter(p => p.project_type === 'gig')

  function handleSave(data: Partial<Project>) {
    if (editProject) updateProject(editProject.id, data)
    else createProject(data)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={v => v && setTypeFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="package">Packages</SelectItem>
            <SelectItem value="gig">Gigs</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={v => v && setServiceFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="thumbnail">Thumbnail</SelectItem>
            <SelectItem value="video_editing">Video Editing</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditProject(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Add Project
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-zinc-400 py-8 text-center">Loading...</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-sm text-zinc-400 py-16 text-center">No projects yet.</div>
      )}

      {/* Packages section */}
      {packages.length > 0 && (
        <div className="space-y-2">
          {(typeFilter === 'all') && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Packages</span>
            </div>
          )}
          {packages.map(p => (
            <PackageRow
              key={p.id}
              project={p}
              onView={() => setDetailProject(p)}
              onEdit={() => { setEditProject(p); setFormOpen(true) }}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Gigs section */}
      {gigs.length > 0 && (
        <div className="space-y-2">
          {(typeFilter === 'all') && (
            <div className="flex items-center gap-2 mb-1 mt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Gigs</span>
            </div>
          )}
          {gigs.map(p => (
            <GigRow
              key={p.id}
              project={p}
              onEdit={() => { setEditProject(p); setFormOpen(true) }}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProject(null) }}
        onSave={handleSave}
        project={editProject}
      />

      <PackageDetailModal
        open={!!detailProject}
        onClose={() => setDetailProject(null)}
        project={detailProject}
        onDeliveryChange={() => mutate()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>
              {deleteTarget?.project_type === 'package' && ' and all its delivery logs'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) deleteProject(deleteTarget.id); setDeleteTarget(null) }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
