// features/matchday/types.ts
//
// Types for the Golafly MatchDay API (football ticket browsing + checkout),
// built from "Frontend integration guide — MatchDay API Reference", revised
// through the MatchDay Update doc (21 September 2026) and the Multi-Currency
// Checkout Contract (21 September 2026).
//
// Conventions from the doc (§01), reflected throughout this file:
//   - Base path: /api/v1/matchday
//   - Money: decimal numbers in MAJOR units (e.g. 152.50), never cents —
//     EXCEPT the two amounts on the /pay price-changed 409, which are in
//     MINOR units. That is the one exception on this whole API; see
//     PriceChangedErrorDetails below and format.ts's minorToMajor().
//   - Currency: per-listing/per-order, always read it, never assume EUR.
//     Read meta.currency beside every meta price on /listings.
//     Never hardcode a symbol.
//   - Dates: ISO-8601 for API dates (e.g. "2026-09-14T16:30:00"); the
//     /events *filters* (from_date/to_date) are the one exception and use
//     dd-mm-yyyy — see EventFilters below.
//
// Auth (doc §01, now settled): MatchDay is guest checkout, so there's no
// bearer token or login. Each checkout step instead requires a capability
// value only the buyer could hold:
// `checkout_token` (from POST /checkout) before payment, and the Stripe
// `session_id` after. Both are carried as ordinary request fields, not
// headers — see CreateCheckoutPayload / PayCheckoutPayload /
// SubmitAttendeesPayload below.
//
// ── What changed in MatchDay Update doc (21 Sept 2026) ────────────────
// REMOVED: price_details.fee_for_quantities — no longer returned.
//          Any use of it in the codebase must be removed.
// ADDED:   min_price.price can now be null (when the fixture's currency
//          cannot be converted). Render "see tickets" rather than zero.
// ADDED:   meta.currency on GET /listings — the currency every price in
//          meta is expressed in. Read it; never assume EUR.
// ADDED:   GET /listings can return 503 for currency-unavailable fixtures.
// ADDED:   GET /api/v1/auth/matchday-orders (customer order list).
// ADDED:   GET /api/v1/matchday/admin/orders (admin order list).

import type { FreeEsimOrderBlock } from '@/features/free-esim/types'
import type {
  PriceBreakdown,
  PriceDiscount,
} from '@/features/price-breakdown/types'

/* ── Response envelope ──────────────────────────────────────────
   Every response, success or failure, uses this wrapper (doc §01). */
export interface MatchdaySuccess<T> {
  success: true
  message: string
  data: T
  meta?: Record<string, unknown>
}

export type MatchdayErrorDetails = Record<string, unknown> | null

export interface MatchdayFailure {
  success: false
  message: string
  /**
   * Validation errors are usually Record<string, string[]>; business-rule
   * failures may instead contain machine-readable details such as
   * error_num/reference/upstream_message. The frontend must branch on the
   * documented machine-readable code and never parse the human message.
   */
  errors: MatchdayErrorDetails
}

export type MatchdayResponse<T> = MatchdaySuccess<T> | MatchdayFailure

/* ── Catalogue: tournaments / teams / venues ────────────────────── */

export interface MatchdayTournament {
  tournament_id: number
  name: string
  /** Always have a fallback image — this is frequently null (doc §03). */
  banner: string | null
}

export interface MatchdayTeam {
  team_id: number
  name: string
  banner: string | null
}

export interface VenueCategory {
  category_id: number
  name: string
  /** Always an array — never a string, never null (doc §03). */
  blocks: string[]
  /** Nests the same shape recursively. */
  sub_categories: VenueCategory[]
}

export interface MatchdayVenue {
  venue_id: number
  venue_name: string
  venue_image: string | null
  /** String, or null — not a number (doc §03). */
  capacity: string | null
  venue_city_name: string
  venue_country_name: string
  categories: VenueCategory[]
}

/* ── Events (fixtures) ──────────────────────────────────────────── */

export interface EventMinPrice {
  /**
   * NULLABLE — MatchDay Update doc: "an event's min_price.price can be
   * null in the events list" when the fixture's currency cannot be
   * converted (no ECB rate available). Render "see tickets" rather than
   * zero. Never access .price without a null guard.
   */
  price: number | null
  currency_code: string
  /**
   * Price-breakdown contract: the cheapest ticket INCLUDING the third-party
   * fee but WITHOUT the Golafly booking fee. Label it "from". null (or
   * absent) when no exchange rate is available — then show no "from" price.
   * `price` above is unchanged and is still the all-in charged price.
   */
  price_from?: number | null
}

/** Slim venue/team/tour shapes as embedded on an event (doc §03).
 *  `nice_name` / `t1_nice_name` / `t2_nice_name` are legacy slots the
 *  supplier no longer populates — always null. Kept in the type only so
 *  nobody re-derives them by accident; never render them. */
export interface EventVenue {
  venue_id: number
  venue_name: string
  venue_city_name: string
  venue_country_name: string
  venue_image: string | null
  capacity: string | null
  categories: VenueCategory[]
}

export interface EventTour {
  id: number
  name: string
  image: string | null
  nice_name: null
}

export interface EventTeam {
  id: number
  name: string
  image: string | null
  t1_nice_name: null
  t2_nice_name: null
}

export interface MatchdayEvent {
  id: number
  name: string
  /** ISO-8601, e.g. "2026-09-14T16:30:00" — or null when the fixture has
   *  no date yet (seen live: postponed fixtures such as Al Nassr vs Al Wasl
   *  come back with `"date": null, "postponed": true`). */
  date: string | null
  postponed: boolean
  /** Seating plan SVG — optional enhancement (doc §10 "Build checklist"). */
  svg_url: string | null
  /** A "from" price for the whole fixture — NOT the price of any specific
   *  listing. Safe to show on a fixture card as "from €128.45", but the
   *  ticket page must always use /listings' price_per_ticket (doc §03).
   *
   *  IMPORTANT: .price is nullable since the MatchDay Update doc — always
   *  check before using. */
  min_price: EventMinPrice
  venue: EventVenue
  tour: EventTour
  /** Home team. */
  team1: EventTeam
  /** Away team. */
  team2: EventTeam
  /** [] when the fixture has no fan-side segregation. */
  fans_sides: string[]
}

/** GET /events query params (doc §03). Dates are dd-mm-yyyy here — the
 *  one place in this API that is NOT ISO-8601. */
export interface EventFilters {
  page?: number
  /** Default 50, max 100 — larger values are clamped server-side. */
  per_page?: number
  /** Format dd-mm-yyyy. */
  from_date?: string
  /** Format dd-mm-yyyy. */
  to_date?: string
  event_name?: string
  home_team_name?: string
  away_team_name?: string
  home_team_id?: number
  away_team_id?: number
  venue_id?: number
  /** Note the name: this is the tournament_id from GET /tournaments
   *  (doc §08, rule 10 — "tour_id filters events, tournament_id comes
   *  back from /tournaments. Different names, same value."). */
  tour_id?: number
  /** Exact event id — returns just that one event. */
  id?: number
}

export interface EventsMeta {
  current_page: number
  per_page: number
  total_events: number
}

/* ── Listings ────────────────────────────────────────────────────── */

export interface ListingFilters {
  /** Required — 422 if missing. */
  event_id: number
  /** Return only this listing. */
  listing_id?: number
  /** Comma-separated, e.g. "6,7". */
  blocks?: string
  /** Comma-separated category ids. */
  categories?: string
}

export interface ListingCategory {
  category_id: number
  category_name: string
  description: string | null
  seating_type: string
  /** Always an array (doc §03/§04, same normalisation as venues). */
  seating_blocks: string[] | string
}

export interface ListingPriceDetails {
  currency: string
  /** THE price — display this, per ticket, all-inclusive (doc §04 rule).
   *  Multiply by quantity for the total. */
  price_per_ticket: number
  /**
   * Price-breakdown contract: the provider's price for one ticket, without
   * any fee. THIS is what a listing shows. `price_per_ticket` is unchanged
   * (still the charged all-in price, which the cart and checkout rely on)
   * and must no longer be displayed on the listing.
   */
  ticket_price?: number | null
  /** Per-ticket breakdown: ticket + third-party fee + Golafly fee. */
  price_breakdown?: PriceBreakdown | null
  // fee_for_quantities REMOVED — MatchDay Update doc:
  // "price_details.fee_for_quantities is no longer returned on listings."
  // It was the supplier's internal fee table, never a customer price.
  // Remove any use of it from the codebase.
}

export interface ListingSeatDetails {
  block: string
  row: string
  view_type: string
  age_group: string
  image_point_of_view: string | null
  extra_note_hospitality: string
}

export interface ListingSplit {
  split_type: string
  /** The ONLY quantities this listing may be bought in (doc §04, §08
   *  rule 01). Build the quantity selector from this array — nothing
   *  else is valid and anything else is rejected at checkout. */
  splits: number[]
}

export interface MatchdayListing {
  listing_id: number
  event_id: number
  venue_id: number
  tournament_id: number
  category: ListingCategory
  is_singles: boolean
  /** Total stock. */
  quantity: number
  /** Reserved by anyone right now. */
  held_quantity: number
  /** 1 = live, 0 = sold out / inactive.
   *  MatchDay Update doc: inactive listings (activated: 0) still come
   *  back with a price of 0 — hide them. */
  activated: 0 | 1
  type: string
  price_details: ListingPriceDetails
  seat_details: ListingSeatDetails
  split: ListingSplit
  description: string | null
  note: string | null
  fans_side: string | null
  instant_download: string
  /** Often "" — not recorded. */
  seats: string
  seats_together: string
}

export interface ListingsMetaBlock {
  block: string
  category_id: number
  category: string
  min_price: number
  /** "From" price (incl. third-party fee, excl. Golafly fee). */
  price_from?: number | null
}

export interface ListingsMetaCategory {
  category_id: number
  name: string
  description: string | null
  min_price: number
  /** "From" price (incl. third-party fee, excl. Golafly fee). */
  price_from?: number | null
}

/** GET /listings meta — the filter sidebar's data source (doc §03):
 *  block/category price ranges without deriving them client-side, plus
 *  the fixture repeated so the ticket page needs no second call.
 *
 *  NEW (MatchDay Update doc): meta.currency is the currency that every
 *  price in meta (min_price, max_price, each block and category min_price)
 *  is expressed in. It is the buyer's chosen currency when the server
 *  switch is on. null only when the fixture's currency is unknown. */
export interface ListingsMeta {
  total: number
  min_price: number
  /** "From" price for the whole event (incl. third-party fee, excl. the
   *  Golafly fee). null when no exchange rate is available. */
  min_price_from?: number | null
  max_price: number
  total_tickets: number
  /**
   * The currency every price in this meta block is expressed in.
   * Always read this field; never assume EUR or hardcode a symbol.
   * null when the fixture's own currency cannot be identified.
   */
  currency: string | null
  blocks: Record<string, ListingsMetaBlock>
  categories: ListingsMetaCategory[]
  event: Partial<MatchdayEvent> & { id: number; name: string }
}

/* ── Checkout / orders ──────────────────────────────────────────── */

export interface MatchdayCustomer {
  /** Required. */
  email: string
  /** Required. */
  first_name: string
  /** Required. */
  last_name: string
  /** Required — validate E.164 client-side, e.g. "+972500000000". */
  phone: string
  /** Optional. */
  country?: string
  /** Optional. */
  state?: string
  /** Optional. */
  city?: string
  /** Optional. */
  address?: string
  /** Optional — send "" rather than a placeholder if unsure (doc §04):
   *  implausible values are dropped, but a real-looking wrong one can
   *  still be rejected by the supplier. */
  postal_code?: string
}

export interface CreateCheckoutPayload {
  event_id: number
  listing_id: number
  /** Must be one of the listing's split.splits. */
  quantity: number
  /** Optional, max 500 chars. */
  note?: string
  customer: MatchdayCustomer
}

/** POST /checkout/{order_id}/pay's request body — new in the 4 Sept 2026
 *  revision (doc §00: "Now takes a body, and requires checkout_token").
 *  Previously this call took no body at all. */
export interface PayCheckoutPayload {
  /** The token from POST /checkout's response — the only response that
   *  ever contains it (doc §04/§08 rule 01). Refused without it. */
  checkout_token: string
  /** Optional coupon. The charge is reduced only when the code is valid. */
  coupon_code?: string
}

/** The two independent fields an order carries (doc §06) — they move
 *  independently, always read both.
 *
 *  Revised 4 Sept 2026 (doc §00): three new values were added —
 *  `confirming`, `needs_reconciliation`, `manual_review`. Critically,
 *  `failed` changed meaning: it used to mean "could not be fulfilled, a
 *  refund has been issued." It now means "could not be prepared, BEFORE
 *  any payment — nothing was charged." Anything that goes wrong AFTER
 *  payment now goes to `needs_reconciliation` or `manual_review` instead,
 *  where money is deliberately left alone while a human resolves it.
 *  NEVER tell a customer they've been refunded on `failed`. */
export type MatchdayOrderStatus =
  | 'initiated'
  | 'awaiting_payment'
  | 'pending_payment'
  | 'paid'
  /** Order is being placed with the supplier right now. Keep polling. */
  | 'confirming'
  | 'awaiting_attendees'
  | 'confirmed'
  /** Paid, Golafly is confirming with the supplier what happened.
   *  Money untouched. Keep polling while automation retries the supplier. */
  | 'needs_reconciliation'
  /** Paid, a human at Golafly now owns resolving it and will contact the
   *  customer directly. Same message as needs_reconciliation. */
  | 'manual_review'
  /** Meaning changed 4 Sept 2026 — now means "before any payment, nothing
   *  was charged," NOT "refund issued." */
  | 'failed'
  | 'cancelled'

/** Docs 3 payment status vocabulary. `refunding` is an in-flight state;
 * it is not a terminal failure. */
export type MatchdayPaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunding'
  | 'refunded'
  | 'expired'
  | 'failed'

/** value_type as returned in attendees_required (doc §05). */
export type AttendeeValueType = 'TEXT' | 'DATE' | 'EMAIL' | 'PHONE' | 'SELECT'

export interface AttendeeRequiredField {
  /** The exact key to send back — never translate it (doc §05/§08). */
  field_name: string
  value_type: AttendeeValueType
  /** Non-empty -> render exactly these as a dropdown. Empty -> open-ended
   *  input for that field (only country/nationality today, doc §05). */
  options: string[]
}

/** event/ticket sub-objects are null/placeholder until payment succeeds
 *  (doc §04 — "Two fields are empty here on purpose"). */
export interface MatchdayOrderEvent {
  event_id: string
  event_name: string | null
  event_date: string | null
  home_team: string | null
  away_team: string | null
}

export interface MatchdayOrderTicket {
  listing_id: string
  category_name: string
  ticket_type: string
}

/** Common shape returned by POST /checkout, POST /checkout/{id}/pay and
 *  GET /orders/by-checkout-session/{id} (doc §04) — the doc explicitly
 *  says to reuse one shape across all three since the pay/poll responses
 *  are the checkout response plus extra fields. */
export interface MatchdayOrder {
  order_id: number
  status: MatchdayOrderStatus
  payment_status: MatchdayPaymentStatus
  /** The currency this order was charged in. An order keeps its currency
   *  forever — always read from the record, never from the buyer's
   *  current currency picker (MatchDay Update doc). */
  currency: string
  /** Total the customer will be / was charged. */
  amount_paid: number
  /** Price-breakdown contract: the whole order's breakdown. `total` is
   *  BEFORE the discount — total paid = total − discount. */
  price_breakdown?: PriceBreakdown | null
  /** This order's coupon discount, or null. */
  discount?: PriceDiscount | null
  quantity: number
  event: MatchdayOrderEvent
  ticket: MatchdayOrderTicket
  /** Always [] from POST /checkout — only meaningful after payment, read
   *  it from the status poll (doc §04, §08 rule 12). */
  attendees_required: AttendeeRequiredField[]
  /** Only present on the POST /checkout response (doc §00/§04, new 4 Sept
   *  2026) — the ONLY response that ever contains it. Store it alongside
   *  order_id; POST /…/pay is refused without it (doc §08 rule 01). */
  checkout_token?: string
  /** Only present on the POST /checkout/{id}/pay response. */
  checkout_url?: string
  /** The envelope-level message from the status poll response — populated
   *  by getOrderByCheckoutSession for the `failed` status, where the
   *  message explains why the order failed (doc §07/§10: "show message;
   *  invite them to try again"). Not present on other statuses. */
  statusMessage?: string
}

/** The /pay endpoint's special 409 (doc §04, new 4 Sept 2026): the
 *  supplier re-priced the seats between prepare and pay. Recoverable —
 *  show both totals, get the customer to confirm, then call /pay again
 *  with the *same* checkout_token. Branch on `code`, never on `message`.
 *
 *  IMPORTANT: previous_amount_minor/new_amount_minor are in MINOR units —
 *  the one exception to this API's "always major units" rule (doc §08
 *  rule 03). Convert with features/matchday/format.ts's minorToMajor()
 *  before displaying. The amounts come back in the order's own currency
 *  (not necessarily the buyer's current header value). */
export interface PriceChangedErrorDetails {
  code: 'price_changed'
  order_id: number
  currency: string
  quantity: number
  previous_amount_minor: number
  new_amount_minor: number
}

export interface SubmitAttendeesPayload {
  /** Required, new 4 Sept 2026 (doc §00/§04) — the Stripe `session_id`
   *  from the redirect/status-poll, the same value used to poll status.
   *  Missing returns 422; a wrong capability returns 404 (Docs 3 rule 6). */
  checkout_session_id: string
  /** Exactly one entry per ticket (order.quantity). Each entry's keys are
   *  the exact field_name values from attendees_required — extra/unknown
   *  keys are ignored silently (doc §04/§05/§08). */
  attendees: Record<string, string>[]
}

/* ── Customer order list (MatchDay Update doc — NEW) ────────────── */

/**
 * A smaller vocabulary than the checkout `status`, written for the buyer.
 * Returned by GET /api/v1/auth/matchday-orders.
 */
export type CustomerOrderStatus =
  | 'processing'
  | 'action_required'
  | 'confirmed'
  | 'tickets_sent'
  | 'refunded'

export interface CustomerMatchdayOrder {
  id: number
  status: CustomerOrderStatus
  event: {
    name: string
    date: string
    home_team: string
    away_team: string
    venue_name: string
    venue_city: string
  }
  ticket: {
    category_name: string
    ticket_type: string
    quantity: number
    block: string
    row: string
  }
  /** The currency this order was paid in — read per-record (MatchDay
   *  Update doc: "An order keeps its currency forever."). */
  currency: string
  amount_paid: number
  /** Price-breakdown contract (see MatchdayOrder). `total` is BEFORE the
   *  discount. */
  price_breakdown?: PriceBreakdown | null
  discount?: PriceDiscount | null
  /** Non-empty only when status === 'action_required'. */
  attendees_required: AttendeeRequiredField[]
  tickets_sent_at: string | null
  created_at: string
  paid_at: string | null
}

export interface CustomerOrdersMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
}

export interface CustomerOrdersData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  data: CustomerMatchdayOrder[]
}

/* ── Admin order book (GET /api/v1/matchday/admin/orders) ──────────
   List:   GET /api/v1/matchday/admin/orders
   Detail: GET /api/v1/matchday/admin/orders/{orderId}
   Money is major units. The admin record is NOT the public checkout shape:
   what the customer paid lives under `charge`, our supplier cost under
   `cost`, and there are top-level `amount_paid`/`currency` only on older
   payloads — so both are optional and the helpers in
   services/matchday-admin.ts read `charge` first. */

export interface AdminMatchdayOrderCustomer {
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  phone?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  postal_code?: string | null
}

export interface AdminMatchdayOrderEvent {
  event_id?: string | number | null
  id?: string | number | null
  name?: string | null
  event_name?: string | null
  date?: string | null
  event_date?: string | null
  home_team?: string | null
  away_team?: string | null
  venue_name?: string | null
  venue_city?: string | null
}

export interface AdminMatchdayOrderTicket {
  listing_id?: string | number | null
  category_name?: string | null
  ticket_type?: string | null
  quantity?: number | null
  block?: string | null
  row?: string | null
  split_type?: string | null
}

/** What the customer was charged, in the order's own currency. */
export interface AdminMatchdayOrderCharge {
  currency?: string | null
  amount_paid?: number | string | null
  markup?: number | string | null
}

/** What Golafly pays the supplier. */
export interface AdminMatchdayOrderCost {
  currency?: string | null
  amount?: number | string | null
  converted?: number | string | null
}

export interface AdminMatchdayOrderFx {
  rate?: number | string | null
  source?: string | null
  captured_at?: string | null
}

export interface AdminMatchdayOrderFtn {
  order_id?: string | null
  display_order_id?: string | null
  delivery_status?: string | null
  fulfillment_status?: string | null
}

export interface AdminMatchdayOrderStripe {
  checkout_session_id?: string | null
  payment_intent_id?: string | null
  refund_id?: string | null
}

export interface AdminMatchdayOrderDelivery {
  delivered_at?: string | null
  tickets?: { count?: number; formats?: string[] } | null
}

export interface AdminMatchdayOrderReconciliation {
  parked_at?: string | null
  attempts?: number
  escalated_at?: string | null
  escalated_final_at?: string | null
}

export interface AdminMatchdayOrder {
  id?: number
  order_id?: number
  /** Golafly booking reference, e.g. "GO00000812LY" (Ticket dashboards §4). */
  reference?: string | null
  status: string
  payment_status?: string | null
  failure_code?: string | null
  failure_message?: string | null
  checkout_type?: string | null

  /** Legacy top-level fields — prefer `charge`. */
  currency?: string | null
  amount_paid?: number | string | null

  charge?: AdminMatchdayOrderCharge | null
  cost?: AdminMatchdayOrderCost | null
  fx?: AdminMatchdayOrderFx | null
  ftn?: AdminMatchdayOrderFtn | null
  stripe?: AdminMatchdayOrderStripe | null
  delivery?: AdminMatchdayOrderDelivery | null
  reconciliation?: AdminMatchdayOrderReconciliation | null
  refund?: { claimed_at?: string | null } | null

  quantity?: number
  event?: AdminMatchdayOrderEvent | null
  ticket?: AdminMatchdayOrderTicket | null
  customer?: AdminMatchdayOrderCustomer | null
  attendees_required?: AttendeeRequiredField[]
  attendees?: Record<string, string>[]
  tickets_sent_at?: string | null
  created_at?: string | null
  paid_at?: string | null
  confirmed_at?: string | null
  updated_at?: string | null
  note?: string | null
  /** VIP package (ULID) this ticket order belongs to; null/absent for a
   *  normal order (VIP Admin API contract §7). */
  hospitality_package_id?: string | null
  /** Free eSIM contract §6: detail only (the list doesn't carry it);
   *  absent until the backend deploys the feature. */
  free_esim?: FreeEsimOrderBlock | null
}

/* ── Errors ──────────────────────────────────────────────────────── */

/** Standard Laravel validation error body (422 with per-field detail),
 *  distinct from a supplier business error which has `errors: null` and
 *  only a human `message` (doc §07). Handle both. */
export interface MatchdayValidationErrorBody {
  message: string
  errors: Record<string, string[]> | null
}

/** Supplier business-rule diagnostics returned with 422 responses.
 * `reference` and `upstream_message` are deliberately never shown to buyers.
 */
export interface MatchdaySupplierErrorDetails {
  error_num?: number
  reference?: string | null
  upstream_message?: string | null
  [key: string]: unknown
}

export const MATCHDAY_SUPPLIER_ERROR_CODES = {
  SOLD_OUT: 244,
  QUANTITY_NOT_AVAILABLE: 258,
  SINGLE_TICKET_ONLY: 234,
  NO_LONGER_AVAILABLE: 242,
  FIXTURE_OFF_SALE: 231,
  POSTCODE_REJECTED: 300,
} as const

export const MATCHDAY_RETRYABLE_STATUS_CODES = [502] as const
export const MATCHDAY_NO_RETRY_STATUS_CODES = [404, 409, 503] as const
