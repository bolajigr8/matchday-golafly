'use client'

// International football tickets — partner-marketplace layout: plain header,
// a "Filter" button that opens a right-hand drawer (dates, teams, venues),
// then the green "Upcoming international fixtures" panel. Competitions and
// national teams stay browsable A–Z underneath.
//
// ⚠ SEE features/matchday/international.ts FOR THE FLAG: the backend has no
// "is this international" field, so which competitions count is decided by
// a curated keyword list. Every fixture, id, crest and price shown here
// comes straight from GET /events for those real catalogue competitions.

import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { AlertTriangle, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QueryKeys } from '@/models/query'
import { getEvents } from '@/features/matchday/client'
import {
  useMatchdayTeams,
  useMatchdayTournaments,
} from '@/features/matchday/hooks'
import {
  isCuratedNationalTeamName,
  isCuratedInternationalTournamentName,
} from '@/features/matchday/international'
import { enterBuilder } from '@/features/builder/enter'
import { useLiveMatchCache } from '@/store/live-match-cache'
import type { MatchdayEvent } from '@/features/matchday/types'
import { AZDirectory, type DirectoryItem } from '@/components/directory/az-directory'
import { DirectoryHero } from '@/components/directory/directory-hero'
import { DirectoryTabs } from '@/components/directory/directory-tabs'
import { FixtureRow } from '@/components/matches/fixture-row'
import { eventTime, compareEventDates } from '@/features/matchday/format'

/** Cap on competitions fetched (one GET /events each, 100 fixtures max). */
const MAX_TOURNAMENTS = 12
const PAGE = 20

type Range = 'all' | 'week' | 'next'
interface Filters {
  from: string
  to: string
  range: Range
  teams: string[]
  venues: string[]
}
const EMPTY: Filters = { from: '', to: '', range: 'all', teams: [], venues: [] }

function dayStart(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Monday–Sunday of this week (from today) or of next week. */
function rangeBounds(range: Range): [number, number] | null {
  if (range === 'all') return null
  const today = dayStart(new Date())
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  if (range === 'next') monday.setDate(monday.getDate() + 7)
  const end = new Date(monday)
  end.setDate(monday.getDate() + 7)
  const start = range === 'week' ? today.getTime() : monday.getTime()
  return [start, end.getTime()]
}

function applyFilters(events: MatchdayEvent[], f: Filters) {
  const bounds = rangeBounds(f.range)
  const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null
  const to = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null
  return events.filter((e) => {
    const t = eventTime(e.date)
    // A fixture with no date yet can't match a date filter.
    if ((bounds || from !== null || to !== null) && Number.isNaN(t)) return false
    if (bounds && (t < bounds[0] || t >= bounds[1])) return false
    if (from !== null && t < from) return false
    if (to !== null && t > to) return false
    if (f.teams.length && !f.teams.includes(e.team1.name) && !f.teams.includes(e.team2.name))
      return false
    if (f.venues.length && !f.venues.includes(e.venue.venue_name)) return false
    return true
  })
}

function countBy(events: MatchdayEvent[], keys: (e: MatchdayEvent) => string[]) {
  const m = new Map<string, number>()
  for (const e of events) for (const k of keys(e)) if (k) m.set(k, (m.get(k) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export function InternationalDirectoryClient() {
  const router = useRouter()
  const upsert = useLiveMatchCache((s) => s.upsert)
  const teamsQ = useMatchdayTeams()
  const slugs = useCatalogueSlugs()
  const toursQ = useMatchdayTournaments()
  // Fixed for the life of the page: keeps render pure (react-hooks/purity).
  const [now] = useState(() => Date.now())

  const intlTours = useMemo(
    () => (toursQ.data ?? []).filter((t) => isCuratedInternationalTournamentName(t.name)),
    [toursQ.data],
  )

  const results = useQueries({
    queries: intlTours.slice(0, MAX_TOURNAMENTS).map((t) => ({
      queryKey: [QueryKeys.Matchday_Events, { tour_id: t.tournament_id, per_page: 100, page: 1 }],
      queryFn: () => getEvents({ tour_id: t.tournament_id, per_page: 100, page: 1 }),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  const dataKey = results.map((r) => r.dataUpdatedAt).join('|')
  const allEvents = useMemo(() => {
    const map = new Map<number, MatchdayEvent>()
    for (const r of results)
      for (const e of r.data?.events ?? []) if (eventTime(e.date) > now) map.set(e.id, e)
    return [...map.values()].sort((a, b) => compareEventDates(a.date, b.date))
    // `results` is a new array every render; dataKey tracks real changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, now])

  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(PAGE)
  const events = useMemo(() => applyFilters(allEvents, filters), [allEvents, filters])
  const filterCount =
    (filters.range !== 'all' ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0) +
    filters.teams.length +
    filters.venues.length

  useEffect(() => {
    for (const e of events.slice(0, shown)) upsert(e)
  }, [events, shown, upsert])

  const eventsLoading = toursQ.isLoading || results.some((r) => r.isLoading)
  const eventsError =
    toursQ.isError || (results.length > 0 && results.every((r) => r.isError))
  const teamCount = useMemo(
    () => new Set(allEvents.flatMap((e) => [e.team1.id, e.team2.id])).size,
    [allEvents],
  )

  const nationalTeams: DirectoryItem[] = useMemo(
    () =>
      (teamsQ.data ?? [])
        .filter((t) => isCuratedNationalTeamName(t.name))
        .map((t) => ({ id: t.team_id, name: t.name, image: t.banner, href: slugs.teamPath(t.team_id, t.name) })),
    [teamsQ.data, slugs],
  )
  const tourItems: DirectoryItem[] = useMemo(
    () =>
      intlTours.map((t) => ({
        id: t.tournament_id,
        name: t.name,
        image: t.banner,
        href: slugs.tournamentPath(t.tournament_id, t.name),
      })),
    [intlTours, slugs],
  )

  function book(e: MatchdayEvent) {
    if (e.postponed) return
    upsert(e)
    enterBuilder(router, String(e.id), { title: `${e.team1.name} vs ${e.team2.name}` })
  }

  return (
    <div className='min-h-screen bg-muted/40 pb-16 dark:bg-background'>
      <DirectoryTabs />
      <DirectoryHero
        variant='plain'
        crumb='International'
        title='International football tickets'
        description={
          eventsLoading
            ? 'Loading international fixtures…'
            : `International football tickets for national-team matches worldwide — World Cup, Euros, Nations League and more. ${allEvents.length} upcoming fixtures across ${teamCount} national teams. Every order is covered by our 150% order guarantee.`
        }
      />

      <div className='page-container'>
        <div className='mb-4 flex justify-end'>
          <button
            type='button'
            onClick={() => setOpen(true)}
            className='inline-flex h-10 items-center gap-2 rounded-full bg-ticket px-4 text-[13px] font-semibold text-ticket-foreground shadow-sm transition-opacity hover:opacity-90'
          >
            <SlidersHorizontal className='size-4' />
            Filter
            {filterCount > 0 && (
              <span className='rounded-full bg-ticket-foreground/20 px-1.5 text-[11px]'>
                {filterCount}
              </span>
            )}
          </button>
        </div>

        <section className='rounded-2xl bg-ticket-panel p-3 text-ticket-panel-foreground sm:rounded-3xl sm:p-6'>
          <div className='px-1 pt-1 pb-4 sm:pb-5'>
            <h2 className='text-[17px] font-semibold sm:text-[19px]'>
              Upcoming international fixtures
            </h2>
            <p className='mt-2 text-[14px] font-semibold opacity-90'>
              {eventsLoading
                ? 'Loading…'
                : `${events.length} event${events.length === 1 ? '' : 's'} found`}
              {filterCount > 0 && (
                <button
                  type='button'
                  onClick={() => setFilters(EMPTY)}
                  className='ml-3 text-[12.5px] font-medium underline underline-offset-2'
                >
                  Clear filters
                </button>
              )}
            </p>
          </div>

          {eventsLoading && (
            <div className='flex justify-center py-14'>
              <Loader2 className='size-5 animate-spin' />
            </div>
          )}

          {!eventsLoading && eventsError && (
            <div className='flex flex-col items-center gap-2 py-14 text-center'>
              <AlertTriangle className='size-5' />
              <p className='text-sm font-semibold'>
                International fixtures aren&apos;t available right now
              </p>
              <button
                onClick={() => results.forEach((r) => r.refetch())}
                className='text-[12px] underline underline-offset-2'
              >
                Try again
              </button>
            </div>
          )}

          {!eventsLoading && !eventsError && events.length === 0 && (
            <p className='py-14 text-center text-sm opacity-90'>
              {filterCount
                ? 'No fixtures match these filters.'
                : 'No international fixtures are on sale right now.'}
            </p>
          )}

          <div className='space-y-3'>
            {events.slice(0, shown).map((e, i) => (
              <FixtureRow key={e.id} event={e} index={i} onBook={() => book(e)} />
            ))}
          </div>

          {events.length > shown && (
            <div className='mt-5 flex justify-center'>
              <button
                type='button'
                onClick={() => setShown((n) => n + PAGE)}
                className='h-10 rounded-full bg-ticket-panel-foreground px-6 text-[13px] font-semibold text-ticket-panel transition-opacity hover:opacity-90'
              >
                Show more ({events.length - shown} remaining)
              </button>
            </div>
          )}
        </section>

        {!teamsQ.isLoading && !toursQ.isLoading && (
          <div className='mt-14 space-y-12'>
            <AZDirectory
              items={tourItems}
              emptyLabel='international competitions'
              heading='International competitions'
            />
            <AZDirectory
              items={nationalTeams}
              emptyLabel='national teams'
              heading='National teams'
            />
            <p className='text-center text-[11px] text-muted-foreground'>
              Country and competition coverage reflects today&apos;s ticket catalogue and is
              curated by our team.
            </p>
          </div>
        )}
      </div>

      <FilterDrawer
        open={open}
        onOpenChange={setOpen}
        events={allEvents}
        value={filters}
        onApply={(f) => {
          setFilters(f)
          setShown(PAGE)
          setOpen(false)
        }}
      />
    </div>
  )
}

/* ── Filter drawer ───────────────────────────────────────────────────── */

function FilterDrawer({
  open,
  onOpenChange,
  events,
  value,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  events: MatchdayEvent[]
  value: Filters
  onApply: (f: Filters) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0' />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className='fixed inset-y-0 right-0 z-[60] flex w-full max-w-[380px] flex-col bg-ticket-surface text-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right'
        >
          {/* Remounts on every open, so the draft starts from the applied filters */}
          {open && <DrawerBody events={events} initial={value} onApply={onApply} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function DrawerBody({
  events,
  initial,
  onApply,
}: {
  events: MatchdayEvent[]
  initial: Filters
  onApply: (f: Filters) => void
}) {
  const [draft, setDraft] = useState<Filters>(initial)

  // Team / venue counts follow the date choice, like the partner's drawer.
  const dated = useMemo(
    () => applyFilters(events, { ...draft, teams: [], venues: [] }),
    [events, draft],
  )
  const teamCounts = useMemo(() => countBy(dated, (e) => [e.team1.name, e.team2.name]), [dated])
  const venueCounts = useMemo(() => countBy(dated, (e) => [e.venue.venue_name]), [dated])
  const resultCount = useMemo(() => applyFilters(events, draft).length, [events, draft])

  const toggle = (key: 'teams' | 'venues', v: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v],
    }))

  const chip = (active: boolean) =>
    cn(
      'rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
      active
        ? 'bg-ticket-soft font-semibold text-ticket-soft-foreground'
        : 'text-ticket-ink hover:bg-muted',
    )
  const quick = !draft.from && !draft.to

  return (
    <>
      <div className='flex items-center justify-between border-b border-ticket-line px-5 py-4'>
        <DialogPrimitive.Title className='text-[15px] font-semibold text-ticket-ink'>
          Filters
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          aria-label='Close filters'
          className='rounded-full p-1 text-ticket-ink hover:bg-muted'
        >
          <X className='size-4' />
        </DialogPrimitive.Close>
      </div>

      <div className='flex-1 overflow-y-auto px-5 py-5'>
        <h3 className='mb-3 text-[13px] font-semibold text-ticket-ink'>Date</h3>
        <div className='grid grid-cols-2 gap-2'>
          {(['from', 'to'] as const).map((k) => (
            <label key={k} className='block'>
              <span className='mb-1 block text-[11px] text-muted-foreground'>
                {k === 'from' ? 'From date' : 'To date'}
              </span>
              <input
                type='date'
                value={draft[k]}
                min={k === 'to' ? draft.from || undefined : undefined}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [k]: e.target.value, range: 'all' }))
                }
                className='h-10 w-full rounded-lg border border-ticket-line bg-ticket-surface px-2.5 text-[12.5px] text-foreground outline-none focus:border-ticket dark:[color-scheme:dark]'
              />
            </label>
          ))}
        </div>
        <div className='mt-2.5 flex flex-wrap gap-1.5'>
          {(
            [
              ['all', 'All dates'],
              ['week', 'This week'],
              ['next', 'Next week'],
            ] as [Range, string][]
          ).map(([r, label]) => (
            <button
              key={r}
              type='button'
              aria-pressed={quick && draft.range === r}
              onClick={() => setDraft((d) => ({ ...d, range: r, from: '', to: '' }))}
              className={chip(quick && draft.range === r)}
            >
              {label}
            </button>
          ))}
        </div>

        <hr className='my-5 border-ticket-line' />
        <h3 className='mb-3 text-[13px] font-semibold text-ticket-ink'>Teams</h3>
        <div className='flex flex-wrap gap-1'>
          <button
            type='button'
            aria-pressed={!draft.teams.length}
            onClick={() => setDraft((d) => ({ ...d, teams: [] }))}
            className={chip(!draft.teams.length)}
          >
            All teams ({dated.length})
          </button>
          {teamCounts.map(([name, n]) => (
            <button
              key={name}
              type='button'
              aria-pressed={draft.teams.includes(name)}
              onClick={() => toggle('teams', name)}
              className={chip(draft.teams.includes(name))}
            >
              {name} ({n})
            </button>
          ))}
        </div>

        <hr className='my-5 border-ticket-line' />
        <h3 className='mb-3 text-[13px] font-semibold text-ticket-ink'>Venues</h3>
        <div className='flex flex-wrap gap-1'>
          <button
            type='button'
            aria-pressed={!draft.venues.length}
            onClick={() => setDraft((d) => ({ ...d, venues: [] }))}
            className={chip(!draft.venues.length)}
          >
            All venues ({dated.length})
          </button>
          {venueCounts.map(([name, n]) => (
            <button
              key={name}
              type='button'
              aria-pressed={draft.venues.includes(name)}
              onClick={() => toggle('venues', name)}
              className={chip(draft.venues.includes(name))}
            >
              {name} ({n})
            </button>
          ))}
        </div>
      </div>

      <div className='border-t border-ticket-line p-4'>
        <button
          type='button'
          onClick={() => onApply(draft)}
          className='h-12 w-full rounded-full bg-ticket text-[14px] font-semibold text-ticket-foreground transition-opacity hover:opacity-90'
        >
          Show {resultCount} event{resultCount === 1 ? '' : 's'}
        </button>
      </div>
    </>
  )
}
