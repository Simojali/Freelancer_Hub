import { useEffect, useState } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Calendar, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/hooks/useAnalytics'

interface Props {
  period: AnalyticsPeriod
  /** YYYY-MM-DD; only meaningful when period === 'custom' */
  customFrom?: string
  customTo?: string
  onChange: (p: AnalyticsPeriod, customFrom?: string, customTo?: string) => void
}

/**
 * Popover-based period picker. Presets are grouped Calendar / Rolling / All-time,
 * plus a Custom section at the bottom with two date inputs and an Apply button.
 * Picking a preset closes the popover immediately; the custom section waits
 * for Apply so the user can edit both inputs without re-firing the hook on each
 * keystroke.
 */
export default function AnalyticsPeriodPicker({ period, customFrom, customTo, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(customFrom ?? '')
  const [draftTo, setDraftTo]     = useState(customTo ?? '')

  // Reset draft values to the committed ones whenever the popover opens —
  // prevents stale edits from a previously-cancelled session bleeding through.
  useEffect(() => {
    if (open) {
      setDraftFrom(customFrom ?? '')
      setDraftTo(customTo ?? '')
    }
  }, [open, customFrom, customTo])

  const calendar = ANALYTICS_PERIODS.filter(p => p.group === 'calendar')
  const rolling  = ANALYTICS_PERIODS.filter(p => p.group === 'rolling')
  const allTime  = ANALYTICS_PERIODS.filter(p => p.group === 'all')

  function pickPreset(value: AnalyticsPeriod) {
    onChange(value)
    setOpen(false)
  }

  function applyCustom() {
    // Need at least one bound to be meaningful. Empty `from` is OK (effectively
    // "before this date"), but we require at least `to` so the chart has an
    // anchor. Falls back to today if both empty — same as the periodBounds default.
    onChange('custom', draftFrom || undefined, draftTo || undefined)
    setOpen(false)
  }

  const triggerLabel = (() => {
    if (period === 'custom') {
      if (customFrom && customTo) return `${customFrom}  →  ${customTo}`
      if (customFrom) return `from ${customFrom}`
      if (customTo)   return `until ${customTo}`
      return 'Custom'
    }
    return ANALYTICS_PERIODS.find(p => p.value === period)?.label ?? 'Select period'
  })()

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs text-foreground hover:bg-muted/40 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="truncate max-w-[18rem]">{triggerLabel}</span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align="end" className="z-50">
          <PopoverPrimitive.Popup className="bg-card border border-border rounded-lg shadow-lg w-80 p-3 outline-none">
            <Section title="Calendar">
              <Grid items={calendar} active={period} onPick={pickPreset} />
            </Section>
            <Section title="Rolling" className="mt-3 pt-3 border-t border-border">
              <Grid items={rolling} active={period} onPick={pickPreset} />
            </Section>
            <div className="mt-3 pt-3 border-t border-border">
              <Grid items={allTime} active={period} onPick={pickPreset} />
            </div>

            {/* Custom range — own block so the inputs read naturally beneath the label */}
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Custom range
                </div>
                {period === 'custom' && (
                  <Check className="w-3 h-3 text-foreground" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-muted-foreground space-y-1">
                  From
                  <Input
                    type="date"
                    value={draftFrom}
                    max={draftTo || undefined}
                    onChange={e => setDraftFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </label>
                <label className="text-[10px] text-muted-foreground space-y-1">
                  To
                  <Input
                    type="date"
                    value={draftTo}
                    min={draftFrom || undefined}
                    onChange={e => setDraftTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </label>
              </div>
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                disabled={!draftFrom && !draftTo}
                onClick={applyCustom}
              >
                Apply range
              </Button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  )
}

function Grid({
  items,
  active,
  onPick,
}: {
  items: { value: AnalyticsPeriod; label: string }[]
  active: AnalyticsPeriod
  onPick: (v: AnalyticsPeriod) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(p => {
        const isActive = active === p.value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onPick(p.value)}
            className={cn(
              'text-xs px-3 py-2 rounded-md border text-left transition-colors flex items-center justify-between gap-2',
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-foreground hover:bg-muted/40'
            )}
          >
            <span>{p.label}</span>
            {isActive && <Check className="w-3 h-3 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
