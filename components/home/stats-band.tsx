'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  useMatchdayTeams,
  useMatchdayTournaments,
} from '@/features/matchday/hooks'

/* Ink stats strip that sits under Trending competitions on the home page.

   ┌───────────┬──────────────┬──────────────────┬───────────────┐
   │ ▬         │ ▬            │ ▬                │ ▬             │
   │ 1,284     │ 62           │ 100%             │ 24/7          │
   │ TEAMS     │ COMPETITIONS │ VERIFIED TICKETS │ SUPPORT       │
   └───────────┴──────────────┴──────────────────┴───────────────┘

   The two counts are live (GET /teams, GET /tournaments: the same
   catalogue hooks AboutSection uses); the other two are claims the site
   already makes (100% verified tickets, 24/7 support). 2×2 on phones,
   one row of four from lg, hairlines between cells. Neon is allowed as
   type here because this is an ink band. */

type Stat = { key: string; label: string; value: ReactNode | null }

function count(n: number | undefined) {
  return n ? n.toLocaleString('en-GB') : null
}

/** Left cells sit flush with the page gutter so the numbers line up with
 *  the hero copy above; the rest get room on both sides of the hairline. */
function cellPadding(i: number) {
  return cn(
    'py-5 pr-4 sm:py-6 lg:py-1.5 lg:pr-8',
    i % 2 === 0 ? 'pl-0' : 'pl-5 sm:pl-8',
    i === 0 ? 'lg:pl-0' : 'lg:pl-8',
  )
}

export function StatsBand() {
  const teamsQuery = useMatchdayTeams()
  const tournamentsQuery = useMatchdayTournaments()
  const teams = teamsQuery.data
  const tournaments = tournamentsQuery.data
  const failed = teamsQuery.isError || tournamentsQuery.isError

  const stats: Stat[] = [
    { key: 'teams', label: 'Teams', value: count(teams?.length) },
    {
      key: 'competitions',
      label: 'Competitions',
      value: count(tournaments?.length),
    },
    {
      key: 'verified',
      label: 'Verified tickets',
      value: (
        <>
          100<span className='text-primary'>%</span>
        </>
      ),
    },
    {
      key: 'support',
      label: 'Support',
      value: (
        <>
          24<span className='text-primary'>/</span>7
        </>
      ),
    },
  ]

  return (
    <section
      aria-label='Golafly Matchday at a glance'
      className='border-y border-band-ink-border bg-band-ink text-band-ink-fg'
    >
      <div className='page-container py-8 sm:py-10'>
        <dl className='grid grid-cols-2 gap-px bg-band-ink-border lg:grid-cols-4'>
          {stats.map((s, i) => (
            <div
              key={s.key}
              className={cn('flex flex-col-reverse bg-band-ink', cellPadding(i))}
            >
              <dt className='mt-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-band-ink-muted'>
                {s.label}
              </dt>
              <dd>
                <span
                  aria-hidden
                  className='mb-4 block h-[3px] w-6 rounded-full bg-primary'
                />
                <span className='block font-heading text-[36px] font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-[44px]'>
                  {s.value ?? (
                    <span className='text-band-ink-muted'>
                      <span aria-hidden>—</span>
                      <span className='sr-only'>
                        {failed ? 'Not available' : 'Loading'}
                      </span>
                    </span>
                  )}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
