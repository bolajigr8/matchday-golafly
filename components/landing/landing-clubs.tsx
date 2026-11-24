'use client'

import * as React from 'react'
import { useClubTiles } from '@/features/matchday/club-tiles'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { useLandingScope } from '@/features/landing/scope'
import { TeamTile } from '@/components/matches/teams-strip'
import { mainUrl } from '@/lib/sites'

/* "Follow your team": this competition's clubs, linking to their pages on the
   MAIN site (teams are followed there, not on a landing page).

   Images follow the site's one rule (features/matchday/club-tiles.ts): our own
   file in /public/flyers first; the ticket API's image only for clubs that
   are allowed to use it and have no file of their own. */

const MAX = 12

export function LandingClubs() {
  const scope = useLandingScope()
  const { ready, tiles } = useClubTiles()
  const slugs = useCatalogueSlugs()

  const ordered = React.useMemo(() => {
    if (!scope) return []
    const out = []
    for (const file of scope.site.clubs) {
      const tile = tiles.find((t) => t.club.file === file)
      if (tile) out.push(tile)
      if (out.length >= MAX) break
    }
    return out
  }, [scope, tiles])

  if (!scope) return null
  if (ready && ordered.length === 0) return null

  return (
    <section
      id='clubs'
      aria-labelledby='landing-clubs-title'
      className='scroll-mt-24 border-y border-border bg-muted/40 py-16 sm:py-20'
    >
      <div className='page-container'>
        <div className='mb-8 text-center'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
            Popular clubs
          </p>
          <h2
            id='landing-clubs-title'
            className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'
          >
            Follow your team
          </h2>
        </div>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
          {!ready &&
            Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className='aspect-[4/5] animate-pulse rounded-2xl border border-border bg-muted'
              />
            ))}
          {ordered.map(({ club, teamId, local, img }, i) => (
            <TeamTile
              key={`${club.file}-${local ? 'local' : 'api'}`}
              team={club}
              img={img}
              local={local}
              href={mainUrl(
                teamId ? slugs.teamPath(teamId, club.name) : '/teams',
              )}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
