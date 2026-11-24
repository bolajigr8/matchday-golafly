'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { FixtureRow } from '@/components/matches/fixture-row'
import { enterBuilder } from '@/features/builder/enter'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { useMatchdayEvents } from '@/features/matchday/hooks'
import {
  formatKickoffTime,
  formatMatchdayMoney,
  isTimeTba,
  parseEventDate,
  toEventFilterDate,
  eventTime,
  compareEventDates,
} from '@/features/matchday/format'
import type { MatchdayEvent } from '@/features/matchday/types'
import type { CategoryInfo, SeatListing } from '@/features/matchday/seats'
import { FAQ_CATEGORIES } from '@/store/faqs'

/* The three sections under the seats page: match FAQ, similar matches and
 * "Remarks before you buy". Every statement is either this match's live data
 * (date, venue, prices, delivery types, sellers' notes) or copied from the
 * site's own Help & FAQs (store/faqs.ts) — one source of truth, so these
 * answers can never contradict /help-faqs. */

/** An answer from the Help & FAQs page, by its exact question. */
function helpAnswer(question: string): string | null {
  for (const c of FAQ_CATEGORIES) {
    const hit = c.items.find((i) => i.q === question)
    if (hit) return hit.a
  }
  return null
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className='mb-4 flex flex-wrap items-end justify-between gap-2'>
      <h2 className='text-xl font-bold text-foreground sm:text-2xl'>{children}</h2>
      {aside}
    </div>
  )
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */

export function SeatsFaq({
  home,
  away,
  dateISO,
  venueName,
  city,
  listings,
  categories,
  currency,
}: {
  home: string
  away: string
  dateISO?: string | null
  venueName?: string | null
  city?: string | null
  listings: SeatListing[]
  categories: CategoryInfo[]
  currency: string | null
}) {
  const fixture = `${home} vs ${away}`
  const money = (n: number) => formatMatchdayMoney(n, currency ?? 'EUR')

  const items = useMemo(() => {
    const out: { q: string; a: React.ReactNode }[] = []

    // When
    const date = dateISO ? parseEventDate(dateISO) : null
    const validDate = date && !Number.isNaN(date.getTime())
    const where = [venueName, city].filter(Boolean).join(', ')
    out.push({
      q: `When is ${fixture}?`,
      a: validDate ? (
        <>
          {fixture} is scheduled for{' '}
          <b>
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(date!)}
          </b>
          {isTimeTba(dateISO) ? (
            <>. The kick-off time hasn’t been confirmed yet</>
          ) : (
            <>
              , kick-off <b>{formatKickoffTime(dateISO)}</b> (local time)
            </>
          )}
          {where ? <> at {where}</> : null}. Dates and kick-off times are set by the organiser and
          can change.
        </>
      ) : (
        <>The date for {fixture} hasn’t been confirmed yet. It will show here as soon as it is announced.</>
      ),
    })

    // Price
    const seated = categories.filter((c) => c.listingCount > 0).sort((a, b) => a.minPrice - b.minPrice)
    const min = listings.length ? Math.min(...listings.map((l) => l.fromPrice)) : null
    out.push({
      q: `How much do ${fixture} tickets cost?`,
      a:
        min === null ? (
          <>No tickets are listed for this match right now. New listings appear here as soon as they are available.</>
        ) : (
          <>
            Tickets currently start from <b>{money(min)}</b> per ticket, across {listings.length} listing
            {listings.length === 1 ? '' : 's'}. Prices depend on the seating category
            {seated.length > 1 ? ':' : '.'}
            {seated.length > 1 && (
              <ul className='mt-2 grid gap-1 sm:grid-cols-2'>
                {seated.slice(0, 8).map((c) => (
                  <li key={c.id} className='flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2.5 py-1'>
                    <span className='flex min-w-0 items-center gap-2'>
                      <span className='size-2.5 shrink-0 rounded-sm' style={{ background: c.color }} />
                      <span className='truncate'>{c.name}</span>
                    </span>
                    <span className='shrink-0 font-semibold text-foreground'>from {money(c.minPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ),
    })

    // Delivery
    const types = [...new Set(listings.map((l) => l.delivery).filter((d): d is string => !!d))]
    const when = helpAnswer('When will I receive my tickets?')
    out.push({
      q: `How will my ${fixture} tickets be delivered?`,
      a: (
        <>
          {types.length > 0 && (
            <>
              Listings for this match are delivered as <b>{types.join(', ')}</b> — each listing shows its delivery
              method before you buy.{' '}
            </>
          )}
          {when}
        </>
      ),
    })

    // Reschedule
    const resched = helpAnswer('What happens if the match is rescheduled or postponed?')
    if (resched) {
      out.push({
        q: 'What happens if the match is rescheduled or postponed?',
        a: (
          <>
            {resched}{' '}
            <Link href='/legal/refund' className='font-semibold text-brand-text underline underline-offset-2'>
              Read our refund policy
            </Link>
            .
          </>
        ),
      })
    }
    return out
  }, [fixture, dateISO, venueName, city, listings, categories, currency]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-labelledby='seats-faq' className='mt-12'>
      <SectionTitle>
        <span id='seats-faq'>Frequently asked questions</span>
      </SectionTitle>
      <div className='grid items-start gap-3 lg:grid-cols-2'>
        {items.map((it) => (
          <details
            key={it.q}
            className='group rounded-xl border border-border bg-card shadow-sm open:shadow-md'
          >
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-foreground sm:px-5 sm:text-[15px] [&::-webkit-details-marker]:hidden'>
              {it.q}
              <ChevronDown className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
            </summary>
            <div className='border-t border-border/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground sm:px-5'>
              {it.a}
            </div>
          </details>
        ))}
      </div>
      <p className='mt-3 text-xs text-muted-foreground'>
        More answers in{' '}
        <Link href='/help-faqs' className='font-semibold text-brand-text underline underline-offset-2'>
          Help &amp; FAQs
        </Link>
        .
      </p>
    </section>
  )
}

/* ── Similar matches ─────────────────────────────────────────────────── */

/** Rows shown — the same count as the homepage's popular-matches list. */
const SIMILAR_SHOWN = 6

export function SimilarMatches({
  eventId,
  homeId,
  awayId,
  tourId,
  tourName,
}: {
  eventId: number | null
  homeId?: number | null
  awayId?: number | null
  tourId?: number | null
  tourName?: string | null
}) {
  // Upcoming fixtures of both clubs first, then the rest of the competition.
  const router = useRouter()
  const upsert = useLiveMatchCache((st) => st.upsert)
  const [now] = useState(() => Date.now())
  const from = useMemo(() => toEventFilterDate(new Date(now)), [now])
  const opts = { per_page: 8, from_date: from }
  const hH = useMatchdayEvents({ ...opts, home_team_id: homeId ?? undefined }, { enabled: !!homeId })
  const hA = useMatchdayEvents({ ...opts, away_team_id: homeId ?? undefined }, { enabled: !!homeId })
  const aH = useMatchdayEvents({ ...opts, home_team_id: awayId ?? undefined }, { enabled: !!awayId })
  const aA = useMatchdayEvents({ ...opts, away_team_id: awayId ?? undefined }, { enabled: !!awayId })
  const tour = useMatchdayEvents({ ...opts, tour_id: tourId ?? undefined }, { enabled: !!tourId })

  const events = useMemo(() => {
    const seen = new Set<number>(eventId ? [eventId] : [])
    const pick = (list?: MatchdayEvent[]) =>
      (list ?? [])
        .filter((e) => !seen.has(e.id) && !e.postponed && eventTime(e.date) >= now)
        .sort((a, b) => compareEventDates(a.date, b.date))
    const teams = pick([...(hH.data?.events ?? []), ...(hA.data?.events ?? []), ...(aH.data?.events ?? []), ...(aA.data?.events ?? [])])
    const out: MatchdayEvent[] = []
    for (const e of [...teams, ...pick(tour.data?.events)]) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
      out.push(e)
      if (out.length === SIMILAR_SHOWN) break
    }
    return out
  }, [now, eventId, hH.data, hA.data, aH.data, aA.data, tour.data])

  if (!events.length) return null

  return (
    <section aria-labelledby='seats-similar' className='mt-12'>
      <SectionTitle aside={tourName ? <span className='text-xs text-muted-foreground'>{tourName}</span> : null}>
        <span id='seats-similar'>Similar matches</span>
      </SectionTitle>
      {/* Same fixture rows as the homepage list and the /matches page. */}
      <div className='space-y-3'>
        {events.map((e, i) => (
          <FixtureRow
            key={e.id}
            event={e}
            index={i}
            onBook={() => {
              upsert(e)
              enterBuilder(router, String(e.id))
            }}
          />
        ))}
      </div>
    </section>
  )
}

/* ── Remarks before buying ───────────────────────────────────────────── */

export function SeatsRemarks({ listings }: { listings: SeatListing[] }) {
  // What sellers of THIS match require (e.g. "Passolig Account Required
  // (Turkey)", "Personalized Tickets – Attendee Details Required").
  const requirements = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of listings) for (const n of l.notes) counts.set(n, (counts.get(n) ?? 0) + 1)
    return [...counts.entries()]
      .filter(([n]) => n.length <= 140 && !/^home supporters( section)?$/i.test(n))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([n]) => n)
  }, [listings])

  const general = [
    helpAnswer('Can I choose where I sit?'),
    'Event dates and kick-off times are set by the organiser and can change. ' +
      (helpAnswer('What happens if the match is rescheduled or postponed?') ?? ''),
    helpAnswer('What do I need to enter the stadium?'),
    helpAnswer('What can I bring inside?'),
    'Each listing shows its category, delivery method, seating arrangement and any restrictions before you buy — please read them carefully.',
  ].filter((x): x is string => !!x)

  return (
    <section aria-labelledby='seats-remarks' className='mt-12'>
      <SectionTitle>
        <span id='seats-remarks'>Good to know before you buy</span>
      </SectionTitle>
      <div className='rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6'>
        {requirements.length > 0 && (
          <div className='mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4'>
            <p className='text-sm font-bold text-foreground'>Requirements from sellers for this match</p>
            <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
              {requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className='mt-2 text-xs text-muted-foreground'>
              Not every listing has every requirement — check the listing you choose.
            </p>
          </div>
        )}
        <ul className='list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground'>
          {general.map((g) => (
            <li key={g}>{g}</li>
          ))}
          <li>
            Cancellations and refunds follow our{' '}
            <Link href='/legal/refund' className='font-semibold text-brand-text underline underline-offset-2'>
              refund policy
            </Link>{' '}
            and{' '}
            <Link href='/legal/terms' className='font-semibold text-brand-text underline underline-offset-2'>
              terms &amp; conditions
            </Link>
            .
          </li>
        </ul>
      </div>
    </section>
  )
}
