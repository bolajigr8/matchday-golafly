'use client'

// "Popular Matches" — modelled on footballticketnet.com's homepage fixture
// list. Tabs: All matches / This weekend / a few real, resolved
// competitions.
//
// DATA SOURCE: every fixture rendered is real, from GET /events via
// useMatchdayEvents (features/matchday/hooks.ts) — same call the rest of
// the site uses. The only thing that's a small curated list is *which
// tournament names get their own tab* (below), matching the existing
// pattern in store/data.ts's nav dropdowns — it's a shortlist of display
// labels, resolved against the real GET /tournaments catalogue via
// findTournamentIdByName, exactly like the navbar already does. If a
// listed competition isn't currently in the supplier's catalogue, its tab
// simply doesn't render (see `tabs` below) rather than showing empty/fake
// results.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMatchdayEvents, useMatchdayTournaments } from '@/features/matchday/hooks'
import { findTournamentIdByName } from '@/features/matchday/resolve'
import { eventTime } from '@/features/matchday/format'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { enterBuilder } from '@/features/builder/enter'
import { FixtureRow } from '@/components/matches/fixture-row'
import { SectionHead } from './section-head'
import type { MatchdayEvent } from '@/features/matchday/types'

/** Rows shown per tab. Exported so the upcoming-fixtures grid can skip the
 *  fixtures this list already shows (both read the same GET /events page). */
export const POPULAR_SHOWN = 6
/** Shared with UpcomingFixturesSection: same query key → one request. */
export const HOME_EVENTS_PAGE_SIZE = 50
const WEEKEND_WINDOW_DAYS = 8

/** Curated shortlist of competition tabs — display labels only, resolved
 *  against the real catalogue below. Same shortlist style as store/data.ts. */
const TAB_TOURNAMENT_NAMES = ['Premier League', 'Champions League', 'La Liga', 'La Liga Hypermotion', 'Serie A']

type TabKey = 'all' | 'weekend' | number

/** True when the kickoff is between now and `days` from now. Kept at module
 *  level (not inline in the component's memo) so reading the clock stays out
 *  of the render body (react-hooks/purity). */
function kicksOffWithinDays(iso: string | null, days: number) {
  const diff = eventTime(iso) - Date.now() // NaN (no date yet) → false
  return diff >= 0 && diff <= days * 86_400_000
}

function RowSkeleton() {
  return (
    <div
      aria-hidden
      className='flex items-center gap-4 rounded-[20px] border border-border bg-card p-3.5 sm:gap-5 sm:p-4'
    >
      <div className='h-[78px] w-[58px] shrink-0 rounded-[14px] bg-muted motion-safe:animate-pulse sm:w-[74px]' />
      <div className='min-w-0 flex-1 space-y-2.5'>
        <div className='h-2.5 w-24 rounded-full bg-muted motion-safe:animate-pulse' />
        <div className='h-4 w-3/4 max-w-[320px] rounded-full bg-muted motion-safe:animate-pulse' />
        <div className='h-2.5 w-1/2 max-w-[220px] rounded-full bg-muted motion-safe:animate-pulse' />
      </div>
      <div className='hidden h-11 w-36 shrink-0 rounded-full bg-muted motion-safe:animate-pulse sm:block' />
    </div>
  )
}

export function PopularMatchesSection() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const upsert = useLiveMatchCache((s) => s.upsert)
  const { data: tournaments } = useMatchdayTournaments()

  const tournamentTabs = useMemo(
    () =>
      TAB_TOURNAMENT_NAMES.map((name) => ({
        name,
        id: findTournamentIdByName(tournaments, name),
      })).filter(
        (t): t is { name: string; id: number } => typeof t.id === 'number',
      ),
    [tournaments],
  )

  const [tab, setTab] = useState<TabKey>('all')

  const { data, isLoading, isError } = useMatchdayEvents({
    per_page: HOME_EVENTS_PAGE_SIZE,
    tour_id: typeof tab === 'number' ? tab : undefined,
  })

  const events = useMemo(() => {
    const all = data?.events ?? []
    if (tab !== 'weekend') return all.slice(0, POPULAR_SHOWN)
    return all
      .filter((e) => kicksOffWithinDays(e.date, WEEKEND_WINDOW_DAYS))
      .slice(0, POPULAR_SHOWN)
  }, [data, tab])

  useEffect(() => {
    for (const e of events) upsert(e)
  }, [events, upsert])

  function handleBook(event: MatchdayEvent) {
    upsert(event)
    enterBuilder(router, String(event.id))
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All matches' },
    { key: 'weekend', label: 'This weekend' },
    ...tournamentTabs.map((t) => ({ key: t.id, label: t.name })),
  ]

  return (
    <section
      id='popular-matches'
      aria-labelledby='popular-matches-title'
      className='scroll-mt-24'
    >
      <SectionHead
        align='left'
        titleId='popular-matches-title'
        eyebrow='Popular matches'
        title={
          <>
            What fans are <span className='hl-neon'>booking now</span>
          </>
        }
        action={{ href: '/matches', label: 'See all fixtures' }}
      />

      {/* Filter pills — scroll sideways on phones, bleeding to the edge. The
          4px inset (py-1, lg:px-1) keeps the focus outline unclipped by the
          scroll container; the top margin is trimmed by the same amount. */}
      <div
        role='group'
        aria-label='Filter matches'
        className='-mx-5 mt-7 flex gap-2 overflow-x-auto px-5 py-1 scrollbar-hide sm:-mx-6 sm:mt-9 sm:px-6 lg:-mx-1 lg:px-1'
      >
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={String(t.key)}
              type='button'
              aria-pressed={active}
              onClick={() => setTab(t.key)}
              className={cn(
                'h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                active
                  ? 'bg-foreground text-background'
                  : 'border border-border bg-card text-foreground/75 hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className='mt-6 sm:mt-8' aria-busy={isLoading}>
        {isLoading && (
          <div className='space-y-3'>
            {Array.from({ length: 4 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
            <span className='sr-only'>Loading matches…</span>
          </div>
        )}

        {!isLoading && isError && (
          <div className='flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border bg-card px-6 py-14 text-center'>
            <span className='flex size-11 items-center justify-center rounded-full bg-status-warn-bg text-status-warn'>
              <AlertTriangle aria-hidden className='size-5' />
            </span>
            <p className='font-heading text-[17px] font-semibold text-foreground'>
              Live fixtures aren&apos;t available right now
            </p>
            <p className='max-w-sm text-[14px] text-muted-foreground'>
              Please try again in a moment, or browse the full fixture list.
            </p>
            <Link
              href='/matches'
              className='mt-2 inline-flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 px-5 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            >
              Browse all matches
              <ArrowRight aria-hidden className='size-3.5' />
            </Link>
          </div>
        )}

        {!isLoading && !isError && (
          <AnimatePresence mode='wait' initial={false}>
            {events.length > 0 ? (
              <motion.div
                key={String(tab)}
                className='space-y-3'
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {events.map((event, i) => (
                  <FixtureRow
                    key={event.id}
                    event={event}
                    index={i}
                    onBook={() => handleBook(event)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`${String(tab)}-empty`}
                className='rounded-[20px] border border-dashed border-border bg-card px-6 py-14 text-center'
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
              >
                <p className='font-heading text-[17px] font-semibold text-foreground'>
                  No matches for this filter yet
                </p>
                <p className='mt-2 text-[14px] text-muted-foreground'>
                  Try another competition, or{' '}
                  <Link
                    href='/matches'
                    className='font-semibold text-foreground underline decoration-1 underline-offset-4 hover:no-underline'
                  >
                    browse every fixture
                  </Link>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
