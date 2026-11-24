'use client'

// Full club directory — the equivalent of footballticketnet.com's /teams:
// green header, a row of featured clubs with live fixture counts, then the
// A–Z letter grid with every club in the catalogue.
//
// DATA SOURCE: 100% real backend data. `useMatchdayTeams()` calls
// GET /api/v1/matchday/teams; featured cards resolve their names against it
// (features/matchday/resolve.ts) and count fixtures with GET /events.

import { useMemo } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  useMatchdayTeams,
  useMatchdayImageCache,
} from '@/features/matchday/hooks'
import { pickTeam } from '@/features/matchday/resolve'
import { teamPath, teamSlugIndex } from '@/lib/slug'
import { AZDirectory, type DirectoryItem } from '@/components/directory/az-directory'
import { DirectoryHero } from '@/components/directory/directory-hero'
import { DirectoryTabs } from '@/components/directory/directory-tabs'
import { FeaturedGrid, type FeaturedItem } from '@/components/directory/featured-grid'

const FEATURED_TEAMS = [
  'Real Madrid',
  'FC Barcelona',
  'Arsenal',
  'Chelsea',
  'AC Milan',
  'Manchester City',
  'Liverpool',
  'Tottenham Hotspur',
]

export function TeamsDirectoryClient() {
  const { data: teams, isLoading, isError, refetch } = useMatchdayTeams()
  const { teamImages } = useMatchdayImageCache()

  const items: DirectoryItem[] = useMemo(() => {
    const index = teamSlugIndex(teams)
    return (teams ?? []).map((t) => ({
        id: t.team_id,
        name: t.name,
        image: teamImages[t.team_id] ?? t.banner,
        href: teamPath(index, t.team_id, t.name),
      }))
  }, [teams, teamImages])

  const featured: FeaturedItem[] = useMemo(() => {
    const out: FeaturedItem[] = []
    for (const name of FEATURED_TEAMS) {
      const t = pickTeam(teams, name)
      if (t && !out.some((o) => o.id === t.team_id))
        out.push({ id: t.team_id, name: t.name, image: teamImages[t.team_id] ?? null })
    }
    return out
  }, [teams, teamImages])

  return (
    <div className='min-h-screen bg-muted/40 pb-16 dark:bg-background'>
      <DirectoryTabs />
      <DirectoryHero
        crumb='Teams'
        title='All teams'
        subtitle='Find tickets for any team, any league, any match.'
        description={
          isLoading
            ? 'Loading the full club directory…'
            : `Browse our complete directory of ${items.length.toLocaleString('en-GB')} football teams from leagues worldwide, including the Premier League, La Liga, Serie A, Bundesliga and Ligue 1. Pick a letter below to see every team in that group. Every order is covered by our 150% order guarantee.`
        }
      />

      {!isLoading && !isError && (
        <FeaturedGrid heading='Featured teams' items={featured} kind='team' />
      )}

      <div className='page-container pt-8 sm:pt-10'>
        {isLoading && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <Loader2 className='size-5 animate-spin text-ticket-ink' />
            <p className='text-sm text-muted-foreground'>Loading teams…</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <AlertTriangle className='size-5 text-amber-500' />
            <p className='text-sm font-semibold'>Couldn&apos;t load the team directory</p>
            <button
              onClick={() => refetch()}
              className='text-[12px] font-semibold text-ticket-ink underline underline-offset-2'
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <AZDirectory items={items} emptyLabel='teams' heading='Browse teams alphabetically' />
        )}
      </div>
    </div>
  )
}
