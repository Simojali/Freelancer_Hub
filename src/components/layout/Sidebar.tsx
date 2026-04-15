import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, UserCheck, FolderKanban, DollarSign, Globe, Settings } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/hooks/useSettings'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/clients', label: 'Clients', icon: UserCheck },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'MAD', label: 'MAD (د.م.)' },
]

export default function Sidebar() {
  const pathname = useLocation().pathname
  const { currency, updateCurrency } = useSettings()

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-200">
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">Freelancer Hub</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-zinc-100 text-zinc-900 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Currency selector */}
      <div className="px-3 py-3 border-t border-zinc-200">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition-colors">
          <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
          <Select value={currency} onValueChange={v => v && updateCurrency(v)}>
            <SelectTrigger className="h-auto border-none shadow-none bg-transparent p-0 text-sm text-zinc-500 focus:ring-0 [&>svg]:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {CURRENCIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  )
}
