'use client'

// Full competition directory — the equivalent of footballticketnet.com's
// /tournaments: green header, featured competitions with live fixture
// counts, then the A–Z grid.
//
// DATA SOURCE: 100% real backend data — GET /tournaments for the catalogue,
// GET /events (per_page=1) for each featured card's count and logo.

import { tournamentPath, tournamentSlugIndex } from '@/lib/slug'
import { useMemo } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  useMatchdayTournaments,
  useMatchdayImageCache,
} from '@/features/matchday/hooks'
import { pickTournament } from '@/features/matchday/resolve'
import { AZDirectory, type DirectoryItem } from '@/components/directory/az-directory'
import { DirectoryHero } from '@/components/directory/directory-hero'
import { DirectoryTabs } from '@/components/directory/directory-tabs'
import { FeaturedGrid, type FeaturedItem } from '@/components/directory/featured-grid'

/* Each entry lists alternative catalogue spellings; the first that
   resolves wins. */
const FEATURED_TOURNAMENTS: string[][] = [
  ['Premier League'],
  ['Champions League'],
  ['Italian Serie A', 'Serie A'],
  ['Spanish La Liga', 'La Liga', 'LaLiga'],
  ['German Bundesliga', 'Bundesliga'],
  ['Portuguese Liga NOS', 'Liga Portugal', 'Primeira Liga'],
  ['French Ligue 1', 'Ligue 1'],
  ['Carabao Cup', 'EFL Cup', 'League Cup'],
]

export function TournamentsDirectoryClient() {
  const { data: tournaments, isLoading, isError, refetch } = useMatchdayTournaments()
  const { tourImages } = useMatchdayImageCache()

  const items: DirectoryItem[] = useMemo(() => {
    const index = tournamentSlugIndex(tournaments)
    return (tournaments ?? []).map((t) => ({
        id: t.tournament_id,
        name: t.name,
        image: tourImages[t.tournament_id] ?? t.banner,
        href: tournamentPath(index, t.tournament_id, t.name),
      }))
  }, [tournaments, tourImages])

  const featured: FeaturedItem[] = useMemo(() => {
    const out: FeaturedItem[] = []
    for (const names of FEATURED_TOURNAMENTS) {
      const t = names.map((n) => pickTournament(tournaments, n)).find(Boolean)
      if (t && !out.some((o) => o.id === t.tournament_id))
        out.push({ id: t.tournament_id, name: t.name, image: t.banner ?? tourImages[t.tournament_id] ?? null })
    }
    return out
  }, [tournaments, tourImages])

  return (
    <div className='min-h-screen bg-muted/40 pb-16 dark:bg-background'>
      <DirectoryTabs />
      <DirectoryHero
        crumb='Tournaments'
        title='All tournaments'
        subtitle='Find tickets for any league, cup, or international competition.'
        description={
          isLoading
            ? 'Loading the full competition directory…'
            : `Browse our complete directory of ${items.length} football competitions, including the Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1 and dozens of cup and international tournaments. Pick a letter below to see every competition in that group. Every order is covered by our 150% order guarantee.`
        }
      />

      {!isLoading && !isError && (
        <FeaturedGrid heading='Featured tournaments' items={featured} kind='tournament' />
      )}

      <div className='page-container pt-8 sm:pt-10'>
        {isLoading && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <Loader2 className='size-5 animate-spin text-ticket-ink' />
            <p className='text-sm text-muted-foreground'>Loading tournaments…</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className='flex flex-col items-center gap-2 py-20 text-center'>
            <AlertTriangle className='size-5 text-amber-500' />
            <p className='text-sm font-semibold'>Couldn&apos;t load the tournament directory</p>
            <button
              onClick={() => refetch()}
              className='text-[12px] font-semibold text-ticket-ink underline underline-offset-2'
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <AZDirectory
            items={items}
            emptyLabel='tournaments'
            heading='Browse tournaments alphabetically'
          />
        )}
      </div>
    </div>
  )
}
