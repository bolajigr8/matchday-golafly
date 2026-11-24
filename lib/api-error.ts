// lib/api-error.ts
//
// Generic "give me the backend's own message, if there is one" extractor
// for any axios error — not cart-specific like features/cart/api.ts's
// cartApiError, which additionally has cart-specific 409/422 formatting.
// Use this one for search/list/detail calls (flights, stays, eSIM,
// MatchDay listings) that don't have their own bespoke error shape.
//
// Added for the Multi-Currency Checkout Contract's new 503: "No usable
// exchange rate. message names the product... show 'prices are
// unavailable right now, try again shortly', and offer EUR, which never
// needs a rate." Reading the real message means the UI can show that
// specific text instead of a generic "search failed", and
// isCurrencyUnavailableError() lets a screen offer the EUR fallback only
// when it's actually a pricing/rate problem, not e.g. a bad date range.

export function apiErrorMessage(err: unknown): string | null {
  if (typeof err !== 'object' || err === null || !('response' in err)) {
    return null
  }
  const response = (err as { response?: { data?: { message?: unknown } } })
    .response
  const message = response?.data?.message
  return typeof message === 'string' && message !== '' ? message : null
}

/** True for the doc's 503 "no usable exchange rate" case specifically —
 *  every variant names the product ("Flight pricing is unavailable.",
 *  "Stays pricing is unavailable.", etc.) and always ends the same way,
 *  so match on that shared suffix rather than the product name. */
export function isCurrencyUnavailableError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('response' in err)) {
    return false
  }
  const status = (err as { response?: { status?: number } }).response
    ?.status
  const message = apiErrorMessage(err)
  return status === 503 && !!message && /pricing is unavailable/i.test(message)
}
