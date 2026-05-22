import { useState } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Calendar, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/hooks/useAnalytics'

interface Props {
  period: AnalyticsPeriod
  onChange: (p: AnalyticsPeriod) => void
}

/**
 * Popover-based period picker for the analytics page. Shows the current
 * selection on the trigger; the popover groups presets into Calendar /
 * Rolling / All-time sections so the 10 options are visually scannable
 * instead of stuffed into a vertical dropdown.
 */
export default function AnalyticsPeriodPicker({ period, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = ANALYTICS_PERIODS.find(p => p.value === period)

  const calendar = ANALYTICS_PERIODS.filter(p => p.group === 'calendar')
  const rolling  = ANALYTICS_PERIODS.filter(p => p.group === 'rolling')
  const allTime  = ANALYTICS_PERIODS.filter(p => p.group === 'all')

  function pick(value: AnalyticsPeriod) {
    onChange(value)
    setOpen(false)
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs text-foreground hover:bg-muted/40 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{current?.label ?? 'Select period'}</span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align="end" className="z-50">
          <PopoverPrimitive.Popup className="bg-card border border-border rounded-lg shadow-lg w-80 p-3 outline-none">
            <Section title="Calendar">
              <Grid items={calendar} active={period} onPick={pick} />
            </Section>
            <Section title="Rolling" className="mt-3 pt-3 border-t border-border">
              <Grid items={rolling} active={period} onPick={pick} />
            </Section>
            <div className="mt-3 pt-3 border-t border-border">
              <Grid items={allTime} active={period} onPick={pick} />
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
