// features/flights/types.ts

import type { PriceBreakdown } from '@/features/price-breakdown/types'

/* ── Shared airport / place ─────────────────────────────────── */

export interface Airport {
  id: string
  iata_code: string
  name: string
  city_name?: string
  iata_country_code?: string
  latitude?: number
  longitude?: number
  time_zone?: string
}

export interface PlaceSuggestion {
  id: string
  name: string
  iata_code?: string
  iata_country_code?: string
  /** The city this airport is in, when the API has resolved one — e.g.
   *  "Washington" for DCA. Absent on a city-type suggestion itself. */
  city_name?: string | null
  latitude?: number
  longitude?: number
  time_zone?: string
  type: 'airport' | 'city'
  airports?: PlaceSuggestion[]
}

/* ── Carrier / aircraft ─────────────────────────────────────── */
export interface Carrier {
  id: string
  name: string
  iata_code: string
  logo_symbol_url?: string
  logo_lockup_url?: string
}

export interface Aircraft {
  id: string
  name: string
  iata_code: string
}

/* ── Per-segment cabin amenities (seat/wifi/power) ──────────── */
export interface CabinAmenities {
  seat?: {
    pitch?: string | null
    legroom?: string | null
    type?: string | null
  } | null
  wifi?: {
    available?: boolean
    cost?: 'free' | 'paid' | 'n/a' | string | null
  } | null
  power?: {
    available?: boolean
  } | null
}

/** Fare/cabin/baggage detail for one passenger on one segment. This lives
 * on the segment (segment.passengers[]), not on the slice or the
 * top-level offer.passengers[]. */
export interface SegmentPassengerFare {
  passenger_id: string
  cabin_class?: string | null
  cabin_class_marketing_name?: string | null
  fare_basis_code?: string | null
  baggages?: { quantity: number; type: 'carry_on' | 'checked' }[]
  cabin?: {
    name?: string
    marketing_name?: string
    amenities?: CabinAmenities | null
  } | null
}

/* ── Segment (one flight leg: airport-to-airport, no stops) ── */
export interface FlightSegment {
  id: string
  departing_at: string
  arriving_at: string
  origin: Airport
  destination: Airport
  operating_carrier: Carrier
  marketing_carrier: Carrier
  operating_carrier_flight_number?: string
  marketing_carrier_flight_number: string
  aircraft?: Aircraft | null
  duration: string
  distance?: string
  stops?: unknown[]
  origin_terminal?: string | null
  destination_terminal?: string | null
  /** Per-passenger cabin/fare/baggage detail for THIS segment specifically
   *  (a connection can be a different cabin/fare/aircraft than the rest of
   *  the slice). Falls back to offer.passengers[]/slice-level data in the
   *  UI if absent, since older cached offers may not include it. */
  passengers?: SegmentPassengerFare[]
}

/* ── Slice ────────────────────────────────────────────────── */
export interface FlightSlice {
  id: string
  origin: Airport
  destination: Airport
  departure_date: string
  duration: string
  segments: FlightSegment[]
  fare_brand_name?: string
  conditions?: {
    change_before_departure?: {
      allowed: boolean
      penalty_amount?: string | null
      penalty_currency?: string | null
    } | null
    refund_before_departure?: {
      allowed: boolean
      penalty_amount?: string | null
      penalty_currency?: string | null
    } | null
  }
}

/* ── Passenger on an offer ──────────────────────────────────── */
export interface OfferPassenger {
  id: string
  age?: number | null
  type?: 'adult' | 'child' | 'infant_without_seat' | null
  given_name?: string | null
  family_name?: string | null
  loyalty_programme_accounts?: unknown[]
  baggages?: { quantity: number; type: 'carry_on' | 'checked' }[]
}

/* ── Purchasable extras on an offer (bags) ──────────────────── */
export interface AvailableService {
  id: string
  type: string
  total_amount: string
  total_currency: string
  maximum_quantity: number
  segment_ids: string[]
  passenger_ids: string[]
  metadata: {
    type?: string | null
    maximum_weight_kg?: number | null
    maximum_length_cm?: number | null
    maximum_height_cm?: number | null
    maximum_depth_cm?: number | null
  }
}

/* ── Full flight offer ──────────────────────────────────────── */
export interface FlightOffer {
  id: string
  /** Unchanged: the charged price. Not shown on the offer any more —
   *  show the first line of `price_breakdown` instead. */
  total_amount: string
  total_currency: string
  /** Price-breakdown contract. Offers carry a flight_ticket_price line and
   *  the Golafly fee; there is no flight_extras line on an offer (extras
   *  are added in the cart). null/absent → show total_amount as before. */
  price_breakdown?: PriceBreakdown | null
  base_amount?: string
  base_currency?: string
  tax_amount?: string
  tax_currency?: string
  slices: FlightSlice[]
  passengers: OfferPassenger[]
  available_services?: AvailableService[] | null
  payment_requirements?: {
    requires_instant_payment: boolean
    price_guarantee_expires_at?: string | null
    payment_required_by?: string | null
  }
  conditions?: {
    /** Same shape as FlightSlice['conditions'] — refund_before_departure
     *  only ever appears here at the offer level (never on the slice),
     *  while change_before_departure appears at both levels and can
     *  differ per slice for round trips. */
    change_before_departure?: {
      allowed: boolean
      penalty_amount?: string | null
      penalty_currency?: string | null
    } | null
    refund_before_departure?: {
      allowed: boolean
      penalty_amount?: string | null
      penalty_currency?: string | null
    } | null
  }
  total_emissions_kg?: string | null
  passenger_identity_documents_required?: boolean
  supported_passenger_identity_document_types?: string[]
  created_at: string
  updated_at?: string
  expires_at?: string | null
  live_mode?: boolean
}

/* ── Offer request (search response — offers arrive inline) ── */
export interface FlightOfferRequest {
  id: string
  client_key?: string
  cabin_class: string
  slices: {
    origin: { iata_code: string; name?: string }
    destination: { iata_code: string; name?: string }
    departure_date: string
  }[]
  passengers: { id: string; age?: number | null; type?: string | null }[]
  offers: FlightOffer[]
  created_at: string
  expires_at?: string
}

/* ── Search / offer-request payload ─────────────────────────── */
export type PassengerType = 'adult' | 'child' | 'infant_without_seat'

export interface SearchPassengerInput {
  type?: PassengerType
  age?: number
}

export interface FlightSearchPayload {
  data: {
    slices: {
      origin: string
      destination: string
      departure_date: string
      departure_time?: { from: string; to: string }
      arrival_time?: { from: string; to: string }
    }[]
    passengers: SearchPassengerInput[]
    cabin_class?: string
    max_connections?: number
  }
}

/* ── API envelope ───────────────────────────────────────────── */
export interface ApiResponse<T> {
  data: T
  meta?: { limit?: number; before?: string | null; after?: string | null }
}

export interface OrderApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/* ── Seat maps ─────────────────────────────────────────────────
 * IMPORTANT: rows carry an `elements` array directly (no `sections`
 * wrapper in the actual API response). Each seat element carries a
 * boolean `available` flag and a `prices` array — one entry per
 * passenger it can be priced for (not `available_services`). */
export interface SeatMapPrice {
  passenger_id: string
  service_id: string // ase_… — send as orders.services[].id
  amount: string
  currency: string
}

export interface SeatMapElement {
  type:
    | 'seat'
    | 'bassinet'
    | 'empty'
    | 'lavatory'
    | 'galley'
    | 'exit_row'
    | string
  designator?: string | null
  name?: string | null
  available?: boolean
  disclosures?: string[] | null
  prices?: SeatMapPrice[]
}

export interface SeatMapRow {
  elements: SeatMapElement[]
}

export interface SeatMapCabin {
  cabin_class: string
  deck: number
  aisles: number
  rows: SeatMapRow[]
}

export interface SeatMapEntry {
  segment_id: string
  slice_id: string
  cabins: SeatMapCabin[]
}

/* ── Create-order request payload ───────────────────────────── */
export type PassengerTitle = 'mr' | 'mrs' | 'ms' | 'miss' | 'dr'
export type PassengerGender = 'm' | 'f'

export interface IdentityDocumentInput {
  type: string
  unique_identifier: string
  issuing_country_code: string
  expires_on?: string
}

export interface OrderPassengerInput {
  id: string
  given_name: string
  family_name: string
  born_on: string
  gender: PassengerGender
  email: string
  phone_number: string
  title: PassengerTitle
  infant_passenger_id?: string
  identity_documents?: IdentityDocumentInput[]
}

export interface OrderServiceInput {
  id: string
  quantity: number
  passenger_id?: string
  segment_id?: string
}

export interface CreateOrderPayload {
  data: {
    type: 'instant'
    selected_offers: string[]
    passengers: OrderPassengerInput[]
    services?: OrderServiceInput[]
  }
}

export interface CreateOrderResult {
  checkout_url: string
  session_id: string
  ledger_id: number
}

export interface OrderTicket {
  passenger_name: string
  ticket_number: string
}

export interface OrderBookingPassenger {
  title: string
  given_name: string
  family_name: string
  type: string | null
}

export interface OrderFlight {
  flight_number: string
  airline: string
  aircraft: string
  departure_airport: string
  departure_airport_name: string
  arrival_airport: string
  arrival_airport_name: string
  departure_terminal: string | null
  arrival_terminal: string | null
  departure_time: string
  arrival_time: string
  cabin_class: string
  seat: string | null
  baggage: { type: 'checked' | 'carry_on'; quantity: number }[]
}

export interface OrderAddOn {
  type: string
  seat?: string | null
  passenger_id: string
  quantity: number
  amount: string
  currency: string
}

export interface OrderPricing {
  currency: string
  flight_fare: string
  extras_total: string
  total_paid: string
}

export interface FlightOrder {
  booking_reference: string
  booking_status: string
  order_id: string
  airline: string
  ticketing: { ticketed: boolean; tickets: OrderTicket[] }
  refundability: {
    refundable: boolean
    penalty_amount: string | null
    penalty_currency: string | null
  }
  passengers: OrderBookingPassenger[]
  flights: OrderFlight[]
  add_ons?: OrderAddOn[]
  pricing?: OrderPricing
  payment: { currency: string; amount_paid: string; payment_status: string }
}

/* ── Cancellation ─────────────────────────────────────────────── */
export type CancellationPayload =
  | { data: { order_id: string; reason?: string } }
  | { data: { reference: string; email: string; reason?: string } }
  | { data: { pnr: string; email: string; reason?: string } }

export interface CancellationRecord {
  id: number
  booking_reference: string
  order_id: string
  status: string
  requested_at: string
  cancelled_at: string | null
  reason: string | null
  airline_penalty_amount: string | null
  service_fee_forfeited: string | null
  refund_amount: string | null
  refund_currency: string | null
}

export interface CancellationStatus {
  status: string
  requested_at: string
  cancelled_at: string | null
  reason: string
  airline_penalty_amount: string | null
  service_fee_forfeited: string | null
  refund_amount: string | null
  refund_currency: string | null
}
