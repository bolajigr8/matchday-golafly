'use client'

/* Navbar search — events, teams and tournaments as you type.

   Results, in order: a "Search for “…”" row (→ /matches?q=…#matches),
   then EVENTS (GET /events?event_name=, debounced 250 ms, 2+ characters,
   max 5), TEAMS (max 3) and TOURNAMENTS (max 3). Teams and tournaments are
   matched in the browser against the GET /teams and GET /tournaments
   catalogues the navbar already loads, ignoring spaces and accents
   ("laliga" finds "La Liga", "atletico" finds "Atlético"). The matched
   text is shown in bold.

   Keyboard: ArrowUp/ArrowDown move through the rows, Enter opens the
   highlighted row (or searches all matches when none is highlighted),
   Esc closes. Focus stays in the input throughout (aria-activedescendant),
   so there is no <form> and Enter never submits anything.

   Placement (rendered inside the navbar's right-hand group):
     ≥ 1280px  an inline field before the currency selector, 208px wide
               (256px at 2xl).
     < 1280px  a search icon button in the same spot. It opens a full-width
               bar under the header — absolutely positioned, so the sticky
               header is its containing block and nothing in the header row
               moves. The bar closes on an outside press, Esc and any route
               change. */

import Link from 'next/link'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2, Search, Trophy, X } from 'lucide-react'
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

/* Same recipes as components/navbar.tsx (kept in step by hand — the navbar
   imports this file, so importing back would be circular). */
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const ICON_BUTTON = cn(
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/75 transition-colors duration-200 hover:bg-muted hover:text-foreground',
  FOCUS_RING,
)
const POPOVER =
  'rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[var(--lift-3)]'
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
 *  with it (the match may run across words: "ligah" → "La Liga Hypermotion"),
 *  2 = it appears inside a word. */
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
function Highlight({ text, query }: { text: string; query: string }) {
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

/* ── The search box (used inline and inside the bar) ───────────────── */

interface Row {
  key: string
  href: string
  render: () => ReactNode
}

function SearchBox({
  variant,
  autoFocus,
  onNavigate,
}: {
  variant: 'inline' | 'bar'
  autoFocus?: boolean
  /** Called after a result is opened (the bar closes itself). */
  onNavigate?: () => void
}) {
  const router = useRouter()
  const uid = useId()
  const listId = `${uid}-results`
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const text = query.trim()
  const debounced = useDebounced(text, DEBOUNCE_MS)
  const eventsEnabled = debounced.length >= EVENT_MIN_CHARS

  const { data: teams } = useMatchdayTeams()
  const { data: tournaments } = useMatchdayTournaments()
  const slugs = useCatalogueSlugs()

  const eventsQ = useQuery({
    queryKey: [
      QueryKeys.Matchday_Events,
      { _navSearch: true, event_name: debounced, per_page: MAX_EVENTS, page: 1 },
    ],
    queryFn: () => getEvents({ event_name: debounced, per_page: MAX_EVENTS, page: 1 }),
    enabled: eventsEnabled,
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

  const teamHits = useMemo(
    () => matchCatalogue(teams, (t) => t.name, text, MAX_TEAMS),
    [teams, text],
  )
  const tourHits = useMemo(
    () => matchCatalogue(tournaments, (t) => t.name, text, MAX_TOURNAMENTS),
    [tournaments, text],
  )

  const rows: Row[] = []
  if (text) {
    rows.push({
      key: 'all',
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
      href: matchPath(e),
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
      href: slugs.teamPath(t.team_id, t.name),
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

  const showPanel = open && !!text
  const activeRow = active >= 0 && active < rows.length ? rows[active] : null

  function close() {
    setOpen(false)
    setActive(-1)
  }

  /** Opened from the keyboard. Mouse clicks go through the <Link> itself,
   *  so a result is never navigated to twice. */
  function go(href: string) {
    close()
    inputRef.current?.blur()
    onNavigate?.()
    router.push(href)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!rows.length) return
      e.preventDefault()
      setOpen(true)
      setActive((a) => {
        if (e.key === 'ArrowDown') return a + 1 >= rows.length ? 0 : a + 1
        return a <= 0 ? rows.length - 1 : a - 1
      })
    } else if (e.key === 'Enter') {
      if (!text) return
      e.preventDefault()
      go((activeRow ?? rows[0]).href)
    } else if (e.key === 'Escape') {
      // Results first; the bar (if any) closes on the same Esc through its
      // own document listener.
      if (showPanel) close()
    }
  }

  function renderRows(from: number, to: number) {
    return rows.slice(from, to).map((row, k) => {
      const i = from + k
      const selected = i === active
      return (
        <Link
          key={row.key}
          id={`${uid}-opt-${i}`}
          href={row.href}
          role='option'
          aria-selected={selected}
          tabIndex={-1}
          onMouseEnter={() => setActive(i)}
          onClick={() => {
            close()
            onNavigate?.()
          }}
          className={cn(ROW, selected && 'bg-muted text-foreground')}
        >
          {row.render()}
        </Link>
      )
    })
  }

  const nothing =
    text.length > 0 &&
    !events.length &&
    !teamHits.length &&
    !tourHits.length &&
    !eventsPending &&
    !eventsFailed

  return (
    <div
      ref={boxRef}
      className='relative w-full'
      onBlur={(e) => {
        if (!boxRef.current?.contains(e.relatedTarget as Node | null)) close()
      }}
    >
      <Search
        aria-hidden
        className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
      />
      <input
        ref={inputRef}
        type='search'
        role='combobox'
        aria-label='Search events, teams and tournaments'
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete='list'
        aria-activedescendant={activeRow ? `${uid}-opt-${active}` : undefined}
        autoComplete='off'
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder='Search teams, matches…'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full rounded-full border border-border bg-transparent pl-9 pr-9 text-[13.5px] text-foreground placeholder:text-muted-foreground transition-colors hover:border-foreground/25 focus-visible:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-search-cancel-button]:hidden',
          variant === 'bar' ? 'h-11' : 'h-9',
        )}
      />
      {query && (
        <button
          type='button'
          aria-label='Clear search'
          onClick={() => {
            setQuery('')
            setActive(-1)
            inputRef.current?.focus()
          }}
          className='absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <X aria-hidden className='size-3.5' />
        </button>
      )}

      {showPanel && (
        <div
          id={listId}
          role='listbox'
          aria-label='Search results'
          // Keeps focus in the input when a row (or the panel) is pressed;
          // the link's click still fires.
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            POPOVER,
            'absolute top-full z-50 mt-2 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain',
            variant === 'inline'
              ? 'right-0 w-[min(28rem,calc(100vw-2rem))]'
              : 'inset-x-0',
          )}
        >
          {renderRows(0, eventStart)}

          {(events.length > 0 || eventsPending || eventsFailed) && (
            <div role='group' aria-label='Events' className='mt-1 border-t border-border pt-1'>
              <p className={SECTION_LABEL} aria-hidden>
                Events
              </p>
              {renderRows(eventStart, teamStart)}
              {eventsPending && (
                <p className='flex items-center gap-2 px-3 py-2 text-[12.5px] text-muted-foreground'>
                  <Loader2 aria-hidden className='size-3.5 animate-spin' /> Searching events…
                </p>
              )}
              {eventsFailed && (
                <p className='px-3 py-2 text-[12.5px] text-muted-foreground'>
                  Couldn&rsquo;t load events right now.
                </p>
              )}
            </div>
          )}

          {teamHits.length > 0 && (
            <div role='group' aria-label='Teams' className='mt-1 border-t border-border pt-1'>
              <p className={SECTION_LABEL} aria-hidden>
                Teams
              </p>
              {renderRows(teamStart, tourStart)}
            </div>
          )}

          {tourHits.length > 0 && (
            <div role='group' aria-label='Tournaments' className='mt-1 border-t border-border pt-1'>
              <p className={SECTION_LABEL} aria-hidden>
                Tournaments
              </p>
              {renderRows(tourStart, rows.length)}
            </div>
          )}

          {nothing && (
            <p className='border-t border-border px-3 pb-2 pt-3 text-[12.5px] text-muted-foreground'>
              No events, teams or tournaments match yet — press Enter to search all
              matches.
            </p>
          )}
        </div>
      )}
    </div>
  )
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

/* ── Placement ─────────────────────────────────────────────────────── */

export function NavbarSearch() {
  const pathname = usePathname()
  const [barOpen, setBarOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  /* Route change closes the bar — adjusted while rendering, the same
     pattern the navbar uses for its mobile menu. */
  const [barPath, setBarPath] = useState(pathname)
  if (barPath !== pathname) {
    setBarPath(pathname)
    setBarOpen(false)
  }

  useEffect(() => {
    if (!barOpen) return
    /* The toggle counts as "inside": pressing it must not first close the
       bar here and then have its own click reopen it. Its click toggles. */
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (barRef.current?.contains(t) || toggleRef.current?.contains(t)) return
      setBarOpen(false)
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setBarOpen(false)
      toggleRef.current?.focus()
    }
    // The bar is xl:hidden; growing into the inline layout closes it.
    const wide = window.matchMedia('(min-width: 1280px)')
    const onWide = () => {
      if (wide.matches) setBarOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    wide.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      wide.removeEventListener('change', onWide)
    }
  }, [barOpen])

  return (
    <>
      <div className='hidden w-52 shrink-0 xl:block 2xl:w-64'>
        <SearchBox variant='inline' />
      </div>

      <button
        ref={toggleRef}
        type='button'
        onClick={() => setBarOpen((o) => !o)}
        aria-label={barOpen ? 'Close search' : 'Search'}
        aria-expanded={barOpen}
        aria-controls='navbar-search-bar'
        className={cn(ICON_BUTTON, 'xl:hidden', barOpen && 'bg-muted text-foreground')}
      >
        {barOpen ? (
          <X aria-hidden className='size-[18px]' strokeWidth={1.75} />
        ) : (
          <Search aria-hidden className='size-[18px]' strokeWidth={1.75} />
        )}
      </button>

      {barOpen && (
        <div
          ref={barRef}
          id='navbar-search-bar'
          className='absolute inset-x-0 top-full z-40 border-b border-navbar-border bg-navbar shadow-[var(--lift-2)] xl:hidden'
        >
          <div className='page-container py-3'>
            <SearchBox variant='bar' autoFocus onNavigate={() => setBarOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
