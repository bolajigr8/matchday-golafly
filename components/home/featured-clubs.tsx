'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOURNAMENTS } from '@/store/matches'
import {
  useMatchdayTournaments,
  useMatchdayImageCache,
} from '@/features/matchday/hooks'
import { findTournamentIdByName, namesMatch } from '@/features/matchday/resolve'
import {
  markFlyerMissing,
  useFlyers,
  type Club,
} from '@/features/matchday/flyers'
import { useClubTiles } from '@/features/matchday/club-tiles'
import { TeamCrest } from '@/components/tickets/primitives'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { SectionHead } from './section-head'

// Curated featured names — matched against live API catalogue by name
const FEATURED_TOUR_NAMES = [
  'Premier League',
  'Champions League',
  'Italian Serie A',
  'Spanish La Liga',
  'La Liga Hypermotion',
  'German Bundesliga',
  'French Ligue 1',
  'Europa League',
  'Nations League',
]

/** The Premier League card rotates through these clubs' own images from
 *  /public/flyers, in this order. Clubs without an image are skipped. */
export const PREMIER_LEAGUE_SLIDES = [
  'chelsea',
  'manutd',
  'mancity',
  'arsenal',
  'liverpool',
]
const CARD_SLIDE_MS = 4000

function crestFor<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  return list.find((c) => namesMatch(c.name, name))
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/* ── Card slider (Premier League) ──────────────────────────────────── */

/** Exported: also used on the Premier League tournament page
 *  (app/tournament/[slug]/client.tsx). Fills its nearest positioned parent. */
export function CardSlider({ images }: { images: string[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = images.length
  const current = n ? active % n : 0

  useEffect(() => {
    if (n < 2 || reduce || paused) return
    const t = setInterval(() => setActive((a) => (a + 1) % n), CARD_SLIDE_MS)
    return () => clearInterval(t)
  }, [n, reduce, paused])

  return (
    <span
      className='absolute inset-0'
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=''
          loading='lazy'
          onError={() => markFlyerMissing(src)}
          className='absolute inset-0 h-full w-full max-w-none object-cover object-center ease-out'
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current && !reduce ? 'scale(1.06)' : 'scale(1)',
            transitionProperty: 'opacity, transform',
            transitionDuration: `1000ms, ${CARD_SLIDE_MS + 1000}ms`,
          }}
        />
      ))}
      {n > 1 && (
        <span className='absolute inset-x-0 top-3 z-20 flex justify-center gap-1.5'>
          {images.map((src, i) => (
            <span
              key={src}
              className={`h-1 rounded-full bg-white shadow transition-all duration-500 ${
                i === current ? 'w-4 opacity-100' : 'w-1.5 opacity-50'
              }`}
            />
          ))}
        </span>
      )}
    </span>
  )
}

/* ── Trending competitions ─────────────────────────────────────────── */

const SCROLLER_REVEAL: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const CARD_REVEAL: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

function CompetitionCard({
  name,
  img,
  slides,
  href,
}: {
  name: string
  img: string | null
  /** Rotating images (Premier League); replaces `img` when non-empty. */
  slides?: string[]
  href: string
}) {
  const reduce = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const hasSlides = !!slides && slides.length > 0
  const showImage = !hasSlides && !!img && !imgFailed
  const crest = crestFor(TOURNAMENTS, name)

  return (
    <motion.li
      className='w-[156px] shrink-0 snap-start sm:w-[196px] lg:w-[calc((100%-4rem)/5)]'
      variants={reduce ? undefined : CARD_REVEAL}
    >
      {/* Full-bleed cover with the name over a dark gradient: the image
          fills the whole card instead of being shrunk inside a blurred copy
          of itself, so wide competition banners read at full size. */}
      <Link
        href={href}
        className={cn(
          'group relative isolate block aspect-square overflow-hidden rounded-[18px] border border-border bg-band-ink transition duration-200 hover:-translate-y-0.5 hover:shadow-(--lift-3) motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          FOCUS_RING,
        )}
        style={
          !hasSlides && !showImage && crest ? { background: crest.bg } : undefined
        }
      >
        {hasSlides ? (
          <CardSlider images={slides as string[]} />
        ) : showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img as string}
            alt=''
            loading='lazy'
            decoding='async'
            onError={() => setImgFailed(true)}
            className='absolute inset-0 size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none'
          />
        ) : crest ? (
          <span
            className='absolute inset-0 flex items-center justify-center pb-10 font-display text-[52px] leading-none tracking-[0.02em] sm:text-[64px]'
            style={{ color: crest.color }}
          >
            {crest.abbr}
          </span>
        ) : (
          <span className='absolute inset-0 flex items-center justify-center pb-10 font-display text-[52px] leading-none text-white/30 sm:text-[64px]'>
            {initials(name)}
          </span>
        )}
        <span
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/90 via-black/55 to-transparent'
        />
        <span className='absolute inset-x-0 bottom-0 px-3 pb-3.5 text-center'>
          <span className='line-clamp-2 text-[14px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'>
            {name}
          </span>
        </span>
        <span
          aria-hidden
          className='pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10'
        />
      </Link>
    </motion.li>
  )
}

function ScrollButton({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={
        dir === 'prev' ? 'Previous competitions' : 'More competitions'
      }
      className={cn(
        'hidden size-10 items-center justify-center rounded-full border border-foreground/15 text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-35 sm:inline-flex',
        FOCUS_RING,
      )}
    >
      <Icon aria-hidden className='size-4' />
    </button>
  )
}

export function TrendingTournaments() {
  const reduce = useReducedMotion()
  const { data: tournaments } = useMatchdayTournaments()
  const { tourImages } = useMatchdayImageCache()
  const { srcFor } = useFlyers()
  const slugs = useCatalogueSlugs()
  const plSlides = PREMIER_LEAGUE_SLIDES.map((file) => srcFor(file)).filter(
    (src): src is string => !!src,
  )
  const scroller = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const resolvedTours = FEATURED_TOUR_NAMES.map((name) => {
    const id = findTournamentIdByName(tournaments, name)
    const match =
      id != null ? tournaments?.find((t) => t.tournament_id === id) : undefined
    const img = match
      ? (match.banner ?? tourImages[match.tournament_id] ?? null)
      : null
    return { name, id: match?.tournament_id, apiName: match?.name, img }
  })

  const updateEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  const scrollByPage = (dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.85,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-labelledby='trending-competitions-title'>
      <SectionHead
        align='left'
        titleId='trending-competitions-title'
        eyebrow='Competitions'
        title='Trending competitions'
        action={{ href: '/tournaments', label: 'All competitions' }}
        aside={
          <div className='flex items-center gap-2'>
            <ScrollButton
              dir='prev'
              disabled={!canPrev}
              onClick={() => scrollByPage(-1)}
            />
            <ScrollButton
              dir='next'
              disabled={!canNext}
              onClick={() => scrollByPage(1)}
            />
          </div>
        }
      />

      <motion.ul
        ref={scroller}
        onScroll={updateEdges}
        className='-mx-5 mt-8 -mb-6 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-1.5 pb-8 scrollbar-hide sm:-mx-6 sm:mt-10 sm:scroll-px-6 sm:gap-4 sm:px-6 lg:-mx-2 lg:scroll-px-2 lg:px-2'
        variants={reduce ? undefined : SCROLLER_REVEAL}
        initial={reduce ? false : 'hidden'}
        whileInView='show'
        viewport={{ once: true, amount: 0.2 }}
      >
        {resolvedTours.map((tour) => (
          <CompetitionCard
            key={tour.name}
            name={tour.name}
            img={tour.img}
            slides={
              namesMatch(tour.name, 'Premier League') ? plSlides : undefined
            }
            href={tour.id ? slugs.tournamentPath(tour.id, tour.apiName) : '/tournaments'}
          />
        ))}
      </motion.ul>
    </section>
  )
}

/* ── Featured teams ────────────────────────────────────────────────── */

/** One club card. The club list comes from useClubTiles (same clubs as
 *  /matches "Follow your team"). Crest: the supplier's TeamCrest when the
 *  club resolved to an API team id, else the club's own brand badge. */
function ClubCard({
  club,
  teamId,
  href,
  index,
}: {
  club: Club
  teamId: number | undefined
  href: string
  index: number
}) {
  const reduce = useReducedMotion()
  const name = club.name

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.4,
        delay: (index % 6) * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={href}
        className={cn(
          'group flex h-full flex-col items-center gap-3.5 rounded-[20px] border border-border bg-card px-3 pt-6 pb-5 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-(--lift-3) motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:gap-4 sm:pt-7',
          FOCUS_RING,
        )}
      >
        <span
          aria-hidden
          className='flex size-16 items-center justify-center rounded-full bg-muted p-3 ring-1 ring-border transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none sm:size-18'
        >
          {teamId ? (
            <TeamCrest teamId={teamId} name={name} className='size-full' />
          ) : (
            <span
              className='flex size-full items-center justify-center rounded-full font-heading text-[12px] font-bold tracking-tight'
              style={{ background: club.bg, color: club.color }}
            >
              {club.abbr}
            </span>
          )}
        </span>
        <span className='line-clamp-2 text-[13px] leading-snug font-semibold text-balance text-foreground sm:line-clamp-1 sm:text-[14px]'>
          {name}
        </span>
      </Link>
    </motion.li>
  )
}

function ClubCardSkeleton() {
  return (
    <li
      aria-hidden
      className='flex flex-col items-center gap-4 rounded-[20px] border border-border bg-card px-3 pt-7 pb-5'
    >
      <span className='size-16 rounded-full bg-muted motion-safe:animate-pulse sm:size-18' />
      <span className='h-3 w-20 rounded-full bg-muted motion-safe:animate-pulse' />
    </li>
  )
}

export function FeaturedTeams() {
  const { ready, tiles } = useClubTiles()
  const slugs = useCatalogueSlugs()

  return (
    <section aria-labelledby='featured-teams-title'>
      <SectionHead
        align='left'
        titleId='featured-teams-title'
        eyebrow='Top clubs'
        title='Follow your team'
        subtitle="Every upcoming fixture for Europe's biggest clubs, in one place."
        action={{ href: '/teams', label: 'All teams' }}
      />

      <ul className='mt-8 grid grid-cols-3 gap-2.5 sm:mt-10 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6'>
        {!ready
          ? Array.from({ length: 6 }, (_, i) => <ClubCardSkeleton key={i} />)
          : tiles.map(({ club, teamId }, i) => (
              <ClubCard
                key={club.file}
                club={club}
                teamId={teamId}
                href={teamId ? slugs.teamPath(teamId, club.name) : '/teams'}
                index={i}
              />
            ))}
      </ul>
    </section>
  )
}

export function FeaturedClubs() {
  return (
    <div className='space-y-20 sm:space-y-24'>
      <TrendingTournaments />
      <FeaturedTeams />
    </div>
  )
}
