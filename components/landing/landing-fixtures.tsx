'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { QueryKeys } from '@/models/query'
import { foldAscii } from '@/lib/slug'
import { getEvents, type EventsResult } from '@/features/matchday/client'
import { useMatchdayTournaments } from '@/features/matchday/hooks'
import { parseEventDate } from '@/features/matchday/format'
import type { MatchdayEvent } from '@/features/matchday/types'
import {
  FIXTURES_ANCHOR,
  eventTitle,
  useLandingScope,
} from '@/features/landing/scope'
import { FixtureRow } from '@/components/matches/fixture-row'
import { trackViewItemList } from '@/lib/analytics'

/* Every fixture in this competition, soonest first, with the hero search
   applied. The search lives in the URL (?q=…, ?team=…, ?date=…) so a result
   can be shared and the back button works.

   One request (100 fixtures) normally covers a whole competition; if there
   are more, the rest load in the background so a search always looks at all
   of them. Filtering happens here, on that list. */

const FIRST = 8
const MORE = 8
const PAGE = 100
const MAX_PAGES = 10

// Defined outside the component so useQueries can keep the merged list stable
// between renders (it only changes when a page's data actually changes).
const combineEvents = (results: UseQueryResult<EventsResult, Error>[]) =>
  results.flatMap((r) => r.data?.events ?? [])

function localISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function LandingFixturesInner() {
  const scope = useLandingScope()
  const params = useSearchParams()
  const tournaments = useMatchdayTournaments()

  const q = (params.get('q') ?? '').trim()
  const date = params.get('date') ?? ''
  const teamId = Number(params.get('team')) || 0
  const filterKey = `${q}|${date}|${teamId}`
  const filtered = !!(q || date || teamId)

  // Fixed for the life of the page: keeps render pure.
  const [now] = React.useState(() => Date.now())

  const filters = scope?.eventFilters ?? null
  const pages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil((scope?.eventsTotal ?? 0) / PAGE)),
  )
  const moreEvents = useQueries({
    combine: combineEvents,
    queries: Array.from({ length: pages - 1 }, (_, i) => {
      const f = { ...(filters ?? {}), page: i + 2 }
      return {
        queryKey: [QueryKeys.Matchday_Events, f],
        queryFn: () => getEvents(f),
        enabled: !!filters,
        staleTime: 60 * 1000,
        retry: false,
      }
    }),
  })
  const firstPage = scope?.events

  const all = React.useMemo<MatchdayEvent[]>(() => {
    const byId = new Map<number, MatchdayEvent>()
    for (const e of [...(firstPage ?? []), ...moreEvents]) byId.set(e.id, e)
    return [...byId.values()]
      .filter((e) => parseEventDate(e.date).getTime() > now - 3 * 3600 * 1000)
      .sort(
        (a, b) =>
          parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime(),
      )
  }, [firstPage, moreEvents, now])

  const results = React.useMemo(() => {
    if (!filtered) return all
    const words = foldAscii(q)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w && w !== 'v' && w !== 'vs')
    return all.filter((e) => {
      if (teamId && e.team1.id !== teamId && e.team2.id !== teamId) return false
      if (date && localISODate(parseEventDate(e.date)) !== date) return false
      if (words.length && !teamId) {
        const hay = foldAscii(
          [
            e.name,
            e.team1.name,
            e.team2.name,
            e.venue?.venue_name,
            e.venue?.venue_city_name,
          ]
            .filter(Boolean)
            .join(' '),
        ).toLowerCase()
        if (!words.every((w) => hay.includes(w))) return false
      }
      return true
    })
  }, [all, filtered, q, date, teamId])

  // Back to the first few rows whenever the search changes (state adjusted
  // during render, React's pattern for resetting state when a value changes).
  const [shown, setShown] = React.useState(FIRST)
  const [shownKey, setShownKey] = React.useState(filterKey)
  if (shownKey !== filterKey) {
    setShownKey(filterKey)
    setShown(FIRST)
  }

  // One "list viewed" event per page load, for the unfiltered list.
  const reported = React.useRef(false)
  React.useEffect(() => {
    if (reported.current || filtered || !scope || all.length === 0) return
    reported.current = true
    trackViewItemList(
      `${scope.site.name} fixtures`,
      all.slice(0, 10).map((e) => ({
        id: String(e.id),
        name: eventTitle(e),
        category: e.tour?.name,
        price: e.min_price?.price ?? undefined,
      })),
    )
  }, [all, filtered, scope])

  if (!scope) return null

  const loading =
    scope.eventsLoading || (!scope.tourId && tournaments.isLoading)
  const notFound = !scope.tourId && !tournaments.isLoading
  const visible = results.slice(0, shown)

  const chips: string[] = []
  if (teamId) {
    const t = scope.teams.find((x) => x.team_id === teamId)
    chips.push(t?.name ?? 'Selected team')
  } else if (q) chips.push(`“${q}”`)
  if (date) {
    chips.push(
      new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    )
  }

  return (
    <section
      id={FIXTURES_ANCHOR}
      aria-labelledby='landing-fixtures-title'
      className='scroll-mt-24 bg-background py-14 sm:py-20'
    >
      <div className='page-container'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
              All fixtures
            </p>
            <h2
              id='landing-fixtures-title'
              className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'
            >
              {scope.site.name} matches
            </h2>
          </div>
          {!loading && !notFound && (
            <p className='text-[13px] text-muted-foreground' aria-live='polite'>
              {results.length} {results.length === 1 ? 'match' : 'matches'}
              {filtered ? ' found' : ' on sale'}
            </p>
          )}
        </div>

        {filtered && (
          <div className='mb-5 flex flex-wrap items-center gap-2'>
            <span className='font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground'>
              Showing
            </span>
            {chips.map((c) => (
              <span
                key={c}
                className='rounded-full border border-border bg-card px-3 py-1 text-[13px] text-foreground'
              >
                {c}
              </span>
            ))}
            <button
              type='button'
              onClick={() => scope.search({ q: '', date: '' })}
              className='inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
            >
              <X aria-hidden className='size-3.5' /> Clear
            </button>
          </div>
        )}

        {loading ? (
          <ul aria-busy className='space-y-3'>
            {Array.from({ length: 4 }, (_, i) => (
              <li
                key={i}
                aria-hidden
                className='h-[104px] rounded-[20px] bg-muted motion-safe:animate-pulse'
              />
            ))}
          </ul>
        ) : notFound ? (
          <p className='rounded-2xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground'>
            We couldn’t load the {scope.site.name} fixtures right now. Please
            refresh the page in a moment.
          </p>
        ) : results.length === 0 ? (
          <div className='rounded-2xl border border-border bg-card p-8 text-center'>
            <p className='text-[15px] font-semibold text-foreground'>
              {filtered
                ? 'No matches found for that search.'
                : `No ${scope.site.name} matches are on sale right now.`}
            </p>
            {filtered && (
              <button
                type='button'
                onClick={() => scope.search({ q: '', date: '' })}
                className='mt-4 inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 text-[14px] font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background'
              >
                Show all {scope.site.name} matches
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className='space-y-3'>
              {visible.map((event, i) => (
                <li key={event.id}>
                  <FixtureRow
                    event={event}
                    index={i}
                    onBook={() => scope.openMatch(event, 'fixtures')}
                  />
                </li>
              ))}
            </ul>
            {shown < results.length && (
              <div className='mt-8 flex justify-center'>
                <button
                  type='button'
                  onClick={() => setShown((n) => n + MORE)}
                  className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-brand-text'
                >
                  Show more matches
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/* The search lives in the URL, and reading it (useSearchParams) needs its own
   Suspense boundary. Keeping it here, around this one section, means the rest
   of the page is still in the server-rendered HTML. */
export function LandingFixtures() {
  const scope = useLandingScope()
  return (
    <React.Suspense
      fallback={
        <section
          id={FIXTURES_ANCHOR}
          aria-hidden
          className='scroll-mt-24 bg-background py-14 sm:py-20'
        >
          <div className='page-container'>
            <div className='mb-8'>
              <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
                All fixtures
              </p>
              <h2 className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
                {scope ? `${scope.site.name} matches` : 'Matches'}
              </h2>
            </div>
            <ul className='space-y-3'>
              {Array.from({ length: 4 }, (_, i) => (
                <li
                  key={i}
                  className='h-[104px] rounded-[20px] bg-muted motion-safe:animate-pulse'
                />
              ))}
            </ul>
          </div>
        </section>
      }
    >
      <LandingFixturesInner />
    </React.Suspense>
  )
}
