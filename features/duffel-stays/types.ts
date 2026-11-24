// features/duffel-stays/types.ts
//
// Copied from the travels app (same backend, same contract).
//
// Types for the Duffel supplier integration. This is a SEPARATE data model
// from features/stays/types.ts (ETG) — the two never mix. Fields here are
// modeled directly on the Duffel Stays Postman collection (locations,
// search, rates, quotes, checkout). The two endpoints marked "LEAVE THIS
// ENDPOINT OUT FOR NOW" in that collection — accommodation-name search and
// place/airport search — are deliberately not implemented here either.

export interface DuffelApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ── Cancellation timeline entry (shared by quote + rate) ─────────
export interface DuffelCancellationTimelineEntry {
  before: string
  refund_amount: string
  refund_currency: string
  refund_percentage_of_paid: number
}

export interface DuffelCondition {
  title: string
  description: string
}

// ── Rate (nested inside an accommodation room, inside a quote) ───
export interface DuffelRate {
  id: string // rat_...
  name: string | null
  code: string | null
  description: string | null
  expires_at: string // deadline lives on the RATE, not the quote
  total_amount: string
  total_currency: string
  due_at_accommodation_amount: string | null
  due_at_accommodation_currency: string | null
  board_type: string | null
  payment_type: 'pay_now' | 'pay_later' | null
  quantity_available: number | null
  refundable: boolean
  cancellation_timeline: DuffelCancellationTimelineEntry[]
  conditions: DuffelCondition[]
  benefits: string[] | null
  deal_types: string[]
  loyalty_programme_required: boolean
  supported_loyalty_programme: string | null
}

export interface DuffelBedConfiguration {
  type: string
  count: number
}

export interface DuffelRoom {
  name: string
  beds: DuffelBedConfiguration[] | null
  photos: { url: string }[]
  rates: DuffelRate[]
}

export interface DuffelAccommodationAddress {
  line_one: string
  city_name: string
  postal_code: string
  region: string | null
  country_code: string
}

export interface DuffelAccommodation {
  id: string // acc_...
  name: string
  description?: string
  rating?: number | null
  ratings?: { source: string; value: number }[]
  review_score?: number | null
  review_count?: number | null
  location?: {
    address: DuffelAccommodationAddress
    geographic_coordinates: { latitude: number; longitude: number }
  }
  photos?: { url: string }[]
  amenities?: { description: string; type: string }[]
  check_in_information?: {
    check_out_before_time: string | null
    check_in_before_time: string | null
    check_in_after_time: string | null
  }
  key_collection?: string | null
  chain?: { name: string; id?: string } | null
  brand?: { name: string; id: string } | null
  supported_loyalty_programme?: string | null
  rooms: DuffelRoom[]
}

// ── Quote (POST /duffel-stays/quotes, GET /duffel-stays/quotes/{id}) ──
export interface DuffelQuote {
  id: string // quo_...
  expires_at: string | null // informational only — real deadline is on the rate
  check_in_date: string
  check_out_date: string
  total_amount: string
  total_currency: string
  due_at_accommodation_amount: string | null
  due_at_accommodation_currency: string | null
  refundable: boolean
  cancellation_timeline: DuffelCancellationTimelineEntry[]
  board_type: string | null
  payment_type: 'pay_now' | 'pay_later' | null
  conditions: DuffelCondition[]
  loyalty_programme_required: boolean | null
  supported_loyalty_programme: string | null
  accommodation: DuffelAccommodation
}

// ── Checkout (POST /duffel-stays/checkout) ────────────────────────
export interface DuffelGuestInput {
  given_name: string
  family_name: string
  born_on?: string // YYYY-MM-DD
}

export interface DuffelCheckoutPayload {
  quote_id: string
  guests: DuffelGuestInput[]
  email: string
  phone_number: string
  accommodation_special_requests?: string
  loyalty_programme_account_number?: string | null
  coupon_code?: string
}

export interface DuffelCheckoutResult {
  checkout_url: string
  session_id: string
  booking_id: number
  amount: number
  currency: string
  due_at_accommodation: { amount: string; currency: string } | null
  expires_at: string | null
}

// ── Booking / ledger status (poll after redirect back from Stripe) ──
// The docs describe polling GET /ledgers/transactions/{sessionId} until a
// terminal state, without specifying the exact payload shape. This mirrors
// the ETG BookingStatusResult shape for UI consistency — confirm/adjust
// field names against the real endpoint before relying on this in prod.
export interface DuffelBookingStatusResult {
  booking_id: number
  status: string
  session_id: string
  amount?: number
  currency?: string
  accommodation_name?: string | null
  check_in_date?: string
  check_out_date?: string
  confirmation_reference?: string | null
  failure_reason?: string | null
}

// ── Rate-life / countdown helpers ─────────────────────────────────
export const DUFFEL_CHECKOUT_MIN_RATE_LIFE_MINUTES = 30

// ══════════════════════════════════════════════════════════════════
// Search flow (locations/suggestions → search → search-results/rates)
// ══════════════════════════════════════════════════════════════════

// ── GET /duffel-stays/locations/suggestions ────────────────────────
export interface DuffelLocationSuggestion {
  id: string // geo_... for cities, a Duffel place id for airports
  source: 'city' | 'airport'
  name: string
  label: string // render this, never `name` — see docs, disambiguated server-side
  region: string | null
  country_code: string | null
  country_name: string | null
  population: number | null
  accommodation_id: null // this endpoint never returns hotels
  geographic_coordinates: {
    latitude: number
    longitude: number
  }
}

// ── POST /duffel-stays/search body ──────────────────────────────────
export type DuffelSearchGuestInput =
  | { type: 'adult' } // `age` is FORBIDDEN on adults — omit the key entirely
  | { type: 'child'; age: number } // age REQUIRED for children (0–17)

export type DuffelSearchSort =
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'review_score_desc'

// Mutually exclusive with `accommodationId` — a search is either "by area"
// or "for one specific property" picked from a (currently disabled)
// accommodation-name search. Sending both, or neither, is a 422.
export interface DuffelSearchByLocationInput {
  checkInDate: string // YYYY-MM-DD
  checkOutDate: string // YYYY-MM-DD
  rooms: number // 1–9
  guests: DuffelSearchGuestInput[]
  location: {
    radius: number // km, 1–50 — required whenever `location` is sent
    geographicCoordinates: { latitude: number; longitude: number }
  }
  accommodationId?: undefined
  perPage?: number
  sort?: DuffelSearchSort
  freeCancellationOnly?: boolean
  instantPayment?: boolean
}

export interface DuffelSearchByAccommodationInput {
  checkInDate: string
  checkOutDate: string
  rooms: number
  guests: DuffelSearchGuestInput[]
  location?: undefined
  accommodationId: string // acc_...
  perPage?: number
  sort?: DuffelSearchSort
}

export type DuffelSearchInput =
  | DuffelSearchByLocationInput
  | DuffelSearchByAccommodationInput

// ── Search result item — `data[]` on POST /search and GET /results ──
// This is the SAME shape whether it came from the initial POST /search
// or a later GET /search/{searchId}/results page/re-sort — render either
// response without branching, per the docs.
export interface DuffelSearchResultAccommodationSummary {
  id: string // acc_...
  name: string
  rating: number | null
  review_score: number | null
  review_count: number | null
  location: {
    address: {
      line_one: string
      city_name: string
      country_code: string
    }
    geographic_coordinates: { latitude: number; longitude: number }
  }
  // Only 3 photos in list view — the full set arrives with rates.
  photos: { url: string }[]
}

export interface DuffelSearchResultItem {
  id: string // srr_... — the handle for fetching rates. NOT meta.search_id.
  expires_at: string
  check_in_date: string
  check_out_date: string
  rooms: number // how many rooms were REQUESTED — not a list of room objects
  guests: DuffelSearchGuestInput[]
  cheapest_rate_total_amount: string // already marked up
  cheapest_rate_currency: string
  cheapest_rate_due_at_accommodation_amount: string | null
  cheapest_rate_due_at_accommodation_currency: string | null
  accommodation: DuffelSearchResultAccommodationSummary
}

export interface DuffelSearchCriteria {
  check_in_date: string
  check_out_date: string
  rooms: number
  guests: DuffelSearchGuestInput[]
}

export interface DuffelSearchMeta {
  search_id: string // UUID — for GET /search/{searchId}/results. NOT an srr_ id.
  expires_at: string // Duffel holds a result set ~45 minutes
  criteria: DuffelSearchCriteria // echoed so the search can be rebuilt after a 410
  total: number
  page: number
  per_page: number
  last_page: number
  sort: DuffelSearchSort
}

export interface DuffelSearchResponseData {
  data: DuffelSearchResultItem[]
  meta: DuffelSearchMeta
}

// The actual wire shape of POST /search and GET /search/{id}/results —
// `meta` sits alongside `data`, unlike the quote/checkout endpoints which
// only ever have `data`. Kept as its own type rather than reusing
// DuffelApiResponse<T> for that reason.
export interface DuffelSearchApiResponse {
  success: boolean
  message: string
  data: DuffelSearchResultItem[]
  meta: DuffelSearchMeta
}

// ── POST /duffel-stays/search-results/{srr}/rates ─────────────────
// `data` here is a single object (not an array) — the same search-result
// shape, but with `accommodation` fully populated and `rooms[]` filled in.
export interface DuffelRatesResponseData {
  id: string // srr_...
  expires_at: string // rates expire SOONER than this — use each rate's own expires_at
  check_in_date: string
  check_out_date: string
  rooms: number
  guests: DuffelSearchGuestInput[]
  cheapest_rate_total_amount: string
  cheapest_rate_currency: string
  accommodation: DuffelAccommodation
}

