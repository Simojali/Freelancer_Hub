import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, size = 'default', className }: Props) {
  const pad = size === 'sm' ? 'py-6' : size === 'lg' ? 'py-20' : 'py-12'
  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10'
  const ActionIcon = action?.icon

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 text-center', pad, className)}>
      {Icon && (
        <div className="rounded-full bg-muted p-3 mb-1">
          <Icon className={cn(iconSize, 'text-muted-foreground')} />
        </div>
      )}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <div className="text-xs text-muted-foreground max-w-xs">{description}</div>}
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-2">
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-1" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
