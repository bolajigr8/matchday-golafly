// features/vip/contract.ts
//
// The backend's own shapes for VIP packages, exactly as the "MatchDay VIP
// packages: Frontend API contract" (version of 17 Nov 2026) describes them. Every
// endpoint lives under /api/v1/hospitality, except the cart checkout and
// the ledger (the existing /api/v1/cart and /api/v1/ledgers ones).
//
// Only the fields the pages read are typed; real responses carry more.
// Nothing here is invented: when the contract says a shape is "the one the
// normal screen already reads" (hotel rates, flight offers), the type
// stays loose and features/vip/normalize.ts reads it defensively.

import type { FlightOffer } from '@/features/flights/types'
import type { PriceSummary } from '@/features/price-breakdown/types'

/** { success, message, data } — every success answer. */
export interface VipEnvelope<T> {
  success: boolean
  message: string
  data: T
}

/* ── 1. The feature switch and the two modes ────────────────────────── */

/** "package": ticket + flight + hotel required, eSIM optional (default).
 *  "flexible": only the ticket is required. Chosen by an admin. */
export type VipPackageMode = 'package' | 'flexible'

/** GET /hospitality/settings (public). A 404 = VIP packages are off. The
 *  mode here is for NEW packages; a package keeps its own (read it from
 *  the package, never from here). */
export interface VipSettings {
  mode: VipPackageMode
}

export type VipStepName = 'ticket' | 'flight' | 'hotel' | 'esim'

/* ── 2.1 Browse ─────────────────────────────────────────────────────── */

export interface VipClub {
  /** "barcelona", "real_madrid", "atletico_madrid" */
  slug: string
  name: string
  city: string
  airports: string[]
}

export interface VipEvent {
  id: number
  name: string
  /** Local kick-off time in Spain, WITHOUT an offset. Show it as given. */
  date: string
  /** venue_image: the stadium photo (live events send it; ~430px wide). */
  venue: { venue_id: number; venue_name: string; venue_image?: string | null }
  /** The stadium's seating plan (supplier SVG). Real events send it (Postman
   *  example); the contract's trimmed example does not, so it is optional. */
  svg_url?: string | null
  team1: { id: number; name: string; image?: string | null }
  team2: { id: number; name: string; image?: string | null }
  /** Competition (live events send it): "Spanish La Liga", "Champions League". */
  tour?: { id: number; name: string } | null
  /** Lowest VIP ticket price for the match (browse price, up to 2 min old). */
  vip_price_from: { currency_code: string; price: number } | null
  hospitality: { club: string; city: string; airports: string[] }
}

export interface VipEventsMeta {
  current_page: number
  per_page: number
  total_events: number
  has_more: boolean
}

export interface VipEventsPage {
  data: VipEvent[]
  meta: VipEventsMeta
}

export interface VipListing {
  listing_id: number
  event_id: number
  category: {
    category_id: number
    category_name: string
    /** "VIP_Players-Zone_2;VIP_Players-Zone_3;…": the plan blocks of this
     *  category (Postman example). Lights them up on the stadium map. */
    seating_blocks?: string | null
    /** The category's own description (Postman example), e.g. "Tribuna 1st
     *  Central Lower Seats With Pre Match Catering & Drinks…". */
    description?: string | null
  }
  /** Tickets left on this listing. */
  quantity: number
  price_details: { currency: string; price_per_ticket: number }
  seat_details: {
    block?: string | null
    row?: string | null
    extra_note_hospitality?: string | null
  }
  /** Offer quantities from `splits` ONLY. */
  split: { split_type: string; splits: number[] }
  note?: string | null
}

export interface VipListingsMeta {
  currency: string
  min_price: number
  max_price: number
  total_tickets: number
}

export interface VipListingsPage {
  data: VipListing[]
  meta: VipListingsMeta
}

/* ── 2.2–2.6 The package while it is being built ────────────────────── */

export type VipPackageStatus =
  | 'building'
  | 'checkout_started'
  | 'paid'
  | 'ticket_secured'
  | 'completed'
  | 'refunded'
  | 'abandoned'

export interface VipStep {
  done: boolean
  next: boolean
  blocked: boolean
  optional: boolean
  /** flight and hotel only. */
  expired?: boolean
}

export interface VipPackageSteps {
  ticket: VipStep
  flight: VipStep
  hotel: VipStep
  esim: VipStep
}

/** A cart line of the package. The ticket/flight/hotel/eSIM lines are the
 *  normal cart item shapes plus `hospitalityPackageId` and `expired`. */
export interface VipPackageItem {
  id: string
  type: 'matchday' | 'flight' | 'stays' | 'esim'
  hospitalityPackageId?: string
  expired?: boolean
  /* matchday */
  eventId?: string
  listingId?: string
  quantity?: number
  eventName?: string | null
  eventDate?: string | null
  categoryName?: string | null
  block?: string | null
  row?: string | null
  currency?: string
  unitAmount?: number
  /* flight */
  offerId?: string
  offer?: FlightOffer
  /* stays */
  provider?: 'etg' | 'duffel'
  hotelName?: string
  hotelImage?: string
  hotelAddress?: string
  roomName?: string
  checkin?: string
  checkout?: string
  rooms?: number
  adults?: number
  expiresAt?: string | null
  /* esim */
  packageId?: string
  package?: { title?: string; data?: string; validity_days?: number; name?: string } | null
}

/** The hotel's dates (contract 2.6): those of the hotel in the package, or
 *  else those of a search in progress for a package without a flight. */
export interface VipHotelDates {
  check_in: string
  check_out: string
  nights: number
}

export interface VipPackage {
  /** ULID. Keep it: the success page needs it again. */
  id: string
  status: VipPackageStatus
  club: string
  /** The mode this package was created under (never changes). Older
   *  answers may leave it out: then it is "package". */
  mode?: VipPackageMode
  /** e.g. ["ticket", "flight", "hotel"] (package) or ["ticket"] (flexible). */
  required_steps?: VipStepName[]
  optional_steps?: VipStepName[]
  hotel_dates?: VipHotelDates | null
  steps: VipPackageSteps
  ready_for_checkout: boolean
  items: VipPackageItem[]
  /** The price to show (live, not the browse price). */
  price_summary: PriceSummary | null
  /** Only when this call created a new guest cart. */
  guest_token?: string
}

export interface VipCreatePackageBody {
  club: string
  event_id: number
  listing_id: number
  quantity: number
}

export interface VipChangeTicketBody {
  event_id: number
  listing_id: number
  quantity: number
}

/* ── 2.3 Flight ─────────────────────────────────────────────────────── */

export type VipCabinClass = 'business' | 'first' | 'any'

export interface VipFlightSearchBody {
  origin: string
  cabin_class: VipCabinClass
  return?: boolean
  /** YYYY-MM-DD: the day before the match up to match day. */
  departure_date?: string
  /** YYYY-MM-DD: the day after the match up to 3 days after. */
  return_date?: string
}

/** A normal flight offer plus the `hospitality` block. `total_amount` is
 *  for all travellers. Keep `passengers[].id` for checkout. */
export type VipFlightOffer = FlightOffer & {
  hospitality?: { arrival_local: string; hours_before_kickoff: number } | null
}

export interface VipFlightService {
  id: string
  quantity: number
  passenger_id?: string
  segment_id?: string
}

export interface VipAddFlightBody {
  offer_id: string
  services?: VipFlightService[]
}

/* ── 2.4 Hotel ──────────────────────────────────────────────────────── */

export interface VipHotelSearchBody {
  rooms: number
  /** 1 to 7. Required with a one-way flight or no flight; optional with a
   *  return flight (left out: check-out = the return flight's day). */
  nights?: number
  /** YYYY-MM-DD. Only without a flight (flexible mode), and then required. */
  check_in?: string
  /** 2 letters, the lead guest's country of residence. */
  residency: string
}

export interface VipHotelOption {
  option_id: string
  /** For logic only. NEVER shown. */
  provider: 'etg' | 'duffel' | string
  name: string
  stars: number
  address: string
  photos: string[]
  /** null for one supplier ("See prices" state); the other may send only
   *  the currency, so `amount` is optional. */
  price_from: { amount?: string | null; currency: string } | null
  price_breakdown: unknown
}

/** GET …/hotels/{optionId}/rates — the supplier's own rates shape (the
 *  normal hotel screen's). Read through normalizeHotelRates(). */
export type VipHotelRatesRaw = Record<string, unknown>

/** POST …/hotel/lock — data.id is the lock_id. The locked price is in the
 *  supplier's own fields; read it through normalizeHotelLock(). */
export type VipHotelLockRaw = { id: string; price_changed?: boolean } & Record<string, unknown>

/* ── 2.5 eSIM ───────────────────────────────────────────────────────── */

export interface VipEsimPlan {
  package_id: string
  title: string
  data: string
  validity_days: number
  price: number
  currency: string
}

export interface VipEsimPage {
  data: VipEsimPlan[]
  pagination: { total: number; per_page: number; page: number; last_page: number }
}

/* ── 2.7 Pay (the existing cart checkout) ───────────────────────────── */

export interface VipCheckoutPassenger {
  id: string
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr'
  given_name: string
  family_name: string
  gender: 'm' | 'f'
  born_on: string
  email: string
  phone_number: string
}

export interface VipCheckoutBody {
  email: string
  phone: string
  matchday: { cart_item_id: string; customer: { first_name: string; last_name: string } }[]
  flights: { cart_item_id: string; passengers: VipCheckoutPassenger[] }[]
  stays: (
    | { cart_item_id: string; rooms: { guests: { first_name: string; last_name: string }[] }[] }
    | { cart_item_id: string; guests: { given_name: string; family_name: string; born_on?: string }[] }
  )[]
}

export interface VipCheckoutResult {
  checkout_url: string
  session_id: string
  ledger_ids?: number[]
  matchday_order_ids?: number[]
  checkout_type?: 'cart'
  hospitality_package_id?: string
  price_summary?: PriceSummary | null
}

/* ── 6. After payment ───────────────────────────────────────────────── */

export interface VipLedgerItem {
  status: string
  status_message?: string | null
  payment_status?: string
}

export interface VipAttendeeField {
  name?: string
  label?: string
  [key: string]: unknown
}

export interface VipLedgerMatchdayOrder {
  order_id: number
  status: string
  payment_status: string
  quantity: number
  attendees_required: VipAttendeeField[]
}

export interface VipLedgerTransaction {
  status: string
  status_message?: string | null
  payment_status: string
  checkout_type?: string
  hospitality_package_id?: string
  pricing?: { amount_paid_minor?: number; currency?: string; payment_method?: string }
  item_count?: number
  items?: VipLedgerItem[]
  matchday_orders?: VipLedgerMatchdayOrder[]
}

export type VipTicketStatus = 'processing' | 'action_required' | 'confirmed' | 'tickets_sent' | 'refunded'

export interface VipPaidItem {
  type: 'flight' | 'hotel' | 'esim' | 'esim_topup'
  status: string
  status_message: string | null
}

/** GET /hospitality/packages/{id} after payment: built from the records,
 *  no steps, no cart lines, no prices. */
export interface VipPaidPackage {
  id: string
  status: VipPackageStatus
  club: string
  mode?: VipPackageMode
  required_steps?: VipStepName[]
  optional_steps?: VipStepName[]
  event_name: string
  event_date: string
  event_timezone: string
  quantity: number
  ticket: { status: VipTicketStatus } | null
  items: VipPaidItem[]
}

/** The package endpoint answers either shape; `steps` tells them apart. */
export type VipPackageView = VipPackage | VipPaidPackage

export function isBuildingView(p: VipPackageView): p is VipPackage {
  return 'steps' in p && !!(p as VipPackage).steps
}
