// features/duffel-stays/status.ts
//
// Copied from the travels app (same backend, same contract).
//
// Statuses that mean "stop polling — we have a final answer" for a Duffel
// booking. The Duffel checkout docs describe the underlying flow (Stripe
// payment confirmed → background job books with Duffel) without naming an
// exact status enum, so this mirrors features/stays/status.ts naming for UI
// consistency. Confirm the real values against GET
// /ledgers/transactions/{sessionId} and adjust this set if they differ.
export const DUFFEL_TERMINAL_BOOKING_STATUSES = new Set([
  'confirmed',
  'cancelled',
  'payment_received_booking_failed',
  'failed',
])

export function isTerminalDuffelBookingStatus(
  status?: string | null,
): boolean {
  return !!status && DUFFEL_TERMINAL_BOOKING_STATUSES.has(status)
}

/**
 * The single most important timing rule in this flow: checkout refuses any
 * rate with under 30 minutes of life left (409). expires_at on a quote is
 * informational — the real deadline lives on the RATE that was quoted, so
 * callers must track rate.expires_at (captured at quote time) alongside the
 * quote id, not re-derive it from the quote response.
 */
export const DUFFEL_MIN_CHECKOUT_RATE_LIFE_MS = 30 * 60 * 1000

export function isRateTooCloseToExpiry(rateExpiresAt: string | null): boolean {
  if (!rateExpiresAt) return true
  const remainingMs = new Date(rateExpiresAt).getTime() - Date.now()
  return remainingMs < DUFFEL_MIN_CHECKOUT_RATE_LIFE_MS
}

// Every Duffel error response we've seen (validation 422s across
// locations/suggestions, search, and checkout) sets `message` to a
// genuinely useful, customer-ready single line — the docs say to show it
// as-is. `errors` (per-field) is kept as a fallback for the rare case
// `message` is missing entirely, not because `message` is unreliable.
interface DuffelApiErrorShape {
  message?: string
  errors?: Record<string, string[]>
}

export function extractDuffelErrorMessage(
  data: DuffelApiErrorShape | undefined,
  fallback: string,
): string {
  if (data?.message) return data.message
  const firstField = data?.errors ? Object.values(data.errors)[0] : undefined
  if (firstField?.[0]) return firstField[0]
  return fallback
}
