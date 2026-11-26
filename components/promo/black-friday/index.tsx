'use client'

// Black Friday 2026 on golafly.com (matchday). The bar, hero and card stay up
// for the whole Match Promo date window. Today's slot count does not hide them.
// The free eSIM line on checkout still shows only while a discount applies.
// "Find tickets" opens the matches page (where fans pick a match and build
// their trip), never Travel.
//
// Placement: bar pinned at the very top of public pages (above the sticky
// header, components/conditional-header.tsx), hero band under the homepage
// hero (app/client.tsx), card on /flights under the page title.

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useBlackFriday } from '@/features/promo/use-black-friday'
import { InfoTip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BlackFridayBarView, BlackFridayTicketView } from './views'

/** Where fans find tickets and build their trip (boss, 19 Nov: not Travel). */
const TICKETS_URL = '/matches'

/* Pages where the bar would pull people away from something they are in the
   middle of (booking, paying, signing in), or that have their own look. */
const NO_BAR_PREFIXES = [
  '/builder',
  '/cart',
  '/payment-success',
  '/payment-cancelled',
  '/verify-email',
  '/vip',
  '/world-football-summit',
]

/* The bar stays pinned at the top while scrolling. Its height is published as
   --bf-bar-h on <html>; the sticky header and the sticky sidebars add it to
   their `top`, so they stack under the bar instead of behind it. */
function usePinnedHeight(el: HTMLElement | null) {
  useEffect(() => {
    if (!el) return
    const root = document.documentElement
    const set = () => root.style.setProperty('--bf-bar-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--bf-bar-h')
    }
  }, [el])
}

export function BlackFridayBar() {
  const pathname = usePathname()
  const { open, dates } = useBlackFriday()
  const hidden = !open || NO_BAR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  usePinnedHeight(hidden ? null : el)
  if (hidden) return null
  return (
    <div ref={setEl} className='sticky top-0 z-[51]'>
      <BlackFridayBarView href={TICKETS_URL} dates={dates} />
    </div>
  )
}

export function BlackFridayHero() {
  const { open, dates } = useBlackFriday()
  if (!open) return null
  return <BlackFridayTicketView variant='band' href={TICKETS_URL} dates={dates} />
}

/** Free eSIM line on checkout. Hidden unless a discount still applies today.
 *  It is a gift, so it never changes the total. */
export function BlackFridayCheckoutGift({ className }: { className?: string }) {
  const { offer } = useBlackFriday()
  if (!offer) return null
  return (
    <div className={cn('flex items-center justify-between gap-3 text-sm', className)}>
      <span className='flex items-center gap-1.5 text-muted-foreground'>
        eSIM
        <InfoTip label='free eSIM'>
          A free eSIM to selected destinations is included with your match tickets.
        </InfoTip>
      </span>
      <span className='rounded-md bg-[#e7f8ef] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#12a150]'>
        FREE
      </span>
    </div>
  )
}

export function BlackFridayCard({ className }: { className?: string }) {
  const { open, dates } = useBlackFriday()
  if (!open) return null
  return (
    <div className={className}>
      <BlackFridayTicketView variant='card' href={TICKETS_URL} dates={dates} />
    </div>
  )
}
