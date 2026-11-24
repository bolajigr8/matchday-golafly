'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { VipCountdownCard } from '@/components/vip/countdown-card'
import { VipButtonLink } from '@/components/vip/flow/button'
import { VipEyebrow } from '@/components/vip/flow/eyebrow'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipLongDate, formatVipPrice, formatVipTime, kickoffInstant } from '@/features/vip/format'
import { vipFlowHref } from '@/features/vip/routes'

/* Figma: VIP Flow · 1 · Match → "Hero" (504:3023), 1440 × 640.
 * From xl up the pieces sit where Figma puts them (page-container's content
 * edge is x=112 on a 1440 screen): back chip top-left, countdown top-right,
 * match copy bottom-left, CTA bottom-right. Below xl they stack. */
export function VipMatchHero({ match }: { match: VipEventView }) {
  const reduce = useReducedMotion()
  const seatsHref = vipFlowHref(match.club, match.eventId, 'seats')

  return (
    <section className='dark relative isolate overflow-hidden bg-vip-ink xl:h-[640px]'>
      {/* ── Background: photo with a slow zoom (Figma "VIP · Hero photo
          (slow zoom)" 513:5912, Out → In = 1440 → 1540.8 wide). ── */}
      <motion.div
        aria-hidden
        className='absolute inset-0 -z-10'
        initial={{ scale: 1 }}
        animate={reduce ? undefined : { scale: 1.07 }}
        transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        <Image src={match.image} alt='' fill priority sizes='100vw' className='object-cover' />
      </motion.div>
      <div className='absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/55 via-55% to-vip-ink' />
      <div className='absolute inset-0 -z-10 bg-linear-to-r from-black/75 to-transparent to-60%' />
      {/* Gold glow: 700px circle at x=900, y=-260, 180 layer blur. */}
      <div
        aria-hidden
        className='pointer-events-none absolute -right-[160px] -top-[260px] -z-10 size-[700px] rounded-full bg-vip-gold/16 blur-[90px]'
      />

      <div className='page-container relative flex h-full flex-col gap-8 pb-12 pt-6 sm:pt-9 xl:block xl:pb-0'>
        <Link
          href='/vip'
          className='flex w-fit items-center gap-2 rounded-full border border-vip-line/14 bg-black/50 px-3.5 py-2 font-mono text-[12px] leading-[normal] text-vip-chalk transition-colors hover:border-vip-gold/60 hover:text-vip-gold-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light xl:absolute xl:top-9'
        >
          <ArrowLeft aria-hidden className='size-3' strokeWidth={2} />
          All VIP matches
        </Link>

        {/* ── Match copy (x=112, y=324 → 72px above the bottom) ── */}
        <div className='flex flex-col gap-[18px] pt-16 sm:pt-28 xl:absolute xl:bottom-[72px] xl:max-w-[760px] xl:pt-0'>
          <VipEyebrow>{`${match.city} · VIP Hospitality`}</VipEyebrow>
          <h1 className='flex flex-col gap-[18px] font-heading font-bold uppercase leading-[0.95] text-[44px] sm:text-[64px] xl:text-[80px]'>
            <span className='text-vip-chalk'>{match.home}</span>
            <span className='flex items-center gap-4'>
              <span className='font-sans text-[20px] font-normal normal-case leading-[normal] text-vip-mist sm:text-[28px]'>
                vs
              </span>
              <span className='text-vip-gold-text'>{match.away}</span>
            </span>
          </h1>
          <p className='text-[15px] leading-[normal] text-[#d9dbd6] sm:whitespace-pre sm:text-[18px]'>
            {`${match.venue}, ${match.city}  ·  ${formatVipLongDate(match.date)}  ·  ${formatVipTime(match.date)} local time`}
          </p>
        </div>

        <VipCountdownCard
          className='xl:absolute xl:right-8 xl:top-24'
          title={`${match.home} vs ${match.away}`}
          subtitle={`${match.venue}, ${match.city}`}
          kickoff={kickoffInstant(match.date).toISOString()}
        />

        {/* ── CTA (right edge, y=446 → 75px above the bottom) ── */}
        <div className='flex flex-col items-start gap-3 xl:absolute xl:bottom-[75px] xl:right-8 xl:items-end'>
          <VipButtonLink href={seatsHref} arrow>
            {match.priceFrom
              ? `Start building from ${formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)} per person`
              : 'Start building'}
          </VipButtonLink>
          <p className='text-[13px] leading-[normal] text-vip-mist'>
            Hospitality ticket · Flight · Hotel · One payment
          </p>
        </div>
      </div>
    </section>
  )
}
