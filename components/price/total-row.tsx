// components/price/total-row.tsx
//
// The big total at the foot of a cart / checkout summary.

import { cn } from '@/lib/utils'
import { formatPriceAmount } from '@/features/price-breakdown/helpers'

type Format = (amount: number, currency: string) => string

export function GrandTotalRow({
  label = 'Total',
  amount,
  currency,
  format = formatPriceAmount,
  size = 'lg',
  className,
}: {
  label?: string
  amount: number
  currency: string
  format?: Format
  /** lg = cart / checkout summaries, md = compact panels (drawer, extras). */
  size?: 'lg' | 'md'
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', size === 'lg' ? 'py-4' : 'py-3', className)}>
      <span className='font-mono text-[11px] uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <span
        translate='no'
        className={cn(
          'notranslate font-heading font-bold leading-none text-foreground',
          size === 'lg' ? 'text-2xl' : 'text-xl',
        )}
      >
        {format(amount, currency)}
      </span>
    </div>
  )
}
