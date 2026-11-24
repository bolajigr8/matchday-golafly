'use client'

// features/landing/scope.tsx
//
// "Which competition is this page about, and what happens when a visitor
// picks a match or searches?" — in one place.
//
// The landing page (app/lp/[site]/client.tsx) wraps itself in
// <LandingScopeProvider>. Components shared with the main site (the two
// heroes, the search box) call useLandingScope(): it is null on golafly.com,
// so they behave exactly as before there, and returns the scope on a landing
// page, where they narrow themselves to this competition. No props threaded
// through the existing components.

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  useMatchdayEvents,
  useMatchdayTournaments,
} from '@/features/matchday/hooks'
import { pickTournament } from '@/features/matchday/resolve'
import type { MatchSearchQuery } from '@/features/matchday/use-matches-search'
import type { EventFilters, MatchdayEvent } from '@/features/matchday/types'
import { enterBuilder } from '@/features/builder/enter'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { trackSelectItem } from '@/lib/analytics'
import { mainUrl, type LandingSite } from '@/lib/sites'
import { isMatchdayLive } from '@/features/matchday/config'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'

/** The id the page scrolls to when a search runs. */
export const FIXTURES_ANCHOR = 'fixtures'

/** One request serves the heroes, the search suggestions and the fixtures
 *  list's first page: they all use exactly these filters. */
const PAGE_SIZE = 100

export interface CompetitionTeam {
  team_id: number
  name: string
}

export interface LandingScope {
  site: LandingSite
  /** null until the catalogue has been read (or if no tournament matches). */
  tourId: number | null
  tourName: string
  /** Filters for the competition's events, first page. null until tourId. */
  eventFilters: EventFilters | null
  /** The competition's fixtures, first page (shared by heroes and list). */
  events: MatchdayEvent[]
  /** All of this competition's events on sale (the list may be paged). */
  eventsTotal: number
  eventsLoading: boolean
  /** Teams that actually have fixtures in this competition. */
  teams: CompetitionTeam[]
  /** Start booking a match: quantity dialog, then the Seats step. */
  openMatch: (event: MatchdayEvent, listName?: string) => void
  /** Run a search inside this competition: fills the fixtures list. */
  search: (q: MatchSearchQuery) => void
  /** Link to a team's page on the MAIN site. */
  teamHref: (team: CompetitionTeam) => string
}

const Ctx = React.createContext<LandingScope | null>(null)

/** null on the main site. */
export function useLandingScope(): LandingScope | null {
  return React.useContext(Ctx)
}

export function eventTitle(e: MatchdayEvent): string {
  return e.name || `${e.team1.name} vs ${e.team2.name}`
}

export function LandingScopeProvider({
  site,
  initialTourId,
  initialTourName,
  children,
}: {
  site: LandingSite
  /** Resolved on the server when the API was reachable, to skip a round trip. */
  initialTourId: number | null
  initialTourName: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const live = isMatchdayLive()
  const upsert = useLiveMatchCache((s) => s.upsert)
  const slugs = useCatalogueSlugs()

  const { data: tournaments } = useMatchdayTournaments()
  const resolved = React.useMemo(
    () => pickTournament(tournaments, site.tournamentName),
    [tournaments, site.tournamentName],
  )
  const tourId = initialTourId ?? resolved?.tournament_id ?? null
  const tourName = resolved?.name ?? initialTourName

  const eventFilters = React.useMemo<EventFilters | null>(
    () =>
      tourId ? { tour_id: tourId, per_page: PAGE_SIZE, page: 1 } : null,
    [tourId],
  )
  const eventsQuery = useMatchdayEvents(eventFilters ?? {}, {
    enabled: live && !!eventFilters,
  })
  const events = React.useMemo(
    () => eventsQuery.data?.events ?? [],
    [eventsQuery.data],
  )

  const teams = React.useMemo<CompetitionTeam[]>(() => {
    const m = new Map<number, CompetitionTeam>()
    for (const e of events) {
      for (const t of [e.team1, e.team2]) {
        if (t?.id && t.name && !m.has(t.id)) m.set(t.id, { team_id: t.id, name: t.name })
      }
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [events])

  const openMatch = React.useCallback(
    (event: MatchdayEvent, listName = `${site.name} landing`) => {
      upsert(event)
      trackSelectItem(
        {
          id: String(event.id),
          name: eventTitle(event),
          category: event.tour?.name,
          price: event.min_price?.price ?? undefined,
        },
        listName,
      )
      enterBuilder(router, String(event.id), { title: eventTitle(event) })
    },
    [router, upsert, site.name],
  )

  const search = React.useCallback(
    ({ q, date, teamId }: MatchSearchQuery) => {
      const usp = new URLSearchParams()
      // A picked team filters by id; free text filters by name.
      if (teamId) usp.set('team', String(teamId))
      else if (q.trim()) usp.set('q', q.trim())
      if (date) usp.set('date', date)
      const qs = usp.toString()
      router.replace(qs ? `/?${qs}` : '/', { scroll: false })
      // After the list has had a moment to re-render.
      window.setTimeout(() => {
        document
          .getElementById(FIXTURES_ANCHOR)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    },
    [router],
  )

  const teamHref = React.useCallback(
    (t: CompetitionTeam) => mainUrl(slugs.teamPath(t.team_id, t.name)),
    [slugs],
  )

  const value = React.useMemo<LandingScope>(
    () => ({
      site,
      tourId,
      tourName,
      eventFilters,
      events,
      eventsTotal: eventsQuery.data?.meta?.total_events ?? events.length,
      eventsLoading: eventsQuery.isLoading,
      teams,
      openMatch,
      search,
      teamHref,
    }),
    [
      site,
      tourId,
      tourName,
      eventFilters,
      events,
      eventsQuery.data,
      eventsQuery.isLoading,
      teams,
      openMatch,
      search,
      teamHref,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
