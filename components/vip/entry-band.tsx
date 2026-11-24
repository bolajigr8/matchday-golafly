'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useVipAvailable } from '@/features/vip/use-available'
import { VipCrowdVideo } from './crowd-video'

/* Figma: "golafly.com homepage · VIP entry band" (352:2691), 1440 × 560.
 * The crowd loop under a dark wash, copy block at x=128: "NEW · GOLAFLY
 * VIP" eyebrow, "MATCHDAY," + "IN FIRST CLASS." on a gold block, one line
 * of copy, then "Explore VIP experiences →" (gold) and "See VIP fixtures →"
 * (outline). Sizes follow the outline's boxes and the landing page's
 * matching pieces (eyebrow, gold title block, 56px buttons). Always dark —
 * it sits on light pages as a full-bleed band. Figma's note: place it after
 * "What fans are booking now" on the homepage. */
export function VipEntryBand() {
  /* Hidden while VIP packages are switched off on the backend. */
  if (!useVipAvailable()) return null
  return (
    <section
      aria-labelledby='vip-band-title'
      className='dark relative isolate overflow-hidden bg-vip-ink py-16 text-vip-fg sm:py-20 xl:flex xl:h-[560px] xl:items-center xl:py-0'
    >
      <VipCrowdVideo className='absolute inset-0 -z-10' />
      <div className='absolute inset-0 -z-10 bg-linear-to-r from-[rgba(5,5,5,0.92)] via-[rgba(5,5,5,0.7)] to-[rgba(5,5,5,0.35)]' />

      <div className='page-container'>
        <div className='flex max-w-[760px] flex-col items-start gap-[26px] xl:pl-4'>
          <p className='flex items-center gap-3 font-mono text-[11px] font-medium leading-[normal] tracking-[2.2px] text-vip-gold-text sm:text-[13px] sm:tracking-[2.86px]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/figma/vip/dot-gold.svg' alt='' width={7} height={7} className='size-[7px] shrink-0' />
            NEW · GOLAFLY VIP
          </p>
          <h2
            id='vip-band-title'
            className='flex flex-col items-start gap-1 font-heading text-[40px] font-bold leading-none tracking-[-0.02em] sm:text-[60px] xl:text-[80px]'
          >
            <span className='text-vip-fg'>MATCHDAY,</span>
            <span className='bg-vip-gold px-[0.2em] pt-[0.05em] text-[#0a0a0a]'>IN FIRST CLASS.</span>
          </h2>
          <p className='max-w-[620px] text-[16px] leading-[1.6] text-vip-body sm:text-[19px]'>
            Hospitality seats, Business or First Class flights, a 4 or 5 star hotel and an eSIM, all in one
            booking.
          </p>
          <div className='flex flex-wrap gap-3.5'>
            <Link
              href='/vip'
              className='group flex h-14 items-center gap-2.5 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold-deep px-[30px] text-[16px] font-semibold leading-[normal] text-vip-gold-ink transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
            >
              Explore VIP experiences
              <ArrowRight aria-hidden className='size-[17px] transition-transform group-hover:translate-x-0.5' strokeWidth={2.25} />
            </Link>
            <Link
              href='/vip#pick-your-match'
              className='group flex h-14 items-center gap-2.5 rounded-full border border-vip-line/25 px-[30px] text-[16px] font-semibold leading-[normal] text-vip-fg transition-colors hover:border-vip-line/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
            >
              See VIP fixtures
              <ArrowRight aria-hidden className='size-[17px] transition-transform group-hover:translate-x-0.5' strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
