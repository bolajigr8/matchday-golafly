'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/* The small shared pieces every admin screen assembles from. Kept in one file
   because none of them is big enough to earn its own, and they are always
   imported together. */

/* ── Primary action ─────────────────────────────────────────────────────────
   The lime pill is the only thing in the product that glows, and there is one
   per view. Everything else is outline or ghost — a screen with three lime
   pills has no primary action at all. */
export function AdminButton({
  children,
  variant = 'primary',
  size = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default'
}) {
  return (
    <button
      type='button'
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-mono font-semibold uppercase tracking-[0.09em] transition-shadow',
        size === 'sm' ? 'h-7 px-2.5 text-[9.5px]' : 'h-8 px-3.5 text-[10px]',
        variant === 'primary' &&
          'bg-brand text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge),0_0_12px_var(--brand-glow)] hover:shadow-[0_0_0_1px_var(--brand-edge),0_0_20px_var(--brand-glow)]',
        variant === 'outline' &&
          'text-foreground shadow-[0_0_0_1px_var(--edge)] hover:bg-accent',
        variant === 'ghost' &&
          'text-muted-foreground hover:bg-accent hover:text-foreground',
        variant === 'destructive' &&
          'bg-destructive text-white hover:opacity-90',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────────────
   Mono eyebrow, Space Grotesk numeral, delta with an arrow so direction is
   never colour-only. Numerals are tabular so a counter does not jitter. */
export function StatCard({
  label,
  icon,
  value,
  delta,
  direction,
}: {
  label: string
  icon: React.ReactNode
  value: string
  delta?: string
  direction?: 'up' | 'down'
}) {
  return (
    <div className='rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]'>
      <div className='flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground'>
        {icon}
        {label}
      </div>
      {/* <div className="mt-1.5 text-[25px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
        {value}
      </div> */}

      <div className='mt-1.5 break-words text-[20px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[25px]'>
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            'mt-1.5 flex items-center gap-1 text-[10.5px]',
            direction === 'up' && 'text-status-good',
            direction === 'down' && 'text-destructive',
            !direction && 'text-muted-foreground',
          )}
        >
          {direction === 'up' && <ArrowUp className='size-2.5' />}
          {direction === 'down' && <ArrowDown className='size-2.5' />}
          {delta}
        </div>
      )}
    </div>
  )
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]',
        className,
      )}
    >
      <div className='mb-3 flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='m-0 text-[13px] font-semibold'>{title}</h2>
          {subtitle && (
            <p className='m-0 mt-0.5 text-[11px] text-muted-foreground'>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ── Empty states ───────────────────────────────────────────────────────────
   "Nothing exists yet" and "nothing matched your filters" are different
   states and must never share a component: the first invites you to create,
   the second invites you to loosen. Showing "Add player" to someone whose
   filter is too narrow is the classic empty-state bug. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className='flex flex-col items-center gap-1.5 px-5 py-10 text-center'>
      <span className='mb-1.5 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-[0_0_0_1px_var(--edge)]'>
        {icon}
      </span>
      <p className='text-[13.5px] font-semibold text-foreground'>{title}</p>
      <p className='max-w-[34ch] text-[11.5px] leading-relaxed text-muted-foreground'>
        {body}
      </p>
      {action && <div className='mt-2.5'>{action}</div>}
    </div>
  )
}
