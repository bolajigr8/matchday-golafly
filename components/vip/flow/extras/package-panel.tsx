'use client'

import { Lock } from 'lucide-react'
import { VipButton, VipButtonLink } from '@/components/vip/flow/button'
import type { VipPackage, VipPackageItem } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import { flightOfferOf, offerCabin, packageItem, packageTravellers, stepRequired } from '@/features/vip/package'

/* Extras → "Your cart" (Figma 506:4158), 376px, sticky beside the steps on
   desktop. Live data: one row per package item (label, detail, the item's
   total), every figure from the backend's `price_summary` lines; under an
   item with several lines (the ticket: match ticket price + third-party
   fee) they are listed so the fees stay visible as the contract asks.
   Figma's "≈ local currency" line is left out (no backend figure for it).
   "Remove this package" is not in Figma: the contract asks for it while
   the package is being built. */

const ITEM_NAMES: Record<string, string> = {
  matchday: 'Hospitality ticket',
  flight: 'Flight',
  stays: 'Hotel',
  esim: 'eSIM',
}

/** The row's second line, from the item itself. */
export function vipItemDetail(pkg: VipPackage, item: VipPackageItem): string {
  switch (item.type) {
    case 'matchday':
      return [item.categoryName, item.block?.trim() ? `Block ${item.block.replace(/_/g, ' ')}` : null]
        .filter(Boolean)
        .join(' · ')
    case 'flight': {
      const offer = flightOfferOf(pkg)
      if (!offer) return ''
      const out = offer.slices[0]
      const route = out ? `${out.origin.iata_code} – ${out.destination.iata_code}` : ''
      return [route, offer.slices.length > 1 ? 'Return' : 'One way', offerCabin(offer)].filter(Boolean).join(' · ')
    }
    case 'stays':
      return [item.hotelName, item.rooms ? `${item.rooms} room${item.rooms === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ')
    case 'esim':
      return [item.package?.title ?? 'Spain data plan', item.quantity && item.quantity > 1 ? `× ${item.quantity}` : null]
        .filter(Boolean)
        .join(' ')
    default:
      return ''
  }
}

export function VipPackagePanel({
  pkg,
  title,
  next,
  onRemove,
  removing,
}: {
  pkg: VipPackage
  /** "FC BARCELONA VS RIVAL · SAT 6 MAR" */
  title: string
  /** The button at the bottom (Go to checkout). */
  next?: { href?: string; onClick?: () => void; label: string; disabled?: boolean; hint?: string }
  onRemove?: () => void
  removing?: boolean
}) {
  const summary = pkg.price_summary
  const currency = summary?.currency ?? packageItem(pkg, 'matchday')?.currency ?? 'EUR'
  const travellers = packageTravellers(pkg)
  const money = (n: number) => formatVipPrice(n, currency)

  const rows = pkg.items.map((item) => {
    const lines = (summary?.lines ?? []).filter((l) => l.item_id === item.id)
    return { item, lines, total: lines.length ? lines.reduce((s, l) => s + l.amount, 0) : null }
  })

  return (
    <aside
      aria-labelledby='vip-cart-title'
      className='flex flex-col gap-3.5 rounded-[22px] border border-vip-gold/45 bg-linear-to-b from-vip-gold/10 to-vip-panel to-50% p-6 shadow-[0_20px_60px_rgba(212,178,106,0.15)]'
    >
      <div className='flex items-center justify-between'>
        <h2 id='vip-cart-title' className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>
          Your cart
        </h2>
        <span className='rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-[9px] py-[3px] text-[12px] font-semibold leading-[normal] text-[#111111]'>
          {pkg.items.length}
        </span>
      </div>
      <p className='font-mono text-[10px] leading-[normal] tracking-[1px] text-vip-gold-text'>{title}</p>

      <ul className='flex flex-col gap-3.5'>
        {rows.map(({ item, lines, total }) => {
          const detail = vipItemDetail(pkg, item)
          return (
            <li key={item.id} className='flex flex-col gap-1.5 border-b border-vip-line/6 pb-3'>
              <span className='flex justify-between gap-4'>
                <span className='flex min-w-0 flex-col gap-[3px]'>
                  <span className='text-[14px] font-medium leading-[normal] text-vip-chalk'>
                    {ITEM_NAMES[item.type] ?? item.type}
                    {item.type === 'matchday' && item.quantity ? ` × ${item.quantity}` : ''}
                  </span>
                  {detail && <span className='text-[12px] leading-[normal] text-vip-mist'>{detail}</span>}
                </span>
                <span className='shrink-0 text-[14px] font-semibold leading-[normal] text-vip-chalk'>
                  {item.expired ? (
                    <span className='rounded-full bg-vip-error/12 px-2 py-0.5 text-[11px] text-vip-error'>Price expired</span>
                  ) : total !== null ? (
                    money(total)
                  ) : (
                    '—'
                  )}
                </span>
              </span>
              {lines.length > 1 &&
                lines.map((l) => (
                  <span key={`${l.key}-${l.label}`} className='flex justify-between gap-4 text-[12px] leading-[normal] text-vip-mist'>
                    <span>{l.label}</span>
                    <span className='shrink-0'>{money(l.amount)}</span>
                  </span>
                ))}
            </li>
          )
        })}
        {(['flight', 'stays'] as const)
          .filter((t) => !packageItem(pkg, t))
          .map((t) => (
            <li key={t} className='rounded-xl border border-dashed border-vip-gold/40 px-3.5 py-3 text-[13px] leading-[normal] text-vip-mist'>
              {t === 'flight' ? 'Flight' : 'Hotel'}: {stepRequired(pkg, t === 'flight' ? 'flight' : 'hotel') ? 'not chosen yet' : 'optional, not added'}
            </li>
          ))}
      </ul>

      {summary?.golafly_booking_fee && summary.golafly_booking_fee.amount > 0 && (
        <div className='flex justify-between gap-4 text-[13px] leading-[normal] text-vip-mist'>
          <span>Golafly booking fee</span>
          <span className='text-vip-chalk'>{money(summary.golafly_booking_fee.amount)}</span>
        </div>
      )}

      <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-[3px]'>
          <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>
            TOTAL · {travellers} GUEST{travellers === 1 ? '' : 'S'}
          </span>
          <span className='text-[12px] leading-[normal] text-vip-mist'>All fees included</span>
        </div>
        <span className='font-heading text-[32px] font-bold leading-[normal] text-vip-gold-text'>
          {summary ? money(summary.total.amount) : '—'}
        </span>
      </div>

      {next &&
        (next.href && !next.disabled ? (
          <VipButtonLink href={next.href} arrow className='w-full'>
            {next.label}
          </VipButtonLink>
        ) : (
          <VipButton arrow onClick={next.onClick} disabled={next.disabled} className='w-full'>
            {next.label}
          </VipButton>
        ))}
      {next?.hint && <p className='text-[12px] leading-[1.45] text-vip-mist'>{next.hint}</p>}

      <p className='flex items-center gap-1.5 text-[12px] leading-[normal] text-vip-mist'>
        <Lock aria-hidden className='size-3 fill-vip-gold-strong text-vip-gold-strong' strokeWidth={2} />
        All fees included · Secure checkout
      </p>

      {onRemove && (
        <button
          type='button'
          onClick={onRemove}
          disabled={removing}
          className='w-fit text-[12.5px] leading-[normal] text-vip-mist underline underline-offset-2 hover:text-vip-chalk disabled:opacity-60'
        >
          {removing ? 'Removing…' : 'Remove this package'}
        </button>
      )}
    </aside>
  )
}
