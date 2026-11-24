'use client'

// features/matchday/featured.ts
//
// The /matches hero carousel: ONE slide per hero club (HERO_CLUBS in
// flyers.ts) whose image exists in /public/flyers. For each of those clubs
// we fetch its upcoming fixtures (home AND away) and put its next match on
// its image. A hero club whose image is missing gets no slide at all.
//
// Two flyer clubs playing each other (e.g. Barcelona vs Real Madrid) do
// not cost a slide: each club falls back to its next other fixture, and
// only if it has none does it reuse the shared match on its own flyer.

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import { getEvents } from './client'
import { useMatchdayTeams } from './hooks'
import { pickTeam } from './resolve'
import { CLUBS, HERO_CLUBS, useFlyers } from './flyers'
import type { MatchdayEvent } from './types'
import { useLandingScope } from '@/features/landing/scope'
import { eventTime, compareEventDates } from '@/features/matchday/format'

export interface FeaturedSlide {
  event: MatchdayEvent
  /** Public path of our flyer for this slide's club. */
  flyer: string
}

const PER_QUERY = 10

/** dd-mm-yyyy, the format GET /events expects for from_date. */
function ddmmyyyy(ms: number) {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

export function useFeaturedEvents(enabled = true) {
  // On a landing page (features/landing/scope.tsx) the clubs come from that
  // competition's list and the fixtures from its ONE events request, instead of
  // two requests per club. null on the main site: nothing below changes there.
  const scope = useLandingScope()
  const scopedEvents = scope?.events
  const clubFiles: readonly string[] = scope ? scope.site.clubs : HERO_CLUBS
  const { data: teams } = useMatchdayTeams()
  const { ready: flyersChecked, srcFor, version } = useFlyers(enabled)
  // Fixed for the life of the page: keeps render pure (react-hooks/purity).
  const [now] = useState(() => Date.now())

  /** Clubs whose flyer exists, resolved to their real team_id. */
  const clubs = useMemo(() => {
    const out: { teamId: number; flyer: string }[] = []
    for (const file of clubFiles) {
      const flyer = srcFor(file)
      const club = CLUBS.find((c) => c.file === file)
      if (!flyer || !club) continue
      const t = pickTeam(teams, club.name)
      if (t && !out.some((c) => c.teamId === t.team_id)) out.push({ teamId: t.team_id, flyer })
    }
    return out
    // `version` changes whenever the set of available images changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, version, clubFiles])

  const fromDate = ddmmyyyy(now)
  const results = useQueries({
    queries: (scope ? [] : clubs).flatMap(({ teamId }) =>
      (['home_team_id', 'away_team_id'] as const).map((side) => ({
        queryKey: [
          QueryKeys.Matchday_Events,
          { _featured: true, [side]: teamId, from_date: fromDate, per_page: PER_QUERY },
        ],
        queryFn: () =>
          getEvents({ [side]: teamId, from_date: fromDate, per_page: PER_QUERY, page: 1 }),
        enabled: enabled && clubs.length > 0,
        staleTime: 5 * 60 * 1000,
        retry: false,
      })),
    ),
  })

  const dataKey = results.map((r) => r.dataUpdatedAt).join('|')
  const slides = useMemo<FeaturedSlide[]>(() => {
    const all = new Map<number, MatchdayEvent>()
    if (scopedEvents) for (const e of scopedEvents) all.set(e.id, e)
    else for (const r of results) for (const e of r.data?.events ?? []) all.set(e.id, e)
    const upcoming = [...all.values()].filter(
      (e) => !e.postponed && eventTime(e.date) > now,
    )

    // Bookable (priced) fixtures first, then the soonest.
    const rank = (a: MatchdayEvent, b: MatchdayEvent) =>
      Number(b.min_price?.price != null) - Number(a.min_price?.price != null) ||
      compareEventDates(a.date, b.date)

    const used = new Set<number>()
    const out: FeaturedSlide[] = []
    for (const { teamId, flyer } of clubs) {
      const mine = upcoming
        .filter((e) => e.team1.id === teamId || e.team2.id === teamId)
        .sort(rank)
      const pick = mine.find((e) => !used.has(e.id)) ?? mine[0]
      if (!pick) continue // no upcoming fixture for this club — no slide
      used.add(pick.id)
      out.push({ event: pick, flyer })
    }
    return out.sort((a, b) => compareEventDates(a.event.date, b.event.date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, clubs, now, scopedEvents])

  return {
    slides,
    isLoading:
      !teams ||
      !flyersChecked ||
      (scope ? scope.eventsLoading : results.some((r) => r.isLoading)),
  }
}
