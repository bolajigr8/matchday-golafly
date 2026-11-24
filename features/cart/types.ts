import type { FlightOffer } from '@/features/flights/types'
import type { EsimPackage, EsimType } from '@/features/esim/types'
import type { PrebookRate } from '@/features/stays/types'
import type { PassengerInput } from '@/features/checkout/types'
import type { PriceSummary } from '@/features/price-breakdown/types'

export type ServerCartItemType = 'flight' | 'esim' | 'stays' | 'matchday'

export interface CartFlightItem {
  id: string
  type: 'flight'
  offerId: string
  offer: FlightOffer
  currency?: string
  addedAt?: string
}

export interface CartEsimItem {
  id: string
  type: 'esim'
  packageId: string
  package: EsimPackage
  esimType: EsimType
  destination: string
  quantity: number
  addedAt?: string
}

export interface CartStaysItem {
  id: string
  type: 'stays'
  provider?: 'etg' | 'duffel'
  hotelId: string
  hotelName: string
  hotelImage: string
  hotelAddress: string
  roomName: string
  checkin: string
  checkout: string
  adults: number
  children?: number
  rooms: number
  childrenAges: number[]
  occupancy?: { adults: number; children?: number[] }[]
  guestsExpected?: number
  genderRequired?: boolean
  currency: string
  language?: string
  residency?: string | null
  bookHash?: string | null
  quoteId?: string | null
  matchHash?: string | null
  expiresAt?: string | null
  prebookedRate: PrebookRate
  addedAt?: string
}

export interface CartMatchDayItem {
  id: string
  type: 'matchday'
  eventId: string
  listingId: string
  quantity: number
  eventName?: string | null
  eventDate?: string | null
  homeTeam?: string | null
  awayTeam?: string | null
  categoryName?: string | null
  block?: string | null
  row?: string | null
  image?: string | null
  matchId?: string | null
  currency: string
  unitAmount: number
  addedAt?: string
}

export type ServerCartItem =
  | CartFlightItem
  | CartEsimItem
  | CartStaysItem
  | CartMatchDayItem

export interface CartApiFlightService {
  id: string
  quantity: number
  passenger_id?: string
  segment_id?: string
}

export interface CartApiFlightPayload {
  offer_id: string
  services?: CartApiFlightService[]
}

export interface CartApiEsimPayload {
  package_id: string
  type: EsimType
  country?: string
  quantity?: number
}

export interface CartApiStayPayload {
  provider: 'etg' | 'duffel'
  book_hash?: string
  quote_id?: string
  match_hash?: string
  hotel_id: string
  hotel_name: string
  hotel_image?: string
  hotel_address?: string
  room_name?: string
  checkin: string
  checkout: string
  adults: number
  children?: number
  rooms?: number
  guests_expected?: number
  occupancy?: { adults: number; children?: number[] }[]
  language?: string
  residency?: string
  currency: string
  amount_paid_minor: number
  expires_at?: string
  prebooked_rate?: PrebookRate
  gender_required?: boolean
}

export interface CartApiMatchDayPayload {
  event_id: string
  listing_id: string
  quantity: number
  event_name?: string
  event_date?: string
  home_team?: string
  away_team?: string
  category_name?: string
  block?: string
  row?: string
  image?: string
  match_id?: string
}

export interface CartSummary {
  items: ServerCartItem[]
  item_count: number
  /** Unchanged. Equals price_summary.total before any discount. */
  subtotal: number
  currency: string
  guest_token?: string
  /**
   * Price-breakdown contract: provider lines → ONE Golafly fee → discount →
   * total. null for an empty cart or when the backend could not build it;
   * then show `subtotal` exactly as before. Read it through
   * normalizePriceSummary() — never trust the raw shape.
   */
  price_summary?: PriceSummary | null
  /** Only on GET /cart?coupon_code=… when the code is invalid, expired or
   *  not applicable. Show it to the customer; the cart itself is fine. */
  coupon_error?: string | null
}

export interface CartCheckoutFlightPayload {
  cart_item_id: string
  passengers: PassengerInput[]
}

export interface CartCheckoutStayPayload {
  cart_item_id: string
  language?: string
  rooms?: {
    guests: {
      first_name: string
      last_name: string
      gender?: 'male' | 'female' | 'unknown'
      is_child?: boolean
      age?: number
    }[]
  }[]
  guests?: {
    given_name: string
    family_name: string
    born_on?: string
  }[]
  accommodation_special_requests?: string
}

export interface CartCheckoutMatchDayPayload {
  cart_item_id: string
  customer: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    country?: string
    state?: string
    city?: string
    address?: string
    postal_code?: string
  }
  note?: string
}

/** Was missing entirely until now — the eSIM item was being added to the
 *  server cart and shown/confirmed in the checkout UI, but never included
 *  in the request sent to POST /cart/checkout, so it silently never got
 *  purchased. `email` carries the shared contact info the same way
 *  flights/matchday already do (see payUnifiedCart in
 *  app/builder/pay/client.tsx). Field names here are a best guess at
 *  what a backend expects for cart-based esim checkout — confirm against
 *  the (currently undocumented) /api/v1/cart/* contract once you have it. */
export interface CartCheckoutEsimPayload {
  cart_item_id: string
  email?: string
  device_confirmed: boolean
  activation_confirmed: boolean
  auto_activate?: boolean
}

export interface CartCheckoutPayload {
  email: string
  phone: string
  coupon_code?: string
  flights?: CartCheckoutFlightPayload[]
  stays?: CartCheckoutStayPayload[]
  matchday?: CartCheckoutMatchDayPayload[]
  esim?: CartCheckoutEsimPayload[]
}

export interface CartCheckoutResult {
  checkout_url: string
  session_id: string
  ledger_ids?: number[]
  matchday_order_ids?: number[]
  checkout_type?: 'cart'
  /** Built after the coupon is applied; its total is exactly what the
   *  Stripe page charges. null when the backend could not guarantee that —
   *  then show the cart's own figures. */
  price_summary?: PriceSummary | null
}

export interface CartApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, unknown>
}

// ── Currency-switch 422 (Multi-Currency Checkout Contract) ──────────────
// PATCH /api/v1/cart/currency is all-or-nothing: if any item can't be
// re-priced into the requested currency, the server returns 422 and the
// cart is left untouched. `errors` is keyed by cart item id (Laravel
// validation shape — same style as the customer.* field errors already
// handled in checkout-tickets/client.tsx), each value a list of reasons.
export interface CartCurrencyErrorPayload {
  message?: string
  errors?: Record<string, string[] | string>
}

/** One cart item that blocked a currency switch, resolved against the
 *  cart we already have client-side so the UI can show a name, not just
 *  a raw id. */
export interface BlockedCurrencyItem {
  itemId: string
  reason: string
  item?: ServerCartItem
}
