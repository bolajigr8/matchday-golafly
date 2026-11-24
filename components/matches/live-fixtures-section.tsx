'use client'

import { matchPath } from '@/lib/slug'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  AlertTriangle,
  X,
  LayoutGrid,
  List,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { todayISO } from '@/features/flights/schema'
import {
  useMatchdayTournaments,
  useMatchdayTeams,
} from '@/features/matchday/hooks'
import { isoDateStringToEventFilterDate, compareEventDates, hasEventDate, parseEventDate } from '@/features/matchday/format'
import { findTeamNameById } from '@/features/matchday/resolve'
import { getEvents } from '@/features/matchday/client'
import { QueryKeys } from '@/models/query'
import { useLiveMatchCache } from '@/store/live-match-cache'
import type { MatchdayEvent, EventFilters } from '@/features/matchday/types'
import { MatchCard } from './match-card'
import { FixtureRow } from './fixture-row'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

const FALLBACK_MATCH_IMAGE =
  '/figma/fedc7f165d8fd2c10a48fded8d08fb5a48c7a33b.png'
const PER_PAGE = 24

/* ------------------------------------------------------------------ */
/* Competition filter                                                  */
/*                                                                     */
/* One component, one set of pills, two behaviours:                    */
/*  - Mobile (< sm):  single horizontally-scrollable row. "See more"   */
/*    switches it to a wrapped grid that opens downwards.              */
/*  - Desktop (>= sm): pills wrap inside a tidy rounded panel, clamped */
/*    to 2 rows. "See more" (only shown if there's overflow) opens the */
/*    rest downwards.                                                  */
/* ------------------------------------------------------------------ */

type Tournament = { tournament_id: number; name: string }

// Height of 2 rows of pills (2 × 34px) + one 8px gap.
const DESKTOP_COLLAPSED_MAX_H = 'sm:max-h-[76px]'

function CompetitionFilter({
  tournaments,
  tourId,
  onSelect,
  countLabel,
  hasFilters,
  onClear,
}: {
  tournaments: Tournament[]
  tourId: number | null
  onSelect: (id: number | null) => void
  countLabel: string
  hasFilters: boolean
  onClear: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Track breakpoint (matches Tailwind `sm` = 640px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Desktop only: detect whether pills exceed the 2-row clamp
  useEffect(() => {
    const el = listRef.current
    if (!el || !isDesktop || expanded) return
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isDesktop, expanded, tournaments])

  // Desktop text toggle only shows when there's something hidden.
  // Mobile uses an icon-only arrow (always rendered, hidden via `sm:hidden`).
  const showDesktopToggle =
    tournaments.length > 0 && isDesktop && (overflowing || expanded)

  const pillClass = (active: boolean) =>
    cn(
      'shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 font-heading text-xs font-semibold transition-all',
      active
        ? 'border-foreground bg-foreground text-background'
        : 'border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground',
    )

  return (
    <div className='mb-6 rounded-2xl border border-border bg-muted/60 p-3 sm:p-4'>
      {/* Header row: label · count · clear */}
      <div className='mb-3 flex items-center justify-between gap-3'>
        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>
          Competition
        </span>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground'>
            {countLabel}
          </span>
          {hasFilters && (
            <button
              type='button'
              onClick={onClear}
              className='flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-brand-text'
            >
              <X className='size-3' /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Pills (+ mobile arrow on the right) */}
      <div className='flex items-start gap-2'>
        <div className='relative min-w-0 flex-1'>
          <div
            ref={listRef}
            className={cn(
              'flex gap-2',
              expanded
                ? 'flex-wrap'
                : cn(
                    // mobile: one scrollable row
                    'overflow-x-auto scrollbar-hide',
                    // desktop: wrap, clamp to 2 rows
                    'sm:flex-wrap sm:overflow-hidden',
                    DESKTOP_COLLAPSED_MAX_H,
                  ),
            )}
          >
            <button
              type='button'
              aria-pressed={tourId === null}
              onClick={() => onSelect(null)}
              className={pillClass(tourId === null)}
            >
              All
            </button>
            {tournaments.map((t) => (
              <button
                key={t.tournament_id}
                type='button'
                aria-pressed={tourId === t.tournament_id}
                onClick={() =>
                  onSelect(tourId === t.tournament_id ? null : t.tournament_id)
                }
                className={pillClass(tourId === t.tournament_id)}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Soft fade on desktop when clamped, hints there's more below */}
          {!expanded && isDesktop && overflowing && (
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-muted/90 to-transparent' />
          )}
        </div>
      </div>

      {/* Mobile: icon-only arrow, below the pills on the right */}
      {tournaments.length > 0 && (
        <div className='mt-2 flex justify-end sm:hidden'>
          <button
            type='button'
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={
              expanded ? 'Show fewer competitions' : 'Show more competitions'
            }
            className='flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-brand-text'
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      )}

      {/* Desktop: See more / less */}
      {showDesktopToggle && (
        <div className='mt-3 flex justify-center'>
          <button
            type='button'
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className='flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-brand-text'
          >
            {expanded ? 'See less' : 'See more'}
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function LiveFixturesSection({
  onBook,
}: {
  onBook?: (event: MatchdayEvent) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive all filter values directly from URL — no setState needed, no cascading renders.
  const tourId = searchParams.get('tour_id')
    ? Number(searchParams.get('tour_id'))
    : null
  const teamId = searchParams.get('team_id')
    ? Number(searchParams.get('team_id'))
    : null
  const eventName = searchParams.get('q') ?? ''
  const homeName = searchParams.get('home_name') ?? ''
  const awayName = searchParams.get('away_name') ?? ''

  // Date range. The hero search can prefill a single day via ?date=; the
  // pickers below then edit it locally. State is stored with the URL date it
  // was derived from, so a new hero search resets it without an effect.
  const urlDate = searchParams.get('date') ?? ''
  const [dates, setDates] = useState({ key: urlDate, from: urlDate, to: urlDate })
  const fromDate = dates.key === urlDate ? dates.from : urlDate
  const toDate = dates.key === urlDate ? dates.to : urlDate
  const setFromDate = (v: string) =>
    setDates({ key: urlDate, from: v, to: toDate && v && toDate < v ? v : toDate })
  const setToDate = (v: string) => setDates({ key: urlDate, from: fromDate, to: v })
  const [viewMode, setViewMode] = useState<'row' | 'card'>('row')

  // Pagination. `page` is stored together with the filter set it belongs to,
  // so changing any filter makes it page 1 again with no effects and no
  // stale-list flash. Every loaded page is its own cached query (useQueries)
  // and the visible list is derived from them, which also means going back to
  // an earlier filter (cached) shows its results instantly.
  const filterKey = `${tourId}|${teamId}|${eventName}|${homeName}|${awayName}|${fromDate}|${toDate}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1

  const upsertLiveMatch = useLiveMatchCache((s) => s.upsert)
  const { data: tournaments } = useMatchdayTournaments()
  const { data: teams } = useMatchdayTeams()

  const buildFilters = (p: number): EventFilters => {
    const f: EventFilters = { per_page: PER_PAGE, page: p }
    if (fromDate) f.from_date = isoDateStringToEventFilterDate(fromDate)
    if (toDate) f.to_date = isoDateStringToEventFilterDate(toDate)
    if (tourId !== null) f.tour_id = tourId
    if (eventName) f.event_name = eventName
    if (homeName) f.home_team_name = homeName
    if (awayName) f.away_team_name = awayName
    return f
  }
  const eventsQuery = (filters: EventFilters) => ({
    queryKey: [QueryKeys.Matchday_Events, filters],
    queryFn: () => getEvents(filters),
    staleTime: 60 * 1000,
    retry: false,
  })

  const queries = Array.from({ length: page }, (_, i) => i + 1).flatMap((p) =>
    teamId === null
      ? [eventsQuery(buildFilters(p))]
      : [
          eventsQuery({ ...buildFilters(p), home_team_id: teamId }),
          eventsQuery({ ...buildFilters(p), away_team_id: teamId }),
        ],
  )
  const results = useQueries({ queries })

  const isLoading = page === 1 && results.some((r) => r.isLoading)
  const isFetching = results.some((r) => r.isFetching)
  const isError = results.some((r) => r.isError)
  const error = results.find((r) => r.error)?.error as Error | undefined
  const totalEvents = Math.max(
    0,
    ...results.map((r) => r.data?.meta?.total_events ?? 0),
  )
  const primaryDone = results.every((r) => !r.isLoading)

  const dataKey = results.map((r) => r.dataUpdatedAt).join('|')
  const primaryEvents = useMemo(() => {
    const map = new Map<number, MatchdayEvent>()
    for (const r of results) for (const e of r.data?.events ?? []) map.set(e.id, e)
    const list = Array.from(map.values())
    return teamId === null
      ? list
      : list.sort((a, b) => compareEventDates(a.date, b.date))
    // `results` is a new array each render; dataKey tracks when data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, dataKey])

  // Safety net for free-text search: if the server's event_name filter finds
  // nothing, search the next 100 fixtures locally by team, competition and
  // venue so a typo-free query like "Leeds" or "Emirates" never dead-ends.
  const needsLocal =
    Boolean(eventName) && teamId === null && primaryDone && !isError && primaryEvents.length === 0
  const localQuery = useQuery({
    queryKey: [QueryKeys.Matchday_Events, { _localSearch: true, per_page: 100, page: 1 }],
    queryFn: () => getEvents({ per_page: 100, page: 1 }),
    enabled: needsLocal,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
  const localEvents = useMemo(() => {
    if (!needsLocal) return []
    const tokens = eventName.toLowerCase().split(/\s+/).filter(Boolean)
    return (localQuery.data?.events ?? []).filter((e) => {
      const hay = `${e.team1.name} ${e.team2.name} ${e.tour.name} ${e.venue.venue_name} ${e.venue.venue_city_name} ${e.venue.venue_country_name}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return tokens.every((t) => hay.includes(t))
    })
  }, [needsLocal, localQuery.data, eventName])

  const allEvents = primaryEvents.length > 0 ? primaryEvents : localEvents
  const loadingNow = isLoading || (needsLocal && localQuery.isLoading)

  const refetch = () => results.forEach((r) => r.refetch())
  const setPage = (fn: (p: number) => number) =>
    setPageState({ key: filterKey, page: fn(page) })

  useEffect(() => {
    for (const e of allEvents) upsertLiveMatch(e)
  }, [allEvents, upsertLiveMatch])

  const hasMore =
    primaryEvents.length > 0 && page < Math.ceil(totalEvents / PER_PAGE)

  const teamName = findTeamNameById(teams, teamId)
  const searchLabel =
    homeName && awayName
      ? `${homeName} vs ${awayName}`
      : teamName
        ? `Team: ${teamName}`
        : eventName
          ? `"${eventName}"`
          : null

  const hasFilters = Boolean(
    fromDate ||
    toDate ||
    tourId !== null ||
    teamId !== null ||
    eventName ||
    homeName ||
    awayName,
  )

  const countLabel = loadingNow
    ? '…'
    : `${allEvents.length}${hasMore ? ` of ${totalEvents}` : ''} match${allEvents.length === 1 ? '' : 'es'}`

  function clearAllFilters() {
    setDates({ key: '', from: '', to: '' })
    router.replace('/matches#matches', { scroll: false })
  }

  function clearSearchOnly() {
    const params = new URLSearchParams(searchParams.toString())
    ;['team_id', 'q', 'home_name', 'away_name', 'date'].forEach((k) => params.delete(k))
    const qs = params.toString()
    router.replace(`/matches${qs ? `?${qs}` : ''}#matches`, { scroll: false })
  }

  function selectTournament(id: number | null) {
    if (id === null) {
      router.replace('/matches#matches', { scroll: false })
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('tour_id', String(id))
    router.replace(`/matches?${params.toString()}#matches`, { scroll: false })
  }

  return (
    <section id='matches' className='scroll-mt-24 bg-background py-20 sm:py-24'>
      <div className='page-container'>
        {/* Header */}
        <motion.div
          className='mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className='mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
              Live Fixtures
            </p>
            <h2 className='mb-2 font-heading text-3xl font-bold uppercase leading-[1.1] tracking-tight text-foreground sm:text-4xl'>
              Every Match, Every Ticket
            </h2>
            <p className='text-sm text-muted-foreground'>
              Real-time fixtures and pricing straight from the ticket
              marketplace.
              {totalEvents > 0 && !loadingNow && (
                <span className='ml-2 font-mono text-[10px] text-brand-text'>
                  {totalEvents} total
                </span>
              )}
            </p>
          </div>

          {/* List / Grid toggle */}
          <div
            className='flex overflow-hidden rounded-lg border border-border self-end'
            role='tablist'
          >
            {(['row', 'card'] as const).map((mode) => (
              <button
                key={mode}
                type='button'
                role='tab'
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold transition-all',
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === 'row' ? (
                  <List className='size-3.5' />
                ) : (
                  <LayoutGrid className='size-3.5' />
                )}
                {mode === 'row' ? 'List' : 'Grid'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Active search chip */}
        {searchLabel && (
          <div className='mb-4 flex items-center gap-2'>
            <span className='inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 font-heading text-xs font-semibold text-foreground'>
              {searchLabel}
              <button
                type='button'
                onClick={clearSearchOnly}
                aria-label='Clear search'
                className='rounded-full p-0.5 hover:bg-primary/20'
              >
                <X className='size-3' />
              </button>
            </span>
          </div>
        )}

        {/* Date range */}
        <div className='mb-4 flex flex-wrap gap-2'>
          <div className='min-w-[160px] flex-1 rounded-xl border border-border bg-muted px-4 py-2.5'>
            <DatePicker
              months={2}
              value={fromDate}
              onChange={(v) => setFromDate(v)}
              min={todayISO()}
              placeholder='Any date'
            />
            <span className='font-mono text-[9px] tracking-wider text-muted-foreground'>
              From
            </span>
          </div>
          <div className='min-w-[160px] flex-1 rounded-xl border border-border bg-muted px-4 py-2.5'>
            <DatePicker
              months={2}
              value={toDate}
              onChange={(v) => setToDate(v)}
              min={fromDate || todayISO()}
              placeholder='Any date'
            />
            <span className='font-mono text-[9px] tracking-wider text-muted-foreground'>
              To
            </span>
          </div>
        </div>

        {/* Competition filter — drives state via URL so filterKey resets pagination */}
        <CompetitionFilter
          tournaments={tournaments ?? []}
          tourId={tourId}
          onSelect={selectTournament}
          countLabel={countLabel}
          hasFilters={hasFilters}
          onClear={clearAllFilters}
        />

        {loadingNow && page === 1 && (
          <div className='flex flex-col items-center gap-2 py-16 text-center'>
            <Loader2 className='size-5 animate-spin text-brand-text' />
            <p className='text-sm text-muted-foreground'>
              Loading live fixtures…
            </p>
          </div>
        )}

        {!loadingNow && isError && (
          <div className='flex flex-col items-center gap-2 py-16 text-center'>
            <AlertTriangle className='size-5 text-amber-400' />
            <p className='text-sm font-semibold text-foreground'>
              Live fixtures aren&apos;t available right now
            </p>
            <p className='max-w-xs text-xs text-muted-foreground'>
              {error?.message ?? 'The ticketing service could not be reached.'}
            </p>
            <button
              onClick={refetch}
              className='mt-1 font-mono text-[11px] text-brand-text underline underline-offset-2'
            >
              Try again
            </button>
          </div>
        )}

        {!loadingNow && !isError && allEvents.length === 0 && (
          <div className='py-16 text-center'>
            <p className='text-sm text-muted-foreground'>
              No fixtures found{hasFilters ? ' for these filters' : ''}.
            </p>
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className='mt-2 font-mono text-[11px] text-brand-text underline underline-offset-2'
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {(!loadingNow || page > 1) && !isError && allEvents.length > 0 && (
          <AnimatePresence mode='wait'>
            {viewMode === 'row' ? (
              <motion.div
                key='row'
                className='space-y-3'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {allEvents.map((event, i) => (
                  <FixtureRow
                    key={event.id}
                    event={event}
                    index={i}
                    onBook={onBook ? () => onBook(event) : undefined}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key='card'
                className='grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {allEvents.map((event, i) => (
                  <MatchCard
                    key={event.id}
                    matchId={String(event.id)}
                    matchName={event.name}
                    href={matchPath(event)}
                    index={i}
                    home={event.team1.name}
                    away={event.team2.name}
                    homeId={event.team1.id}
                    awayId={event.team2.id}
                    img={
                      event.venue.venue_image ||
                      event.team1.image ||
                      event.team2.image ||
                      FALLBACK_MATCH_IMAGE
                    }
                    info={`${hasEventDate(event.date) ? parseEventDate(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'} · ${[event.venue.venue_name, event.venue.venue_city_name].filter(Boolean).join(', ')}`}
                    badgeLabel={event.tour.name}
                    badgeColor='neon'
                    priceFrom={eventFromPrice(event.min_price)}
                    currency={event.min_price?.currency_code ?? 'EUR'}
                    onBook={() => onBook?.(event)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!isError && allEvents.length > 0 && hasMore && (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className='flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground transition-all hover:border-primary/40 hover:text-brand-text disabled:opacity-50'
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
    </section>
  )
}
