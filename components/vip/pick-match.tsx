'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipClub } from '@/features/vip/contract'
import type { VipEventView } from '@/features/vip/clubs'
import { VipMatchCard, VipMatchRow } from './match-card'
import { VipSectionHead } from './section-head'

/* Figma: VIP Hospitality (Desktop) → "Step 1 · Pick your match" (346:2582).
 * The matches are the backend's VIP home matches of every club (soonest
 * first), with a club filter on top. Like the main Matchday matches page:
 * a List / Grid switch, and 12 matches at a time with "Load more"
 * (client request; the cards are smaller than Figma's so more fit). */

const PAGE = 12
type View = 'grid' | 'list'
export function VipPickMatch({
  clubs,
  matches,
  loading,
  message,
  initialClub,
}: {
  clubs: VipClub[]
  matches: VipEventView[]
  loading: boolean
  /** Shown instead of the cards (switched off, unreachable, no matches). */
  message: string | null
  /** Pre-selected club (from /vip?club=…). */
  initialClub?: string | null
}) {
  const [club, setClub] = useState<string | null>(
    initialClub && clubs.some((c) => c.slug === initialClub) ? initialClub : null,
  )
  const [view, setView] = useState<View>('grid')
  const [limit, setLimit] = useState(PAGE)
  const all = club ? matches.filter((m) => m.club === club) : matches
  const shown = all.slice(0, limit)
  const pickClub = (slug: string | null) => {
    setClub(slug)
    setLimit(PAGE)
  }

  return (
    <section
      id='pick-your-match'
      aria-labelledby='vip-pick-match-title'
      className='scroll-mt-24 bg-vip-ink pb-16 pt-16 sm:pt-24 xl:pb-[100px] xl:pt-[120px]'
    >
      <div className='page-container flex flex-col gap-10 xl:gap-12'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <VipSectionHead
            id='vip-pick-match-title'
            eyebrow='STEP 01 · PICK YOUR MATCH'
            line1='THE BIGGEST'
            line2='NIGHTS IN FOOTBALL.'
          />
          {clubs.length > 1 && (
            <div role='radiogroup' aria-label='Club' className='flex flex-wrap gap-2'>
              {[{ slug: null as string | null, name: 'All clubs' }, ...clubs].map((c) => (
                <button
                  key={c.slug ?? 'all'}
                  type='button'
                  role='radio'
                  aria-checked={club === c.slug}
                  onClick={() => pickClub(c.slug)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-[14px] font-semibold leading-[normal] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light',
                    club === c.slug
                      ? 'border-vip-gold/70 bg-vip-gold/12 text-vip-gold-text'
                      : 'border-vip-line/14 text-vip-fg hover:border-vip-line/30',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List / Grid switch (main Matchday matches page pattern). */}
        {!loading && !message && all.length > 0 && (
          <div className='-mt-4 flex items-center justify-between gap-3 xl:-mt-6'>
            <p className='text-[14px] leading-[normal] text-vip-muted'>
              {all.length} VIP match{all.length === 1 ? '' : 'es'}
            </p>
            <div role='tablist' aria-label='View' className='flex overflow-hidden rounded-full border border-vip-line/14'>
              {(['list', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  type='button'
                  role='tab'
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 font-mono text-[11px] font-semibold uppercase leading-[normal] tracking-[1px] transition-colors',
                    view === v ? 'bg-vip-gold/14 text-vip-gold-text' : 'text-vip-muted hover:text-vip-fg',
                  )}
                >
                  {v === 'list' ? <List aria-hidden className='size-3.5' /> : <LayoutGrid aria-hidden className='size-3.5' />}
                  {v === 'list' ? 'List' : 'Grid'}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <ul aria-hidden className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {[0, 1, 2].map((i) => (
              <li key={i} className='h-[440px] animate-pulse rounded-3xl bg-vip-line/5' />
            ))}
          </ul>
        ) : message || all.length === 0 ? (
          <p className='rounded-[22px] border border-vip-line/10 bg-vip-tint/3 p-8 text-[16px] leading-[normal] text-vip-muted'>
            {message ?? 'No VIP matches are on sale for this club right now. Check back soon.'}
          </p>
        ) : view === 'grid' ? (
          <ul className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {shown.map((m, i) => (
              <li key={`${m.club}-${m.eventId}`}>
                <VipMatchCard match={m} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className='flex flex-col gap-3'>
            {shown.map((m) => (
              <li key={`${m.club}-${m.eventId}`}>
                <VipMatchRow match={m} />
              </li>
            ))}
          </ul>
        )}

        {!loading && !message && all.length > shown.length && (
          <div className='flex flex-col items-center gap-2'>
            <button
              type='button'
              onClick={() => setLimit((n) => n + PAGE)}
              className='rounded-full border border-vip-gold/60 px-7 py-3 text-[15px] font-semibold leading-[normal] text-vip-gold-text transition-colors hover:bg-vip-gold/10'
            >
              Load more
            </button>
            <span className='text-[12.5px] leading-[normal] text-vip-muted'>
              Showing {shown.length} of {all.length}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
