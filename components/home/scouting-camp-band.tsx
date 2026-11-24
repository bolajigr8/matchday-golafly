'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PillarBadge } from '@/components/brand/pillar-badge'
import { CAMP } from '@/components/scouting-camp/content'

/* Scouting Camp promo band, right under the home hero.

   ┌──────────────╱─────────────────────────────────────────┐
   │   players   ╱  ◉ GOLAFLY · SCOUTING CAMP               │
   │   photo    ╱   ( PLAY IT )                             │
   │           ╱    TRAIN. COMPETE.                         │
   │          ╱     GET SEEN.                               │
   │         ╱      [10–19 JAN 2027] [BARCELONA] [10 DAYS] …│
   │        ╱       ( RESERVE YOUR PLACE → )             ◢  │
   └───────╱─────────────────────────────────────────────────┘

   Built in code from the marketing banner, not dropped in as an image, so
   the copy stays sharp, translates and the CTA is a real link. Dates, city
   and length come from the camp's own content file, so this band and the
   camp page can never disagree. Phones keep this exact layout, photo beside
   the copy, with the type and spacing scaled down: it never stacks.
   Ink band, so neon is allowed as type here. */

const CAMP_HREF = '/scouting-camp'

export function ScoutingCampBand() {
  const chips = [
    CAMP.dates,
    CAMP.city,
    `${CAMP.days} days`,
    'Limited places',
  ].filter((c): c is string => !!c)

  return (
    <section
      aria-labelledby='scouting-camp-band-title'
      className='relative isolate overflow-hidden border-y border-band-ink-border bg-band-ink text-band-ink-fg'
    >
      {/* Players photo: a diagonal-cut panel at every width */}
      <div className='absolute inset-y-0 left-0 w-[34%] [clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]'>
        <Image
          src='/scouting-camp/banner-players.webp'
          alt='Two players in Golafly kits at night'
          fill
          sizes='34vw'
          className='object-cover object-[50%_22%]'
        />
      </div>

      {/* Neon stripe along the cut */}
      <div
        aria-hidden
        className='absolute inset-y-0 left-0 w-[calc(34%+6px)] bg-primary [clip-path:polygon(calc(100%-6px)_0,100%_0,calc((100%-6px)*0.82+6px)_100%,calc((100%-6px)*0.82)_100%)] sm:w-[calc(34%+12px)] sm:[clip-path:polygon(calc(100%-12px)_0,100%_0,calc((100%-12px)*0.82+12px)_100%,calc((100%-12px)*0.82)_100%)]'
      />

      {/* Neon corner */}
      <div
        aria-hidden
        className='absolute bottom-0 right-0 size-10 bg-primary [clip-path:polygon(100%_0,100%_100%,0_100%)] sm:size-24 lg:h-36 lg:w-56'
      />

      <div className='page-container relative'>
        <div className='ml-[34%] flex flex-col gap-2.5 py-5 pl-3 sm:gap-5 sm:py-10 sm:pl-8 lg:gap-6 lg:py-16 lg:pl-16'>
          <div translate='no' className='notranslate flex items-center gap-2 sm:gap-3'>
            <Image
              src='/brand/golafly-scouting-camp.png'
              alt=''
              width={256}
              height={256}
              className='size-7 sm:size-11'
            />
            <span className='flex flex-col leading-none'>
              <span className='font-heading text-[13px] font-bold tracking-[0.02em] sm:text-[20px]'>
                GOLAFLY
              </span>
              <span className='mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.3em] text-primary sm:mt-1 sm:text-[9px]'>
                Scouting Camp
              </span>
            </span>
          </div>

          <PillarBadge pillar='play' size='sm' onInk className='self-start' />

          <h2
            id='scouting-camp-band-title'
            className='font-heading text-[clamp(18px,5.6vw,56px)] font-bold uppercase leading-[0.95] tracking-[-0.02em] xl:text-[72px]'
          >
            Train. Compete.
            <br />
            <span className='text-primary'>Get seen.</span>
          </h2>

          <ul className='flex flex-wrap gap-1 sm:gap-2.5'>
            {chips.map((chip) => (
              <li
                key={chip}
                className='rounded-full border border-band-ink-border bg-band-ink-raise px-2 py-1 font-mono text-[clamp(8px,2.3vw,13px)] font-bold uppercase tracking-[0.04em] sm:px-4 sm:py-2 sm:tracking-[0.06em]'
              >
                {chip}
              </li>
            ))}
          </ul>

          <Link
            href={CAMP_HREF}
            className='group inline-flex min-h-10 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-full bg-primary px-3 text-[clamp(10px,3vw,15px)] font-bold uppercase tracking-[0.04em] text-primary-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_35%,transparent)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:min-h-12 sm:gap-2 sm:px-7 sm:text-[15px]'
          >
            Reserve your place
            <ArrowRight
              aria-hidden
              className='size-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none sm:size-4'
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
