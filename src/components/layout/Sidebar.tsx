import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, UserCheck, FolderKanban, DollarSign, BarChart3, Settings, Eye, EyeOff } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { usePrivacy } from '@/lib/privacy'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/clients', label: 'Clients', icon: UserCheck },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = useLocation().pathname
  const { isPrivate, toggle: togglePrivacy } = usePrivacy()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <span className="text-sm font-semibold tracking-tight">Freelancer Hub</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Privacy + theme toggles + Settings link at bottom */}
      <div className="px-3 py-3 border-t border-border space-y-2">
        <button
          type="button"
          onClick={togglePrivacy}
          aria-pressed={isPrivate}
          title={isPrivate ? 'Show amounts' : 'Hide amounts'}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
            isPrivate
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60',
          )}
        >
          {isPrivate ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
          {isPrivate ? 'Amounts hidden' : 'Hide amounts'}
        </button>
        <ThemeToggle />
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60',
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
