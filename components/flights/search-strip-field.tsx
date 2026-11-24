import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * One field inside the flight search bar: mono uppercase label ON TOP,
 * value below. Ported from Travels' components/search-band/strip-field.tsx
 * — same convention, same layout, using matchday's own `bg-muted` token
 * instead of Travels' `bg-field` (matchday's theme doesn't define that
 * one, `bg-muted` is the equivalent already used everywhere else here).
 */
export function SearchStripField({
  label,
  children,
  className,
  error,
}: {
  label: string
  children: ReactNode
  className?: string
  error?: string
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-border bg-muted px-3.5 py-2 transition-colors focus-within:border-primary/50',
        error && 'border-destructive',
        className,
      )}
    >
      <span className='font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>
        {label}
      </span>
      <div className='min-w-0 text-[13px] font-semibold text-foreground'>
        {children}
      </div>
      {error && (
        <span className='mt-0.5 block font-mono text-[9px] text-destructive'>
          {error}
        </span>
      )}
    </div>
  )
}
