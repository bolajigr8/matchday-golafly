'use client'

import { PromoFromPrice, useCardPromo } from '@/components/promo/promo-price'
import { PromoBadge } from '@/components/promo/promo-badge'
import Link from 'next/link'
import { useLandingScope } from '@/features/landing/scope'
import { seatsHref } from '@/features/builder/enter'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchdayEvent } from '@/features/matchday/types'
import { matchPath } from '@/lib/slug'
import {
  TeamCrest,
  eventDateParts,
  ticketMoney,
  urgencyFor,
} from '@/components/tickets/primitives'
import { parseEventDate } from '@/features/matchday/format'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

/* Fixture list row — footballticketnet-style, Golafly language.

   ≥ lg  [date] [crest vs crest] COMPETITION · tag          FROM €X  [View tickets →]
                                 Home vs Away
                                 ⌖ Venue, City · 20:00
   sm–lg same row; the crest pair moves inline next to each team name.
   < sm  compact stacked card:
         [date] COMPETITION · tag
                ◯ Home
                ◯ Away
                ⌖ Venue, City · 20:00
         ─────────────────────────────
         FROM €X                 [View tickets →]

   Props are shared with /matches, /team, /tournament and /international —
   keep them stable. Clicking anywhere on a bookable row opens the builder
   (onBook); the title links to the match page. */

interface FixtureRowProps {
  event: MatchdayEvent
  index?: number
  onBook?: () => void
  hideUrgency?: boolean
}

const PRIMARY_PILL =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,transform] duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:h-11 sm:px-6 sm:text-[14px]'

const SECONDARY_PILL =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-foreground/15 px-5 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-11'

/** Left date tile: weekday · big day numeral · month. */
function DateTile({ iso }: { iso: string | null }) {
  const p = eventDateParts(iso)
  return (
    <div
      className='flex w-[58px] shrink-0 flex-col items-center justify-center self-stretch rounded-[14px] bg-muted px-1 py-2 text-center sm:w-[74px] sm:self-auto sm:py-2.5'
      aria-hidden
    >
      <span className='font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-muted-foreground'>
        {p.weekday}
      </span>
      <span
        className={cn(
          'mt-1 font-display leading-[0.9] text-foreground',
          // "TBC" (no date yet) is three letters — keep it inside the tile
          p.valid ? 'text-[34px] sm:text-[44px]' : 'text-[22px] sm:text-[28px]',
        )}
      >
        {p.day}
      </span>
      <span className='font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-foreground/80'>
        {p.month}
      </span>
    </div>
  )
}

function UrgencyChip({ label }: { label: string }) {
  const soon = label === 'This weekend'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-4 whitespace-nowrap',
        soon
          ? 'bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'
          : 'border border-border text-muted-foreground',
      )}
    >
      {label}
    </span>
  )
}

export function FixtureRow({
  event,
  index = 0,
  onBook,
  hideUrgency,
}: FixtureRowProps) {
  const reduce = useReducedMotion()
  // On a landing page there is no /match/… page: the row books in place.
  const scope = useLandingScope()
  const href = scope ? seatsHref(String(event.id)) : matchPath(event)
  const urgency = hideUrgency ? null : urgencyFor(event.date)
  const price = eventFromPrice(event.min_price)
  const currency = event.min_price?.currency_code ?? 'EUR'
  const bookable = !event.postponed && price != null && !!onBook
  // Match promo (Admin → Match Promo): tag + crossed-out price.
  const deal = useCardPromo(event.postponed ? null : price)
  const parts = eventDateParts(event.date)
  const city = event.venue.venue_city_name
  const venue = [event.venue.venue_name, city].filter(Boolean).join(', ')
  const parsedDate = parseEventDate(event.date)
  const dateLabel = Number.isNaN(parsedDate.getTime())
    ? 'Date to be confirmed'
    : parsedDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  return (
    <motion.article
      className={cn(
        'group relative flex flex-col gap-3.5 rounded-[20px] border border-border bg-card p-3.5 transition duration-200 motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-5 sm:p-4 sm:pr-5',
        bookable &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--lift-3)] motion-reduce:hover:translate-y-0',
      )}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 12) * 0.03, duration: 0.3 }}
      onClick={() => bookable && onBook?.()}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3.5 sm:gap-5'>
        <DateTile iso={event.date} />

        {/* Crest pair — desktop only; smaller screens show a crest per line */}
        <div aria-hidden className='hidden shrink-0 items-center gap-2 lg:flex'>
          <TeamCrest
            teamId={event.team1.id}
            name={event.team1.name}
            className='size-11'
          />
          <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>
            vs
          </span>
          <TeamCrest
            teamId={event.team2.id}
            name={event.team2.name}
            className='size-11'
          />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex min-w-0 items-center gap-2'>
            <p className='truncate font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]'>
              {event.tour.name}
            </p>
            {urgency && <UrgencyChip label={urgency} />}
          </div>

          <h3 className='mt-1.5 font-heading text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-[16px] lg:text-[17px]'>
            <Link
              href={href}
              onClick={(e) => {
                e.stopPropagation()
                if (scope && onBook) {
                  e.preventDefault()
                  onBook()
                }
              }}
              className='flex flex-col gap-1 rounded-sm decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:inline'
            >
              <span className='flex min-w-0 items-center gap-2 lg:inline'>
                <span aria-hidden className='lg:hidden'>
                  <TeamCrest
                    teamId={event.team1.id}
                    name={event.team1.name}
                    className='size-5'
                  />
                </span>
                <span className='truncate lg:whitespace-normal'>
                  {event.team1.name}
                </span>
              </span>
              <span className='sr-only lg:not-sr-only lg:mx-1.5 lg:font-normal lg:text-muted-foreground'>
                {' '}
                vs{' '}
              </span>
              <span className='flex min-w-0 items-center gap-2 lg:inline'>
                <span aria-hidden className='lg:hidden'>
                  <TeamCrest
                    teamId={event.team2.id}
                    name={event.team2.name}
                    className='size-5'
                  />
                </span>
                <span className='truncate lg:whitespace-normal'>
                  {event.team2.name}
                </span>
              </span>
            </Link>
          </h3>

          <p className='mt-1.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted-foreground sm:text-[13px]'>
            <MapPin aria-hidden className='size-3.5 shrink-0' />
            <span className='truncate'>{venue}</span>
            <span aria-hidden className='shrink-0 opacity-50'>
              ·
            </span>
            <time
              dateTime={event.date ?? undefined}
              className='shrink-0 font-mono text-[12px]'
            >
              <span className='sr-only'>{dateLabel}, </span>
              {parts.time}
            </time>
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 border-t border-border pt-3.5 sm:shrink-0 sm:justify-end sm:gap-5 sm:border-0 sm:pt-0'>
        {event.postponed ? (
          <span className='rounded-full bg-status-warn-bg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-status-warn'>
            Postponed
          </span>
        ) : price != null ? (
          <>
            <div className='flex min-w-0 flex-col items-start gap-2 sm:items-end'>
              {/* On a white row: the seats page's lemon badge (PromoBadge). */}
              {deal && <PromoBadge label={deal.label} percent={deal.percent} />}
              <PromoFromPrice
                price={price}
                deal={deal}
                format={(amount) => ticketMoney(amount, currency)}
                align='right'
                priceClassName='sm:text-[22px]'
              />
            </div>
            {onBook ? (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onBook()
                }}
                className={PRIMARY_PILL}
              >
                View tickets
                <ArrowRight
                  aria-hidden
                  className='size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none'
                  strokeWidth={2.25}
                />
                <span className='sr-only'>
                  {' '}
                  for {event.team1.name} vs {event.team2.name}
                </span>
              </button>
            ) : (
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className={PRIMARY_PILL}
              >
                View tickets
                <ArrowRight
                  aria-hidden
                  className='size-3.5'
                  strokeWidth={2.25}
                />
                <span className='sr-only'>
                  {' '}
                  for {event.team1.name} vs {event.team2.name}
                </span>
              </Link>
            )}
          </>
        ) : (
          <>
            <p className='text-[13px] text-muted-foreground'>
              Tickets coming soon
            </p>
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={SECONDARY_PILL}
            >
              Details
              <span className='sr-only'>
                {' '}
                for {event.team1.name} vs {event.team2.name}
              </span>
            </Link>
          </>
        )}
      </div>
    </motion.article>
  )
}
