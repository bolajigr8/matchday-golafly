'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Flame, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchBadge } from '@/store/matches'
import { TeamCrest } from '@/components/tickets/primitives'
import { MatchdayTicket } from '@/components/brand/matchday-logo'
import { matchShortPath } from '@/lib/slug'
import { PromoFromPrice, PromoTag, useCardPromo } from '@/components/promo/promo-price'

/* Match card — image header (venue / team photo) under an ink scrim with
   the competition chip and kickoff date, then teams, venue, from-price and
   a primary "View tickets" pill. Used by the home upcoming grid and the
   /matches grids (live, elite, World Cup) — keep the props stable.
   Clicking a bookable card (has a price, not sold out, onBook given) books;
   the title links to the match page. */

/** Competition dot colour inside the chip (the chip itself is always the
 *  same glass pill so it reads on any photo). */
const BADGE_DOT: Record<MatchBadge, string> = {
  neon: 'bg-primary',
  blue: 'bg-[#5bc8ff]',
  amber: 'bg-[#ffc857]',
  red: 'bg-[#ff6b6b]',
  grey: 'bg-white/60',
}

export interface MatchCardProps {
  /** Real event/match id — links to /match/[id] for the "View Details" page. */
  matchId: string
  home: string
  away: string
  info: string
  img: string
  badgeLabel: string
  badgeColor?: MatchBadge
  priceFrom: number | null
  currency?: string
  hot?: boolean
  soldOut?: boolean
  index?: number
  onBook?: () => void
  /** Optional supplier team ids. When given, club crests are shown next to
   *  the team names and used as the image fallback. */
  homeId?: number | null
  awayId?: number | null
  /** Fixture name, used for the short "/match/<name>-<id>" link when no
   *  `href` is given (the match page redirects it to the full address). */
  matchName?: string
  /** Full match page address — pass matchPath(event) for live fixtures. */
  href?: string
}

const PRIMARY_PILL =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,transform] duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:px-5'

const SECONDARY_PILL =
  'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-foreground/15 px-4 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5'

function formatFrom(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

export function MatchCard({
  matchId,
  home,
  away,
  info,
  img,
  badgeLabel,
  badgeColor = 'neon',
  priceFrom,
  currency = 'EUR',
  hot,
  soldOut,
  index = 0,
  onBook,
  homeId,
  awayId,
  matchName,
  href,
}: MatchCardProps) {
  // Demo ids ("wc1", "cl3") keep the plain /match/<id> they always had.
  const matchHref =
    href ?? (/^\d+$/.test(matchId) ? matchShortPath(matchId, matchName) : `/match/${matchId}`)
  const reduce = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!img && !imgFailed
  const hasCrests = !!homeId && !!awayId
  const canBook = !soldOut && priceFrom !== null && !!onBook
  // Match promo (Admin → Match Promo): tag on the photo + crossed-out price.
  const deal = useCardPromo(soldOut ? null : priceFrom)

  // Split info into date + venue parts if possible
  const [dateInfo, venueInfo] = info.includes(' · ')
    ? [info.split(' · ')[0], info.split(' · ').slice(1).join(' · ')]
    : [info, '']

  return (
    <motion.article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card transition duration-200 motion-reduce:transition-none',
        soldOut && 'cursor-not-allowed opacity-75',
        canBook &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--lift-3)] motion-reduce:hover:translate-y-0',
      )}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: soldOut ? 0.75 : 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.45,
        delay: (index % 4) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={() => canBook && onBook?.()}
      aria-disabled={soldOut || undefined}
    >
      {/* ── Media ── */}
      <div className='relative aspect-[16/10] overflow-hidden bg-band-ink'>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=''
            loading='lazy'
            decoding='async'
            onError={() => setImgFailed(true)}
            className={cn(
              'absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none',
              soldOut && 'grayscale',
            )}
          />
        ) : (
          <div
            aria-hidden
            className='absolute inset-0 flex items-center justify-center'
            style={{
              backgroundImage:
                'radial-gradient(120% 90% at 50% 0%, color-mix(in oklch, var(--brand) 16%, transparent), transparent 60%)',
            }}
          >
            {hasCrests ? (
              <div className='flex items-center gap-4 pb-6'>
                <span className='flex size-16 items-center justify-center rounded-full bg-white/[0.06] p-2.5 ring-1 ring-white/10'>
                  <TeamCrest teamId={homeId} name={home} className='size-full' />
                </span>
                <span className='font-mono text-[11px] uppercase tracking-[0.2em] text-white/50'>
                  vs
                </span>
                <span className='flex size-16 items-center justify-center rounded-full bg-white/[0.06] p-2.5 ring-1 ring-white/10'>
                  <TeamCrest teamId={awayId} name={away} className='size-full' />
                </span>
              </div>
            ) : (
              <MatchdayTicket className='h-16 pb-4 text-white/20' />
            )}
          </div>
        )}

        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent'
        />

        <span className='absolute top-3 left-3 inline-flex max-w-[calc(100%-4rem)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/15 ring-inset backdrop-blur-md'>
          <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', BADGE_DOT[badgeColor])} />
          <span className='truncate'>{badgeLabel}</span>
        </span>

        {hot && !soldOut && (
          <span
            className='absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground'
            title='Popular'
          >
            <Flame aria-hidden className='size-3.5' strokeWidth={2.25} />
            <span className='sr-only'>Popular</span>
          </span>
        )}

        {/* Match promo tag: bottom-left, just above the date, so it never
            collides with the competition chip on narrow cards. */}
        {deal && (
          <PromoTag deal={deal} className='absolute bottom-10 left-4 max-w-[calc(100%-2rem)]' />
        )}

        <p className='absolute inset-x-4 bottom-3.5 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-white/90'>
          {dateInfo}
        </p>
      </div>

      {/* ── Body ── */}
      <div className='flex flex-1 flex-col p-4 sm:p-5'>
        <h3 className='font-heading text-[16px] font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-[17px]'>
          <Link
            href={matchHref}
            onClick={(e) => e.stopPropagation()}
            className='rounded-sm decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
          >
            {hasCrests ? (
              <span className='flex flex-col gap-2'>
                <span className='flex min-w-0 items-center gap-2.5'>
                  <span aria-hidden>
                    <TeamCrest teamId={homeId} name={home} className='size-6' />
                  </span>
                  <span className='truncate'>{home}</span>
                </span>
                <span className='sr-only'> vs </span>
                <span className='flex min-w-0 items-center gap-2.5'>
                  <span aria-hidden>
                    <TeamCrest teamId={awayId} name={away} className='size-6' />
                  </span>
                  <span className='truncate'>{away}</span>
                </span>
              </span>
            ) : (
              <>
                {home}
                <span className='mx-1.5 font-normal text-muted-foreground'>vs</span>
                {away}
              </>
            )}
          </Link>
        </h3>

        {venueInfo && (
          <p className='mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground'>
            <MapPin aria-hidden className='mt-px size-3.5 shrink-0' />
            <span className='line-clamp-1'>{venueInfo}</span>
          </p>
        )}

        <div className='mt-auto pt-5'>
          <div className='flex items-end justify-between gap-3 border-t border-border pt-4'>
            {soldOut ? (
              <p className='pb-2.5 text-[13px] font-semibold text-muted-foreground'>Sold out</p>
            ) : priceFrom !== null ? (
              <PromoFromPrice
                price={priceFrom}
                deal={deal}
                format={(amount) => formatFrom(amount, currency)}
              />
            ) : (
              <p className='pb-2.5 text-[13px] text-muted-foreground'>Tickets coming soon</p>
            )}

            {canBook ? (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onBook?.()
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
                  {' '}for {home} vs {away}
                </span>
              </button>
            ) : (
              <Link
                href={matchHref}
                onClick={(e) => e.stopPropagation()}
                className={SECONDARY_PILL}
              >
                Details
                <span className='sr-only'>
                  {' '}for {home} vs {away}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
