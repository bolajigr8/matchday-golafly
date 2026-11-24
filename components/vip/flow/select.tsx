'use client'

import { useState, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/* "VIP · Dropdown" (Figma 513:4370 Guests, 513:4404 Package, 513:4440
   Stand, 513:4473 Sort). Two looks:
   - 'field': grey label + dark select box (Package, Stand, Sort)
   - 'gold':  gold pill (Guests)
   The open menu is the same for both: 220px dark panel, 36px options, the
   chosen one tinted gold with a ✓. */

export interface VipSelectOption<T extends string | number> {
  value: T
  label: string
  /** Runs instead of choosing (e.g. "5+ guests · ask concierge"). */
  onSelect?: () => void
}

export function VipSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  variant = 'field',
  display,
  align = 'start',
}: {
  /** Grey label left of the box ('field' look). */
  label?: string
  value: T
  options: VipSelectOption<T>[]
  onChange: (value: T) => void
  variant?: 'field' | 'gold'
  /** What the closed control shows; defaults to the chosen label. */
  display?: ReactNode
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const caret = (
    <span aria-hidden className={cn('text-[11px] leading-[normal]', variant === 'gold' ? 'text-[#111111] text-[12px] font-semibold' : 'text-vip-mist')}>
      {open ? '▴' : '▾'}
    </span>
  )

  const trigger =
    variant === 'gold' ? (
      <button
        type='button'
        aria-label={label}
        className='flex h-[37px] items-center gap-2 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-[18px] text-[14px] font-semibold leading-[normal] text-[#111111] transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
      >
        {display ?? current?.label}
        {caret}
      </button>
    ) : (
      <button
        type='button'
        className={cn(
          'flex h-9 items-center gap-2.5 rounded-[10px] border bg-vip-tint/4 px-3.5 text-[13.5px] font-medium leading-[normal] text-vip-chalk transition-colors hover:border-vip-line/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light',
          open ? 'border-vip-gold/50' : 'border-vip-line/14',
        )}
      >
        {display ?? current?.label}
        {caret}
      </button>
    )

  return (
    <div className='flex items-center gap-2.5'>
      {label && variant === 'field' && (
        <span className='text-[13.5px] leading-[normal] text-vip-mist'>{label}</span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={8}
          className='w-[220px] gap-0.5 rounded-[14px] border border-vip-gold/35 bg-vip-popover p-2 text-vip-chalk shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] ring-0'
        >
          <ul role='listbox' aria-label={label} className='flex flex-col gap-0.5'>
            {options.map((o) => {
              const selected = o.value === value
              return (
                <li key={String(o.value)} role='option' aria-selected={selected}>
                  <button
                    type='button'
                    onClick={() => {
                      setOpen(false)
                      if (o.onSelect) o.onSelect()
                      else onChange(o.value)
                    }}
                    className={cn(
                      'flex h-9 w-full items-center justify-between gap-2.5 rounded-[10px] px-3 text-left text-[13.5px] font-medium leading-[normal] transition-colors focus-visible:outline-none',
                      selected
                        ? 'bg-vip-gold/10 text-vip-gold-text'
                        : 'text-vip-chalk hover:bg-vip-line/5 focus-visible:bg-vip-line/5',
                    )}
                  >
                    {o.label}
                    {selected && <span className='text-[13px] font-semibold text-vip-gold-text'>✓</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}
