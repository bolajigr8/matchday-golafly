// features/price-breakdown/types.ts
//
// Shapes of the price-breakdown contract (backend branch
// feat/price-breakdown, 31 Oct 2026). Two shapes only:
//
//   - PriceBreakdown  → ONE item (a match listing, a flight offer, an eSIM
//                       package, a hotel rate, or a single saved order).
//   - PriceSummary    → the whole CART (also returned by checkout and, after
//                       payment, on the basket).
//
// Every field below is ADDITIVE: the backend did not remove or re-define any
// existing field, and any of these can be `null`/absent. Consumers must
// therefore treat them as optional and fall back to the pre-existing display
// (see helpers.ts → normalizePriceBreakdown / normalizePriceSummary, which
// turn anything malformed into null so screens never half-render).

/** Integer minor units (for arithmetic) + the same value as a major-unit
 *  number (for display). Never divide `amount_minor` by 100 yourself:
 *  zero-decimal currencies (JPY) have amount_minor === amount. */
export interface MoneyAmount {
  amount_minor: number
  amount: number
}

/** One provider price: the ticket, the fare, the package, the room, … */
export interface PriceLine extends MoneyAmount {
  /** For logic. Stable. See PRICE_LINE_KEYS. */
  key: string
  /** For display. May change. */
  label: string
}

export interface PriceBreakdown {
  /** ISO code. Every amount in this object is in this currency. */
  currency: string
  /** Provider prices, in display order. */
  lines: PriceLine[]
  /** Golafly's fee for this item. Can be 0, can be null. */
  golafly_booking_fee: MoneyAmount | null
  /** The item's price: lines + fee, exactly. BEFORE any discount. */
  total: MoneyAmount
}

/** A cart-summary line: a PriceLine tagged with the cart item (or, after
 *  payment, the order) it belongs to. */
export interface PriceSummaryLine extends PriceLine {
  item_id: string
  item_type: string
}

export interface PriceDiscount extends MoneyAmount {
  code: string | null
}

export interface PriceSummary {
  currency: string
  /** false when at least one item has no stored breakdown (an item added to
   *  the cart before this feature shipped). The total is still correct. */
  complete: boolean
  lines: PriceSummaryLine[]
  /** ONE fee for the whole cart: every item's fee added together. */
  golafly_booking_fee: MoneyAmount | null
  /** null, or the coupon that applies. */
  discount: PriceDiscount | null
  /** What the customer pays: lines + fee − discount (AFTER the discount). */
  total: MoneyAmount
}

/** Line keys that are part of the contract (labels may change, keys won't). */
export const PRICE_LINE_KEYS = {
  matchTicket: 'match_ticket_price',
  thirdPartyFee: 'third_party_fee',
  flightTicket: 'flight_ticket_price',
  flightExtras: 'flight_extras',
  esim: 'esim_price',
  hotel: 'hotel_price',
  /** Fallback only: an item with no stored breakdown. */
  item: 'item_price',
} as const
