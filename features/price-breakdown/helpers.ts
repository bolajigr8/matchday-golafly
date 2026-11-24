// features/price-breakdown/helpers.ts
//
// Pure helpers for the price-breakdown contract. No React in here.
//
// Rule 8 of the contract: "Any of these new fields can be null. When it is,
// render the screen exactly as today, with the existing amount. A breakdown
// problem never blocks a page, the cart or checkout."
//
// So everything that reads a breakdown goes through the normalizers below.
// They accept `unknown` (the API can send anything) and return either a
// fully-validated object or null. A breakdown whose numbers do not add up is
// also rejected: showing "lines + fee" that visibly does not equal the total
// would be worse than showing the old single price.

import type {
  MoneyAmount,
  PriceBreakdown,
  PriceDiscount,
  PriceLine,
  PriceSummary,
  PriceSummaryLine,
} from './types'
import { PRICE_LINE_KEYS } from './types'

/* ── Parsing ──────────────────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function parseMoney(v: unknown): MoneyAmount | null {
  if (!isRecord(v)) return null
  if (!isFiniteNumber(v.amount_minor) || !Number.isInteger(v.amount_minor)) {
    return null
  }
  if (!isFiniteNumber(v.amount)) return null
  return { amount_minor: v.amount_minor, amount: v.amount }
}

function parseLine(v: unknown): PriceLine | null {
  if (!isRecord(v)) return null
  const money = parseMoney(v)
  if (!money) return null
  if (typeof v.key !== 'string' || v.key === '') return null
  return {
    key: v.key,
    label: typeof v.label === 'string' && v.label !== '' ? v.label : v.key,
    ...money,
  }
}

function parseSummaryLine(v: unknown): PriceSummaryLine | null {
  const line = parseLine(v)
  if (!line || !isRecord(v)) return null
  return {
    ...line,
    item_id: v.item_id == null ? '' : String(v.item_id),
    item_type: typeof v.item_type === 'string' ? v.item_type : '',
  }
}

function parseDiscount(v: unknown): PriceDiscount | null {
  const money = parseMoney(v)
  if (!money || !isRecord(v)) return null
  // A zero/negative discount is "no discount" for display purposes.
  if (money.amount_minor <= 0) return null
  return {
    code: typeof v.code === 'string' && v.code !== '' ? v.code : null,
    ...money,
  }
}

const sumMinor = (items: { amount_minor: number }[]) =>
  items.reduce((s, i) => s + i.amount_minor, 0)

/** Validates one item's breakdown. null = unusable, show today's price. */
export function normalizePriceBreakdown(v: unknown): PriceBreakdown | null {
  if (!isRecord(v)) return null
  if (typeof v.currency !== 'string' || v.currency === '') return null
  if (!Array.isArray(v.lines) || v.lines.length === 0) return null

  const lines: PriceLine[] = []
  for (const raw of v.lines) {
    const line = parseLine(raw)
    if (!line) return null
    lines.push(line)
  }

  const total = parseMoney(v.total)
  if (!total) return null

  // `golafly_booking_fee` may be null/absent: treat as "no fee line".
  const fee =
    v.golafly_booking_fee == null ? null : parseMoney(v.golafly_booking_fee)
  if (v.golafly_booking_fee != null && !fee) return null

  // "total always equals the lines plus the fee, exactly" — in minor units.
  if (sumMinor(lines) + (fee?.amount_minor ?? 0) !== total.amount_minor) {
    return null
  }

  return {
    currency: v.currency.toUpperCase(),
    lines,
    golafly_booking_fee: fee,
    total,
  }
}

/** Validates the cart (or basket) summary. null = unusable. */
export function normalizePriceSummary(v: unknown): PriceSummary | null {
  if (!isRecord(v)) return null
  if (typeof v.currency !== 'string' || v.currency === '') return null
  if (!Array.isArray(v.lines)) return null

  const lines: PriceSummaryLine[] = []
  for (const raw of v.lines) {
    const line = parseSummaryLine(raw)
    if (!line) return null
    lines.push(line)
  }

  const total = parseMoney(v.total)
  if (!total) return null

  const fee =
    v.golafly_booking_fee == null ? null : parseMoney(v.golafly_booking_fee)
  if (v.golafly_booking_fee != null && !fee) return null

  const discount = v.discount == null ? null : parseDiscount(v.discount)
  // A discount object we cannot read must not be silently ignored: the
  // total would then not add up. Reject the whole summary instead.
  if (v.discount != null && !discount && !isZeroDiscount(v.discount)) {
    return null
  }

  // "total = lines + fee − discount", in minor units.
  const expected =
    sumMinor(lines) +
    (fee?.amount_minor ?? 0) -
    (discount?.amount_minor ?? 0)
  if (expected !== total.amount_minor) return null

  return {
    currency: v.currency.toUpperCase(),
    complete: v.complete !== false,
    lines,
    golafly_booking_fee: fee,
    discount,
    total,
  }
}

function isZeroDiscount(v: unknown): boolean {
  const money = parseMoney(v)
  return !!money && money.amount_minor <= 0
}

/* ── Product pages: "provider price only" ─────────────────────────── */

export interface ProviderPrice {
  amount: number
  currency: string
}

/** Rule 1: product pages show the FIRST line of price_breakdown (the
 *  ticket, the fare, the package, the room) — never the fee or the all-in
 *  total. Returns null when there is no usable breakdown. */
export function providerPriceOf(raw: unknown): ProviderPrice | null {
  const breakdown = normalizePriceBreakdown(raw)
  if (!breakdown) return null
  const first = breakdown.lines[0]
  return { amount: first.amount, currency: breakdown.currency }
}

/** The provider price if the breakdown has one, else the field the page
 *  showed before this feature (rule 8). */
export function providerPriceOr(
  raw: unknown,
  fallback: ProviderPrice,
): ProviderPrice {
  return providerPriceOf(raw) ?? fallback
}

/** "From" price for a listing/event/block/category: provider price(s) plus
 *  the third-party fee, WITHOUT the Golafly booking fee. Used when we have
 *  to derive it ourselves from a listing's breakdown (total − Golafly fee). */
export function priceWithoutGolaflyFee(raw: unknown): ProviderPrice | null {
  const b = normalizePriceBreakdown(raw)
  if (!b) return null
  // Sum of the provider lines (ticket + third-party fee …) — i.e. the total
  // minus Golafly's own fee. Display value only, so a rounded major-unit sum
  // is fine; nothing is divided by 100.
  const amount = b.lines.reduce((s, l) => s + l.amount, 0)
  return { amount: roundTo(amount, b.currency), currency: b.currency }
}

/** Rounds a major-unit number to the currency's own decimals (JPY → 0). */
function roundTo(amount: number, currency: string): number {
  const digits = currencyFractionDigits(currency)
  const f = 10 ** digits
  return Math.round(amount * f) / f
}

/* ── Formatting ───────────────────────────────────────────────────── */

/** Number of decimals this currency uses (EUR 2, JPY 0, KWD 3). */
export function currencyFractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency })
        .resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

/** Display formatter for the `amount` (major units) fields of this
 *  contract. Uses the currency's OWN number of decimals instead of a
 *  hard-coded 2, so JPY renders ¥12,000 and not ¥12,000.00. */
export function formatPriceAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/* ── Single saved order ───────────────────────────────────────────── */

/** THE one difference to remember (contract §3.2): on a saved order
 *  (price_breakdown + discount) `price_breakdown.total` is BEFORE the
 *  discount. Total paid = total − discount, computed in minor units. */
export function savedOrderTotalPaid(
  breakdown: PriceBreakdown,
  discount: PriceDiscount | null,
): MoneyAmount {
  if (!discount) return breakdown.total
  return {
    amount_minor: Math.max(
      0,
      breakdown.total.amount_minor - discount.amount_minor,
    ),
    amount: Math.max(
      0,
      roundTo(breakdown.total.amount - discount.amount, breakdown.currency),
    ),
  }
}

/** A saved order's discount as sent by the API (top level or inside
 *  `pricing`). null when absent or not a real discount. */
export function normalizeDiscount(v: unknown): PriceDiscount | null {
  return v == null ? null : parseDiscount(v)
}

/* ── Cart summary helpers ─────────────────────────────────────────── */

/** Lines of one cart item (group by item if a design wants that). */
export function summaryLinesForItem(
  summary: PriceSummary | null | undefined,
  itemId: string | null | undefined,
): PriceSummaryLine[] {
  if (!summary || !itemId) return []
  return summary.lines.filter((l) => l.item_id === itemId)
}

/** Does the summary contain at least one line of this item type? */
export function summaryHasItemType(
  summary: PriceSummary | null | undefined,
  itemType: string,
): boolean {
  return !!summary?.lines.some((l) => l.item_type === itemType)
}

/** Lines that are the fallback `item_price` (item with no stored
 *  breakdown) — see summary.complete. */
export function isFallbackLine(line: PriceLine): boolean {
  return line.key === PRICE_LINE_KEYS.item
}

/** What ONE cart item costs before Golafly's (single, cart-wide) booking
 *  fee: the sum of its provider lines. Used for the per-item amount on
 *  cart screens, so the item rows + the one fee + the discount add up to
 *  the total. null when the summary has no lines for this item (then the
 *  caller shows the item's own price as before). */
export function itemProviderTotal(
  summary: PriceSummary | null | undefined,
  itemId: string | null | undefined,
): ProviderPrice | null {
  const lines = summaryLinesForItem(summary, itemId)
  if (!summary || lines.length === 0) return null
  const amount = lines.reduce((s, l) => s + l.amount, 0)
  return { amount: roundTo(amount, summary.currency), currency: summary.currency }
}

/** The server item id behind a local cart item, if it has been synced. */
export function serverIdOf(item: {
  checkoutPayload?: Record<string, unknown>
}): string | null {
  const id = item.checkoutPayload?.serverId
  return typeof id === 'string' && id !== '' ? id : null
}

/* ── Derived breakdowns ───────────────────────────────────────────── */

/** A per-unit breakdown (one ticket, one eSIM) multiplied by quantity, in
 *  minor units, so lines + fee still add up to the total exactly. */
export function scalePriceBreakdown(
  raw: unknown,
  quantity: number,
): PriceBreakdown | null {
  const b = normalizePriceBreakdown(raw)
  if (!b || !Number.isInteger(quantity) || quantity < 1) return null
  const times = (m: MoneyAmount): MoneyAmount => ({
    amount_minor: m.amount_minor * quantity,
    amount: roundTo(m.amount * quantity, b.currency),
  })
  return {
    currency: b.currency,
    lines: b.lines.map((l) => ({ ...l, ...times(l) })),
    golafly_booking_fee: b.golafly_booking_fee
      ? times(b.golafly_booking_fee)
      : null,
    total: times(b.total),
  }
}

/** A discount built from a major-unit amount we computed ourselves (only
 *  the direct ticket checkout, whose coupon preview is still local). The
 *  minor value comes from the currency's own decimals — never "× 100". */
export function discountFromMajor(
  code: string,
  amount: number,
  currency: string,
): PriceDiscount | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  const digits = currencyFractionDigits(currency)
  return {
    code,
    amount: roundTo(amount, currency),
    amount_minor: Math.round(amount * 10 ** digits),
  }
}

/* ── Event "from" price ───────────────────────────────────────────── */

/** The "from" price for a fixture card: `price_from` (cheapest ticket
 *  incl. the third-party fee, WITHOUT the Golafly fee). When the backend
 *  sends `price_from: null` (no exchange rate) there is NO "from" price.
 *  When the field is absent entirely (an older backend), fall back to the
 *  field cards used before this feature (`price`). */
export function eventFromPrice(
  minPrice:
    | { price?: number | null; price_from?: number | null }
    | null
    | undefined,
): number | null {
  if (!minPrice) return null
  const value = minPrice.price_from !== undefined ? minPrice.price_from : minPrice.price
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
