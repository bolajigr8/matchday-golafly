'use client'

import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipPrice } from '@/features/vip/format'
import type { VipHospitalityCard } from '@/features/vip/landing'
import { VipSectionHead } from './section-head'

/* Figma: VIP Hospitality (Desktop) → "Step 2 · Hospitality" (346:2648),
 * cards "VIP · Hospitality · …" (358:2987 / 3055 / 3125). 100px vertical
 * padding, 48 head→cards, three equal cards bottom-aligned with 24 gaps.
 * The selected card turns warm gold; clicking any card selects it.
 *
 * Live data: the cards are the featured match's real hospitality ticket
 * categories (up to three, cheapest first), with their lowest browse price
 * and the listings' own notes as the lines. The Figma badge ("Most
 * popular") is left out: the backend sends no popularity. */
export function VipHospitalityPackages({
  match,
  cards,
  loading,
  selected,
  onSelect,
}: {
  match: VipEventView | null
  cards: VipHospitalityCard[]
  loading: boolean
  selected: string | null
  onSelect: (name: string) => void
}) {
  if (!match) return null
  return (
    <section aria-labelledby='vip-packages-title' className='bg-vip-ink py-16 sm:py-24 xl:py-[100px]'>
      <div className='page-container flex flex-col gap-10 xl:gap-12'>
        <VipSectionHead
          id='vip-packages-title'
          tone='gradient'
          introWidth={680}
          eyebrow='STEP 02 · HOSPITALITY'
          line1='CHOOSE HOW YOU'
          line2='WATCH THE GAME.'
          intro={`Hospitality tickets on sale now for ${match.home} vs ${match.away}. Pick one, then choose your seats.`}
        />

        {loading ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='h-[420px] animate-pulse rounded-3xl border border-vip-line/8 bg-vip-card' />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className='text-[15px] leading-[normal] text-vip-muted'>
            No hospitality tickets are on sale for this match right now. Pick another match above.
          </p>
        ) : (
          /* Equal-height cards, bottom-aligned; the selected one is raised
             (Figma: the chosen card stands taller than its neighbours). */
          <div
            role='radiogroup'
            aria-label='Hospitality'
            className={cn('grid grid-cols-1 gap-6 md:items-stretch md:pt-6', cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}
          >
            {cards.map((c) => (
              <PackageCard key={c.name} card={c} selected={c.name === selected} onSelect={() => onSelect(c.name)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PackageCard({
  card,
  selected,
  onSelect,
}: {
  card: VipHospitalityCard
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-start gap-[22px] rounded-3xl px-8 pb-8 pt-9 transition-transform duration-300',
        selected && 'md:-translate-y-6',
        selected
          ? 'border-[1.5px] border-vip-gold/90 bg-linear-to-b from-vip-warm to-vip-panel'
          : 'border border-vip-line/8 bg-vip-card',
      )}
    >
      {/* Title row: name (two lines reserved so the prices line up) + Figma's
          chip, showing the real "Only N left" when few tickets remain. */}
      <div className='flex w-full items-start justify-between gap-3'>
        <p className='line-clamp-2 min-h-[2.5em] text-[22px] font-bold leading-[1.25] text-vip-fg' title={card.name}>
          {card.name}
        </p>
        {card.left > 0 && card.left <= 10 && (
          <span className='mt-1 shrink-0 rounded-full bg-vip-gold px-3 py-[5px] text-[12.5px] font-semibold leading-[normal] text-vip-on-gold'>
            Only {card.left} left
          </span>
        )}
      </div>

      <div className='flex flex-col gap-0.5'>
        <p className={cn('whitespace-nowrap font-display text-[44px] leading-[44px] xl:text-[58px] xl:leading-[54px]', selected ? 'text-vip-gold-text' : 'text-vip-fg')}>
          {formatVipPrice(card.price, card.currency)}
        </p>
        <p className='text-[14px] leading-[normal] text-vip-muted'>per person, from</p>
      </div>

      <div className='h-px w-full bg-vip-line/10' />

      <ul className='flex flex-1 flex-col gap-[22px]'>
        {card.perks.map((perk) => (
          <li key={perk} className='flex items-center gap-3 leading-[normal]'>
            <span aria-hidden className={cn('text-[15px] font-bold', selected ? 'text-vip-gold-strong' : 'text-vip-gold-text')}>
              ✓
            </span>
            <span className='text-[15.5px] text-vip-perk'>{perk}</span>
          </li>
        ))}
      </ul>

      <button
        type='button'
        role='radio'
        aria-checked={selected}
        onClick={onSelect}
        className={cn(
          'flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full px-[30px] font-semibold leading-[normal] transition-[filter,border-color]',
          selected
            ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep text-vip-gold-ink'
            : 'border border-vip-line/25 text-vip-fg hover:border-vip-line/50',
        )}
      >
        {selected ? (
          <span className='text-[16px]'>Selected</span>
        ) : (
          <>
            <span className='truncate text-[16px]'>Choose this</span>
            <ArrowRight aria-hidden className='size-[17px] shrink-0' strokeWidth={2.25} />
          </>
        )}
      </button>
    </div>
  )
}
