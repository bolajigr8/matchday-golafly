'use client'
import { TeamCrest } from '@/components/tickets/primitives'

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useMatchdayEvents, useMatchdayTeams } from '@/features/matchday/hooks'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { enterBuilder } from '@/features/builder/enter'
import { formatMatchdayMoney, compareEventDates } from '@/features/matchday/format'
import { FixtureRow } from '@/components/matches/fixture-row'
import type { MatchdayEvent } from '@/features/matchday/types'
import type { EventsResult } from '@/features/matchday/client'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

// Max the API allows per page
const PER_PAGE = 100

export function TeamPageClient({
  teamId,
  initialName,
  initialPages,
}: {
  teamId: number
  /** Team name from the server, so the H1 is in the raw HTML (SEO plan §7). */
  initialName?: string
  /** Page 1 of home + away fixtures, loaded on the server so the list is in
   *  the raw HTML (SEO brief, Task 1). The browser still loads its own copy
   *  (in the visitor's currency) and swaps it in. */
  initialPages?: { home: EventsResult; away: EventsResult }
}) {
  const router = useRouter()
  const upsert = useLiveMatchCache((s) => s.upsert)

  const { data: teams } = useMatchdayTeams()
  const team = teams?.find((t) => t.team_id === teamId)

  // FIX: paginate both home+away queries so clubs with 100+ fixtures
  // (Real Madrid, Man City etc.) don't silently truncate.
  const [homePage, setHomePage] = useState(1)
  const [awayPage, setAwayPage] = useState(1)
  const [allHome, setAllHome] = useState<MatchdayEvent[]>(
    () => initialPages?.home.events ?? [],
  )
  const [allAway, setAllAway] = useState<MatchdayEvent[]>(
    () => initialPages?.away.events ?? [],
  )

  const homeQ = useMatchdayEvents(
    { home_team_id: teamId, per_page: PER_PAGE, page: homePage },
    { enabled: !!teamId },
  )
  const awayQ = useMatchdayEvents(
    { away_team_id: teamId, per_page: PER_PAGE, page: awayPage },
    { enabled: !!teamId },
  )

  // With fixtures from the server there is nothing to wait for: show them
  // (and keep showing them if the browser's refresh fails).
  const hasInitial = !!initialPages
  const isLoading = !hasInitial && (homeQ.isLoading || awayQ.isLoading)
  const isError = !hasInitial && (homeQ.isError || awayQ.isError)

  const homeTotalEvents =
    homeQ.data?.meta?.total_events ?? initialPages?.home.meta.total_events ?? 0
  const awayTotalEvents =
    awayQ.data?.meta?.total_events ?? initialPages?.away.meta.total_events ?? 0
  const hasMoreHome = allHome.length < homeTotalEvents
  const hasMoreAway = allAway.length < awayTotalEvents
  const hasMore = hasMoreHome || hasMoreAway

  // Accumulate home fixtures across pages
  useEffect(() => {
    const incoming = homeQ.data?.events ?? []
    if (!incoming.length) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllHome((prev) => {
      if (homePage === 1) return incoming
      const map = new Map(prev.map((e) => [e.id, e]))
      for (const e of incoming) map.set(e.id, e)
      return Array.from(map.values())
    })
  }, [homeQ.data, homePage])

  // Accumulate away fixtures across pages
  useEffect(() => {
    const incoming = awayQ.data?.events ?? []
    if (!incoming.length) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllAway((prev) => {
      if (awayPage === 1) return incoming
      const map = new Map(prev.map((e) => [e.id, e]))
      for (const e of incoming) map.set(e.id, e)
      return Array.from(map.values())
    })
  }, [awayQ.data, awayPage])

  const events = useMemo(() => {
    const map = new Map<number, MatchdayEvent>()
    for (const e of allHome) map.set(e.id, e)
    for (const e of allAway) map.set(e.id, e)
    // Soonest first; fixtures with no date yet (postponed) go last.
    return Array.from(map.values()).sort((a, b) => compareEventDates(a.date, b.date))
  }, [allHome, allAway])

  useEffect(() => {
    for (const e of events) upsert(e)
  }, [events, upsert])

  // FIX: guard min_price null before splitting into sections
  const ticketed = events.filter(
    (e) => !e.postponed && e.min_price?.price != null,
  )
  const comingSoon = events.filter(
    (e) => !e.postponed && e.min_price?.price == null,
  )
  const postponed = events.filter((e) => e.postponed)

  // FIX: safe team name for section headings — never "undefined Fixtures"
  const teamName = team?.name ?? initialName ?? ''

  function handleBook(event: MatchdayEvent) {
    upsert(event)
    enterBuilder(router, String(event.id))
  }

  function loadMore() {
    if (hasMoreHome) setHomePage((p) => p + 1)
    if (hasMoreAway) setAwayPage((p) => p + 1)
  }

  const isFetchingMore = homeQ.isFetching || awayQ.isFetching

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

          {/* Text on the left, crest on the right from sm up (row-reverse);
              on phones the crest stays above the text as before. */}
          <div className='flex flex-col gap-6 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-8'>
            {/* Club crest (supplier logo by team id) — `team.banner` is a
                promo photo, not a crest. Initials if the crest is missing. */}
            <div className='flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-3 sm:size-28 sm:p-4'>
              <TeamCrest teamId={teamId} name={teamName || 'Team'} className='size-full' />
            </div>

            <div className='min-w-0'>
              <p className='mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary'>
                Team · Football
              </p>
              <h1 className='font-heading text-3xl font-bold uppercase leading-none tracking-tight text-foreground sm:text-5xl'>
                {teamName || <span className='opacity-40'>Loading…</span>}{' '}
                <span className='text-primary'>Tickets</span>
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                {isLoading
                  ? 'Loading fixtures…'
                  : `${ticketed.length} fixture${ticketed.length === 1 ? '' : 's'} available${comingSoon.length > 0 ? ` · ${comingSoon.length} coming soon` : ''}`}
              </p>
              {ticketed[0] && (
                <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
                  Next: {ticketed[0].team1.name} vs {ticketed[0].team2.name} —
                  from{' '}
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
        {isLoading && (
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
              onClick={() => {
                homeQ.refetch()
                awayQ.refetch()
              }}
              className='font-mono text-[11px] text-primary underline underline-offset-2'
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && ticketed.length > 0 && (
          <motion.div
            className='mb-10'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className='mb-4 rounded-t-xl border border-border bg-primary/5 px-5 py-3'>
              <p className='font-heading text-sm font-bold'>
                {/* FIX: only show team name when it's resolved */}
                Upcoming {teamName ? `${teamName} ` : ''}Fixtures
              </p>
              <p className='font-mono text-[10px] text-muted-foreground'>
                {ticketed.length} event{ticketed.length === 1 ? '' : 's'} with
                tickets available
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
                These matches don&apos;t have tickets on sale yet — inventory is
                added daily.
              </p>
            </div>
            <div className='space-y-2'>
              {comingSoon.map((event, i) => (
                <FixtureRow key={event.id} event={event} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {!isLoading && !isError && postponed.length > 0 && (
          <div className='mb-10 opacity-50'>
            <p className='mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
              Postponed
            </p>
            <div className='space-y-2'>
              {postponed.map((event, i) => (
                <FixtureRow key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className='py-20 text-center'>
            <p className='text-sm text-muted-foreground'>
              No upcoming fixtures found for this team.
            </p>
            <Link
              href='/matches'
              className='mt-2 inline-block font-mono text-[11px] text-primary underline underline-offset-2'
            >
              Browse all fixtures →
            </Link>
          </div>
        )}

        {/* Load more — fires both home+away page increments in sync */}
        {!isError && hasMore && (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              onClick={loadMore}
              disabled={isFetchingMore}
              className='flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-all hover:border-primary/40 hover:text-primary disabled:opacity-50'
            >
              {isFetchingMore ? (
                <>
                  <Loader2 className='size-3.5 animate-spin' /> Loading…
                </>
              ) : (
                'Load more fixtures'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
