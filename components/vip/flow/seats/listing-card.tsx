'use client'

import { cn } from '@/lib/utils'
import { PlanThumbnail } from '@/components/seats/plan-thumb'
import { VipButton } from '@/components/vip/flow/button'
import { VipQuantity } from '@/components/vip/flow/quantity'
import type { VipListing } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import type { VipPlanThumb } from '@/features/vip/plan'

/* "VIP · Listing" (Figma 513:4651 / 4748 / 4839 / 4928), 600 wide.
   Hover: gold tint + border + glow. One "Buy" button (one-click, like the
   main Golafly seats page): it starts (or changes) the package with this
   ticket and the shown quantity, then moves to Extras. The ticket already
   in the package keeps the gold "selected" look.
   Everything printed is the backend listing; the price is the browse price
   per ticket (the package shows the live one). */

/** The quantities this listing can be bought in (contract: `splits` only,
 *  never more than are left). */
export function listingQuantities(l: VipListing): number[] {
  return [...new Set(l.split.splits)].filter((n) => n >= 1 && n <= l.quantity).sort((a, b) => a - b)
}

export function VipListingCard({
  listing,
  qty,
  selected,
  onQty,
  onBuy,
  busy = false,
  disabled = false,
  thumb,
  onFocusChange,
}: {
  listing: VipListing
  qty: number
  /** Already in the package (gold look). */
  selected: boolean
  onQty: (n: number) => void
  onBuy: () => void
  /** True while this card's Buy is being processed. */
  busy?: boolean
  disabled?: boolean
  /** Mini stadium map with this ticket's blocks (only when they are on the plan). */
  thumb?: VipPlanThumb | null
  /** Hover / focus: lights this ticket's blocks on the big stadium map. */
  onFocusChange?: (on: boolean) => void
}) {
  const name = listing.category.category_name
  /* Real blocks look like "VIP_Players-Zone_4" (Postman example): show
     underscores as spaces. Empty strings are skipped. */
  const block = listing.seat_details.block?.replace(/_/g, ' ').trim()
  const row = listing.seat_details.row?.trim()
  const seat = [block && `Block ${block}`, row && `Row ${row}`]
    .filter(Boolean)
    .join(' · ')
  const extra = listing.seat_details.extra_note_hospitality?.trim()
  const note = listing.note?.trim()
  const options = listingQuantities(listing)
  const lowStock = listing.quantity <= 4

  return (
    <article
      aria-label={name}
      onMouseEnter={() => onFocusChange?.(true)}
      onMouseLeave={() => onFocusChange?.(false)}
      onFocus={() => onFocusChange?.(true)}
      onBlur={() => onFocusChange?.(false)}
      className={cn(
        'group flex flex-col gap-4 rounded-[18px] border p-5 transition-[background-color,border-color,box-shadow] duration-300',
        selected
          ? 'border-vip-gold/80 bg-vip-gold/6 shadow-[0_12px_40px_rgba(212,178,106,0.18)]'
          : 'border-vip-line/8 bg-vip-tint/3 hover:border-vip-gold/85 hover:bg-vip-gold/6 hover:shadow-[0_16px_44px_rgba(212,178,106,0.2)]',
      )}
    >
      <div className='flex min-w-0 items-start gap-3.5'>
        {thumb && (
          <PlanThumbnail
            {...thumb}
            color='rgba(212,178,106,0.95)'
            label={`Stadium map showing where ${name} is`}
            className='w-[96px] border-vip-line/12 bg-vip-line/5 sm:w-[128px]'
          />
        )}
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <h3 className='break-words font-heading text-[18px] font-bold leading-[1.2] text-vip-chalk sm:text-[20px]'>{name}</h3>
        {seat && <p className='text-[13.5px] leading-[normal] text-vip-mist'>{seat}</p>}
        {(extra || note) && (
          <ul className='flex flex-wrap gap-1.5'>
            {[extra, note].filter(Boolean).map((f) => (
              <li key={f} className='max-w-full break-words rounded-lg bg-vip-line/5 px-[9px] py-1 text-[12px] leading-[1.35] text-vip-mist'>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      <div className='h-px bg-vip-line/7' />

      <div className='flex flex-wrap items-end justify-between gap-3 sm:flex-nowrap'>
        <div className='flex flex-col gap-2'>
          {(selected || lowStock) && (
            <div className='flex flex-wrap items-center gap-1.5'>
              {selected && (
                <span className='rounded-full border border-vip-gold/50 bg-vip-gold/14 px-[9px] py-1 text-[11.5px] font-semibold leading-[normal] text-vip-gold-text'>
                  ✓ In your package
                </span>
              )}
              {lowStock && (
                <span className='rounded-full border border-vip-gold/35 bg-vip-gold/6 px-[9px] py-1 text-[11.5px] font-semibold leading-[normal] text-vip-gold-text'>
                  Only {listing.quantity} left
                </span>
              )}
            </div>
          )}
          <p className='flex items-end gap-1.5'>
            <span className='font-heading text-[24px] font-bold leading-[normal] text-vip-gold-text sm:text-[26px]'>
              {formatVipPrice(listing.price_details.price_per_ticket, listing.price_details.currency)}
            </span>
            <span className='pb-[3px] font-mono text-[10px] leading-[normal] tracking-[1px] text-vip-mist'>PER TICKET</span>
          </p>
        </div>
        <div className='flex items-center gap-3.5'>
          {options.length > 0 && (
            <VipQuantity value={qty} options={options} onChange={onQty} label={`${name}, tickets`} />
          )}
          <VipButton
            variant={selected ? 'gold' : 'ghost'}
            arrow={!busy}
            onClick={onBuy}
            disabled={busy || disabled || options.length === 0}
            aria-label={`Buy ${name}, ${qty} ${qty === 1 ? 'ticket' : 'tickets'}`}
          >
            {busy ? 'Adding…' : options.length === 0 ? 'Sold out' : 'Buy'}
          </VipButton>
        </div>
      </div>
    </article>
  )
}
