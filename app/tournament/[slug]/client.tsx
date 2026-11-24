'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import {
  useMatchdayEvents,
  useMatchdayTournaments,
} from '@/features/matchday/hooks'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { enterBuilder } from '@/features/builder/enter'
import { formatMatchdayMoney, compareEventDates } from '@/features/matchday/format'
import { findTournamentIdByName } from '@/features/matchday/resolve'
import { useFlyers } from '@/features/matchday/flyers'
import {
  CardSlider,
  PREMIER_LEAGUE_SLIDES,
} from '@/components/home/featured-clubs'
import { FixtureRow } from '@/components/matches/fixture-row'
import type { MatchdayEvent, EventFilters } from '@/features/matchday/types'
import type { EventsResult } from '@/features/matchday/client'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

const PER_PAGE = 50

export function TournamentPageClient({
  tourId,
  initialName,
  initialPage,
}: {
  tourId: number
  /** Name from the server, so the H1 never ships as a placeholder. */
  initialName?: string
  /** Page 1 of fixtures, loaded on the server so the list is in the raw HTML
   *  (SEO brief, Task 1). The browser still loads its own copy (in the
   *  visitor's currency) and swaps it in. */
  initialPage?: EventsResult
}) {
  const router = useRouter()
  const upsert = useLiveMatchCache((s) => s.upsert)
  const [page, setPage] = useState(1)
  const [allEvents, setAllEvents] = useState<MatchdayEvent[]>(
    () => initialPage?.events ?? [],
  )

  const { data: tournaments } = useMatchdayTournaments()
  const tournament = tournaments?.find((t) => t.tournament_id === tourId)
  const tourName = tournament?.name ?? initialName

  /* Premier League: the same rotating club images as the homepage's
     Premier League card (/public/flyers). Every other competition, or the
     Premier League with no flyer images available, keeps its badge. */
  const isPremierLeague =
    !!tournaments && findTournamentIdByName(tournaments, 'Premier League') === tourId
  const flyers = useFlyers(isPremierLeague)
  const plSlides = isPremierLeague
    ? PREMIER_LEAGUE_SLIDES.map((file) => flyers.srcFor(file)).filter(
        (src): src is string => !!src,
      )
    : []
  const showSlider = plSlides.length > 0
  const waitingForSlides = isPremierLeague && !flyers.ready

  const filters: EventFilters = { tour_id: tourId, per_page: PER_PAGE, page }
  const query = useMatchdayEvents(filters, { enabled: !!tourId })
  const { data, isFetching, refetch } = query
  // With page 1 from the server there is nothing to wait for on page 1, and
  // a failed browser refresh keeps the server's list instead of an error.
  const hasInitial = !!initialPage
  const isLoading = query.isLoading && !(hasInitial && page === 1)
  const isError = query.isError && !(hasInitial && allEvents.length > 0)

  const totalEvents =
    data?.meta?.total_events ?? initialPage?.meta.total_events ?? 0
  const hasMore = allEvents.length < totalEvents

  useEffect(() => {
    const incoming = data?.events ?? []
    if (!incoming.length) return
    if (page === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllEvents(incoming)
    } else {
      setAllEvents((prev) => {
        const map = new Map(prev.map((e) => [e.id, e]))
        for (const e of incoming) map.set(e.id, e)
        return Array.from(map.values()).sort((a, b) => compareEventDates(a.date, b.date))
      })
    }
  }, [data, page])

  useEffect(() => {
    for (const e of allEvents) upsert(e)
  }, [allEvents, upsert])

  const ticketed = allEvents.filter(
    (e) => e.min_price?.price != null && !e.postponed,
  )
  const comingSoon = allEvents.filter(
    (e) => e.min_price?.price == null && !e.postponed,
  )

  function handleBook(event: MatchdayEvent) {
    upsert(event)
    enterBuilder(router, String(event.id))
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Hero */}
      <div className='border-b border-border bg-gradient-to-b from-card to-background'>
        <div className='page-container py-10 sm:py-14'>
          <Link
            href='/matches'
            className='mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary'
          >
            <ArrowLeft className='size-3.5' /> Back to all fixtures
          </Link>

          <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8'>
            {/* Tournament badge */}
            <div
              className={
                showSlider || waitingForSlides
                  ? 'relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:size-28'
                  : 'flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted p-3 sm:size-28 sm:p-4'
              }
            >
              {showSlider ? (
                <CardSlider images={plSlides} />
              ) : waitingForSlides ? null : tournament?.banner ? (
                <img
                  src={tournament.banner}
                  alt={tournament.name}
                  className='h-full w-full object-contain'
                />
              ) : (
                <div className='size-full rounded-xl bg-muted-foreground/20' />
              )}
            </div>

            <div>
              <p className='mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary'>
                Competition
              </p>
              <h1 className='font-heading text-3xl font-bold uppercase leading-none tracking-tight text-foreground sm:text-5xl'>
                {tourName ?? 'Tournament'}{' '}
                <span className='text-primary'>Tickets</span>
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                {isLoading
                  ? '…'
                  : `${totalEvents} fixture${totalEvents === 1 ? '' : 's'} in this competition`}
              </p>
              {ticketed[0] && (
                <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
                  Next fixture: {ticketed[0].team1.name} vs{' '}
                  {ticketed[0].team2.name} — from{' '}
                  {formatMatchdayMoney(
                    // ticketed is filtered to min_price.price != null above,
                    // so the non-null assertion here is safe. TypeScript can't
                    // narrow through Array.filter; we know the value exists.
                    eventFromPrice(ticketed[0].min_price) ??
                      ticketed[0].min_price.price!,
                    ticketed[0].min_price.currency_code,
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='page-container py-10 sm:py-14'>
        {isLoading && page === 1 && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading fixtures…</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <AlertTriangle className='size-5 text-amber-400' />
            <p className='text-sm font-semibold'>
              Couldn&apos;t load fixtures right now
            </p>
            <button
              onClick={() => refetch()}
              className='font-mono text-[11px] text-primary underline underline-offset-2'
            >
              Try again
            </button>
          </div>
        )}

        {/* Ticketed */}
        {!isLoading && !isError && ticketed.length > 0 && (
          <motion.div
            className='mb-10'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className='mb-4 rounded-t-xl border border-border bg-primary/5 px-5 py-3'>
              <p className='font-heading text-sm font-bold'>
                Upcoming {tourName ? `${tourName} ` : ''}Fixtures
              </p>
              <p className='font-mono text-[10px] text-muted-foreground'>
                {ticketed.length} event{ticketed.length === 1 ? '' : 's'} shown
                · {totalEvents} total
              </p>
            </div>
            <div className='space-y-2'>
              {ticketed.map((event, i) => (
                <FixtureRow
                  key={event.id}
                  event={event}
                  index={i}
                  onBook={() => handleBook(event)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Coming soon */}
        {!isLoading && !isError && comingSoon.length > 0 && (
          <motion.div
            className='mb-10'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className='mb-4 rounded-t-xl border border-border bg-muted/40 px-5 py-3'>
              <p className='font-heading text-sm font-bold'>
                Tickets coming soon
              </p>
              <p className='font-mono text-[10px] text-muted-foreground'>
                Inventory is added daily — check back soon.
              </p>
            </div>
            <div className='space-y-2'>
              {comingSoon.map((event, i) => (
                <FixtureRow key={event.id} event={event} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {!isLoading && !isError && allEvents.length === 0 && (
          <div className='py-20 text-center'>
            <p className='text-sm text-muted-foreground'>
              No fixtures found for this competition.
            </p>
            <Link
              href='/matches'
              className='mt-2 inline-block font-mono text-[11px] text-primary underline underline-offset-2'
            >
              Browse all fixtures →
            </Link>
          </div>
        )}

        {/* Load more */}
        {!isError && allEvents.length > 0 && hasMore && (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className='flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground transition-all hover:border-primary/40 hover:text-primary disabled:opacity-50'
            >
              {isFetching ? (
                <>
                  <Loader2 className='size-3.5 animate-spin' /> Loading…
                </>
              ) : (
                `Load more (${totalEvents - allEvents.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
