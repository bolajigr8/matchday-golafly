'use client'

// components/price/price-rows.tsx
//
// Renders the price-breakdown contract (see features/price-breakdown).
//
// Display order, always (contract §4 rule 3):
//   each line → Golafly booking fee → Discount (when present) → Total
//
// Both components take the RAW api value (`unknown`) and validate it with the
// normalizers, so a null / malformed / non-adding-up breakdown renders
// nothing (they return null) and the caller shows today's single price
// instead — "a breakdown problem never blocks a page".

import type { ReactNode } from 'react'
import {
  BedDouble,
  Plane,
  ShoppingBag,
  Smartphone,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoTip } from '@/components/ui/tooltip'
import { GrandTotalRow } from '@/components/price/total-row'
import {
  formatPriceAmount,
  normalizePriceBreakdown,
  normalizePriceSummary,
  savedOrderTotalPaid,
  summaryLinesForItem,
} from '@/features/price-breakdown/helpers'
import {
  PRICE_LINE_KEYS,
  type PriceDiscount,
  type PriceSummaryLine,
} from '@/features/price-breakdown/types'

export const GOLAFLY_FEE_LABEL = 'Golafly booking fee'

/** Shown in the info bubble beside the booking-fee row. */
export const GOLAFLY_FEE_TIP =
  'A fee that covers securing your seats and processing your order.'

/** Info bubbles for provider lines, by their stable contract key. */
export const THIRD_PARTY_FEE_TIP =
  'A fee charged by the ticket supplier.'

function lineTip(key: string): string | undefined {
  return key === PRICE_LINE_KEYS.thirdPartyFee ? THIRD_PARTY_FEE_TIP : undefined
}

function Money({
  amount,
  currency,
  negative,
  className,
}: {
  amount: number
  currency: string
  negative?: boolean
  className?: string
}) {
  return (
    <span translate='no' className={cn('notranslate', className)}>
      {negative ? '−' : ''}
      {formatPriceAmount(amount, currency)}
    </span>
  )
}

function Row({
  label,
  amount,
  currency,
  negative,
  tone,
  info,
}: {
  label: string
  amount: number
  currency: string
  negative?: boolean
  tone?: 'primary'
  /** Explanation for an (i) icon beside the label — opens on hover, focus or tap. */
  info?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3',
        tone === 'primary' && 'text-primary',
      )}
    >
      <dt
        className={cn(
          'min-w-0',
          info && 'flex items-center gap-1.5',
          tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
        {info && <InfoTip label={label.toLowerCase()}>{info}</InfoTip>}
      </dt>
      <dd
        className={cn(
          'shrink-0 font-medium',
          tone === 'primary' ? 'text-primary' : 'text-foreground',
        )}
      >
        <Money amount={amount} currency={currency} negative={negative} />
      </dd>
    </div>
  )
}

/** A promo line already reads "BLACK FRIDAY · 20% OFF". A coupon code
 *  still needs the "Discount (…)" wrapper. */
function discountLabel(code: string | null | undefined): string {
  if (!code) return 'Discount'
  return code.includes('% OFF') ? code : `Discount (${code})`
}

function TotalRow({
  label,
  amount,
  currency,
  showPromo = false,
}: {
  label: string
  amount: number
  currency: string
  /** Attach the site-wide display promo (badge + crossed-out price). */
  showPromo?: boolean
}) {
  if (showPromo) {
    return <GrandTotalRow label={label} amount={amount} currency={currency} />
  }
  return (
    <div className='flex items-center justify-between py-4'>
      <span className='font-mono text-[11px] uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <Money
        amount={amount}
        currency={currency}
        className='font-heading text-2xl font-bold text-foreground'
      />
    </div>
  )
}

/* ── Grouping (long carts) ─────────────────────────────────────────── */

const ITEM_TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  matchday: { label: 'Match tickets', icon: Ticket },
  flight: { label: 'Flight', icon: Plane },
  esim: { label: 'eSIM', icon: Smartphone },
  stays: { label: 'Hotel', icon: BedDouble },
}

function itemTypeMeta(type: string) {
  return ITEM_TYPE_META[type] ?? { label: 'Item', icon: ShoppingBag }
}

interface LineGroup {
  itemId: string
  itemType: string
  lines: PriceSummaryLine[]
}

/** Lines grouped per cart item, keeping the server's display order. */
function groupLinesByItem(lines: PriceSummaryLine[]): LineGroup[] {
  const groups: LineGroup[] = []
  const byId = new Map<string, LineGroup>()
  for (const line of lines) {
    const id = line.item_id || `${line.item_type}:${groups.length}`
    let group = byId.get(id)
    if (!group) {
      group = { itemId: id, itemType: line.item_type, lines: [] }
      byId.set(id, group)
      groups.push(group)
    }
    group.lines.push(line)
  }
  return groups
}

/* ── Cart / basket ─────────────────────────────────────────────────── */

/** The cart summary: lines → ONE Golafly fee → discount → total.
 *
 *  - `hideFeeWhenIncomplete` (default true): when `complete` is false some
 *    item had no stored breakdown and contributes 0 to the fee, so the fee
 *    line would understate the real fee. The contract recommends hiding it.
 *  - `showTotal={false}` lets a screen place its own element (a coupon
 *    field, say) between the lines and the total, and render the total
 *    itself with <PriceTotal />. */
export function PriceSummaryRows({
  summary: raw,
  hideZero = true,
  hideFeeWhenIncomplete = true,
  showTotal = true,
  totalLabel = 'Total',
  groupByItem = true,
  showPromo = false,
  trailing,
  className,
}: {
  summary: unknown
  hideZero?: boolean
  hideFeeWhenIncomplete?: boolean
  showTotal?: boolean
  totalLabel?: string
  /** With 2+ items, show each item's lines under a small heading (Match
   *  tickets, Flight, eSIM…) so a long cart stays easy to scan. */
  groupByItem?: boolean
  /** Attach the site-wide display promo to the total. */
  showPromo?: boolean
  /** Extra row inside the line list, after the fee and any discount. */
  trailing?: ReactNode
  className?: string
}) {
  const summary = normalizePriceSummary(raw)
  if (!summary) return null

  const { currency } = summary
  const groups = groupLinesByItem(summary.lines).map((g) => ({
    ...g,
    // Each item keeps its main (first) line; zero-amount extras are hidden.
    lines: g.lines.filter(
      (l, i) => i === 0 || !hideZero || l.amount_minor !== 0,
    ),
  }))
  const grouped = groupByItem && groups.length > 1
  const fee = summary.golafly_booking_fee
  const showFee =
    !!fee &&
    !(hideZero && fee.amount_minor === 0) &&
    !(hideFeeWhenIncomplete && !summary.complete)
  const hasFooterRows = (showFee && !!fee) || !!summary.discount

  const lineRow = (line: PriceSummaryLine, i: number) => (
    <Row
      key={`${line.item_id}:${line.key}:${i}`}
      label={line.label}
      amount={line.amount}
      currency={currency}
      info={lineTip(line.key)}
    />
  )

  return (
    <div className={className}>
      {grouped && (
        <div className='space-y-3 pb-3 text-sm'>
          {groups.map((group) => {
            const meta = itemTypeMeta(group.itemType)
            const Icon = meta.icon
            return (
              <section key={group.itemId} aria-label={meta.label}>
                <p className='mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  <span className='flex size-4 items-center justify-center rounded bg-primary/10'>
                    <Icon className='size-2.5 text-brand-text' strokeWidth={2.5} />
                  </span>
                  {meta.label}
                </p>
                <dl className='space-y-1.5 border-l border-border pl-3 text-[13px]'>
                  {group.lines.map(lineRow)}
                </dl>
              </section>
            )
          })}
        </div>
      )}
      <dl
        className={cn(
          'space-y-2.5 border-b border-border pb-4 text-sm',
          grouped && hasFooterRows && 'border-t border-dashed pt-3',
          grouped && !hasFooterRows && 'pb-0',
        )}
      >
        {!grouped && groups.flatMap((g) => g.lines).map(lineRow)}
        {showFee && fee && (
          <Row
            label={GOLAFLY_FEE_LABEL}
            amount={fee.amount}
            currency={currency}
            info={GOLAFLY_FEE_TIP}
          />
        )}
        {summary.discount && (
          <Row
            label={discountLabel(summary.discount.code)}
            amount={summary.discount.amount}
            currency={currency}
            negative
            tone='primary'
          />
        )}
        {trailing}
      </dl>
      {showTotal && (
        <TotalRow
          label={totalLabel}
          amount={summary.total.amount}
          currency={currency}
          showPromo={showPromo}
        />
      )}
    </div>
  )
}

/** One cart item's OWN lines (e.g. Match ticket price, Third-party fee),
 *  for compact item cards such as the extras "Your Cart" panel, where the
 *  item's name/details are shown by the caller. The single Golafly fee and
 *  the total are shown once, by the caller, below all items. Renders nothing
 *  when the summary is invalid or has no lines for this item. */
export function ItemPriceLines({
  summary: raw,
  itemId,
  hideZero = true,
  className,
}: {
  summary: unknown
  itemId: string | null | undefined
  hideZero?: boolean
  className?: string
}) {
  const summary = normalizePriceSummary(raw)
  if (!summary) return null
  const lines = summaryLinesForItem(summary, itemId).filter(
    (l, i) => i === 0 || !hideZero || l.amount_minor !== 0,
  )
  if (lines.length === 0) return null
  return (
    <dl className={cn('mt-2 space-y-1 text-[11px]', className)}>
      {lines.map((line, i) => (
        <div
          key={`${line.key}:${i}`}
          className='flex items-start justify-between gap-3'
        >
          <dt
            className={cn(
              'min-w-0 text-muted-foreground',
              lineTip(line.key) && 'flex items-center gap-1.5',
            )}
          >
            {line.label}
            {lineTip(line.key) && (
              <InfoTip label={line.label.toLowerCase()}>{lineTip(line.key)}</InfoTip>
            )}
          </dt>
          <dd className='shrink-0 font-medium text-foreground'>
            <Money amount={line.amount} currency={summary.currency} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Just the total row of a validated summary (pairs with showTotal={false}). */
export function PriceTotal({
  amount,
  currency,
  label = 'Total',
  showPromo = false,
}: {
  amount: number
  currency: string
  label?: string
  /** Attach the site-wide display promo (badge + crossed-out price). */
  showPromo?: boolean
}) {
  return (
    <TotalRow
      label={label}
      amount={amount}
      currency={currency}
      showPromo={showPromo}
    />
  )
}

/* ── One item / one saved order ────────────────────────────────────── */

/** A single item's breakdown: lines → Golafly fee → (discount) → total.
 *
 *  For a SAVED ORDER `price_breakdown.total` is BEFORE the discount, so when
 *  a `discount` is passed the total shown is total − discount ("Total
 *  paid"). Without a discount the total is shown as received. */
export function PriceBreakdownRows({
  breakdown: raw,
  discount,
  hideZero = true,
  totalLabel,
  showTotal = true,
  compact = false,
  trailing,
  className,
}: {
  breakdown: unknown
  discount?: PriceDiscount | null
  hideZero?: boolean
  totalLabel?: string
  /** false lets a screen render its own total (see <PriceTotal />). */
  showTotal?: boolean
  compact?: boolean
  /** Extra row inside the line list, after the fee and any discount. */
  trailing?: ReactNode
  className?: string
}) {
  const breakdown = normalizePriceBreakdown(raw)
  if (!breakdown) return null

  const { currency } = breakdown
  const lines = breakdown.lines.filter(
    (l, i) => i === 0 || !hideZero || l.amount_minor !== 0,
  )
  const fee = breakdown.golafly_booking_fee
  const showFee = !!fee && !(hideZero && fee.amount_minor === 0)
  const paid = savedOrderTotalPaid(breakdown, discount ?? null)

  return (
    <div className={className}>
      <dl
        className={cn(
          'border-b border-border text-sm',
          compact ? 'space-y-1.5 pb-3 text-[12px]' : 'space-y-2.5 pb-4',
        )}
      >
        {lines.map((line, i) => (
          <Row
            key={`${line.key}:${i}`}
            label={line.label}
            amount={line.amount}
            currency={currency}
            info={lineTip(line.key)}
          />
        ))}
        {showFee && fee && (
          <Row
            label={GOLAFLY_FEE_LABEL}
            amount={fee.amount}
            currency={currency}
            info={GOLAFLY_FEE_TIP}
          />
        )}
        {discount && (
          <Row
            label={discount.code ? `Discount (${discount.code})` : 'Discount'}
            amount={discount.amount}
            currency={currency}
            negative
            tone='primary'
          />
        )}
        {trailing}
      </dl>
      {showTotal && (
        <TotalRow
          label={totalLabel ?? (discount ? 'Total paid' : 'Total')}
          amount={paid.amount}
          currency={currency}
        />
      )}
    </div>
  )
}
