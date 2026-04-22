import { useState, useEffect } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DateRange } from '@/App'
import { rangeBounds } from '@/App'

const PRESETS: { value: Exclude<DateRange, 'custom' | 'all'>; label: string }[] = [
  { value: 'today',         label: 'Today' },
  { value: 'week',          label: 'This week' },
  { value: 'month',         label: 'This month' },
  { value: 'last_month',    label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'year',          label: 'This year' },
]

interface Props {
  dateRange: DateRange
  from?: string
  to?: string
  /** Called with a preset value (also used for 'all' + 'custom') */
  onPreset: (r: DateRange) => void
  /** Called when the user types into From */
  onFromChange: (d: string) => void
  /** Called when the user types into To */
  onToChange: (d: string) => void
}

export default function DateRangePicker({ dateRange, from, to, onPreset, onFromChange, onToChange }: Props) {
  const [open, setOpen] = useState(false)
  // Draft state so the user can edit from/to freely before clicking Done
  const [draftFrom, setDraftFrom] = useState(from ?? '')
  const [draftTo, setDraftTo]     = useState(to ?? '')
  const [draftPreset, setDraftPreset] = useState<DateRange>(dateRange)

  // Sync draft with props when popover opens or external value changes
  useEffect(() => {
    if (open) {
      setDraftFrom(from ?? '')
      setDraftTo(to ?? '')
      setDraftPreset(dateRange)
    }
  }, [open, from, to, dateRange])

  const triggerLabel = (() => {
    if (dateRange === 'all') return 'All time'
    if (dateRange === 'custom') {
      if (from && to) return `${from}  →  ${to}`
      if (from) return `from ${from}`
      if (to)   return `until ${to}`
      return 'Custom'
    }
    return PRESETS.find(p => p.value === dateRange)?.label ?? 'All time'
  })()

  function applyPreset(p: Exclude<DateRange, 'custom' | 'all'>) {
    const bounds = rangeBounds(p)
    setDraftPreset(p)
    setDraftFrom(bounds.from ?? '')
    setDraftTo(bounds.to ?? '')
  }

  function handleClear() {
    setDraftPreset('all')
    setDraftFrom('')
    setDraftTo('')
  }

  function handleDone() {
    // If the user changed only the date inputs (draftPreset === 'custom' or mismatched bounds),
    // commit to custom. Otherwise commit the preset.
    if (draftPreset === 'all') {
      onPreset('all')
    } else if (draftPreset === 'custom') {
      // commit custom: first flip to custom, then write from/to
      onFromChange(draftFrom)
      onToChange(draftTo)
      if (dateRange !== 'custom') onPreset('custom')
    } else {
      onPreset(draftPreset)
    }
    setOpen(false)
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors',
          dateRange !== 'all'
            ? 'border-zinc-400 text-zinc-900 bg-zinc-50'
            : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
        )}
      >
        <Calendar className="w-3 h-3" />
        <span className="truncate max-w-[14rem]">{triggerLabel}</span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} className="z-50">
          <PopoverPrimitive.Popup className="bg-white border border-zinc-200 rounded-lg shadow-lg w-72 p-3 outline-none">
            {/* Preset grid (2 columns) */}
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => {
                const active = draftPreset === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => applyPreset(p.value)}
                    className={cn(
                      'text-xs px-3 py-2 rounded-md border text-left transition-colors',
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            {/* Custom range */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Custom range
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={e => { setDraftFrom(e.target.value); setDraftPreset('custom') }}
                  className="h-8 text-xs flex-1"
                  aria-label="From date"
                />
                <span className="text-zinc-400 text-xs">→</span>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={e => { setDraftTo(e.target.value); setDraftPreset('custom') }}
                  className="h-8 text-xs flex-1"
                  aria-label="To date"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Clear
              </button>
              <Button size="sm" onClick={handleDone} className="h-7 text-xs">
                Done
              </Button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
