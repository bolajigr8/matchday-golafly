// features/stays/types.ts
//
// Copied from the travels app (ETG certification + citizenship contract),
// plus matchday's price_breakdown fields.

import type { PriceBreakdown } from '@/features/price-breakdown/types'

// ── Region autocomplete ─────────────────────────────────────────
export interface StayRegion {
  region_id: number
  name_en: string
  type: string
  country_code: string
  country_name_en: string
  iata_code: string
  center_lat: string
  center_lng: string
}

// ── Citizenship (GET /stays/countries) ─────────────────────────
// `residency` on the hotel searches means the CITIZENSHIP of the main guest
// (the person who checks in), not where they live. One value per search.
// Codes are ISO 3166-1 alpha-2, always lowercase. Names are English and may
// carry accents or curly apostrophes ("Côte d’Ivoire", "Türkiye"): display
// them as given, and keep the backend's order (sorted ignoring accents).
export interface StayCountry {
  code: string
  name: string
}

// ── Hotel list item (from search-regions) ──────────────────────
// NOTE: this sandbox/test data frequently returns null for name,
// address, star_rating, latitude, and longitude — confirmed against a
// live search-regions response where every field but hotel_id/
// hotel_code/image/kind was null. These are genuinely nullable at
// runtime; every render site must have a fallback (see
// stays-hotel-card.tsx) rather than trusting these are always present.
export interface StayHotelListItem {
  hotel_id: string
  hotel_code: number // HID — used in search-hp & booking form
  name: string | null
  address: string | null
  star_rating: number | null
  image: string // URL with {size} placeholder — may not resolve; see features/stays/stay-images.tsx
  latitude: number | null
  longitude: number | null
  kind: string | null
}

// ── Property fee (charged/collected at the hotel, not online) ──
export interface PropertyFee {
  name: string
  amount: number
  currency: string
}

export interface PropertyFeeTotal {
  amount: number
  currency: string
}

// ── Room (from search-hp) ───────────────────────────────────────
export interface StayRoom {
  book_hash: string // h-... used for prebook
  match_hash: string // m-... used for booking form
  search_hash: string | null
  // ETG's FULL room name, every qualifier included, e.g. "Junior Suite
  // (smoking, bed type is subject to availability (child meal not
  // included))". Show it in full everywhere; never truncate it or swap it for
  // main_room_type. Send it to the cart as is. See <RoomName>.
  room_name: string
  /** The short room type only, e.g. "Junior Suite". Can be null. */
  main_room_type?: string | null
  /** The qualifiers only. Often null. */
  misc_room_type?: string | null
  images: string[] // room photo URLs (may be empty)
  meal_type: string
  has_breakfast: boolean
  max_guests: number
  bed_type: string | null
  bathroom_type: string | null
  total_price: number // already includes all taxes/fees charged online — never add to it
  currency: string
  price_per_night: number
  /** Price-breakdown contract: one hotel_price line + Golafly fee. Fees
   *  payable at the property stay OUTSIDE this breakdown. */
  price_breakdown?: PriceBreakdown | null
  // Taxes/fees the guest pays directly at the property, NOT included in
  // total_price and NOT to be added to it anywhere in the UI.
  fees_payable_at_property?: PropertyFee[] | null
  total_payable_at_property?: PropertyFeeTotal | null
  // The instant, in UTC, no offset marker — do NOT format this directly
  // with the viewer's local clock (Date#toLocaleDateString etc). Use
  // free_cancellation_before_display (already formatted in the hotel's
  // clock) or format this value yourself with { timeZone: hotel_timezone }.
  // null = no free-cancellation window at all (normal for non-refundable
  // rates, not an error).
  free_cancellation_before?: string | null
  // Same instant as above, pre-formatted in the hotel's own timezone —
  // e.g. "21 Oct 2026, 17:00". Safe to render verbatim. Prefer this over
  // formatting free_cancellation_before yourself.
  free_cancellation_before_display?: string | null
  // ETG explicitly returns true/false in normal responses, but this can
  // be null or omitted. Only an explicit true is treated as refundable.
  is_refundable?: boolean | null
  // IANA zone the *_display value above is expressed in, e.g.
  // "America/Los_Angeles". "UTC" means we couldn't resolve the hotel's
  // real zone — label it as UTC, not as "local time".
  hotel_timezone?: string
  allotment: number
  amenities: string[]
}

// ── Description paragraph ───────────────────────────────────────
export interface StayDescriptionBlock {
  title: string
  paragraphs: string[]
}

// ── Hotel detail (from search-hp) ──────────────────────────────
// NOTE: confirmed against a live response that name, address,
// star_rating, latitude, longitude, check_in_time, check_out_time,
// email, phone, and region can ALL be null for a given hotel in this
// dataset (not just metapolicy_*). Every one of these must have a
// fallback at the render site — see details-dynamic.tsx.
// ── Hotel-level metapolicy (from search-hp, ETG cert fixes) ────────
// Confirmed against a live response: this is NOT an array of
// {title, paragraphs} blocks like policy_struct — it's an object keyed
// by category, where most categories are an ARRAY of line items but a
// couple (`visa`, `no_show`) are a single OBJECT. Every field below is
// treated as optional/nullable in the renderer regardless of what's
// declared here, since ETG can omit categories or fields entirely and
// `currency` has been observed as null on individual line items even
// when `price` is set. Prices arrive as STRINGS (e.g. "3.00"), not
// numbers — parse before formatting. See hotel-metapolicy.tsx for the
// renderer, which never trusts this shape and bails out gracefully on
// anything unexpected instead of crashing.
export interface MetapolicyPriceItem {
  price?: string | null
  currency?: string | null
  inclusion?: string | null // 'included' | 'not_included' | ...
  price_unit?: string | null // 'per_room_per_night' | 'per_guest_per_stay' | ...
  amount?: number | null
}

export interface MetapolicyStruct {
  cot?: MetapolicyPriceItem[] | null
  meal?: (MetapolicyPriceItem & { meal_type?: string | null })[] | null
  pets?: (MetapolicyPriceItem & { pets_type?: string | null })[] | null
  visa?: { visa_support?: string | null } | null
  add_fee?: (MetapolicyPriceItem & { fee_type?: string | null })[] | null
  deposit?:
    | (MetapolicyPriceItem & {
        availability?: string | null
        deposit_type?: string | null
        payment_type?: string | null
        pricing_method?: string | null
      })[]
    | null
  no_show?: {
    time?: string | null
    day_period?: string | null
    availability?: string | null
  } | null
  parking?: (MetapolicyPriceItem & { territory_type?: string | null })[] | null
  shuttle?:
    | (MetapolicyPriceItem & {
        shuttle_type?: string | null
        destination_type?: string | null
      })[]
    | null
  children?:
    | {
        price?: string | null
        currency?: string | null
        age_start?: number | null
        age_end?: number | null
        extra_bed?: string | null
      }[]
    | null
  internet?:
    | (MetapolicyPriceItem & {
        work_area?: string | null
        internet_type?: string | null
      })[]
    | null
  extra_bed?: MetapolicyPriceItem[] | null
  children_meal?:
    | (MetapolicyPriceItem & {
        age_start?: number | null
        age_end?: number | null
        meal_type?: string | null
      })[]
    | null
  check_in_check_out?:
    | (MetapolicyPriceItem & { check_in_check_out_type?: string | null })[]
    | null
}

export interface StayHotelDetail {
  hotel_id: string
  hotel_code: number
  name: string | null
  address: string | null
  star_rating: number | null
  image: string
  latitude: number | null
  longitude: number | null
  kind: string | null
  check_in_time: string | null
  check_out_time: string | null
  description_struct: StayDescriptionBlock[]
  policy_struct: StayDescriptionBlock[]
  // New hotel-level policy fields from the ETG certification fixes.
  // Optional/defensive: render only when present, don't assume shape
  // beyond "block list" — confirm the exact shape with backend once the
  // GET /hotels/{id} (or search-hp) response is live, then tighten this.
  metapolicy_struct?: MetapolicyStruct | null
  metapolicy_extra_info?: string | null
  email: string | null
  phone: string | null
  region: {
    country_code: string
    iata: string
    id: number
    name: string
    type: string
  } | null
  // Confirmed present on the live hotel-detail response (not just on
  // BookingFormResult). If true, ETG requires a gender to be captured
  // per guest on booking/form — see guest/client.tsx.
  is_gender_specification_required: boolean
  rooms: StayRoom[]
}

// ── Prebook rate ────────────────────────────────────────────────
export interface PrebookRate {
  book_hash: string // p-... (prebook hash — use this for booking form)
  match_hash: string
  /** Full room name (see StayRoom.room_name). */
  room_name: string
  main_room_type?: string | null
  misc_room_type?: string | null
  meal_type: string
  has_breakfast: boolean
  max_guests: number
  amenities: string[]
  allotment: number
  is_package: boolean
  total_price: number
  currency: string
  price_per_night: number
  /** Price-breakdown contract: one hotel_price line + Golafly fee. Fees
   *  payable at the property stay OUTSIDE this breakdown. */
  price_breakdown?: PriceBreakdown | null
  // See StayRoom — same "UTC instant, don't format locally" rule applies.
  free_cancellation_before?: string | null
  free_cancellation_before_display?: string | null
  hotel_timezone?: string
  // Only `true` is refundable. false, null, or an omitted field are all
  // treated as non-refundable for safety when ETG sends an incomplete rate.
  is_refundable?: boolean | null
  fees_payable_at_property?: PropertyFee[] | null
  total_payable_at_property?: PropertyFeeTotal | null
  // Penalty schedule. A tier with start_at AND end_at both null applies at
  // all times (label it "any time", not a date) — this is what a
  // non-refundable rate looks like. Boundaries are offset-bearing too;
  // apply the same hotel_timezone formatting rule if you render them.
  cancellation_policy?: {
    start_at: string | null
    end_at: string | null
    amount: number
    currency: string
  }[] | null
  no_show: null
  deposit: null
}

export interface PrebookHotel {
  hotel_id: string
  hotel_code: number
  rates: PrebookRate[]
}

export interface PrebookResult {
  hotels: PrebookHotel[]
  price_changed: boolean
}

// ── Booking form guest ──────────────────────────────────────────
// A guest with an `age` but no `is_child: true` counts as an ADULT —
// this is ETG's rule, not ours. Always set is_child explicitly on every
// child guest; never send `age` without it.
export interface BookingGuest {
  first_name: string
  last_name: string
  is_child?: true
  age?: number
}

export interface BookingRoom {
  guests: BookingGuest[]
}

export interface BookingFormPayload {
  book_hash: string
  // Optional now — never an authorisation path, harmless to keep sending.
  match_hash?: string
  hotel_id: number
  // hotel_name intentionally NOT part of this type any more. Stop
  // sending it — it's resolved from our own hotel tables now, and
  // sending it previously blanked the confirmation email when it was
  // omitted by mistake. partner_order_id is also intentionally absent:
  // it's minted server-side and must never be sent by the client.
  language: string
  checkin: string
  checkout: string
  adults: number
  children: number
  user: {
    email: string
    phone: string
  }
  rooms: BookingRoom[]
}

export interface BookingFormResult {
  booking_id: number
  is_gender_specification_required: boolean
  upsell_data: unknown[]
}

// ── Checkout ────────────────────────────────────────────────────
export interface BookingCheckoutResult {
  checkout_url: string
  session_id: string
  booking_id: number
  amount: number
  currency: string
}

// ── Status (legacy GET /booking/{id}/status — superseded, see below) ──
export interface BookingStatusResult {
  booking_id: number
  status: string
  status_message: string
  error_code: string | null
  error_message: string | null
  payment_status: string
  hotel_name: string
  checkin: string
  checkout: string
  adults: number
  children: number
  is_cancellable: boolean | null
  amount_paid: number
  currency: string
  confirmed_at: string | null
}

// ── Ledger transaction (GET /ledgers/transactions/{sessionId}) ────
// This is now the confirmation-page polling endpoint. It's keyed by the
// Stripe checkout session id (not the booking id) and needs no auth,
// which is what makes it pollable from a plain confirmation page.
export type LedgerStatus =
  | 'booking_form_ready' // not terminal — awaiting checkout
  | 'pending_payment' // not terminal — awaiting payment
  | 'paid' // not terminal — payment received, finalising
  | 'processing' // not terminal — being finalised with the hotel
  | 'needs_reconciliation' // not terminal — taking longer than usual, a human is on it. NOT a failure.
  | 'confirmed' // terminal — booked
  | 'payment_received_booking_failed' // terminal — paid, booking failed, refund in motion
  | 'failed' // terminal — not completed, no charge

export type LedgerFailureCode =
  | 'sold_out'
  | 'price_changed'
  | 'payment_declined'
  | 'refund_pending'
  | 'temporarily_unavailable'
  | 'rate_expired'
  | 'booking_failed' // catch-all

export interface LedgerCustomer {
  full_name: string
  email: string
  country: string
}

export interface LedgerPricing {
  // NOTE: despite the field name, this is already a major-unit decimal
  // (e.g. 138.89), not minor units (cents). Do NOT divide it by 100.
  amount_paid_minor: number
  currency: string
  payment_method: string
}

export interface LedgerStays {
  hotel_name: string
  checkin: string
  checkout: string
  adults: number
  children: number
  is_cancellable: boolean
  expires_at: string
}

export interface LedgerTransactionResult {
  status: LedgerStatus
  // An abandoned checkout is NOT a failure status: if the customer never
  // pays, status stays "pending_payment" and only payment_status moves
  // to "expired". Check payment_status === 'expired' before reading
  // status for this case, or the UI will say "awaiting payment" forever.
  payment_status: string
  checkout_type: string
  customer: LedgerCustomer
  pricing: LedgerPricing
  stays: LedgerStays
  paid_at: string | null
  confirmed_at: string | null
  created_at: string
  // Present ONLY when status is 'failed' or 'payment_received_booking_failed'.
  // Check for presence, not for null.
  failure_code?: LedgerFailureCode
  // Written for customers — safe to display verbatim.
  failure_message?: string
}

// ── Cancel order ───────────────────────────────────────────────
export interface CancelOrderPayload {
  reason: string
}

export interface CancelOrderResult {
  id: number
  booking_id: number
  booking_reference: string
  order_id: string
  status: string
  requested_at: string
  cancelled_at: string | null
  reason: string
}

// ── Search payload ──────────────────────────────────────────────
export interface StaySearchFilter {
  star_rating: number[]
  kind?: string[]
  meal_type?: string[]
}

export interface StayGuest {
  adults: number
  children: number[]
}

export interface SearchRegionPayload {
  checkin: string
  checkout: string
  residency: string
  language: string
  guests: StayGuest[]
  region_id: number
  currency: string
  filter?: StaySearchFilter
}

export interface SearchHotelPayload {
  checkin: string
  checkout: string
  hid: number
  residency: string
  language: string
  currency: string
  guests: StayGuest[]
  filter: StaySearchFilter
}

// ── Prebook payload ────────────────────────────────────────────
// guests is now REQUIRED — send the identical array you sent to
// search-hp, byte for byte. It records what the rate was priced for so
// booking/form can verify guests match before anyone is charged.
export interface PrebookPayload {
  hash: string // the h-... hash from the room the user picked
  guests: StayGuest[]
}

// ── Generic API wrapper ─────────────────────────────────────────
export interface StayApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ── Error envelope ──────────────────────────────────────────────
// Every non-validation failure uses this shape. `error` is a stable
// slug — branch on it, never on `message` (message is just for display
// and its wording isn't guaranteed to stay the same).
export type StayErrorSlug =
  | 'prebook_required' // /booking/form — session expired or hash altered, send back to search
  | 'invalid_rate_hash' // /prebook — a p-... hash was sent where an h-... hash was required
  | 'occupancy_mismatch' // /booking/form — guests don't match the rooms that were searched/priced

export interface StayErrorEnvelope {
  success: false
  message: string
  data: null
  error: StayErrorSlug | (string & {})
}

// Laravel validation failures instead carry a field-keyed `errors` object
// and have no `error` slug.
export interface StayValidationErrorEnvelope {
  success: false
  message: string
  errors: Record<string, string[]>
}
