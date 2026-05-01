import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'MAD') {
    return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)} MAD`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a Date as YYYY-MM-DD in the user's LOCAL timezone.
 *
 * Use this instead of `.toISOString().split('T')[0]` whenever the value
 * needs to match a `date` column in Postgres or the value of an
 * `<input type="date">` field. Both of those are calendar-date concepts
 * with no timezone, but `.toISOString()` converts a Date to UTC which
 * silently shifts the calendar day by ±1 for any user who isn't in UTC.
 *
 * Example: a user in UTC+1 picking April 26 → date input writes "2026-04-26".
 * Compare that against `new Date(2026, 3, 26).toISOString().split('T')[0]`
 * which evaluates to "2026-04-25". Off by one. This helper avoids that.
 */
export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

