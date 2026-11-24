'use client'

import { forwardRef } from 'react'
import { Loader2, Star, Smartphone, Ticket, Eye, Users, Flame, Zap, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeatListing, CategoryInfo } from '@/features/matchday/seats'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { PromoBadge } from '@/components/promo/promo-badge'
import { promoPercentFor, promoTicketPrice } from '@/features/promo/pricing'
import { useMatchPromo } from '@/features/promo/use-match-promo'
import { PlanThumbnail } from './plan-thumb'

function money(n: number, c: string | null) {
  return c ? formatMatchdayMoney(n, c) : `€${n.toLocaleString()}`
}

/** Plain-language meaning of the supplier's ticket `type`, shown on hover /
 *  long-press of the delivery chip. */
const DELIVERY_HELP: Record<string, string> = {
  'E-ticket': 'E-ticket: a PDF ticket emailed to you before the match. Print it or show it on your phone at the gate.',
  'Mobile ticket': "Mobile ticket: transferred to your phone (usually the club's official app or mobile wallet). Scan it at the gate.",
}

function Chip({ icon: Icon, children, tone, title }: { icon?: typeof Star; children: React.ReactNode; tone?: 'brand' | 'warn'; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone === 'brand'
          ? 'bg-primary/15 text-brand-text'
          : tone === 'warn'
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {Icon && <Icon className='size-3 shrink-0' />}
      {children}
    </span>
  )
}

export const ListingCard = forwardRef<
  HTMLDivElement,
  {
    listing: SeatListing
    category?: CategoryInfo
    qty: number
    onQty: (n: number) => void
    isLowest: boolean
    selected: boolean
    confirming: boolean
    busy: boolean
    onBuy: () => void
    homeTeam?: string
    /** Mini stadium map highlighting this listing's block(s), when the fixture has a plan. */
    thumb?: { src: string; viewBox: string; outline: string; color: string }
  }
>(function ListingCard({ listing: l, category, qty, onQty, isLowest, selected, busy, confirming, onBuy, homeTeam, thumb }, ref) {
  const blocks = l.blocks.length ? `Block${l.blocks.length > 1 ? 's' : ''} ${l.blocks.join(', ')}` : null
  const low = l.available > 0 && l.available <= 4
  // Provider price only on the listing (the fee shows from the cart on).
  // The promo band follows the charged price per ticket, as checkout picks it.
  const promo = useMatchPromo()
  const promoPercent = promoPercentFor(promo, l.priceEach)
  const unitPrice = promoTicketPrice(l.shownPrice, promoPercent)
  const total = unitPrice * qty
  return (
    <div
      ref={ref}
      className={cn(
        '@container relative flex overflow-hidden rounded-xl border bg-card transition-shadow',
        selected ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-border hover:shadow-md',
      )}
    >
      <span className='w-1.5 shrink-0' style={{ background: category?.color ?? 'var(--border)' }} aria-hidden />
      <div className='flex min-w-0 flex-1 flex-col gap-3 p-3 @[33rem]:flex-row @[33rem]:items-center @[33rem]:gap-4 @[33rem]:p-4'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
        {thumb && (
          <PlanThumbnail
            {...thumb}
            label={`Stadium map showing ${blocks ?? l.categoryName}`}
          />
        )}
        <div className='min-w-0 flex-1'>
          <h3 className='text-[15px] font-bold leading-snug text-foreground @[33rem]:text-base'>
            {l.categoryName}
            {blocks && <span className='ml-2 text-[13px] font-medium text-muted-foreground'>· {blocks}</span>}
            {l.row && <span className='ml-2 text-[13px] font-medium text-muted-foreground'>· Row {l.row}</span>}
          </h3>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {l.homeEnd && <Chip icon={Home} tone='brand'>{homeTeam ? `${homeTeam} supporters` : 'Home supporters'}</Chip>}
            {l.fansSide && !l.homeEnd && <Chip icon={Users}>{l.fansSide} fans</Chip>}
            {l.delivery && (
              <Chip
                icon={l.delivery === 'E-ticket' ? Ticket : Smartphone}
                title={DELIVERY_HELP[l.delivery]}
              >
                {l.delivery}
              </Chip>
            )}
            {l.seatsTogether && <Chip icon={Users}>{l.seatsTogether}</Chip>}
            {l.view && <Chip icon={Eye}>{l.view}</Chip>}
            {l.instantDownload && <Chip icon={Zap}>{l.instantDownload}</Chip>}
            {l.hospitality && <Chip tone='brand'>Hospitality</Chip>}
          </div>
          {l.notes.filter((n) => !/home supporters/i.test(n) || !l.homeEnd).length > 0 && (
            <p className='mt-2 line-clamp-2 text-xs text-muted-foreground'>
              {l.notes.filter((n) => !/^home supporters( section)?$/i.test(n)).join(' · ')}
            </p>
          )}
        </div>
        </div>

        <div className='flex shrink-0 items-end justify-between gap-4 border-t border-border/60 pt-3 @[33rem]:min-w-[156px] @[33rem]:flex-col @[33rem]:items-end @[33rem]:border-t-0 @[33rem]:pt-0'>
          <div className='flex flex-col items-start gap-1 @[33rem]:items-end'>
            <div className='flex flex-wrap gap-1.5 @[33rem]:justify-end'>
              {isLowest && <Chip icon={Star} tone='brand'>Lowest price</Chip>}
              {low && <Chip icon={Flame} tone='warn'>Only {l.available} left</Chip>}
            </div>
            {promo && promoPercent > 0 && (
              <>
                <PromoBadge label={promo.label} percent={promoPercent} />
                <s translate='no' className='notranslate text-xs leading-none text-muted-foreground'>
                  {money(l.shownPrice, l.currency)}
                </s>
              </>
            )}
            <p translate='no' className='notranslate text-xl font-bold leading-none text-foreground'>{money(unitPrice, l.currency)}</p>
            <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
              each{qty > 1 ? ` · ${money(total, l.currency)} total` : ''}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {l.qtyOptions.length > 1 ? (
              <label className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                <span className='sr-only @[33rem]:not-sr-only'>Qty</span>
                <select
                  value={qty}
                  onChange={(e) => onQty(Number(e.target.value))}
                  aria-label='Number of tickets'
                  className='h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary'
                >
                  {l.qtyOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            ) : (
              <span className='text-[11px] text-muted-foreground'>Qty {l.qtyOptions[0] ?? 1}</span>
            )}
            <button
              type='button'
              onClick={onBuy}
              disabled={busy || l.qtyOptions.length === 0}
              className='inline-flex h-9 min-w-[96px] items-center justify-center gap-1.5 rounded-full border border-brand-edge bg-primary px-4 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_14px_var(--brand-glow)] disabled:cursor-not-allowed disabled:opacity-50'
            >
              {busy ? <Loader2 className='size-4 animate-spin' /> : confirming ? 'Confirm' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
