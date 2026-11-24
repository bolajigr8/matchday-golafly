'use client'

// features/matchday/use-catalogue-slugs.ts
//
// Link builder for every client component that points at a team or
// tournament page. Uses the same GET /teams and GET /tournaments catalogue
// queries the navbar already runs on every page (react-query serves them
// from cache), and lib/slug.ts — the exact rules the server uses — so a
// link is the canonical slug as soon as the catalogue is in.
//
// Before the catalogue loads, links fall back to "/team/<name>-<id>",
// which the team/tournament page 308s to the canonical slug.

import { useMemo } from 'react'
import { useMatchdayTeams, useMatchdayTournaments } from './hooks'
import {
  teamPath,
  teamSlugIndex,
  tournamentPath,
  tournamentSlugIndex,
} from '@/lib/slug'

export function useCatalogueSlugs() {
  const { data: teams } = useMatchdayTeams()
  const { data: tournaments } = useMatchdayTournaments()

  const teamIndex = useMemo(() => (teams ? teamSlugIndex(teams) : null), [teams])
  const tourIndex = useMemo(
    () => (tournaments ? tournamentSlugIndex(tournaments) : null),
    [tournaments],
  )

  return useMemo(
    () => ({
      teamPath: (id: number, name?: string | null) => teamPath(teamIndex, id, name),
      tournamentPath: (id: number, name?: string | null) =>
        tournamentPath(tourIndex, id, name),
      /** False once the catalogue is in and has no such team, i.e. its page
       *  would 404 (a team that was removed). Link only when true (SEO
       *  brief, Task 7). True while the catalogue is still loading. */
      hasTeam: (id: number) => (teamIndex ? teamIndex.byId.has(id) : true),
      /** Same for tournaments. */
      hasTournament: (id: number) => (tourIndex ? tourIndex.byId.has(id) : true),
    }),
    [teamIndex, tourIndex],
  )
}
