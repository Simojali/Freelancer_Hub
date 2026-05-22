import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * Single-button theme switcher: click to flip between light and dark.
 * Shows the icon for the theme you'll switch TO (so the affordance reads as
 * "click here to go dark" / "click here to go light").
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60',
        className,
      )}
    >
      {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
