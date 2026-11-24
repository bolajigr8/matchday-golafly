'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { VipButtonLink } from '@/components/vip/flow/button'
import { VipEyebrow } from '@/components/vip/flow/eyebrow'
import { VipLoading, VipNotice } from '@/components/vip/flow/state'
import { VipHowItWorks } from '@/components/vip/how-it-works'
import { vipEventView, type VipEventView } from '@/features/vip/clubs'
import { formatVipKickoff, formatVipMediumDate, formatVipPrice, formatVipTime } from '@/features/vip/format'
import { useVipClubEvents, useVipEvent, useVipListings } from '@/features/vip/hooks'
import { vipFlowHref } from '@/features/vip/routes'
import { VipMatchHero } from './match-hero'

/* VIP Flow · 1 · Match (Figma 504:2985): hero → match facts → about &
   travel overview → more matches of the same club → build in 4 steps.
   Everything about the match comes from the backend's event. */

const monoLabel = 'font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'

export function VipMatchClient({ club, eventId }: { club: string; eventId: number }) {
  const { event, loading, error, missing } = useVipEvent(club, eventId)

  if (loading) {
    return (
      <div className='page-container py-10'>
        <VipLoading />
      </div>
    )
  }
  if (error || missing || !event) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='This match isn’t available as a VIP package'
          message={
            error && error.status !== 404
              ? error.message
              : 'It may have sold out, or it is too close to kick-off to fly in. Pick another match.'
          }
          action={{ href: '/vip#pick-your-match', label: 'See VIP matches' }}
        />
      </div>
    )
  }

  const match = vipEventView(event)
  const seatsHref = vipFlowHref(match.club, match.eventId, 'seats')
  return (
    <>
      <VipMatchHero match={match} />
      <MatchFacts match={match} />
      <About match={match} seatsHref={seatsHref} />
      <Upcoming match={match} />
      <VipHowItWorks
        cta={{
          href: seatsHref,
          label: match.priceFrom
            ? `Start building from ${formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)} per person`
            : 'Start building',
        }}
      />
    </>
  )
}

/* ── Match details strip (504:3061): five equal columns ── */
function MatchFacts({ match }: { match: VipEventView }) {
  const facts = [
    { label: 'MATCH DATE', value: formatVipMediumDate(match.date) },
    { label: 'KICK OFF', value: `${formatVipTime(match.date)} local time` },
    { label: 'VENUE', value: match.venue },
    { label: 'CITY', value: match.city },
    { label: 'FLY INTO', value: match.airport || match.city },
  ]
  return (
    <section aria-label='Match details' className='border-b border-vip-line/7'>
      <dl className='page-container grid grid-cols-2 gap-x-6 gap-y-6 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:py-9'>
        {facts.map((f) => (
          <div key={f.label} className='flex flex-col gap-1.5'>
            <dt className={monoLabel}>{f.label}</dt>
            <dd className='text-[15px] font-medium leading-[normal] text-vip-chalk sm:text-[16px]'>{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ── About & overview (Figma 506:4607): 792px copy + photo, 400px card ──
   Live data: the text is written from the backend's event (teams, venue,
   city, kick-off) and its real hospitality categories on sale; the photo is
   the club's Figma picture. The card's rows are the event's "from" price
   and the backend's flight rules. Figma's "First class from Lagos",
   "Hotels from" and "Chauffeur & concierge" rows are not shown: flight
   prices only exist after a search, hotel prices after a hotel search,
   and chauffeur/concierge are not sold. */
function About({ match, seatsHref }: { match: VipEventView; seatsHref: string }) {
  const listings = useVipListings(match.club, match.eventId)
  const categories = [...new Set((listings.data?.data ?? []).map((l) => l.category.category_name))]
  const rows = [
    ...(match.priceFrom
      ? [{ label: 'HOSPITALITY FROM', value: `${formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)} per person` }]
      : []),
    { label: 'FLIGHTS', value: 'Business or First · priced live' },
    { label: 'FLY INTO', value: match.airport || match.city },
    { label: 'HOTELS', value: '4 or 5 star · priced live' },
    { label: 'ESIM FOR SPAIN', value: 'Optional' },
  ]
  return (
    <section className='page-container flex flex-col gap-6 pt-14 lg:flex-row lg:items-start lg:pt-[72px]'>
      <div className='flex min-w-0 flex-1 flex-col gap-3.5'>
        <h2 className='font-heading text-[24px] font-bold leading-[normal] text-vip-chalk sm:text-[26px]'>
          About this match
        </h2>
        <p className='text-[16px] leading-[normal] text-vip-mist'>
          {match.home} host {match.away} at {match.venue}, {match.city}, on {formatVipMediumDate(match.date)}, kick-off{' '}
          {formatVipTime(match.date)} local time. Book your hospitality ticket and a Business or First Class flight into{' '}
          {match.airport || match.city} together, in one booking and one payment.
        </p>
        <h3 className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk sm:text-[22px]'>
          Inside the hospitality
        </h3>
        {categories.length > 0 && (
          <p className='text-[15px] leading-[normal] text-vip-mist'>On sale for this match: {categories.join(' · ')}.</p>
        )}
        <div className='relative aspect-[792/300] overflow-hidden rounded-[20px]'>
          <Image src={match.image} alt={`${match.venue}, ${match.city}`} fill sizes='(min-width: 1024px) 792px, 100vw' className='object-cover' />
        </div>
      </div>

      <aside className='flex w-full flex-col gap-3.5 rounded-[22px] border border-vip-gold/40 bg-vip-tint/3 p-[26px] lg:w-[400px] lg:shrink-0'>
        <h2 className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>Travel overview</h2>
        <dl className='flex flex-col gap-3.5'>
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </dl>
        <VipButtonLink href={seatsHref} arrow className='w-full'>
          Start building
        </VipButtonLink>
        <p className='text-[12px] leading-[normal] tracking-[-0.1px] text-vip-mist'>
          One secure payment · the price is confirmed in your package
        </p>
      </aside>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-4 border-b border-vip-line/6 pb-3'>
      <dt className={monoLabel}>{label}</dt>
      <dd className='text-right text-[14px] font-semibold leading-[normal] text-vip-gold-text'>{value}</dd>
    </div>
  )
}

/* ── More matches of the same club (513:3832): up to 4 cards; fewer are
   joined by a dashed "See every VIP fixture" card. ── */
function Upcoming({ match }: { match: VipEventView }) {
  const { data } = useVipClubEvents(match.club)
  const cards = (data ?? [])
    .filter((e) => e.id !== match.eventId)
    .slice(0, 4)
    .map(vipEventView)
  return (
    <section aria-labelledby='vip-upcoming-title' className='page-container flex flex-col gap-8 pt-20 lg:pt-24'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-3.5'>
          <VipEyebrow>{`MORE VIP MATCHES · ${match.city.toUpperCase()}`}</VipEyebrow>
          <h2
            id='vip-upcoming-title'
            className='font-heading text-[28px] font-bold uppercase leading-[1.02] text-vip-chalk sm:text-[40px]'
          >
            More big nights with
            <br />
            {match.home.toUpperCase()}.
          </h2>
        </div>
        <Link
          href='/vip#pick-your-match'
          className='flex shrink-0 items-center gap-2 text-[14px] font-semibold leading-[normal] text-vip-gold-text transition-[gap] hover:gap-3'
        >
          All VIP fixtures
          <ArrowRight aria-hidden className='size-[1em]' strokeWidth={2.25} />
        </Link>
      </div>
      <ul className='-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 scrollbar-hide sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0'>
        {cards.map((m) => (
          <li key={m.eventId} className='w-[289px] shrink-0 snap-start lg:w-auto'>
            <UpcomingCard match={m} />
          </li>
        ))}
        {cards.length < 4 && (
          <li className='w-[289px] shrink-0 snap-start lg:w-auto'>
            <Link
              href='/vip#pick-your-match'
              className='group flex h-[348px] flex-col justify-center gap-3 rounded-[20px] border border-dashed border-vip-gold/50 bg-vip-gold/5 px-6 py-7 transition-colors hover:border-vip-gold/80'
            >
              <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.32px] text-vip-gold-text'>
                MORE VIP NIGHTS
              </span>
              <span className='font-heading text-[22px] font-bold leading-[normal] text-vip-chalk'>
                See every VIP fixture this season
              </span>
              <span className='flex items-center gap-1.5 text-[13px] font-semibold leading-[normal] text-vip-gold-text transition-[gap] group-hover:gap-2.5'>
                Browse fixtures
                <ArrowRight aria-hidden className='size-[1em]' strokeWidth={2.25} />
              </span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}

/* "VIP · Upcoming match card" (510:3204): Default / Hover. */
function UpcomingCard({ match }: { match: VipEventView }) {
  return (
    <Link
      href={vipFlowHref(match.club, match.eventId)}
      className='group flex min-h-[348px] flex-col overflow-hidden rounded-[20px] border border-vip-line/8 bg-vip-tint/3 transition-[background-color,border-color,box-shadow] duration-300 hover:border-vip-gold/75 hover:bg-vip-gold/6 hover:shadow-[0_18px_48px_rgba(212,178,106,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
    >
      <div className='relative h-[168px] shrink-0 overflow-hidden'>
        <Image
          src={match.cardImage}
        /* Supplier stadium photos are small already; the image optimiser's
           server fetch to their CDN times out (500), so load them directly. */
        unoptimized={match.cardImage.startsWith('http')}
          alt=''
          fill
          sizes='(min-width: 1024px) 300px, 289px'
          className='object-cover transition-transform duration-500 group-hover:scale-110'
        />
        <div className='absolute inset-0 bg-linear-to-b from-transparent from-30% to-vip-ink/95' />
        <span className='dark absolute left-4 top-4 rounded-full bg-black/60 px-2.5 py-[5px] font-mono text-[10.5px] font-medium uppercase leading-[normal] tracking-[1.05px] text-vip-fg'>
          {match.city}
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-2 px-5 pb-6 pt-[18px]'>
        <p className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.1px] text-vip-gold-text'>
          {formatVipKickoff(match.date)}
        </p>
        <p className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>{match.home}</p>
        <p className='flex items-center gap-2'>
          <span className='text-[14px] leading-[normal] text-vip-mist'>vs</span>
          <span className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>{match.away}</span>
        </p>
        <p className='text-[13px] leading-[normal] text-vip-mist'>{match.venue}</p>
        <div className='mt-auto flex items-end justify-between gap-3 pt-2.5'>
          {match.priceFrom ? (
            <span className='flex flex-col gap-0.5 leading-[normal]'>
              <span className='text-[11.5px] text-vip-mist'>From · per person</span>
              <span className='text-[16px] font-semibold text-vip-gold-text'>
                {formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)}
              </span>
            </span>
          ) : (
            <span />
          )}
          <span className='flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold leading-[normal] text-vip-chalk transition-[gap] group-hover:gap-2.5'>
            View match
            <ArrowRight aria-hidden className='size-[1em]' strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </Link>
  )
}
