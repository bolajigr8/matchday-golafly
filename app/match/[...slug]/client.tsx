'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useResolvedMatch } from '@/features/builder/use-builder-match'
import { isMatchdayLive } from '@/features/matchday/config'
import { MATCHES } from '@/store/matchday'
import {
  formatKickoffTime,
  formatMatchdayMoney,
  isTimeTba,
} from '@/features/matchday/format'
import type { MatchdayEvent } from '@/features/matchday/types'
import { FreeEsimNote } from '@/components/free-esim/free-esim-note'

const imgHero = '/figma/fedc7f165d8fd2c10a48fded8d08fb5a48c7a33b.png'
const imgStadium = '/figma/b01eef212cfdae3dc78a4a2ae45b51bea5321ad5.png'
const imgSagrada = '/figma/1524a9703d60ba170b8762ae15b7455b02fe81f8.png'
const imgGothic = '/figma/b2955a2bb1a4d98a1b9b5c4568379e0feca7a587.png'
const imgParkGuell = '/figma/c75053ffa78035684ff89eb287af9944c565d266.png'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export function MatchDetailClient({
  id,
  initialEvent,
}: {
  id: string
  /** The event the server loaded: rendered straight into the HTML, so
   *  crawlers see the match details without running JavaScript. */
  initialEvent?: MatchdayEvent
}) {
  const live = isMatchdayLive()
  const match = useResolvedMatch(id, initialEvent)
  // Only meaningful for the mock path — real fixtures don't carry a
  // league colour/name, and the sections further down (Landmarks, Stadium
  // history, Getting There) are hand-written Barcelona content with no
  // real-data equivalent, so they're only rendered for a mock match.
  const mockExtra = !live
    ? MATCHES.find((m) => m.id === id) || MATCHES[2]
    : null

  // ── Price display helpers ───────────────────────────────────────────
  // priceFrom is nullable since the MatchDay Update doc — a fixture whose
  // currency cannot be converted returns null. Render "See tickets" in
  // that case; never hardcode the € symbol (doc: "Never hardcode a symbol,
  // and never convert on the client.").
  //
  // For mock data we fall back to "EUR" since the mock arrays have no
  // currency field and this section is only shown for the Barcelona demo.
  // Live fixtures carry the raw API date; the kick-off is read from it
  // ("TBA" when the time isn't known — features/matchday/format.ts).
  // Demo data keeps its own kickoff string.
  const kickoffTba = !!match.dateISO && isTimeTba(match.dateISO)
  const kickoffLabel = match.dateISO
    ? formatKickoffTime(match.dateISO)
    : match.kickoff || 'TBC'

  const hasPriceFrom = match.priceFrom != null
  const formattedPriceFrom = hasPriceFrom
    ? formatMatchdayMoney(match.priceFrom!, match.priceCurrency ?? 'EUR')
    : null

  return (
    <div className='relative min-h-screen bg-background'>
      {/* ── Hero ─── */}
      <div className='relative h-[340px] w-full overflow-hidden sm:h-[440px] md:h-[520px]'>
        <motion.img
          src={match.image || imgHero}
          alt={`${match.home} vs ${match.away}`}
          className='h-full w-full object-cover'
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20' />

        <motion.div
          className='absolute left-4 top-4 sm:left-6 sm:top-6'
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Link
            href='/matches'
            className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 backdrop-blur transition-all hover:border-white/30'
          >
            <ArrowLeft className='h-4 w-4 text-white' />
            <span className='font-mono text-[10px] tracking-wider text-white/80'>
              All Matches
            </span>
          </Link>
        </motion.div>

        {mockExtra && (
          <motion.span
            className='absolute right-4 top-4 font-mono text-xs tracking-wider sm:right-6 sm:top-6'
            style={{ color: mockExtra.leagueColor }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {mockExtra.league}
          </motion.span>
        )}

        <div className='absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-6 sm:pb-6'>
          <motion.div
            className='mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className='space-y-1.5'>
              <h1 className='text-3xl font-bold leading-tight text-white sm:text-5xl'>
                {match.home}{' '}
                <span className='text-xl font-normal text-white/50 sm:text-2xl'>
                  vs
                </span>{' '}
                {match.away}
              </h1>
              <p className='font-mono text-xs tracking-wider text-white/60'>
                {match.venue} · {match.date}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/builder/seats?match=${match.id}`}
                className='inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
              >
                Buy This Ticket{' '}
                <ArrowRight className='h-3.5 w-3.5' strokeWidth={2.5} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Match Facts ─── */}
      <motion.div
        className='content-container py-6 sm:py-8'
        variants={fadeUp}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <div className='grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4 sm:p-6 md:grid-cols-4'>
          {[
            ['Match Date', match.date],
            ['Kick-off', kickoffLabel],
            ['Venue', match.venue],
            [
              'Competition',
              mockExtra?.league ?? match.competition ?? 'MatchDay',
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <p className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                {label}
              </p>
              <p className='mt-2 text-base font-bold text-foreground sm:text-lg'>
                {value}
              </p>
            </div>
          ))}
        </div>
        <FreeEsimNote venueCountry={match.venueCountry} className='mt-3' />
      </motion.div>

      {/* ── Description ─── */}
      <motion.div
        className='content-container py-6 sm:py-8'
        variants={fadeUp}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <div className='grid gap-6 lg:grid-cols-3 lg:gap-8'>
          <div className='space-y-4 lg:col-span-2'>
            <h2 className='text-xl font-bold text-foreground sm:text-2xl'>
              About This Match
            </h2>
            {mockExtra ? (
              <p className='leading-relaxed text-muted-foreground'>
                The Estadi Olímpic de Montjuïc hosts FC Barcelona as they battle{' '}
                {match.away} in a La Liga encounter of the highest order.
                Perched on Montjuïc hill overlooking the city, the stadium
                offers a unique setting that blends sporting spectacle with
                breathtaking Mediterranean views.
              </p>
            ) : (
              <p className='leading-relaxed text-muted-foreground'>
                {match.home} host {match.away} at {match.venue}
                {kickoffTba ? ' (kick-off time to be confirmed)' : ''} — secure
                your seats now and Golafly will handle tickets, travel and
                everything else for matchday.
              </p>
            )}
          </div>
          <div className='space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6'>
            <h3 className='font-bold text-foreground'>Travel Overview</h3>
            {mockExtra ? (
              <dl className='space-y-2.5 text-sm'>
                {[
                  ['Country', 'Spain'],
                  ['Language', 'Catalan / Spanish'],
                  ['Currency', 'Euro (EUR)'],
                  ['Climate', '22–26 °C in June'],
                ].map(([dt, dd]) => (
                  <div
                    key={dt}
                    className='flex justify-between border-t border-border pt-2.5 first:border-0 first:pt-0'
                  >
                    <dt className='text-muted-foreground'>{dt}</dt>
                    <dd className='font-semibold text-foreground'>{dd}</dd>
                  </div>
                ))}
                <div className='border-t border-primary/30 pt-3'>
                  <p className='text-xs text-muted-foreground'>Packages from</p>
                  {/* Mock data: priceFrom is always a number on the mock path.
                      We still use formatMatchdayMoney for consistency, falling
                      back to EUR since mock data has no currency field. */}
                  <p className='mt-1 text-2xl font-bold text-primary'>
                    {formattedPriceFrom ?? 'See tickets'}
                  </p>
                </div>
              </dl>
            ) : (
              <div className='border-t border-primary/30 pt-3'>
                <p className='text-xs text-muted-foreground'>Tickets from</p>
                {/* Live path: priceFrom can be null when the fixture's currency
                    cannot be converted. Show "See tickets" in that case. Never
                    hardcode € — always use the currency the API returned. */}
                <p className='mt-1 text-2xl font-bold text-primary'>
                  {formattedPriceFrom ?? 'See tickets'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stadium (live matches) ───
          Real data only — venue name/image/capacity/city/country come
          straight from the event's venue object. No year-built, no
          attendance record, no "explore the city" content here: the API
          doesn't carry any of that, and this app doesn't fabricate it.
          The fuller mock-only Stadium/Explore/Getting There sections below
          are unchanged and still only render for the Barcelona demo. */}
      {!mockExtra && (match.venueImage || match.venueCapacity) && (
        <motion.div
          className='content-container py-6 sm:py-8'
          variants={fadeUp}
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className='mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl'>
            The Stadium
          </h2>
          <div className='space-y-5 sm:space-y-6'>
            {match.venueImage && (
              <div className='overflow-hidden rounded-xl'>
                <motion.img
                  src={match.venueImage}
                  alt={match.venue}
                  className='w-full object-cover'
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div>
                <p className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                  Venue
                </p>
                <p className='mt-2 text-xl font-bold text-foreground sm:text-2xl'>
                  {match.venue.split(',')[0]}
                </p>
              </div>
              {match.venueCapacity && (
                <div>
                  <p className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                    Capacity
                  </p>
                  <p className='mt-2 text-xl font-bold text-foreground sm:text-2xl'>
                    {Number(match.venueCapacity).toLocaleString()}
                  </p>
                </div>
              )}
              {(match.venueCity || match.venueCountry) && (
                <div>
                  <p className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                    Location
                  </p>
                  <p className='mt-2 text-xl font-bold text-foreground sm:text-2xl'>
                    {[match.venueCity, match.venueCountry]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Stadium / Landmarks / Getting There ───
          Hand-written Barcelona content with no live-data equivalent —
          only shown for the mock match this was written for, rather than
          showing fabricated details for a real fixture. */}
      {mockExtra && (
        <>
          <motion.div
            className='content-container py-6 sm:py-8'
            variants={fadeUp}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className='mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl'>
              The Stadium
            </h2>
            <div className='space-y-5 sm:space-y-6'>
              <div className='overflow-hidden rounded-xl'>
                <motion.img
                  src={imgStadium}
                  alt='Estadi Olímpic'
                  className='w-full object-cover'
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className='leading-relaxed text-muted-foreground'>
                Originally constructed in 1927 and renovated for the 1992
                Barcelona Olympic Games, the Estadi Olímpic de Montjuïc serves
                as FC Barcelona&apos;s temporary home during the Camp Nou
                renovation.
              </p>
              <div className='grid grid-cols-3 gap-4 sm:gap-6'>
                {[
                  ['Capacity', '54,867'],
                  ['Year Built', '1927'],
                  ['Record Attendance', '77,000'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                      {label}
                    </p>
                    <p className='mt-2 text-xl font-bold text-foreground sm:text-2xl'>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className='content-container py-6 sm:py-8'
            variants={fadeUp}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className='mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl'>
              Explore Barcelona
            </h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6'>
              {[
                {
                  img: imgSagrada,
                  name: 'Sagrada Família',
                  desc: "Gaudí's unfinished Baroque-Gothic masterpiece, under construction since 1882.",
                  dist: '5 km from venue',
                },
                {
                  img: imgGothic,
                  name: 'Gothic Quarter',
                  desc: "Barcelona's medieval old town, a labyrinth of narrow streets and ancient Roman ruins.",
                  dist: '4 km from venue',
                },
                {
                  img: imgParkGuell,
                  name: 'Park Güell',
                  desc: "Gaudí's whimsical public park featuring mosaic terraces with panoramic views.",
                  dist: '6 km from venue',
                },
              ].map(({ img, name, desc, dist }, i) => (
                <motion.div
                  key={name}
                  className='overflow-hidden rounded-xl border border-border bg-card'
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  whileHover={{ y: -4 }}
                >
                  <div className='overflow-hidden h-44 sm:h-48'>
                    <motion.img
                      src={img}
                      alt={name}
                      className='h-full w-full object-cover'
                      whileHover={{ scale: 1.07 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className='space-y-1.5 p-4'>
                    <h3 className='font-bold text-foreground'>{name}</h3>
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {desc}
                    </p>
                    <p className='font-mono text-xs text-primary'>{dist}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className='content-container py-6 sm:py-8'
            variants={fadeUp}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className='mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl'>
              Getting There
            </h2>
            <div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
              <div className='rounded-xl border border-border bg-card p-5 sm:p-6'>
                <h3 className='mb-3 font-bold text-foreground'>By Air</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  <span className='font-semibold text-foreground'>
                    Barcelona El Prat (BCN)
                  </span>
                  <br />
                  Transfer to city centre: 35 min by Aerobus or Metro L9
                </p>
              </div>
              <div className='rounded-xl border border-border bg-card p-5 sm:p-6'>
                <h3 className='mb-3 font-bold text-foreground'>By Train</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  <span className='font-semibold text-foreground'>
                    Estació de Sants (Sants Station)
                  </span>
                  <br />
                  Direct connections from major European cities
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Matchday Builder steps teaser ─── */}
      <motion.div
        className='content-container py-6 sm:py-8'
        variants={fadeUp}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
      >
        <div className='overflow-hidden rounded-2xl border border-border bg-card'>
          <div className='px-5 py-5 sm:px-6'>
            <p className='mb-1 font-mono text-[10px] tracking-[2px] text-primary'>
              Matchday Builder
            </p>
            <h2 className='text-lg font-bold text-foreground sm:text-xl'>
              Build your perfect matchday in 4 steps
            </h2>
          </div>
          <div className='grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0'>
            {[
              {
                num: '01',
                label: 'Pick Seats',
                sub: 'Choose your stand & category',
              },
              { num: '02', label: 'Add Extras', sub: 'Hotel, flights & eSIM' },
              { num: '03', label: 'Checkout', sub: 'Contact & payment info' },
              {
                num: '04',
                label: 'Confirmed',
                sub: 'E-tickets straight to email',
              },
            ].map((step) => (
              <div key={step.num} className='space-y-1 p-4 sm:p-5'>
                <p className='font-mono text-[10px] font-bold text-primary'>
                  {step.num}
                </p>
                <p className='text-[13px] font-bold text-foreground'>
                  {step.label}
                </p>
                <p className='text-[11px] leading-snug text-muted-foreground'>
                  {step.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── CTA ─── */}
      <motion.div
        className='content-container py-4 pb-12 sm:pb-16'
        variants={fadeUp}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
      >
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Link
            href={`/builder/seats?match=${match.id}`}
            className='block w-full rounded-full bg-primary py-4 text-center text-[15px] font-bold text-primary-foreground shadow-[0_0_20px_var(--brand-glow)] transition-all hover:shadow-[0_0_35px_var(--brand-glow)]'
          >
            {/* Never hardcode € — read currency from the API. Null guard for
                fixtures whose rate is unavailable (MatchDay Update doc). */}
            {hasPriceFrom
              ? `Start Building — From ${formattedPriceFrom}`
              : 'Start Building — See Tickets'}
          </Link>
        </motion.div>
        <p className='mt-3 text-center font-mono text-[10px] text-muted-foreground'>
          Free cancellation · E-tickets by email · All taxes included
        </p>
      </motion.div>
    </div>
  )
}
