import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useProjects } from '@/hooks/useProjects'
import type { Project, ProjectStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ProjectCard from './ProjectCard'
import ProjectFormModal from './ProjectFormModal'
import KanbanColumn from './KanbanColumn'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const COLUMNS: { id: ProjectStatus; label: string }[] = [
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

export default function ProjectsBoard() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects()
  const [formOpen, setFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overColumn = COLUMNS.find(c => c.id === over.id)
    if (overColumn) {
      updateProject(active.id as string, { status: overColumn.id })
    }
  }

  function handleSave(data: Partial<Project>) {
    if (editProject) updateProject(editProject.id, data)
    else createProject(data)
  }

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditProject(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4 mr-1" /> Add Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Loading...</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colProjects = projects.filter(p => p.status === col.id)
              return (
                <KanbanColumn key={col.id} id={col.id} label={col.label} count={colProjects.length}>
                  <SortableContext items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {colProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => { setEditProject(project); setFormOpen(true) }}
                        onDelete={() => setDeleteTarget(project)}
                      />
                    ))}
                    {colProjects.length === 0 && (
                      <div className="text-xs text-zinc-400 text-center py-6">No projects</div>
                    )}
                  </SortableContext>
                </KanbanColumn>
              )
            })}
          </div>

          <DragOverlay>
            {activeProject && (
              <ProjectCard project={activeProject} onEdit={() => {}} onDelete={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        project={editProject}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) deleteProject(deleteTarget.id); setDeleteTarget(null) }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
