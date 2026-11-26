'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/navbar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SummitGolaflyLogo } from './logo'
import { IconWhatsApp } from '@/components/social-icons'
import { CONTACT } from '@/store/data'
import { GOLAFLY_PRODUCTS } from '@/store/ecosystem'
import { getSummitEvent } from '@/features/summit/api'
import { SUMMIT_BASE, summitLandingHref } from '@/features/summit/routes'

/* Figma "Summit · Header": the Golafly family strip with "Summit · NEW" lit,
   then the navbar with the WFS partner lockup and the summit's own menu.
   Same behaviour as the site header: sticky, and the family strip folds
   away once the page scrolls. */

const FOCUS = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const ITEM = 'relative inline-flex h-full items-center gap-1.5 whitespace-nowrap px-2.5 transition-colors duration-200'

function SummitTopBar() {
  return (
    <div className='hidden border-b border-band-ink-border bg-band-ink text-[12.5px] text-band-ink-muted lg:block'>
      <div className='page-container flex h-9 items-center justify-between gap-6'>
        <nav aria-label='Golafly family' className='flex h-full items-center'>
          <span className='flex items-center gap-2 pr-[18px] font-mono text-[10.5px] font-medium uppercase tracking-[2.4px] text-band-ink-fg'>
            <span aria-hidden className='size-[5px] rounded-full bg-primary' />
            Golafly
          </span>
          <span aria-hidden className='h-4 w-px bg-white/15' />
          <ul className='flex h-full items-center gap-1 pl-3.5'>
            {GOLAFLY_PRODUCTS.filter((p) => p.key !== 'summit').map((p) => (
              <li key={p.key} className='flex h-full items-center'>
                {!p.href ? (
                  <span className={cn(ITEM, 'text-band-ink-muted')}>
                    <span translate='no' className='notranslate'>{p.name}</span>
                    <span className='rounded-full bg-white/12 px-[7px] py-0.5 font-mono text-[9.5px] font-medium uppercase leading-[normal] tracking-[1.3px] text-white'>
                      Soon
                    </span>
                  </span>
                ) : p.external ? (
                  <a href={p.href} target='_blank' rel='noopener noreferrer' className={cn(ITEM, FOCUS, 'hover:text-band-ink-fg')}>
                    <span translate='no' className='notranslate'>{p.name}</span>
                    <ArrowUpRight aria-hidden className='size-[11px] opacity-70' strokeWidth={2} />
                    <span className='sr-only'>(opens in a new tab)</span>
                  </a>
                ) : (
                  <Link href={p.href} className={cn(ITEM, FOCUS, 'hover:text-band-ink-fg')}>
                    <span translate='no' className='notranslate'>{p.name}</span>
                  </Link>
                )}
              </li>
            ))}
            <li className='flex h-full items-center'>
              <Link
                href={SUMMIT_BASE}
                aria-current='true'
                className={cn(ITEM, FOCUS, 'font-medium text-band-ink-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-wfs-lime')}
              >
                Summit
                <span className='rounded-full bg-wfs-lime px-[7px] py-0.5 font-mono text-[9.5px] font-medium leading-[normal] tracking-[1.3px] text-wfs-on-lime'>
                  NEW
                </span>
              </Link>
            </li>
          </ul>
        </nav>
        <a
          href={CONTACT.whatsapp}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={`Chat with us on WhatsApp, ${CONTACT.phone} (opens in a new tab)`}
          className={cn('inline-flex items-center gap-2 whitespace-nowrap transition-colors duration-200 hover:text-band-ink-fg', FOCUS)}
        >
          <IconWhatsApp className='size-3.5 text-primary' />
          <span className='tabular-nums'>{CONTACT.phone}</span>
          <ArrowUpRight aria-hidden className='size-[11px] opacity-60' strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}
/* Fold after 72px, unfold only near the very top: folding shortens the
   sticky header, and a single threshold would loop (see the site header). */
let folded = false
const isFolded = () => {
  const y = window.scrollY
  if (!folded && y > 72) folded = true
  else if (folded && y < 4) folded = false
  return folded
}
const notFolded = () => false

export function SummitHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, isFolded, notFolded)
  return (
    <header
      className={cn(
        'wfs sticky top-0 z-50 border-b border-navbar-border bg-navbar/95 backdrop-blur-md transition-shadow duration-300 supports-[backdrop-filter]:bg-navbar/92',
        scrolled && 'shadow-[var(--lift-2)]',
      )}
    >
      <div
        inert={scrolled}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          scrolled ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        )}
      >
        <div className='min-h-0 overflow-hidden'>
          <SummitTopBar />
        </div>
      </div>
      <div className='page-container'>
        <Navbar variant='summit' />
      </div>
    </header>
  )
}

/* Figma "Summit · Builder header" (booking steps): logo + partner lockup on
   the left; "Secure booking" and the way back on the right. 76px tall.
   Not in Figma (user request, 26 Nov): the light / dark switch, so every
   summit page has it, as the landing header does. */
export function SummitBuilderHeader() {
  const params = useParams<{ event?: string }>()
  const event = getSummitEvent(params?.event)
  return (
    <header className='wfs sticky top-0 z-50 border-b border-wfs-line bg-wfs-surface'>
      <div className='page-container flex h-[76px] items-center justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-5'>
          <Link
            href='/'
            aria-label='Golafly — home'
            className='flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wfs-lime'
          >
            <SummitGolaflyLogo className='h-10 lg:h-12' />
          </Link>
          <span className='hidden items-center gap-3 sm:flex'>
            <span aria-hidden className='h-7 w-px bg-wfs-hair' />
            <span className='flex flex-col gap-0.5 leading-[normal]'>
              <span className='font-mono text-[9.5px] font-medium uppercase tracking-[1.14px] text-wfs-muted'>Official travel partner</span>
              <span translate='no' className='notranslate font-heading text-[14px] font-bold text-wfs-text'>World Football Summit</span>
            </span>
          </span>
        </div>
        <div className='flex shrink-0 items-center gap-3 sm:gap-6'>
          <span className='hidden items-center gap-2 text-[13.5px] leading-[normal] text-wfs-muted lg:flex'>
            <Lock aria-hidden className='size-[15px]' strokeWidth={1.8} />
            Secure booking · Official WFS tickets
          </span>
          <ThemeToggle className='text-wfs-text/80 hover:bg-wfs-soft hover:text-wfs-text focus-visible:outline-wfs-lime' />
          <Link
            href={summitLandingHref(event?.key)}
            className='inline-flex items-center gap-1.5 rounded-sm font-mono text-[12.5px] font-medium leading-[normal] text-wfs-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
          >
            <ArrowLeft aria-hidden className='size-3.5' strokeWidth={2} />
            <span className='max-sm:hidden'>Back to {event?.name ?? 'WFS London'}</span>
            <span className='sm:hidden'>Back</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
