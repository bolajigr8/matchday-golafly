'use client'

// features/matchday/club-tiles.ts
//
// The club list + image for every "Popular Clubs" section:
//   • homepage  → Featured Teams   (components/home/featured-clubs.tsx)
//   • /matches  → Follow your team (components/matches/teams-strip.tsx)
// Both use this hook, so they always show the same clubs with the same
// images, following the rules in flyers.ts:
//   1. our own image in /public/flyers when it exists;
//   2. otherwise, for `apiImage` clubs only, the live API image;
//   3. every other club is hidden until its image is added.

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import { getEvents } from './client'
import { useMatchdayImageCache, useMatchdayTeams } from './hooks'
import { findTeamIdByName } from './resolve'
import { CLUBS, useFlyers, type Club } from './flyers'

export interface ClubTileData {
  club: Club
  /** Real team id, for /team/{id}; undefined if the API doesn't list it. */
  teamId?: number
  /** Image to show, or null (the tile then shows the club's badge). */
  img: string | null
  /** True when `img` is our own /public/flyers image. */
  local: boolean
}

export function useClubTiles(): { ready: boolean; tiles: ClubTileData[] } {
  const { data: teams } = useMatchdayTeams()
  const { teamImages } = useMatchdayImageCache()
  const { ready, srcFor, version } = useFlyers()

  const base = useMemo(() => {
    if (!ready) return []
    return CLUBS.filter((c) => srcFor(c.file) || c.apiImage).map((club) => {
      const teamId = findTeamIdByName(teams, club.name) ?? undefined
      const local = srcFor(club.file)
      const match = teamId != null ? teams?.find((t) => t.team_id === teamId) : undefined
      const cached = !local && match ? (teamImages[match.team_id] ?? match.banner ?? null) : null
      return { club, teamId, local, cached }
    })
    // `version` changes whenever the set of available images changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, version, teams, teamImages])

  // API-image clubs outside the 100-event image sample: one tiny
  // GET /events per club gives its squad image. Never used for clubs that
  // have their own image.
  const missing = base.filter((x) => !x.local && x.teamId != null && !x.cached)
  const lookups = useQueries({
    queries: missing.map((x) => ({
      queryKey: [QueryKeys.Matchday_Events, { _img: true, home_team_id: x.teamId, per_page: 1 }],
      queryFn: () => getEvents({ home_team_id: x.teamId!, per_page: 1, page: 1 }),
      staleTime: 30 * 60 * 1000,
      retry: false,
    })),
  })
  const fetched = new Map<number, string | null>()
  missing.forEach((x, i) => {
    const ev = lookups[i]?.data?.events?.[0]
    fetched.set(x.teamId!, ev ? (ev.team1.id === x.teamId ? ev.team1.image : ev.team2.image) : null)
  })

  return {
    ready,
    tiles: base.map(({ club, teamId, local, cached }) => ({
      club,
      teamId,
      local: !!local,
      img: local ?? cached ?? (teamId != null ? (fetched.get(teamId) ?? null) : null),
    })),
  }
}
