'use client'

// components/promo/promo-price.tsx
//
// The match promo ("BLACK FRIDAY · 20% OFF") on match cards and lists, wherever
// a "From €…" price shows. Same rule and maths as the seats page
// (components/seats/listing-card.tsx): the percent comes from the price band of
// ONE ticket, and nothing shows unless Admin → Settings → Match Promo is giving
// a discount right now (switched on, inside its dates, slots left today). Turn
// it off in the admin and every tag and crossed-out price disappears.

import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { promoPercentFor, promoTicketPrice } from '@/features/promo/pricing'
import { useMatchPromo } from '@/features/promo/use-match-promo'

export interface CardPromo {
  /** Admin label, e.g. "BLACK FRIDAY". */
  label: string
  percent: number
  /** The "from" price after the promo. */
  price: number
}

/** The promo for a "from" price, or null when there is none right now. */
export function useCardPromo(price: number | null | undefined): CardPromo | null {
  const promo = useMatchPromo()
  if (!promo || price == null) return null
  const percent = promoPercentFor(promo, price)
  if (percent <= 0) return null
  return { label: promo.label || 'Black Friday', percent, price: promoTicketPrice(price, percent) }
}

/** The tag on PHOTOS: a small black pill with lime text, the Black Friday
 *  bar's colours, so it stays readable on any image. On white surfaces use
 *  the seats page's lemon badge instead (components/promo/promo-badge.tsx). */
export function PromoTag({
  deal,
  className,
}: {
  deal: CardPromo
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full bg-[#0b0b0b] py-1 pl-1.5 pr-2.5 text-[#c6ff3d] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-[#c6ff3d]/35',
        className,
      )}
    >
      <Zap aria-hidden className='size-3 shrink-0 fill-current' strokeWidth={2} />
      <span className='truncate font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em]'>
        {deal.label}
      </span>
      <span aria-hidden className='h-2.5 w-px shrink-0 bg-[#c6ff3d]/35' />
      <span className='shrink-0 font-mono text-[10px] font-bold leading-none'>
        −{deal.percent}%
      </span>
      <span className='sr-only'> off</span>
    </span>
  )
}

/** The "From" block with the promo: the old price crossed out on the label
 *  line, the new price in its place. Without a promo it is the plain block. */
export function PromoFromPrice({
  price,
  deal,
  format,
  align = 'left',
  priceClassName,
  tone = 'card',
}: {
  price: number
  deal: CardPromo | null
  format: (amount: number) => string
  align?: 'left' | 'right'
  priceClassName?: string
  /** 'card' on light/dark surfaces; 'photo' on top of an image. */
  tone?: 'card' | 'photo'
}) {
  const muted = tone === 'photo' ? 'text-white/70' : 'text-muted-foreground'
  return (
    <div className={cn('min-w-0 leading-none', align === 'right' && 'sm:text-right')}>
      <p
        className={cn(
          'flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]',
          align === 'right' && 'sm:justify-end',
          muted,
        )}
      >
        From
        {deal && (
          <s className='font-sans text-[12px] normal-case tracking-normal decoration-[1.5px]'>
            <span className='sr-only'>was </span>
            {format(price)}
          </s>
        )}
      </p>
      <p
        className={cn(
          'mt-1.5 font-heading text-[20px] font-bold tracking-[-0.01em] text-foreground',
          priceClassName,
        )}
      >
        {deal && <span className='sr-only'>now </span>}
        {format(deal ? deal.price : price)}
      </p>
    </div>
  )
}
