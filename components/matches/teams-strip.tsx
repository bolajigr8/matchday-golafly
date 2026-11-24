'use client'

import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { markFlyerMissing, type Club } from '@/features/matchday/flyers'
import { useClubTiles } from '@/features/matchday/club-tiles'

/** One tile: our own image from /public/flyers when we have it, otherwise
 *  (for `apiImage` clubs only) the live API image, and the brand-colored
 *  abbreviation badge if that fails too. */
export function TeamTile({
  team,
  img,
  href,
  index,
  local,
}: {
  team: Club
  img: string | null
  /** Our own /public/flyers image (vs. an API image). */
  local: boolean
  href: string
  index: number
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!img && !imgFailed

  return (
    <motion.a
      href={href}
      className='group relative isolate block aspect-[4/5] transform-gpu overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-neutral-700 to-neutral-950 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl'
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.04 }}
    >
      {showImage ? (
        <img
          src={img}
          alt=''
          loading='lazy'
          className='absolute inset-0 h-full w-full max-w-none object-cover transition-transform duration-500 group-hover:scale-105'
          onError={() => (local ? markFlyerMissing(img!) : setImgFailed(true))}
        />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center pb-8'>
          <span
            className='flex size-16 items-center justify-center rounded-full border-2 font-heading text-base font-extrabold tracking-tight sm:size-20'
            style={{ background: team.bg, color: team.color, borderColor: team.color }}
          >
            {team.abbr}
          </span>
        </span>
      )}
      <span className='pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/45 to-transparent' />
      <span className='absolute inset-x-0 bottom-0 p-3 text-center font-heading text-xs font-bold leading-tight text-white drop-shadow'>
        {team.name}
      </span>
    </motion.a>
  )
}

/** Two rows on desktop (6 columns); "Load more" adds two more rows. */
const STEP = 12

export function TeamsStrip() {
  // Same clubs and images as the homepage's Featured Teams — the rules
  // live in features/matchday/club-tiles.ts.
  const { ready, tiles: all } = useClubTiles()
  const slugs = useCatalogueSlugs()
  const [shown, setShown] = useState(STEP)
  const tiles = all.slice(0, shown)

  return (
    <section id='clubs' className='scroll-mt-24 border-y border-border bg-muted/40 py-16 sm:py-20'>
      <div className='page-container'>
        <div className='mb-8 text-center'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
            Popular Clubs
          </p>
          <h2 className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
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
          {tiles.map(({ club, teamId, local, img }, i) => (
            <TeamTile
              key={`${club.file}-${local ? 'local' : 'api'}`}
              team={club}
              img={img}
              local={local}
              // Dedicated team page when we have a real id, else the directory.
              href={teamId ? slugs.teamPath(teamId, club.name) : '/teams'}
              index={i}
            />
          ))}
        </div>

        {shown < all.length && (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              onClick={() => setShown((n) => n + STEP)}
              className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-brand-text'
            >
              Load more clubs <ChevronDown className='size-3.5' />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
