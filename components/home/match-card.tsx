'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Match } from '@/store/matchday'
import { enterBuilder } from '@/features/builder/enter'
import { MatchdayTicket } from '@/components/brand/matchday-logo'

/* Static-catalogue match card (store/matchday MATCHES). Same visual
   language as components/matches/match-card.tsx: photo under an ink scrim
   with a league chip, teams, date/venue, availability and a primary
   "View tickets" pill that opens the builder. */

export function MatchCard({
  match,
  index = 0,
}: {
  match: Match
  index?: number
}) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!match.image && !imgFailed

  /* Book opens the matchday builder for this fixture; stop the click
     from bubbling to the card's outer Link (which goes to the detail page). */
  const book = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    enterBuilder(router, match.id)
  }

  return (
    <motion.div
      className='h-full'
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.45,
        delay: (index % 4) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/match/${match.id}`}
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--lift-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          match.soldOut && 'opacity-75',
        )}
      >
        {/* Media */}
        <div className='relative aspect-[16/10] overflow-hidden bg-band-ink'>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.image}
              alt=''
              loading='lazy'
              decoding='async'
              onError={() => setImgFailed(true)}
              className={cn(
                'absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none',
                match.soldOut && 'grayscale',
              )}
            />
          ) : (
            <div aria-hidden className='absolute inset-0 flex items-center justify-center'>
              <MatchdayTicket className='h-16 pb-4 text-white/20' />
            </div>
          )}
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent'
          />
          <span className='absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/15 ring-inset backdrop-blur-md'>
            <span
              aria-hidden
              className='size-1.5 rounded-full'
              style={{ backgroundColor: match.leagueColor }}
            />
            {match.league}
          </span>
          <p className='absolute inset-x-4 bottom-3.5 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-white/90'>
            {match.date}
          </p>
        </div>

        {/* Body */}
        <div className='flex flex-1 flex-col p-4 sm:p-5'>
          <h3 className='font-heading text-[16px] font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-[17px]'>
            {match.team1}
            <span className='mx-1.5 font-normal text-muted-foreground'>vs</span>
            {match.team2}
          </h3>
          <p className='mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground'>
            <MapPin aria-hidden className='mt-px size-3.5 shrink-0' />
            <span className='line-clamp-1'>{match.venue}</span>
          </p>

          {!match.soldOut && (
            <div className='mt-4'>
              <div className='flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground'>
                <span>Availability</span>
                <span>{match.availability}% left</span>
              </div>
              <div className='mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted'>
                <motion.div
                  className='h-full rounded-full'
                  style={{ backgroundColor: match.availabilityColor }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${match.availability}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: (index % 4) * 0.06 + 0.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          <div className='mt-auto pt-5'>
            <div className='flex items-end justify-between gap-3 border-t border-border pt-4'>
              {match.soldOut ? (
                <>
                  <p className='pb-2.5 text-[13px] font-semibold text-muted-foreground'>Sold out</p>
                  <span className='inline-flex h-10 items-center rounded-full border border-foreground/15 px-4 text-[13px] font-semibold text-foreground'>
                    Details
                  </span>
                </>
              ) : (
                <>
                  <div className='leading-none'>
                    <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground'>
                      From
                    </p>
                    <p className='mt-1.5 font-heading text-[20px] font-bold tracking-[-0.01em] text-foreground'>
                      {match.price}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={book}
                    className='inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter] duration-200 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5'
                  >
                    View tickets
                    <ArrowRight aria-hidden className='size-3.5' strokeWidth={2.25} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
