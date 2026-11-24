'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipShortDate, vipAddDays, vipYmd } from '@/features/vip/format'
import { setVipPrefs, useVipPrefs, type VipCabinPref } from '@/features/vip/prefs'
import { VipCabinToggle } from './hero'
import { VipSectionHead } from './section-head'

/* Figma: "VIP · Cabin section" (358:2590, used as 358:2591 on the page).
 * Header row with a First/Business toggle, then two equal cards. The
 * toggle, the cards and the hero's cabin switch are one choice
 * (features/vip/prefs.ts), which the flight search then starts from.
 *
 * Live data: the route is the customer's airport (hero "FLYING FROM") to
 * the club's real airport, and the dates are the backend's flight window
 * (out from the day before the match, back up to 3 days after). Flight
 * prices only exist after a search, so the card says "Priced live" where
 * Figma has "Return from €…". The lines are what the backend guarantees
 * for every VIP flight, not airline marketing. */

interface CabinCard {
  cabin: VipCabinPref
  title: string
  tagline: (city: string) => string
  image: string
  columns: 1 | 2
}

const CABINS: CabinCard[] = [
  { cabin: 'first', title: 'FIRST CLASS', tagline: (city) => `The ultimate way to ${city}`, image: '/figma/vip/cabin-first.jpg', columns: 1 },
  { cabin: 'business', title: 'BUSINESS CLASS', tagline: () => 'Rest, work, arrive ready', image: '/figma/vip/cabin-business.jpg', columns: 2 },
]

const perks = (cabin: VipCabinPref, match: VipEventView) => [
  {
    title: cabin === 'first' ? 'First Class on every leg' : 'Business Class on every leg',
    body: 'Every flight in your package is checked for the cabin before it is added.',
  },
  { title: 'There before kick-off', body: `Lands in ${match.city} at least 4 hours before the match.` },
  { title: 'Bags and seats', body: 'Add bags and pick seats where the airline offers them.' },
  { title: 'Return optional', body: 'Fly home up to 3 days after the match, or one way only.' },
]

export function VipCabinSection({
  match,
  seatsHref,
}: {
  match: VipEventView | null
  /** Where "Choose …" goes next: the match's seats (with the step 2 pick). */
  seatsHref: string | null
}) {
  const prefs = useVipPrefs()
  const router = useRouter()
  if (!match) return null
  const cabin = prefs.cabin ?? 'first'
  const from = prefs.origin || 'YOU'
  const to = match.airport || match.city

  return (
    <section aria-labelledby='vip-cabin-title' className='bg-vip-ink py-16 sm:py-24 xl:py-[100px]'>
      <div className='page-container flex flex-col gap-10 xl:gap-12'>
        <div className='flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between'>
          <VipSectionHead
            id='vip-cabin-title'
            tone='gradient'
            eyebrow='STEP 03 · YOUR FLIGHT'
            line1='ARRIVE THE WAY'
            line2='YOU WATCH.'
            intro={`${prefs.origin ? `Flights from ${prefs.origin}` : 'Flights from your airport'} to ${to} for ${match.home} vs ${match.away}, Business or First Class only.`}
          />
          <VipCabinToggle size='l' value={cabin} onChange={(c) => setVipPrefs({ cabin: c })} />
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {CABINS.map((c) => (
            <Card
              key={c.cabin}
              card={c}
              match={match}
              from={from}
              to={to}
              selected={c.cabin === cabin}
              onSelect={() => {
                /* Save the cabin (the flight search starts from it), then
                   go on to choose seats for this match. */
                setVipPrefs({ cabin: c.cabin })
                if (seatsHref) router.push(seatsHref)
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({
  card,
  match,
  from,
  to,
  selected,
  onSelect,
}: {
  card: CabinCard
  match: VipEventView
  from: string
  to: string
  selected: boolean
  onSelect: () => void
}) {
  const matchDay = vipYmd(match.date)
  const name = card.cabin === 'first' ? 'First Class' : 'Business Class'
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-[28px]',
        selected
          ? 'border-[1.5px] border-vip-gold bg-linear-to-b from-vip-warm to-vip-panel'
          : 'border border-vip-line/8 bg-vip-card',
      )}
    >
      {/* ── Photo ── */}
      <div className='dark relative h-[220px] shrink-0 sm:h-80'>
        <Image src={card.image} alt='' fill sizes='(min-width: 1024px) 600px, 100vw' className='object-cover' />
        <div className='absolute inset-0 bg-linear-to-b from-[rgba(5,5,5,0)] from-50% to-[rgba(13,13,13,0.95)]' />
        <span
          className={cn(
            'absolute left-6 top-6 rounded-full px-3.5 py-[7px] text-[13px] font-semibold leading-[normal] whitespace-pre',
            selected
              ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep text-vip-on-gold'
              : 'bg-[rgba(5,5,5,0.65)] text-vip-fg',
          )}
        >
          {selected ? '★  Selected' : 'Available'}
        </span>
      </div>

      {/* ── Body ── */}
      <div className='flex flex-1 flex-col gap-[22px] px-5 pb-8 pt-7 sm:px-8'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div className='flex flex-col gap-1.5'>
            <h3
              className={cn(
                'font-heading text-[28px] font-bold leading-[0.96] tracking-[-0.02em] sm:text-[36px]',
                selected ? 'text-vip-gold-text' : 'text-vip-fg',
              )}
            >
              {card.title}
            </h3>
            <p className='text-[15px] leading-[normal] text-vip-muted'>{card.tagline(match.city)}</p>
          </div>
          <div className='flex flex-col items-end gap-0.5 leading-[normal]'>
            <span className='text-[12.5px] text-vip-muted'>Price</span>
            <span className={cn('text-[24px] font-bold', selected ? 'text-vip-gold-text' : 'text-vip-fg')}>Priced live</span>
            <span className='flex items-center gap-1 text-[12.5px] text-vip-muted'>
              {from}
              <ArrowLeftRight aria-label='and back' className='size-3' strokeWidth={2.25} />
              {to} · when you search
            </span>
          </div>
        </div>

        {/* Flight window (backend rules) */}
        <div className='flex flex-col gap-3 rounded-[14px] border border-vip-gold/28 bg-vip-gold/5 px-[18px] py-4'>
          <Leg
            label={`OUTBOUND · ${formatVipShortDate(vipAddDays(matchDay, -1)).toUpperCase()} – ${formatVipShortDate(matchDay).toUpperCase()}`}
            from={from}
            to={to}
            meta='Lands 4h+ before kick-off'
          />
          <Leg
            label={`RETURN · ${formatVipShortDate(vipAddDays(matchDay, 1)).toUpperCase()} – ${formatVipShortDate(vipAddDays(matchDay, 3)).toUpperCase()}`}
            from={to}
            to={from}
            meta='Optional'
          />
          <p className='border-t border-vip-line/7 pt-2.5 text-[12px] leading-[normal] text-vip-mist'>
            Dates set from your match · you choose the exact flight in your trip builder
          </p>
        </div>

        <ul className={cn('grid grid-cols-1 gap-4', card.columns === 2 && 'sm:grid-cols-2')}>
          {perks(card.cabin, match).map((perk) => (
            <li key={perk.title} className='flex flex-col gap-1 rounded-2xl border border-vip-line/6 bg-vip-tint/4 p-4'>
              <p className='flex items-center gap-2 text-[15px] font-semibold leading-[normal] text-vip-fg'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/figma/vip/dot-gold.svg' alt='' width={6} height={6} className='size-1.5 shrink-0' />
                {perk.title}
              </p>
              <p className='text-[13.5px] leading-5 text-vip-muted'>{perk.body}</p>
            </li>
          ))}
        </ul>

        <div className='flex-1' />

        <button
          type='button'
          onClick={onSelect}
          className={cn(
            'flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full px-[30px] text-[16px] font-semibold leading-[normal] transition-[border-color]',
            selected
              ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep text-vip-gold-ink'
              : 'border border-vip-line/25 text-vip-fg hover:border-vip-line/50',
          )}
        >
          {selected ? `Continue with ${name}` : `Choose ${name}`}
          <ArrowRight aria-hidden className='size-[17px]' strokeWidth={2.25} />
        </button>
      </div>
    </article>
  )
}

function Leg({ label, from, to, meta }: { label: string; from: string; to: string; meta: string }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 leading-[normal]'>
      <p className='font-mono text-[10.5px] font-medium tracking-[0.84px] text-vip-gold-text sm:w-[240px] sm:whitespace-nowrap'>{label}</p>
      <p className='flex items-center gap-2 whitespace-nowrap'>
        <span className='font-heading text-[16px] font-bold text-vip-chalk'>{from}</span>
        <ArrowRight aria-label='to' className='size-3.5 text-vip-gold-strong' strokeWidth={2.25} />
        <span className='font-heading text-[16px] font-bold text-vip-chalk'>{to}</span>
      </p>
      <p className='whitespace-nowrap text-[12.5px] text-vip-mist'>{meta}</p>
    </div>
  )
}
