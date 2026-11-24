'use client'

import { PromoTag, useCardPromo } from '@/components/promo/promo-price'
import * as React from 'react'
import Image from 'next/image'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PillarBadge } from '@/components/brand/pillar-badge'
import { useFeaturedEvents } from '@/features/matchday/featured'
import { isMatchdayLive } from '@/features/matchday/config'
import type { MatchdayEvent } from '@/features/matchday/types'
import { markFlyerMissing } from '@/features/matchday/flyers'
import type { FeaturedSlide } from '@/features/matchday/featured'
import { eventDateParts, ticketMoney } from '@/components/tickets/primitives'
import { MatchSearch } from '@/components/shared/match-search'
import { useLandingScope } from '@/features/landing/scope'
import type { MatchSearchQuery } from '@/features/matchday/use-matches-search'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

/* /matches hero — partner-marketplace layout, Golafly copy and colours.

          GOLAFLY FOOTBALL TICKETS
          FOR THE BIGGEST MATCHES
      (✓ 150% order guarantee on every order)
   ┌──────────────────────────────────────────────┐
   │ Secure your seats: …                          │
   │ [ Search teams, matches…  ⌕ ][ dd/mm/yyyy ▦ ][→]│
   │ Trending now: (Arsenal)(Chelsea)(Barcelona)…   │
   └──────────────────────────────────────────────┘
   ░░[ prev ]░░ [      current match slide      ] ░░[ next ]░░
                     ·  ·  ━━━━  ·

   Slides are real upcoming fixtures for the clubs we have our own flyer
   for (features/matchday/featured.ts + flyers.ts). Each slide is drawn on
   that club's flyer from /public/flyers with the match details on top; a
   club whose flyer is missing never gets a slide. The track is an infinite
   loop (three copies, silently re-centred after each move) so a slide is
   always peeking on both sides, exactly like the partner's carousel. */

const SLIDE_MS = 6000
const SWIPE_PX = 40

/* `sizes` for the slide flyers (1200×675, 16:9). A slide is min(720px, 78vw)
   wide. From sm up it is 16:9 too, so the cover is the slide's own width; on
   phones it is 4:3 and object-cover fills it by height, so the image has to
   be 4/3 of the slide's width (about 104vw) or the cover looks soft. */
const SLIDE_SIZES = '(min-width: 924px) 720px, (min-width: 640px) 78vw, 104vw'

/** Kept for existing imports; the search box itself lives in
 *  components/shared/match-search.tsx (also used by the home hero). */
export type HeroSearch = MatchSearchQuery

export function MatchHero({
  onSearch,
  onBook,
  showSearch = true,
}: {
  onSearch?: (s: HeroSearch) => void
  onBook?: (event: MatchdayEvent) => void
  /** The search box under the heading. Off when another search is already on
   *  the page (the landing page puts it in the first hero). */
  showSearch?: boolean
}) {
  const live = isMatchdayLive()
  const scope = useLandingScope()
  // A landing page already has its <h1> in the first hero.
  const Title = scope ? 'h2' : 'h1'
  const { slides, isLoading } = useFeaturedEvents(live)

  return (
    <section
      id='top'
      className='relative overflow-hidden bg-background pt-8 pb-10 sm:pt-12 sm:pb-14'
    >
      <div className='page-container relative z-20'>
        <div className='mx-auto flex flex-col items-center text-center'>
          {!scope && <PillarBadge pillar='live' className='mb-4' />}
          <Title className='font-display uppercase leading-[0.86] text-foreground'>
            <span className='block text-[46px] sm:text-[84px]'>
              {scope
                ? `${scope.site.name} tickets`
                : 'Golafly football tickets'}
            </span>
            <span className='mt-1 block text-[26px] text-brand-text sm:text-[38px]'>
              {scope ? 'Pick your match' : 'For the biggest matches'}
            </span>
          </Title>
          {/* Solid surface + audited text tokens (not a translucent lime fill):
              the text must read on the light and the dark page alike, and on
              a browser without color-mix(), where a /20 fill falls back to
              solid lime. The check is the same lime disc as the hero's list. */}
          <p className='mt-4 inline-flex items-center gap-2 rounded-full bg-card py-1.5 pl-2 pr-4 text-[12.5px] text-card-foreground ring-1 ring-border sm:text-[13.5px]'>
            <span
              aria-hidden
              className='flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'
            >
              <Check className='size-3' strokeWidth={3} />
            </span>
            <span>
              <b className='font-semibold text-foreground'>
                150% order guarantee
              </b>{' '}
              <span className='text-muted-foreground'>on every order</span>
            </span>
          </p>
          {showSearch && <MatchSearch onSearch={onSearch} />}
        </div>
      </div>

      {live && <Carousel slides={slides} loading={isLoading} onBook={onBook} />}
    </section>
  )
}

/* ── Carousel ───────────────────────────────────────────────────────── */

function Carousel({
  slides,
  loading,
  onBook,
}: {
  slides: FeaturedSlide[]
  loading: boolean
  onBook?: (event: MatchdayEvent) => void
}) {
  const reduce = useReducedMotion()
  const n = slides.length
  const looped = n > 1
  // Three copies when looping; `pos` indexes the middle copy at rest.
  const track = looped ? [...slides, ...slides, ...slides] : slides
  const [pos, setPos] = React.useState(n)
  const [animate, setAnimate] = React.useState(true)
  const [paused, setPaused] = React.useState(false)
  const touchX = React.useRef<number | null>(null)

  // Re-centre when the slide list first arrives / changes size.
  const [seenN, setSeenN] = React.useState(n)
  if (seenN !== n) {
    setSeenN(n)
    setPos(looped ? n : 0)
  }

  const current = n ? ((pos % n) + n) % n : 0
  const go = React.useCallback((to: number) => {
    setAnimate(true)
    setPos(to)
  }, [])

  React.useEffect(() => {
    if (!looped || paused || reduce) return
    const t = setTimeout(() => go(pos + 1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [pos, paused, looped, reduce, go])

  // After animating into a clone, jump back to the middle copy unseen.
  const onSettled = () => {
    if (!looped) return
    if (pos >= 2 * n || pos < n) {
      setAnimate(false)
      setPos(n + current)
    }
  }
  // Safety net: if the browser never fired transitionend (tab in the
  // background, interrupted swipe), re-centre anyway so the track can never
  // run past its copies and show an empty slot.
  React.useEffect(() => {
    if (!looped || (pos >= n && pos < 2 * n)) return
    const t = setTimeout(() => {
      setAnimate(false)
      setPos(n + (((pos % n) + n) % n))
    }, 900)
    return () => clearTimeout(t)
  }, [pos, n, looped])

  React.useEffect(() => {
    if (animate) return
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true)),
    )
    return () => cancelAnimationFrame(id)
  }, [animate])

  if (loading && !n) {
    return (
      <div className='relative z-10 -mt-4 flex justify-center gap-3.5 overflow-hidden sm:-mt-5'>
        <div className='aspect-[4/3] w-[78vw] max-w-[720px] animate-pulse rounded-2xl bg-muted sm:aspect-video' />
      </div>
    )
  }
  if (!n) return null

  return (
    <div
      className='relative z-10 -mt-4 sm:-mt-5'
      aria-roledescription='carousel'
      aria-label='Popular upcoming matches'
      // Pause only while a real mouse is over the carousel. Phones fire a fake
      // "mouseenter" on tap with no matching leave, which used to stop the
      // autoplay for good on mobile.
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      // Keyboard focus pauses; a tap/click on a dot or button does not.
      onFocus={(e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.matches(':focus-visible')
        )
          setPaused(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setPaused(false)
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || !looped) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > SWIPE_PX) go(pos + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
      style={
        {
          // Narrower than the viewport so a slice of the neighbouring slides
          // always shows at both ends (like the partner carousel).
          '--w': 'min(720px, 78vw)',
          '--gap': '14px',
        } as React.CSSProperties
      }
    >
      <div className='relative overflow-hidden'>
        {/* Soft fade on both ends so the peeking slides melt into the page */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-y-0 left-0 z-10 w-[7vw] bg-gradient-to-r from-background via-background/70 to-transparent sm:w-[9vw]'
        />
        <div
          aria-hidden
          className='pointer-events-none absolute inset-y-0 right-0 z-10 w-[7vw] bg-gradient-to-l from-background via-background/70 to-transparent sm:w-[9vw]'
        />
        <div
          className='ml-[50%] flex gap-[var(--gap)]'
          style={{
            transform: `translateX(calc(-1 * (${pos} * (var(--w) + var(--gap)) + var(--w) / 2)))`,
            transition:
              animate && !reduce
                ? 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
          }}
          onTransitionEnd={(e) => e.target === e.currentTarget && onSettled()}
        >
          {track.map(({ event, flyer }, i) => (
            <Slide
              key={`${event.id}-${i}`}
              event={event}
              flyer={flyer}
              // The slide shown first (start of the middle copy) is the likely
              // LCP element; every other flyer loads lazily.
              eager={i === (looped ? n : 0)}
              active={i === pos}
              onActivate={() => go(i)}
              onBook={onBook}
            />
          ))}
        </div>
      </div>

      {looped && (
        <div
          className='mt-5 flex items-center justify-center gap-2.5'
          role='tablist'
          aria-label='Choose match'
        >
          {slides.map(({ event: e }, i) => (
            <button
              key={e.id}
              type='button'
              role='tab'
              aria-selected={i === current}
              aria-label={`${e.team1.name} vs ${e.team2.name}`}
              onClick={() => go(n + i)}
              className={cn(
                'relative h-1.5 rounded-full transition-all duration-500 after:absolute after:-inset-2',
                i === current
                  ? 'w-20 bg-primary'
                  : 'w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Slide({
  event,
  flyer,
  eager,
  active,
  onActivate,
  onBook,
}: {
  event: MatchdayEvent
  flyer: string
  eager: boolean
  active: boolean
  onActivate: () => void
  onBook?: (event: MatchdayEvent) => void
}) {
  const p = eventDateParts(event.date)
  const price = eventFromPrice(event.min_price)
  // Match promo (Admin → Match Promo): tag + crossed-out price on the button.
  const deal = useCardPromo(price)
  const place = [event.venue.venue_city_name, event.venue.venue_country_name]
    .filter(Boolean)
    .join(', ')

  return (
    <article
      aria-roledescription='slide'
      aria-hidden={!active}
      onClick={() => !active && onActivate()}
      className={cn(
        'relative aspect-[4/3] w-[var(--w)] shrink-0 overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)] transition-[filter,opacity,transform] duration-500 sm:aspect-video',
        !active &&
          'scale-[0.94] cursor-pointer opacity-75 brightness-[0.75] hover:brightness-90',
      )}
    >
      {/* Our own club flyer (~1.3 MB PNG), sent through next/image so the
          browser gets a resized WebP. If it fails to load, the flyer is
          marked missing and this club's slide drops out of the carousel. */}
      <Image
        src={flyer}
        alt=''
        fill
        sizes={SLIDE_SIZES}
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        onError={() => markFlyerMissing(flyer)}
        className='object-cover object-top'
      />
      <div className='absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent' />

      <div className='absolute inset-x-0 bottom-0 flex items-end gap-3 p-3.5 sm:gap-3.5 sm:p-5'>
        <div className='flex w-[54px] shrink-0 flex-col items-center rounded-md border border-white/45 bg-black/30 py-1.5 text-white backdrop-blur-sm sm:w-[60px]'>
          <span className='text-[11px] font-semibold leading-none'>
            {p.month}
          </span>
          <span className='font-display text-[34px] leading-[0.95]'>
            {p.day}
          </span>
          <span className='whitespace-nowrap text-[8.5px] leading-none text-white/85'>
            {p.weekday} {p.time}
          </span>
        </div>
        <div className='min-w-0 text-white'>
          <h3 className='text-[14px] font-semibold leading-snug drop-shadow sm:text-[15px]'>
            {event.team1.name} vs {event.team2.name}
          </h3>
          <p className='truncate text-[11px] text-white/80 sm:text-[12px]'>
            {event.tour.name}
            {place && ` · ${place}`}
          </p>
          {deal && <PromoTag deal={deal} className='mt-2 mr-2' />}
          {price != null && (
            <button
              type='button'
              tabIndex={active ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation()
                if (active) onBook?.(event)
                else onActivate()
              }}
              className='mt-2 inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-[11px] font-bold uppercase text-primary-foreground transition-opacity hover:opacity-90'
            >
              From
              {deal && (
                <s className='font-semibold opacity-60 decoration-[1.5px]'>
                  <span className='sr-only'>was </span>
                  {ticketMoney(price, event.min_price.currency_code)}
                </s>
              )}
              {deal && <span className='sr-only'>now </span>}
              {ticketMoney(deal ? deal.price : price, event.min_price.currency_code)}
              <ArrowRight className='size-3' strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
