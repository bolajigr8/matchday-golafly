// features/flights/api.ts

import axiosInstance from '@/lib/axios'
import { reverseGeocodeCandidates } from './geocode'
import type {
  ApiResponse,
  CancellationPayload,
  CancellationRecord,
  CancellationStatus,
  CreateOrderPayload,
  CreateOrderResult,
  FlightOffer,
  FlightOrder,
  FlightOfferRequest,
  FlightSearchPayload,
  OrderApiResponse,
  PlaceSuggestion,
  SeatMapEntry,
} from './types'

/* Idempotency key for unsafe, money-moving requests (order create / cancel).
 * Re-using the same key dedupes accidental double-submits server-side. */
function idempotencyKey(prefix: string) {
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}_${uuid}`
}

/**
 * Creates a flight search AND returns bookable offers inline in the same
 * response — this endpoint replaced the old async `/flights/searching` +
 * poll-by-id flow. There is no more "offer request by id" polling step.
 */
export async function createOfferRequest(
  payload: FlightSearchPayload,
): Promise<ApiResponse<FlightOfferRequest>> {
  const { data } = await axiosInstance.post<ApiResponse<FlightOfferRequest>>(
    '/api/v1/flights/offer-requests',
    payload,
  )
  return data
}

export async function getOfferById(
  offerId: string,
): Promise<ApiResponse<FlightOffer>> {
  const { data } = await axiosInstance.get<ApiResponse<FlightOffer>>(
    `/api/v1/flights/offers/${offerId}`,
  )
  return data
}

/** One seat map per flight segment (leg). Only call when the user opts into seat selection. */
export async function getSeatMaps(
  offerId: string,
): Promise<ApiResponse<SeatMapEntry[]>> {
  const { data } = await axiosInstance.get<ApiResponse<SeatMapEntry[]>>(
    '/api/v1/flights/seat-maps',
    { params: { offer_id: offerId } },
  )
  return data
}

/**
 * BUG FIX (geolocation "Field 'rad' can't be blank"): whenever lat/lng are
 * supplied, the backend requires a proximity radius (`rad`, in km) on this
 * endpoint and 422s without it — `{"success":false,"message":"Field 'rad'
 * can't be blank"}`. Plain text-only searches (no lat/lng) never hit this
 * because `rad` simply isn't relevant there. Every caller that passes
 * lat/lng must also pass `rad`; defaulted here so a caller can't
 * accidentally omit it again the way getNearbyPlaces() below used to.
 *
 * 300km (not a smaller value like 100) deliberately errs generous: this is
 * only used to find a *plausible* nearby airport/city name, which is
 * separately distance-checked against MAX_NEARBY_AIRPORT_KM before being
 * accepted (see airport-input.tsx) — too small a radius here just means
 * more genuine "couldn't find anything nearby" failures in regions where
 * airports/named places are sparse, not a worse match.
 */
const DEFAULT_NEARBY_RADIUS_KM = 300

export async function getPlaceSuggestions(
  query: string,
  lat?: number,
  lng?: number,
  rad?: number,
): Promise<ApiResponse<PlaceSuggestion[]>> {
  const { data } = await axiosInstance.get<ApiResponse<PlaceSuggestion[]>>(
    '/api/v1/flights/places/suggestions',
    {
      params: {
        query,
        lat,
        lng,
        // Only send rad when lat/lng are actually present — omitting it
        // entirely for plain text search avoids sending a meaningless
        // radius on a query the backend doesn't scope by proximity.
        rad: lat !== undefined && lng !== undefined ? (rad ?? DEFAULT_NEARBY_RADIUS_KM) : undefined,
      },
    },
  )
  return data
}

/**
 * Fallback path for "use my location" when the airports provider
 * (features/flights/nearest-airport.ts, via /api/airports) has no data
 * for the resolved country, or is down. Tries each reverse-geocode
 * candidate name against our own places API in order, since the
 * candidate names are ordered most-specific first (see geocode.ts for
 * why more than one candidate is needed).
 *
 * Ported from the travels project.
 */
export async function getNearbyPlaces(
  lat: number,
  lng: number,
): Promise<ApiResponse<PlaceSuggestion[]>> {
  const candidates = await reverseGeocodeCandidates(lat, lng)
  if (candidates.length === 0) {
    throw new Error('Could not determine a location name for your position.')
  }

  let lastResult: ApiResponse<PlaceSuggestion[]> | null = null
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      // FIX: this used to omit `rad`, which the backend requires whenever
      // lat/lng are present — every geolocation-triggered lookup was
      // 422ing with "Field 'rad' can't be blank" and silently falling
      // through to the generic "Could not get your location" toast, even
      // though typing the same place manually worked (no lat/lng sent).
      const result = await getPlaceSuggestions(
        candidate,
        lat,
        lng,
        DEFAULT_NEARBY_RADIUS_KM,
      )
      if (result.data && result.data.length > 0) return result
      lastResult = result
    } catch (err) {
      // Don't let one bad candidate sink the rest — keep trying the
      // remaining names (see geocode.ts's file header for the bug this
      // avoids: an earlier version aborted the whole lookup on the
      // first candidate's failure).
      lastError = err
    }
  }

  if (lastResult) return lastResult
  throw lastError instanceof Error
    ? lastError
    : new Error('Could not find any places near your position.')
}

export async function getCabinClasses(): Promise<ApiResponse<string[]>> {
  const { data } = await axiosInstance.get<ApiResponse<string[]>>(
    '/api/v1/flights/classes',
  )
  return data
}

/* ── Orders ─────────────────────────────────────────────────── */

/**
 * Create a flight order. Returns a Stripe checkout_url to redirect to.
 * IMPORTANT: never send a payments/price block — the backend recomputes
 * the charge from the offer + services and ignores anything about price.
 * Idempotency-Key is recommended so a double tap on "Pay" reuses the same
 * checkout session instead of creating a duplicate.
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<OrderApiResponse<CreateOrderResult>> {
  const { data } = await axiosInstance.post<
    OrderApiResponse<CreateOrderResult>
  >('/api/v1/flights/orders', payload, {
    headers: { 'Idempotency-Key': idempotencyKey('flight') },
  })
  return data
}

/** Fetch a confirmed booking by its order id (ord_…). */
export async function getOrder(
  orderId: string,
): Promise<OrderApiResponse<FlightOrder>> {
  const { data } = await axiosInstance.get<OrderApiResponse<FlightOrder>>(
    `/api/v1/flights/orders/${orderId}`,
  )
  return data
}

/**
 * Request cancellation of an order. Idempotency-Key is required per the
 * docs so a double tap on Cancel doesn't create two requests.
 */
export async function cancelOrder(
  payload: CancellationPayload,
): Promise<OrderApiResponse<CancellationRecord>> {
  const { data } = await axiosInstance.post<
    OrderApiResponse<CancellationRecord>
  >('/api/v1/flights/order-cancellations', payload, {
    headers: { 'Idempotency-Key': idempotencyKey('cancel') },
  })
  return data
}

/** Fetch the cancellation status for an order id (ord_…). */
export async function getOrderCancellation(
  orderId: string,
): Promise<OrderApiResponse<CancellationStatus>> {
  const { data } = await axiosInstance.get<
    OrderApiResponse<CancellationStatus>
  >(`/api/v1/flights/order-cancellations/${orderId}`)
  return data
}
