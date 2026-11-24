'use client'

/* Live search suggestions — events, teams and tournaments as you type.
   Used by the home hero search and the /matches hero search
   (components/shared/match-search.tsx). This is the logic that used to
   live in the navbar search, which has been removed.

   Rows, in order: "Search for “…”", then EVENTS (GET /events?event_name=,
   debounced 250 ms, 2+ characters, max 5), TEAMS (max 3) and TOURNAMENTS
   (max 3). Teams and tournaments are matched in the browser against the
   GET /teams and GET /tournaments catalogues already cached by
   react-query, ignoring spaces and accents ("laliga" finds "La Liga",
   "atletico" finds "Atlético"); the matched text is shown in bold. Every
   row links to its readable URL (lib/slug.ts). */

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2, Search, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QueryKeys } from '@/models/query'
import { foldAscii, matchPath } from '@/lib/slug'
import { getEvents } from '@/features/matchday/client'
import { useMatchdayTeams, useMatchdayTournaments } from '@/features/matchday/hooks'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { buildMatchesSearchUrl } from '@/features/matchday/resolve'
import { formatKickoffTime, parseEventDate } from '@/features/matchday/format'
import { TeamCrest } from '@/components/tickets/primitives'
import type { MatchdayEvent } from '@/features/matchday/types'
import { FIXTURES_ANCHOR, useLandingScope } from '@/features/landing/scope'
import { seatsHref } from '@/features/builder/enter'

const ROW =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] text-foreground/80 transition-colors duration-150 hover:bg-muted hover:text-foreground'
const SECTION_LABEL =
  'px-3 pb-1 pt-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground'

const EVENT_MIN_CHARS = 2
const DEBOUNCE_MS = 250
const MAX_EVENTS = 5
const MAX_TEAMS = 3
const MAX_TOURNAMENTS = 3

/* ── Matching ──────────────────────────────────────────────────────── */

/** Accent-free, lower-case, letters and digits only: "La Liga" → "laliga". */
function compact(text: string): string {
  return foldAscii(text).replace(/[^a-z0-9]/g, '')
}

/** -1 = no match, 0 = name starts with the query, 1 = a later word starts
 *  with it (the match may run across words), 2 = it appears inside a word. */
function rankOf(name: string, q: string): number {
  const c = compact(name)
  if (!c.includes(q)) return -1
  if (c.startsWith(q)) return 0
  let offset = 0
  for (const word of foldAscii(name).split(/[^a-z0-9]+/)) {
    if (!word) continue
    if (c.startsWith(q, offset)) return 1
    offset += word.length
  }
  return 2
}

function matchCatalogue<T>(
  list: readonly T[] | undefined,
  nameOf: (item: T) => string,
  query: string,
  max: number,
): T[] {
  const q = compact(query)
  if (!q || !list) return []
  const hits: { item: T; rank: number; name: string }[] = []
  for (const item of list) {
    const name = nameOf(item)
    const rank = rankOf(name, q)
    if (rank >= 0) hits.push({ item, rank, name })
  }
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.name.length - b.name.length ||
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  )
  return hits.slice(0, max).map((h) => h.item)
}

/** `text` with the part matching `query` (ignoring spaces and accents) in
 *  bold. Each compact character remembers which original character it came
 *  from, so "laliga" bolds the whole of "La Liga". */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = compact(query)
  if (!q) return <>{text}</>
  let flat = ''
  const from: number[] = []
  for (let i = 0; i < text.length; i++) {
    for (const ch of compact(text[i])) {
      flat += ch
      from.push(i)
    }
  }
  const at = flat.indexOf(q)
  if (at === -1) return <>{text}</>
  const start = from[at]
  const end = from[at + q.length - 1] + 1
  return (
    <>
      {text.slice(0, start)}
      <b className='font-bold text-foreground'>{text.slice(start, end)}</b>
      {text.slice(end)}
    </>
  )
}

/** "Saudi Pro League · Mon, 19 Oct 2026 · 21:00 · Kingdom Arena" */
function eventMeta(e: MatchdayEvent): string {
  const d = parseEventDate(e.date)
  const day = Number.isNaN(d.getTime())
    ? ''
    : `${d.toLocaleDateString('en-GB', { weekday: 'short' })}, ${d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`
  return [e.tour?.name, day, formatKickoffTime(e.date), e.venue?.venue_name]
    .filter(Boolean)
    .join(' · ')
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

/* ── Results ───────────────────────────────────────────────────────── */

export type SuggestionKind = 'all' | 'event' | 'team' | 'tour'

export interface SuggestionRow {
  key: string
  kind: SuggestionKind
  href: string
  render: () => ReactNode
  /** Set on a landing page: act in place instead of following `href`. */
  onSelect?: () => void
}

export interface SearchSuggestions {
  text: string
  rows: SuggestionRow[]
  /** Index of the first row of each section in `rows`. */
  eventStart: number
  teamStart: number
  tourStart: number
  eventsPending: boolean
  eventsFailed: boolean
  /** Text entered but nothing matched (and nothing still loading). */
  nothing: boolean
}

export function useSearchSuggestions(query: string): SearchSuggestions {
  const text = query.trim()
  const debounced = useDebounced(text, DEBOUNCE_MS)
  const eventsEnabled = debounced.length >= EVENT_MIN_CHARS

  const { data: teams } = useMatchdayTeams()
  const { data: tournaments } = useMatchdayTournaments()
  const slugs = useCatalogueSlugs()
  // On a landing page the search covers one competition only (null elsewhere).
  const scope = useLandingScope()
  const scopeTour = scope?.tourId ?? undefined

  const eventsQ = useQuery({
    queryKey: [
      QueryKeys.Matchday_Events,
      {
        _search: true,
        event_name: debounced,
        per_page: MAX_EVENTS,
        page: 1,
        ...(scope ? { tour_id: scopeTour } : {}),
      },
    ],
    queryFn: () =>
      getEvents({
        event_name: debounced,
        per_page: MAX_EVENTS,
        page: 1,
        ...(scopeTour ? { tour_id: scopeTour } : {}),
      }),
    enabled: eventsEnabled && (!scope || !!scopeTour),
    staleTime: 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  })

  // Events only for 2+ characters; never show a previous query's events
  // once the text is cleared back below that.
  const events =
    text.length >= EVENT_MIN_CHARS && eventsEnabled
      ? (eventsQ.data?.events ?? []).slice(0, MAX_EVENTS)
      : []
  const eventsPending =
    text.length >= EVENT_MIN_CHARS && (debounced !== text || eventsQ.isFetching) && !events.length
  const eventsFailed = eventsEnabled && eventsQ.isError && !events.length

  // Landing: only teams that have fixtures in this competition, and no other
  // competitions to jump to.
  const scopeTeams = scope?.teams
  const teamHits = useMemo(
    () =>
      matchCatalogue(
        (scopeTeams ?? teams) as { team_id: number; name: string }[] | undefined,
        (t) => t.name,
        text,
        MAX_TEAMS,
      ),
    [teams, scopeTeams, text],
  )
  const tourHits = useMemo(
    () =>
      scopeTeams
        ? []
        : matchCatalogue(tournaments, (t) => t.name, text, MAX_TOURNAMENTS),
    [tournaments, scopeTeams, text],
  )

  const rows: SuggestionRow[] = []
  if (text) {
    rows.push({
      key: 'all',
      kind: 'all',
      href: buildMatchesSearchUrl({ q: text }),
      render: () => (
        <>
          <Search aria-hidden className='size-3.5 shrink-0 text-muted-foreground' />
          <span className='truncate font-semibold text-foreground'>
            Search for &ldquo;{text}&rdquo;
          </span>
        </>
      ),
    })
  }
  const eventStart = rows.length
  for (const e of events) {
    rows.push({
      key: `event-${e.id}`,
      kind: 'event',
      href: scope ? seatsHref(String(e.id)) : matchPath(e),
      onSelect: scope ? () => scope.openMatch(e, 'search') : undefined,
      render: () => (
        <span className='min-w-0 flex-1'>
          <span className='block truncate font-medium text-foreground/90'>
            <Highlight text={e.name || `${e.team1.name} vs ${e.team2.name}`} query={text} />
          </span>
          <span className='mt-0.5 block truncate text-[12px] text-muted-foreground'>
            {eventMeta(e)}
          </span>
        </span>
      ),
    })
  }
  const teamStart = rows.length
  for (const t of teamHits) {
    rows.push({
      key: `team-${t.team_id}`,
      kind: 'team',
      href: scope ? `#${FIXTURES_ANCHOR}` : slugs.teamPath(t.team_id, t.name),
      onSelect: scope
        ? () => scope.search({ q: t.name, date: '', teamId: t.team_id })
        : undefined,
      render: () => (
        <>
          <TeamCrest teamId={t.team_id} name={t.name} className='size-5' />
          <span className='truncate'>
            <Highlight text={t.name} query={text} />
          </span>
        </>
      ),
    })
  }
  const tourStart = rows.length
  for (const t of tourHits) {
    rows.push({
      key: `tour-${t.tournament_id}`,
      kind: 'tour',
      href: slugs.tournamentPath(t.tournament_id, t.name),
      render: () => (
        <>
          <TournamentThumb src={t.banner} />
          <span className='truncate'>
            <Highlight text={t.name} query={text} />
          </span>
        </>
      ),
    })
  }

  const nothing =
    text.length > 0 &&
    !events.length &&
    !teamHits.length &&
    !tourHits.length &&
    !eventsPending &&
    !eventsFailed

  return { text, rows, eventStart, teamStart, tourStart, eventsPending, eventsFailed, nothing }
}

function TournamentThumb({ src }: { src: string | null }) {
  const [bad, setBad] = useState(false)
  return (
    <span className='flex size-5 shrink-0 items-center justify-center overflow-hidden rounded bg-muted'>
      {src && !bad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=''
          loading='lazy'
          onError={() => setBad(true)}
          className='size-full object-cover'
        />
      ) : (
        <Trophy aria-hidden className='size-3 text-muted-foreground' />
      )}
    </span>
  )
}

/* ── Panel ─────────────────────────────────────────────────────────── */

/** The dropdown. Focus stays in the input (aria-activedescendant), so
 *  pressing anywhere in the panel must not blur it — onMouseDown is
 *  prevented; a row's click still fires. `onPick` runs on click; for the
 *  "Search for" row it should run the full search (it is prevented from
 *  navigating by itself so the caller can add the date). */
export function SuggestionPanel({
  id,
  optionId,
  s,
  active,
  onActive,
  onPick,
  className,
}: {
  id: string
  optionId: (index: number) => string
  s: SearchSuggestions
  active: number
  onActive: (index: number) => void
  onPick: (row: SuggestionRow) => void
  className?: string
}) {
  const renderRows = (from: number, to: number) =>
    s.rows.slice(from, to).map((row, k) => {
      const i = from + k
      const selected = i === active
      return (
        <Link
          key={row.key}
          id={optionId(i)}
          href={row.href}
          role='option'
          aria-selected={selected}
          tabIndex={-1}
          onMouseEnter={() => onActive(i)}
          onClick={(e) => {
            if (row.kind === 'all' || row.onSelect) e.preventDefault()
            onPick(row)
          }}
          className={cn(ROW, selected && 'bg-muted text-foreground')}
        >
          {row.render()}
        </Link>
      )
    })

  return (
    <div
      id={id}
      role='listbox'
      aria-label='Search suggestions'
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'z-50 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover p-1.5 text-left text-popover-foreground shadow-[var(--lift-3)]',
        className,
      )}
    >
      {renderRows(0, s.eventStart)}

      {(s.eventStart < s.teamStart || s.eventsPending || s.eventsFailed) && (
        <div role='group' aria-label='Events' className='mt-1 border-t border-border pt-1'>
          <p className={SECTION_LABEL} aria-hidden>
            Events
          </p>
          {renderRows(s.eventStart, s.teamStart)}
          {s.eventsPending && (
            <p className='flex items-center gap-2 px-3 py-2 text-[12.5px] text-muted-foreground'>
              <Loader2 aria-hidden className='size-3.5 animate-spin' /> Searching events…
            </p>
          )}
          {s.eventsFailed && (
            <p className='px-3 py-2 text-[12.5px] text-muted-foreground'>
              Couldn&rsquo;t load events right now.
            </p>
          )}
        </div>
      )}

      {s.teamStart < s.tourStart && (
        <div role='group' aria-label='Teams' className='mt-1 border-t border-border pt-1'>
          <p className={SECTION_LABEL} aria-hidden>
            Teams
          </p>
          {renderRows(s.teamStart, s.tourStart)}
        </div>
      )}

      {s.tourStart < s.rows.length && (
        <div role='group' aria-label='Tournaments' className='mt-1 border-t border-border pt-1'>
          <p className={SECTION_LABEL} aria-hidden>
            Tournaments
          </p>
          {renderRows(s.tourStart, s.rows.length)}
        </div>
      )}

      {s.nothing && (
        <p className='border-t border-border px-3 pb-2 pt-3 text-[12.5px] text-muted-foreground'>
          No events, teams or tournaments match yet. Press Enter to search all matches.
        </p>
      )}
    </div>
  )
}
