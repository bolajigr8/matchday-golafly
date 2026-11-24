'use client'

import { matchPath } from '@/lib/slug'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMatchdayEvents } from '@/features/matchday/hooks'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { enterBuilder } from '@/features/builder/enter'
import { MatchCard } from '@/components/matches/match-card'
import { eventDateParts } from '@/components/tickets/primitives'
import { SectionHead } from './section-head'
import { HOME_EVENTS_PAGE_SIZE, POPULAR_SHOWN } from './popular-matches-section'
import type { MatchdayEvent } from '@/features/matchday/types'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

/* "Upcoming fixtures" — a card grid of the next fixtures from GET /events.
   It reads the same page as the Popular Matches list (same query key, one
   request) and starts after the rows that list already shows, so the home
   page never repeats a fixture. Card count follows the column count:
   4 on phones, 6 on tablet / small desktop (2 or 3 per row), 8 on wide
   screens (4 per row). */

const HOME_FIXTURE_COUNT = 8

function visibilityFor(i: number) {
  if (i >= 6) return 'hidden xl:block'
  if (i >= 4) return 'hidden sm:block'
  return ''
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <li
      aria-hidden
      className={cn('overflow-hidden rounded-[20px] border border-border bg-card', className)}
    >
      <div className='aspect-[16/10] bg-muted motion-safe:animate-pulse' />
      <div className='space-y-3 p-5'>
        <div className='h-4 w-2/3 rounded-full bg-muted motion-safe:animate-pulse' />
        <div className='h-4 w-1/2 rounded-full bg-muted motion-safe:animate-pulse' />
        <div className='h-3 w-3/4 rounded-full bg-muted motion-safe:animate-pulse' />
        <div className='flex items-end justify-between border-t border-border pt-4'>
          <div className='h-6 w-16 rounded-full bg-muted motion-safe:animate-pulse' />
          <div className='h-10 w-28 rounded-full bg-muted motion-safe:animate-pulse' />
        </div>
      </div>
    </li>
  )
}

function dateLine(iso: string | null) {
  const p = eventDateParts(iso)
  if (!p.valid) return 'Date TBC'
  return `${p.weekday} ${p.day} ${p.month}, ${p.time}`
}

export function UpcomingFixturesSection() {
  const router = useRouter()
  const upsert = useLiveMatchCache((s) => s.upsert)

  // Same filters (→ same cached request) as the Popular Matches "All" tab.
  const { data, isLoading, isError } = useMatchdayEvents({
    per_page: HOME_EVENTS_PAGE_SIZE,
  })

  const events = useMemo(() => {
    const all = data?.events ?? []
    const next = all.slice(POPULAR_SHOWN, POPULAR_SHOWN + HOME_FIXTURE_COUNT)
    // Small catalogue: better to repeat a fixture than show a near-empty grid.
    return next.length >= 4 ? next : all.slice(0, HOME_FIXTURE_COUNT)
  }, [data])

  // Seed the live match cache so the builder can resolve instantly when
  // the user clicks "View tickets" (same pattern as live-fixtures-section.tsx).
  useEffect(() => {
    for (const event of events) upsert(event)
  }, [events, upsert])

  function handleBook(event: MatchdayEvent) {
    upsert(event)
    enterBuilder(router, String(event.id))
  }

  return (
    <section id='upcoming' aria-labelledby='upcoming-title' className='scroll-mt-24'>
      <SectionHead
        align='left'
        titleId='upcoming-title'
        eyebrow='Upcoming fixtures'
        title='Next on the calendar'
        subtitle='Fresh fixtures with live prices from verified ticket partners.'
        action={{ href: '/matches', label: 'See all' }}
      />

      <div className='mt-8 sm:mt-10' aria-busy={isLoading}>
        {isLoading && (
          <ul className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4'>
            <CardSkeleton />
            <CardSkeleton className='hidden sm:block' />
            <CardSkeleton className='hidden lg:block' />
            <CardSkeleton className='hidden xl:block' />
            <li className='sr-only'>Loading upcoming fixtures…</li>
          </ul>
        )}

        {!isLoading && isError && (
          <div className='flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border bg-card px-6 py-14 text-center'>
            <span className='flex size-11 items-center justify-center rounded-full bg-status-warn-bg text-status-warn'>
              <AlertTriangle aria-hidden className='size-5' />
            </span>
            <p className='font-heading text-[17px] font-semibold text-foreground'>
              Live fixtures aren&apos;t available right now
            </p>
            <p className='max-w-sm text-[14px] text-muted-foreground'>
              Please try again in a moment, or browse the full fixture list.
            </p>
          </div>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <ul className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4'>
            {events.map((event, i) => (
              <li key={event.id} className={visibilityFor(i)}>
                <MatchCard
                  matchId={String(event.id)}
                    matchName={event.name}
                    href={matchPath(event)}
                  index={i}
                  home={event.team1.name}
                  away={event.team2.name}
                  homeId={event.team1.id}
                  awayId={event.team2.id}
                  img={
                    event.venue.venue_image ||
                    event.team1.image ||
                    event.team2.image ||
                    ''
                  }
                  info={`${dateLine(event.date)} · ${[
                    event.venue.venue_name,
                    event.venue.venue_city_name,
                  ]
                    .filter(Boolean)
                    .join(', ')}`}
                  badgeLabel={event.tour.name}
                  badgeColor='neon'
                  priceFrom={event.postponed ? null : eventFromPrice(event.min_price)}
                  currency={event.min_price?.currency_code ?? 'EUR'}
                  onBook={() => handleBook(event)}
                />
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className='rounded-[20px] border border-dashed border-border bg-card px-6 py-14 text-center'>
            <p className='font-heading text-[17px] font-semibold text-foreground'>
              No upcoming fixtures right now
            </p>
            <p className='mt-2 text-[14px] text-muted-foreground'>
              Check back soon, or browse the full fixture list.
            </p>
          </div>
        )}

        {/* Phones see 4 cards — offer the full list right under them */}
        {!isLoading && (
          <Link
            href='/matches'
            className='mt-6 flex h-12 items-center justify-center gap-2 rounded-full border border-foreground/15 text-[14px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden'
          >
            Browse all fixtures
            <ArrowRight aria-hidden className='size-4' />
          </Link>
        )}
      </div>
    </section>
  )
}
