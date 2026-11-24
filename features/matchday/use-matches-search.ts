'use client'

// One search -> /matches navigation shared by every search box (the home
// hero and the /matches hero). A suggestion picked from the dropdown already
// carries its real team/tournament id; free text is resolved the same way
// everywhere ("Arsenal v Leeds" -> pairing, "premier" -> tour_id, otherwise
// event_name). The date filters that single day.
//
// Readable URLs: a search that comes down to ONE team or ONE competition,
// with no date, opens that team's or competition's own page
// (/team/real-madrid, /tournament/premier-league) instead of
// /matches?team_id=8. Those pages list every fixture and can't filter by
// day, so a search WITH a date still goes to the filtered /matches results.

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchdayTeams, useMatchdayTournaments } from './hooks'
import { buildMatchesSearchUrl, resolveSearchQuery, type ResolvedSearch } from './resolve'
import { useCatalogueSlugs } from './use-catalogue-slugs'

export interface MatchSearchQuery {
  q: string
  /** YYYY-MM-DD or "" */
  date: string
  teamId?: number
  tourId?: number
}

export function useMatchesSearchNavigate() {
  const router = useRouter()
  const { data: teams } = useMatchdayTeams()
  const { data: tournaments } = useMatchdayTournaments()
  const slugs = useCatalogueSlugs()

  return useCallback(
    ({ q, date, teamId, tourId }: MatchSearchQuery) => {
      const r: ResolvedSearch = teamId || tourId ? {} : resolveSearchQuery(q, teams, tournaments)
      const team = teamId ?? r.teamId
      const tour = tourId ?? r.tourId
      const pairing = !!(r.homeName || r.awayName)
      if (!date && !pairing && !r.q) {
        const entity =
          team && !tour
            ? slugs.teamPath(team, teams?.find((t) => t.team_id === team)?.name)
            : tour && !team
              ? slugs.tournamentPath(tour, tournaments?.find((t) => t.tournament_id === tour)?.name)
              : null
        if (entity) {
          router.push(entity)
          return entity
        }
      }
      const url = buildMatchesSearchUrl({
        q: r.q,
        teamId: teamId ?? r.teamId,
        tourId: tourId ?? r.tourId,
        homeTeamName: r.homeName,
        awayTeamName: r.awayName,
        date: date || undefined,
      })
      router.push(url)
      return url
    },
    [router, teams, tournaments, slugs],
  )
}
