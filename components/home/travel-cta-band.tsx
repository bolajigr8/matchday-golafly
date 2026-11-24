'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BedDouble, Plane, Smartphone } from 'lucide-react'
import { PillarBadge } from '@/components/brand/pillar-badge'
import { TRAVEL_URL, golaflyProduct } from '@/store/ecosystem'

/* Full-bleed ink band cross-selling Golafly Travel (flights, stays, eSIM)
   right after the fixture list. Ink band in both themes, so neon may be
   used as type here. The lockup PNG is all-neon: ink backgrounds only. */

const FEATURES = [
  {
    icon: Plane,
    title: 'Flights',
    body: 'Fares to the host city on your match dates.',
  },
  {
    icon: BedDouble,
    title: 'Stays',
    body: 'Hotels and apartments for match weekend.',
  },
  {
    icon: Smartphone,
    title: 'eSIM',
    body: 'Mobile data from the moment you land.',
  },
] as const

const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.045) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
  maskImage: 'radial-gradient(ellipse 60% 75% at 82% 45%, #000 15%, transparent 75%)',
  WebkitMaskImage: 'radial-gradient(ellipse 60% 75% at 82% 45%, #000 15%, transparent 75%)',
} as const

export function TravelCtaBand() {
  const reduce = useReducedMotion()
  const travel = golaflyProduct('travel')

  return (
    <section
      aria-labelledby='travel-cta-title'
      className='relative isolate overflow-hidden bg-band-ink text-band-ink-fg'
    >
      {/* Decor: fine grid on the right, a soft neon bloom behind the cards */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-0' style={GRID_STYLE} />
        <div className='absolute -top-48 -right-40 size-[520px] rounded-full bg-primary/[0.12] blur-[120px] sm:size-[640px]' />
      </div>

      <div className='page-container py-20 sm:py-24 lg:py-28'>
        <div className='grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20'>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src='/brand/golafly-travel.png'
              alt='Golafly Travel'
              width={565}
              height={200}
              className='block h-10 w-[113px] object-contain object-left sm:h-12 sm:w-[136px]'
            />

            <PillarBadge pillar='travel' onInk className='mt-10' />

            <h2
              id='travel-cta-title'
              className='mt-4 font-heading text-[30px] font-bold leading-[1.02] tracking-[-0.02em] text-balance text-band-ink-fg sm:text-[40px] lg:text-[46px]'
            >
              Complete your trip{' '}
              <span className='block text-primary'>around the match.</span>
            </h2>

            <p className='mt-5 max-w-md text-[15px] leading-relaxed text-band-ink-muted sm:text-base'>
              Seats sorted? Book flights, stays and an eSIM for match weekend
              with {travel.fullName}, all in one place.
            </p>

            <div className='mt-9 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <a
                href={TRAVEL_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-[filter,transform] duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none'
              >
                Plan your trip
                <ArrowUpRight aria-hidden className='size-4' strokeWidth={2.25} />
                <span className='sr-only'> on Golafly Travel (opens in a new tab)</span>
              </a>
              <Link
                href='/matches'
                className='group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-band-ink-border px-6 text-[15px] font-semibold text-band-ink-fg transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
              >
                Browse matches
                <ArrowRight
                  aria-hidden
                  className='size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none'
                />
              </Link>
            </div>
          </motion.div>

          <ul className='grid gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1'>
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.li
                  key={f.title}
                  className='flex items-center gap-4 rounded-[20px] border border-band-ink-border bg-band-ink-raise p-5 sm:flex-col sm:items-start sm:gap-5 sm:p-6 lg:flex-row lg:items-center lg:gap-5'
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    aria-hidden
                    className='flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary ring-1 ring-primary/25 ring-inset'
                  >
                    <Icon className='size-5' strokeWidth={1.75} />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-heading text-[17px] font-semibold tracking-[-0.01em] text-band-ink-fg'>
                      {f.title}
                    </h3>
                    <p className='mt-1 text-[14px] leading-relaxed text-band-ink-muted'>
                      {f.body}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className='hidden font-mono text-[11px] tracking-[0.2em] text-band-ink-muted/70 lg:block'
                  >
                    0{i + 1}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
