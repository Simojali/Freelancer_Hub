import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useServices } from '@/hooks/useServices'
import type { Service } from '@/lib/types'

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'MAD', label: 'MAD (د.م.)' },
]

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function SettingsPage() {
  const { currency, updateCurrency } = useSettings()
  const { services, createService, updateService, deleteService } = useServices()

  // Add service form
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const newSlug = toSlug(newName)
  const slugExists = services.some(s => s.slug === newSlug)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function startEdit(s: Service) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditColor(s.color)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await updateService(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  async function handleAdd() {
    if (!newName.trim() || slugExists) return
    await createService(newName.trim(), newSlug, newColor)
    setNewName('')
    setNewColor('#6366f1')
  }

  return (
    <div className="space-y-8 max-w-xl">

      {/* Currency */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">Currency</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-600 w-24 shrink-0">Display currency</label>
          <Select value={currency} onValueChange={v => v && updateCurrency(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-1">Services</h2>
        <p className="text-xs text-zinc-400 mb-4">Services appear in all dropdowns. The slug is stored in your data and cannot be changed after creation.</p>

        <div className="space-y-1 mb-4">
          {services.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-md border border-zinc-100 hover:border-zinc-200 bg-zinc-50">
              {editingId === s.id ? (
                <>
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-zinc-200 shrink-0" />
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(s.id); if (e.key === 'Escape') cancelEdit() }}
                    className="h-7 text-sm flex-1"
                    autoFocus
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600" onClick={() => saveEdit(s.id)}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-zinc-800 flex-1">{s.name}</span>
                  <span className="text-xs text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded">{s.slug}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700" onClick={() => startEdit(s)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => deleteService(s.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new service */}
        <div className="border-t border-zinc-100 pt-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Add service</div>
          <div className="flex items-start gap-2">
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border border-zinc-200 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                placeholder="e.g. Logo Design"
              />
              {newName && (
                <div className="text-xs text-zinc-400 mt-1">
                  Slug: <span className={`font-mono ${slugExists ? 'text-red-500' : 'text-zinc-500'}`}>{newSlug || '—'}</span>
                  {slugExists && <span className="text-red-500 ml-1">— already exists</span>}
                </div>
              )}
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || slugExists || !newSlug} className="shrink-0">
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
