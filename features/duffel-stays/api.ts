// features/duffel-stays/api.ts
//
// Copied from the travels app (same backend, same contract).
//
// Talks to the Duffel supplier endpoints only. Never imports from
// features/stays (ETG) and is never imported by it.

import axiosInstance from '@/lib/axios'
import type {
  DuffelApiResponse,
  DuffelQuote,
  DuffelCheckoutPayload,
  DuffelCheckoutResult,
  DuffelLocationSuggestion,
  DuffelSearchInput,
  DuffelSearchApiResponse,
  DuffelSearchSort,
  DuffelRatesResponseData,
} from './types'

function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function idempotencyKey() {
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : fallbackUUID()
  return `duffel-stays-${uuid}`
}

// ── Create a quote — price-locks one rate ahead of checkout ───────
// POST /api/v1/duffel-stays/quotes
// Body: { rate_id }. That is the entire payload — dates/guests/price are
// already bound to the rate. A quote does NOT confirm availability; word
// any UI around it as "price held", never "reserved".
export async function createDuffelQuote(
  rateId: string,
): Promise<DuffelApiResponse<DuffelQuote>> {
  const { data } = await axiosInstance.post<DuffelApiResponse<DuffelQuote>>(
    '/api/v1/duffel-stays/quotes',
    { rate_id: rateId },
    { headers: { 'Idempotency-Key': idempotencyKey() } },
  )
  return data
}

// ── Re-read an existing quote (support/testing path) ───────────────
// GET /api/v1/duffel-stays/quotes/{quoteId}
// Not part of the normal booking flow — the countdown the UI needs comes
// from expires_at already held from createDuffelQuote, no request needed.
// Kept here only for the one case that pays for itself: catching a stale
// client clock immediately before the guest form is submitted.
export async function getDuffelQuote(
  quoteId: string,
): Promise<DuffelApiResponse<DuffelQuote>> {
  const { data } = await axiosInstance.get<DuffelApiResponse<DuffelQuote>>(
    `/api/v1/duffel-stays/quotes/${quoteId}`,
  )
  return data
}

// ── Checkout — takes payment for a quote ────────────────────────────
// POST /api/v1/duffel-stays/checkout
// No booking is made at Duffel here — this only opens a Stripe Checkout
// session. There is no price field: total is re-read from Duffel and
// recomputed server-side; anything sent here is ignored. Resubmitting the
// same quote_id is safe and reuses the existing session.
export async function checkoutDuffelQuote(
  payload: DuffelCheckoutPayload,
): Promise<DuffelApiResponse<DuffelCheckoutResult>> {
  const { data } = await axiosInstance.post<
    DuffelApiResponse<DuffelCheckoutResult>
  >('/api/v1/duffel-stays/checkout', payload, {
    headers: { 'Idempotency-Key': idempotencyKey() },
  })
  return data
}

// ══════════════════════════════════════════════════════════════════
// Search flow
// ══════════════════════════════════════════════════════════════════

// ── Location autocomplete — turns typed text into search coordinates ──
// GET /api/v1/duffel-stays/locations/suggestions
// Duffel Stays cannot search by place name, only coordinates or a specific
// accommodation_id — this is the only step that makes a typed city
// searchable at all. Debounce ~300ms client-side; anything under 2 chars
// only ever 422s, so don't fire below that.
export async function getDuffelLocationSuggestions(
  query: string,
  opts?: { country?: string; limit?: number },
): Promise<DuffelApiResponse<DuffelLocationSuggestion[]>> {
  const { data } = await axiosInstance.get<
    DuffelApiResponse<DuffelLocationSuggestion[]>
  >('/api/v1/duffel-stays/locations/suggestions', {
    params: {
      query,
      ...(opts?.country ? { country: opts.country } : {}),
      ...(opts?.limit ? { limit: opts.limit } : {}),
    },
  })
  return data
}

function buildSearchBody(input: DuffelSearchInput) {
  const base = {
    check_in_date: input.checkInDate,
    check_out_date: input.checkOutDate,
    rooms: input.rooms,
    guests: input.guests,
    ...(input.perPage ? { per_page: input.perPage } : {}),
    ...(input.sort ? { sort: input.sort } : {}),
  }
  if (input.location) {
    return {
      ...base,
      location: {
        radius: input.location.radius,
        geographic_coordinates: input.location.geographicCoordinates,
      },
      ...('freeCancellationOnly' in input && input.freeCancellationOnly
        ? { free_cancellation_only: true }
        : {}),
      ...('instantPayment' in input && input.instantPayment
        ? { instant_payment: true }
        : {}),
    }
  }
  return { ...base, accommodation_id: input.accommodationId }
}

// ── Hotel search — the slow, expensive call in the flow ─────────────
// POST /api/v1/duffel-stays/search
// Returns page 1 plus meta.search_id, which every later page/re-sort
// uses via GET /search/{searchId}/results instead of re-calling this.
// `location` and `accommodationId` are mutually exclusive — sending both
// or neither is a 422.
export async function searchDuffelStays(
  input: DuffelSearchInput,
): Promise<DuffelSearchApiResponse> {
  const { data } = await axiosInstance.post<DuffelSearchApiResponse>(
    '/api/v1/duffel-stays/search',
    buildSearchBody(input),
  )
  return data
}

// ── Page or re-sort an existing search — instant, no Duffel call ────
// GET /api/v1/duffel-stays/search/{searchId}/results
// searchId is meta.search_id (a UUID) — NOT an srr_ id. Use this for
// every page change and every sort change; never re-POST /search for
// either, since re-searching returns a different result set entirely.
export async function getDuffelSearchResultsPage(
  searchId: string,
  opts?: { page?: number; perPage?: number; sort?: DuffelSearchSort },
): Promise<DuffelSearchApiResponse> {
  const { data } = await axiosInstance.get<DuffelSearchApiResponse>(
    `/api/v1/duffel-stays/search/${searchId}/results`,
    {
      params: {
        ...(opts?.page ? { page: opts.page } : {}),
        ...(opts?.perPage ? { per_page: opts.perPage } : {}),
        ...(opts?.sort ? { sort: opts.sort } : {}),
      },
    },
  )
  return data
}

// ── Rooms & rates for one accommodation ──────────────────────────────
// POST /api/v1/duffel-stays/search-results/{srr}/rates
// searchResultId is data[].id from a search response (srr_...) — NOT
// meta.search_id. No request body. Only rates payable from the Duffel
// Balance are returned; a rate being listed does not guarantee
// availability — that's only proven at booking, after payment.
export async function getDuffelRatesForSearchResult(
  searchResultId: string,
): Promise<DuffelApiResponse<DuffelRatesResponseData>> {
  const { data } = await axiosInstance.post<
    DuffelApiResponse<DuffelRatesResponseData>
  >(`/api/v1/duffel-stays/search-results/${searchResultId}/rates`)
  return data
}
