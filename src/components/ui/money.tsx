import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Wrap any money-displaying content so the privacy toggle can blur it.
 *
 *   <Money>{formatCurrency(amount, currency)}</Money>
 *
 * Visually a regular inline span. Carries `data-private`, which the CSS
 * rule in src/index.css targets when `html.privacy-on` is active.
 *
 * Use this for every value that's a sum / price / owed amount / earnings.
 * Don't use it for counts (deliveries, credits) — those aren't sensitive.
 */
export function Money({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span data-private className={cn('inline-block', className)}>
      {children}
    </span>
  )
}
