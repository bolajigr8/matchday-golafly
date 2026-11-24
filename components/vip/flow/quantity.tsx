'use client'

import { cn } from '@/lib/utils'

/* "VIP · Quantity" (Figma 513:4501): − n + pill. A button that can't go
   further is dimmed (#7c857a).
   `options`: the only values allowed, in order (a ticket's `splits`, e.g.
   [2, 4]); − and + step to the previous / next one. Without it, every
   whole number from `min` to `max`. */
export function VipQuantity({
  value,
  min = 1,
  max,
  options,
  onChange,
  label,
}: {
  value: number
  min?: number
  max?: number
  options?: number[]
  onChange: (n: number) => void
  /** Accessible name, e.g. "Hospitality Lounge tickets". */
  label: string
}) {
  const list = options?.length ? [...options].sort((a, b) => a - b) : null
  const prev = list ? [...list].reverse().find((n) => n < value) : value > min ? value - 1 : undefined
  const next = list ? list.find((n) => n > value) : max === undefined || value < max ? value + 1 : undefined

  /* 10px wide like Figma (83px pill); the ::after widens the tap area. */
  const btn =
    'relative flex h-[18px] w-2.5 items-center justify-center text-[15px] font-medium leading-none transition-colors after:absolute after:-inset-2.5 after:content-[""] enabled:hover:text-vip-gold-text disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'

  return (
    <div role='group' aria-label={label} className='flex h-9 items-center gap-3.5 rounded-full border border-vip-line/14 px-3'>
      <button
        type='button'
        aria-label='Fewer'
        disabled={prev === undefined}
        onClick={() => prev !== undefined && onChange(prev)}
        className={cn(btn, prev === undefined ? 'text-[#7c857a]' : 'text-vip-chalk')}
      >
        −
      </button>
      <span
        aria-live='polite'
        className='min-w-[9px] text-center text-[14px] font-semibold leading-[normal] tabular-nums text-vip-chalk'
      >
        {value}
      </span>
      <button
        type='button'
        aria-label='More'
        disabled={next === undefined}
        onClick={() => next !== undefined && onChange(next)}
        className={cn(btn, next === undefined ? 'text-[#7c857a]' : 'text-vip-chalk')}
      >
        +
      </button>
    </div>
  )
}
