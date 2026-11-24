// features/duffel-stays/hooks.ts
//
// Copied from the travels app; the X-Currency key comes from matchday's
// currency store.

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import {
  createDuffelQuote,
  getDuffelQuote,
  checkoutDuffelQuote,
  getDuffelLocationSuggestions,
  searchDuffelStays,
  getDuffelSearchResultsPage,
  getDuffelRatesForSearchResult,
} from './api'
import { isTerminalDuffelBookingStatus } from './status'
import { useCurrencyStore } from '@/store/currency'
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

// Per-field validation errors, as seen on checkout's phone_number 422:
// { "message": "...", "errors": { "phone_number": ["..."] } }
interface ApiErr {
  message?: string
  errors?: Record<string, string[]>
}

// ── Create quote ────────────────────────────────────────────────
// Call when the customer commits to a room, before showing the guest
// details form. Takes no payment, reserves nothing — a price lock only.
export function useCreateDuffelQuote() {
  return useMutation<
    DuffelApiResponse<DuffelQuote>,
    AxiosError<ApiErr>,
    string
  >({
    mutationKey: ['duffel-stay-quote-create'],
    mutationFn: createDuffelQuote,
  })
}

// ── Re-read quote — support/testing only, see api.ts ────────────
export function useDuffelQuote(quoteId: string | null, enabled = true) {
  const currency = useCurrencyStore((s) => s.currency)
  return useQuery<DuffelApiResponse<DuffelQuote>, AxiosError<ApiErr>>({
    queryKey: ['duffel-stay-quote', quoteId, currency],
    queryFn: () => getDuffelQuote(quoteId as string),
    enabled: !!quoteId && enabled,
  })
}

// ── Checkout ──────────────────────────────────────────────────────
export function useCheckoutDuffelQuote() {
  return useMutation<
    DuffelApiResponse<DuffelCheckoutResult>,
    AxiosError<ApiErr>,
    DuffelCheckoutPayload
  >({
    mutationKey: ['duffel-stay-checkout'],
    mutationFn: checkoutDuffelQuote,
  })
}

// ── Booking status polling (after Stripe redirect) ────────────────
// The docs say: read session_id off the success-URL query string and poll
// GET /ledgers/transactions/{sessionId} until terminal. That endpoint isn't
// implemented here yet since its response shape wasn't specced — wire it
// up in api.ts once confirmed, then point this hook at it. Left as a typed
// stub so the confirmation page has a single hook to swap in.
export function useDuffelBookingStatus(_sessionId: string | null) {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error(
      'Duffel booking-status polling endpoint not yet wired — see features/duffel-stays/hooks.ts',
    ),
  } as const
}

export { isTerminalDuffelBookingStatus }

// ══════════════════════════════════════════════════════════════════
// Search flow
// ══════════════════════════════════════════════════════════════════

// ── Location autocomplete (debounce ~300ms in the calling component) ──
export function useDuffelLocationSuggestions(
  query: string,
  opts?: { country?: string; limit?: number },
) {
  return useQuery<DuffelApiResponse<DuffelLocationSuggestion[]>, AxiosError<ApiErr>>({
    queryKey: ['duffel-stay-location-suggestions', query, opts?.country, opts?.limit],
    queryFn: () => getDuffelLocationSuggestions(query, opts),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  })
}

// ── Run a new search (POST /search) ────────────────────────────────
// Call this only when the search itself changes (dates/guests/place/
// radius). Page changes and re-sorts go through
// useDuffelSearchResultsPage instead — see the docs on why re-POSTing
// returns a different result set entirely.
export function useSearchDuffelStays() {
  return useMutation<
    DuffelSearchApiResponse,
    AxiosError<ApiErr>,
    DuffelSearchInput
  >({
    mutationKey: ['duffel-stay-search'],
    mutationFn: searchDuffelStays,
  })
}

// ── Page / re-sort an existing search — instant, no Duffel call ─────
// Uses placeholderData: keepPreviousData so changing page or sort keeps
// the current results on screen (driving `isFetching`, not `isLoading`)
// instead of dropping back to a full loading skeleton on every click —
// this endpoint is instant and free per the docs, so there's no reason
// to make the UI look like it's doing expensive work.
export function useDuffelSearchResultsPage(
  searchId: string | null,
  opts: { page?: number; perPage?: number; sort?: DuffelSearchSort } = {},
  enabled = true,
) {
  /* The cached search's prices are applied when each page is READ, so a page
     fetched under another X-Currency comes back in that currency. The
     currency therefore has to be part of the key. */
  const currency = useCurrencyStore((s) => s.currency)
  return useQuery<DuffelSearchApiResponse, AxiosError<ApiErr>>({
    queryKey: [
      'duffel-stay-search-results',
      searchId,
      currency,
      opts.page,
      opts.perPage,
      opts.sort,
    ],
    queryFn: () =>
      getDuffelSearchResultsPage(searchId as string, opts),
    enabled: !!searchId && enabled,
    placeholderData: keepPreviousData,
  })
}

// ── Rooms & rates for one accommodation ──────────────────────────────
export function useDuffelRatesForSearchResult() {
  return useMutation<
    DuffelApiResponse<DuffelRatesResponseData>,
    AxiosError<ApiErr>,
    string
  >({
    mutationKey: ['duffel-stay-rates'],
    mutationFn: getDuffelRatesForSearchResult,
  })
}
