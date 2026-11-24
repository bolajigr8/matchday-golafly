'use client'

import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import { getEvents } from '@/features/matchday/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import { TeamCrest, teamCrestUrl } from '@/components/tickets/primitives'
import type { EventFilters } from '@/features/matchday/types'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'

/* "Featured teams" / "Featured tournaments" row. Each card asks GET /events
   for one fixture (per_page=1) — that single call returns both the real
   fixture count (meta.total_events) and the crest the supplier uses on
   fixtures, which is more reliable than the catalogue's banner field. */

export interface FeaturedItem {
  id: number
  name: string
  /** Catalogue image used until the fixture lookup returns a crest. */
  image?: string | null
}

export function FeaturedGrid({
  heading,
  items,
  kind,
}: {
  heading: string
  items: FeaturedItem[]
  kind: 'team' | 'tournament'
}) {
  const slugs = useCatalogueSlugs()
  // One filter per card (tournament) or two (team: home + away fixtures).
  const filters: EventFilters[] = items.flatMap((it): EventFilters[] =>
    kind === 'team'
      ? [{ home_team_id: it.id }, { away_team_id: it.id }]
      : [{ tour_id: it.id }],
  )
  const results = useQueries({
    queries: filters.map((f) => ({
      queryKey: [QueryKeys.Matchday_Events, { _count: true, ...f, per_page: 1 }],
      queryFn: () => getEvents({ ...f, per_page: 1, page: 1 }),
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  })

  if (!items.length) return null
  const per = kind === 'team' ? 2 : 1

  return (
    <section className='page-container pt-6 pb-2 sm:pt-8'>
      <h2 className='mb-4 text-[13px] font-bold uppercase tracking-wide text-ticket-ink'>
        {heading}
      </h2>
      <div
        className={cn(
          '-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:overflow-visible sm:px-0',
          // Tournament covers need width to read well: 4 per row on desktop.
          kind === 'tournament' ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-4 lg:grid-cols-8',
        )}
      >
        {items.map((it, i) => {
          const rs = results.slice(i * per, i * per + per)
          const loading = rs.some((r) => r.isLoading)
          const total = rs.reduce((n, r) => n + (r.data?.meta?.total_events ?? 0), 0)
          const ev = rs.find((r) => r.data?.events?.[0])?.data?.events?.[0]
          // Teams: the transparent club crest (team.image is a squad photo).
          // Tournaments: tour.image is already the competition logo.
          const crest = kind === 'team' ? teamCrestUrl(it.id) : ev?.tour.image
          if (kind === 'tournament') {
            // GET /tournaments `banner` is a wide promo image (≈16:9), so
            // it's shown as a cover, not shrunk into a crest circle.
            const cover = it.image || ev?.tour.image || null
            return (
              <Link
                key={it.id}
                href={slugs.tournamentPath(it.id, it.name)}
                className='group flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-ticket-surface ring-1 ring-ticket-line transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-primary sm:w-auto'
              >
                <TournamentCover src={cover} name={it.name} />
                <span className='flex flex-1 flex-col items-center justify-center px-2 py-2.5 text-center'>
                  <span className='line-clamp-2 text-[12.5px] font-semibold leading-tight text-ticket-ink'>
                    {it.name}
                  </span>
                  <span className='mt-1 text-[10.5px] text-muted-foreground'>
                    {loading ? '…' : `${total} match${total === 1 ? '' : 'es'}`}
                  </span>
                </span>
              </Link>
            )
          }
          return (
            <Link
              key={it.id}
              href={
                kind === 'team'
                  ? slugs.teamPath(it.id, it.name)
                  : slugs.tournamentPath(it.id, it.name)
              }
              className='flex w-[132px] shrink-0 snap-start flex-col items-center rounded-xl bg-ticket-surface px-2 pt-3 pb-3 text-center ring-1 ring-ticket-line transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-ticket sm:w-auto'
            >
              <span className='flex size-11 items-center justify-center rounded-full bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.12)]'>
                <TeamCrest src={crest ?? it.image} name={it.name} className='size-full' />
              </span>
              <span className='mt-2 line-clamp-2 text-[12.5px] font-semibold leading-tight text-ticket-ink'>
                {it.name}
              </span>
              <span className='mt-1 text-[10.5px] text-muted-foreground'>
                {loading ? '…' : `${total} match${total === 1 ? '' : 'es'}`}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function TournamentCover({ src, name }: { src: string | null; name: string }) {
  const [bad, setBad] = useState(false)
  return (
    <span className='relative block aspect-[16/9] w-full overflow-hidden bg-muted'>
      {src && !bad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading='lazy'
          onError={() => setBad(true)}
          className='absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105'
        />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-primary/15'>
          <Trophy className='size-7 text-brand-text' />
        </span>
      )}
    </span>
  )
}
