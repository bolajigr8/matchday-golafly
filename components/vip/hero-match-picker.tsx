'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipKickoff, formatVipPrice } from '@/features/vip/format'
import { VipCrest } from './crest'

/* Hero booking bar → MATCH: pick any VIP match the backend has on sale
   (same dark menu as "VIP · Dropdown", wider for match names). The choice
   drives the rest of the landing page and "Build my VIP trip". */

export const vipMatchKey = (m: VipEventView) => `${m.club}-${m.eventId}`

export function VipHeroMatchPicker({
  matches,
  value,
  onChange,
}: {
  matches: VipEventView[]
  value: VipEventView | null
  onChange: (m: VipEventView) => void
}) {
  const [open, setOpen] = useState(false)
  const title = value ? `${value.home} vs ${value.away}` : 'Choose a match'
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          disabled={matches.length === 0}
          aria-label={`Match: ${title}. Change match`}
          className='flex max-w-full items-center gap-2 text-left text-[17px] font-semibold leading-[normal] text-vip-fg transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vip-gold-light disabled:opacity-60'
        >
          <span className='truncate'>{title}</span>
          <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-vip-gold-text transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={14}
        className='dark w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-vip-gold/35 bg-vip-popover p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
      >
        <ul role='listbox' aria-label='VIP matches' className='flex max-h-[360px] flex-col overflow-y-auto overscroll-contain'>
          {matches.map((m) => {
            const active = value ? vipMatchKey(m) === vipMatchKey(value) : false
            return (
              <li key={vipMatchKey(m)}>
                <button
                  type='button'
                  role='option'
                  aria-selected={active}
                  onClick={() => {
                    onChange(m)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    active ? 'bg-vip-gold/12' : 'hover:bg-vip-line/6',
                  )}
                >
                  <span className='flex shrink-0 items-center gap-1'>
                    <VipCrest name={m.home} src={m.homeCrest} className='size-6' />
                    <VipCrest name={m.away} src={m.awayCrest} className='size-6' />
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <span className='truncate text-[14px] font-semibold leading-[normal] text-vip-chalk'>
                      {m.home} vs {m.away}
                    </span>
                    <span className='truncate font-mono text-[10.5px] leading-[normal] tracking-[1px] text-vip-mist'>
                      {formatVipKickoff(m.date)}
                      {m.priceFrom ? ` · from ${formatVipPrice(m.priceFrom.amount, m.priceFrom.currency)}` : ''}
                    </span>
                  </span>
                  {active && <Check aria-hidden className='size-4 shrink-0 text-vip-gold-text' />}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
