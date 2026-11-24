'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { AirportInput } from '@/components/flights/airport-input'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { kickoffInstant } from '@/features/vip/format'
import { setVipPrefs, useVipPrefs, VIP_MAX_GUESTS, type VipCabinPref } from '@/features/vip/prefs'
import { vipFlowHref } from '@/features/vip/routes'
import { VipCountdownCard as Countdown } from './countdown-card'
import { VipHeroMatchPicker } from './hero-match-picker'
import { VipCrowdVideo } from './crowd-video'

/* Figma: "Golafly Matchday · VIP Hospitality (Desktop)" → Hero (346:2445).
 *
 * The design is a 1440 × 860 canvas. From xl (1280px) up it is reproduced
 * exactly: page-container puts the content edge at x=112 on a 1440 screen,
 * the same as Figma, so every absolute offset below is Figma's x minus 112.
 * Below xl the same pieces stack (Figma has no mobile frames).
 *
 * Live data: the countdown and MATCH are the soonest VIP match the backend
 * has on sale. FLYING FROM, CABIN and GUESTS are the customer's own choices
 * (features/vip/prefs.ts): they pre-fill the flight search and the ticket
 * quantity later, nothing is priced here. The flight path animates from
 * their airport ("YOU" until one is picked) to the club's real airport. */

const ASSETS = {
  grid: '/figma/vip/hero-grid.svg',
  glow: '/figma/vip/hero-gold-glow.svg',
  dot: '/figma/vip/dot-gold.svg',
  path: '/figma/vip/flight-path-los-mad.svg',
  plane: '/figma/vip/plane.svg',
}

const label =
  'font-mono text-[11px] font-medium leading-[normal] tracking-[2.42px] text-vip-gold-text'

export function VipHero({
  match,
  matches = [],
  onPickMatch,
}: {
  /** The chosen (or soonest) match. */
  match: VipEventView | null
  /** Every VIP match on sale, for the MATCH picker. */
  matches?: VipEventView[]
  onPickMatch?: (m: VipEventView) => void
}) {
  const title = match ? `${match.home} vs ${match.away}` : 'VIP Hospitality'
  const kickoff = match ? kickoffInstant(match.date).toISOString() : undefined
  const prefs = useVipPrefs()

  return (
    <section className='dark relative isolate overflow-hidden bg-vip-ink xl:h-[860px]'>
      {/* ── Background layers ── */}
      <VipCrowdVideo className='absolute inset-0 -z-10' />
      <div className='absolute inset-0 -z-10 bg-linear-to-r from-[rgba(5,5,5,0.94)] via-[rgba(5,5,5,0.6)] to-[rgba(5,5,5,0.12)]' />
      <div className='absolute inset-0 -z-10 bg-linear-to-b from-[rgba(5,5,5,0)] from-55% to-vip-ink' />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ASSETS.grid} alt='' className='pointer-events-none absolute inset-0 -z-10 size-full' />
      {/* 620px glow box at x=980,y=-180 on 1440; the SVG carries its blur
          margin (inset -32.26% → 1020px), so it is placed by its outer box. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.glow}
        alt=''
        width={1020}
        height={1020}
        className='pointer-events-none absolute -right-[360px] -top-[380px] -z-10 size-[1020px] max-w-none'
      />

      <div className='page-container relative h-full pb-12 pt-14 sm:pt-20 xl:pb-0 xl:pt-24'>
        {/* ── Copy ── */}
        <div className='flex max-w-[860px] flex-col items-start gap-[30px]'>
          <p className='flex items-center gap-3 font-mono leading-[normal] text-[11px] font-medium tracking-[2.2px] text-vip-gold-text sm:text-[13px] sm:tracking-[2.86px]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSETS.dot} alt='' width={7} height={7} className='size-[7px] shrink-0' />
            GOLAFLY VIP · HOSPITALITY, FLIGHTS &amp; TICKETS
          </p>
          <h1 className='flex flex-col items-start gap-1.5 font-heading text-[44px] font-bold leading-[0.96] tracking-[-0.02em] sm:text-[64px] xl:text-[84px]'>
            <span className='text-vip-fg'>MATCHDAY,</span>
            <span className='bg-linear-to-r from-vip-gold-light to-vip-gold-deep px-[0.214em] pt-[0.048em] text-vip-on-gold'>
              FIRST CLASS.
            </span>
          </h1>
          <p className='max-w-[720px] text-[16px] leading-7 text-vip-body sm:text-[20px] sm:leading-8'>
            Hospitality seats at Spain’s biggest home matches, Business or First Class flights, a 4 or 5 star hotel
            and an eSIM, booked in one checkout.
          </p>
        </div>

        {/* ── Countdown (x=998, y=150 → flush with the content's right edge) ── */}
        <Countdown
          className='mt-10 xl:absolute xl:right-8 xl:top-[150px] xl:mt-0'
          title={title}
          subtitle={match ? `${match.venue}, ${match.city}` : ''}
          kickoff={kickoff}
        />

        {/* ── Flight path + plane (desktop composition only) ── */}
        {match && <FlightPath from={prefs.origin || 'YOU'} to={match.airport || match.city.slice(0, 3).toUpperCase()} />}

        {/* ── Booking bar (y=614, full content width) ── */}
        <div
          className={cn(
            'mt-8 flex flex-col gap-5 rounded-[28px] border border-vip-gold/45 bg-vip-panel/96 p-5',
            'xl:absolute xl:inset-x-8 xl:top-[614px] xl:mt-0 xl:h-24 xl:flex-row xl:items-center xl:gap-0 xl:rounded-full xl:py-2.5 xl:pl-7 xl:pr-2.5',
          )}
        >
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 xl:flex xl:items-center xl:gap-0'>
            <div className='flex min-w-0 flex-col items-start gap-1 xl:w-[300px] xl:pr-6'>
              <span className={label}>MATCH</span>
              {onPickMatch && matches.length > 0 ? (
                <VipHeroMatchPicker matches={matches} value={match} onChange={onPickMatch} />
              ) : (
                <span className='text-[17px] font-semibold leading-[normal] text-vip-fg'>{match ? title : '—'}</span>
              )}
            </div>
            <Divider />
            <div className='flex min-w-0 flex-col items-start gap-1 xl:w-[220px] xl:px-6'>
              <span className={label}>FLYING FROM</span>
              <div className='w-full text-[17px] font-semibold leading-[normal] text-vip-fg'>
                <AirportInput
                  value={prefs.origin}
                  onChange={(code) => setVipPrefs({ origin: /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : '' })}
                  label=''
                  placeholder='City or airport'
                  naked
                  dark
                />
              </div>
            </div>
            <Divider />
            <div className='flex flex-col items-start gap-1.5 xl:px-6'>
              <p className={label}>CABIN</p>
              <CabinToggle value={prefs.cabin ?? 'first'} onChange={(cabin) => setVipPrefs({ cabin })} />
            </div>
            <Divider />
            <div className='flex flex-col items-start gap-1 xl:px-6'>
              <span className={label}>GUESTS</span>
              <span className='flex items-center gap-2.5'>
                <button
                  type='button'
                  aria-label='Fewer guests'
                  disabled={prefs.guests <= 1}
                  onClick={() => setVipPrefs({ guests: prefs.guests - 1 })}
                  className='grid size-7 place-items-center rounded-full border border-vip-line/20 text-vip-fg transition-colors hover:border-vip-gold/60 disabled:opacity-40'
                >
                  <Minus aria-hidden className='size-3.5' />
                </button>
                <span className='min-w-[76px] text-center text-[17px] font-semibold leading-[normal] text-vip-fg' aria-live='polite'>
                  {prefs.guests} {prefs.guests === 1 ? 'adult' : 'adults'}
                </span>
                <button
                  type='button'
                  aria-label='More guests'
                  disabled={prefs.guests >= VIP_MAX_GUESTS}
                  onClick={() => setVipPrefs({ guests: prefs.guests + 1 })}
                  className='grid size-7 place-items-center rounded-full border border-vip-line/20 text-vip-fg transition-colors hover:border-vip-gold/60 disabled:opacity-40'
                >
                  <Plus aria-hidden className='size-3.5' />
                </button>
              </span>
            </div>
          </div>
          <div className='hidden flex-1 xl:block' />
          <Link
            href={match ? vipFlowHref(match.club, match.eventId) : '#pick-your-match'}
            className='flex h-14 items-center justify-center gap-2.5 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-[30px] font-semibold leading-[normal] text-[#0a0a0a] transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light xl:h-[76px]'
          >
            <span className='text-[16px]'>Build my VIP trip</span>
            <ArrowRight aria-hidden className='size-[17px]' strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Pieces ─────────────────────────────────────────────────────────── */

function Divider() {
  return <div aria-hidden className='hidden h-11 w-px shrink-0 bg-vip-line/12 xl:block' />
}

/** Shared with the cabin section below the hero. First Class first (client request). */
export function VipCabinToggle({
  value,
  onChange,
  size = 's',
}: {
  value: VipCabinPref
  onChange: (c: VipCabinPref) => void
  size?: 's' | 'l'
}) {
  const options: { value: VipCabinPref; label: string }[] = [
    { value: 'first', label: size === 'l' ? 'First Class' : 'First' },
    { value: 'business', label: size === 'l' ? 'Business Class' : 'Business' },
  ]
  return (
    <div
      role='radiogroup'
      aria-label='Cabin class'
      className={cn(
        'flex shrink-0 gap-0.5 rounded-full',
        size === 'l' ? 'self-start border border-vip-line/12 bg-vip-tint/6 p-1 lg:self-auto' : 'bg-vip-line/6 p-[3px]',
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type='button'
            role='radio'
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-full font-semibold leading-[normal] transition-colors',
              size === 'l' ? 'px-6 py-3 text-[15px]' : 'px-3.5 py-[5px] text-[14px]',
              active
                ? size === 'l'
                  ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep text-vip-on-gold'
                  : 'bg-vip-gold text-vip-on-gold'
                : 'text-vip-muted hover:text-vip-fg',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const CabinToggle = (p: { value: VipCabinPref; onChange: (c: VipCabinPref) => void }) => <VipCabinToggle {...p} />

/* Plane centre points and headings along the dashed arc, read from the five
   Figma variants of "VIP · Plane glide" (358:2771). */
const GLIDE = {
  x: [15, 135, 255, 375, 480],
  y: [111.83, 50.97, 21.21, 22.56, 49.25],
  rotate: [-32.49, -20.69, -6.75, 8.01, 20.18],
}

function FlightPath({ from, to }: { from: string; to: string }) {
  const reduce = useReducedMotion()
  const mono = 'absolute font-mono text-[12px] font-medium tracking-[2.64px] text-vip-gold-text'
  return (
    /* Figma x=860 → 748 inside the content box. */
    <div aria-hidden className='pointer-events-none absolute left-[calc(2rem+748px)] top-[420px] hidden h-[150px] w-[520px] xl:block'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ASSETS.path} alt='' width={522} height={152} className='absolute -left-0.5 top-0 h-[152px] w-[522px] max-w-none' />
      <motion.div
        className='absolute left-0 top-0 size-[30px]'
        initial={{ x: GLIDE.x[0], y: GLIDE.y[0], rotate: GLIDE.rotate[0] }}
        animate={reduce ? undefined : { x: GLIDE.x, y: GLIDE.y, rotate: GLIDE.rotate }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.2 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.plane}
          alt=''
          width={39.33}
          height={38.17}
          /* Figma insets the SVG -13.61% / -15.56% around its 30px box. */
          className='absolute -left-[4.67px] -top-[4.08px] h-[38.17px] w-[39.33px] max-w-none'
        />
      </motion.div>
      <span className={cn(mono, 'left-0 top-[155px]')}>{from}</span>
      <span className={cn(mono, 'left-[492px] top-20')}>{to}</span>
    </div>
  )
}
