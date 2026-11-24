// features/matchday/idempotency.ts
//
// Doc §04 / §08 rule 06:
//   "Send one UUID per checkout attempt and reuse the same value if you
//    retry (network error, double-click). Retries then return the
//    original order instead of creating duplicates. Generate a fresh UUID
//    only when the customer starts a genuinely new checkout."
//
// This is different from features/flights/api.ts's idempotencyKey(),
// which mints a fresh key on every call — flights don't need retry-safe
// reuse the same way. Ticket checkout does, so the key is persisted in
// sessionStorage, scoped to the specific (listing, quantity) attempt, and
// only regenerated when that attempt's signature changes.

const STORAGE_PREFIX = 'gf-matchday-idem:'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** One key per "attempt" — an attempt is a specific listing + quantity
 *  combination. Starting checkout on a different listing/quantity is a
 *  genuinely new attempt and gets a fresh key; retrying the exact same
 *  one (network blip, double-click) reuses it. */
export function getCheckoutIdempotencyKey(attemptSignature: string): string {
  if (typeof window === 'undefined') return uuid()
  const key = `${STORAGE_PREFIX}${attemptSignature}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const fresh = uuid()
    sessionStorage.setItem(key, fresh)
    return fresh
  } catch {
    // Storage unavailable (private mode / quota) — a fresh key per call is
    // the safe fallback; worst case a retry creates a second order, which
    // is the existing behaviour without this module at all.
    return uuid()
  }
}

/** Call after an attempt reaches a terminal state (paid, failed,
 *  cancelled) so a genuinely new checkout attempt on the same listing
 *  later gets a fresh key rather than resurrecting the old order. */
/** Clears all locally cached MatchDay idempotency keys. Useful when a user
 * explicitly abandons an old checkout and wants a genuinely new transaction.
 * Never call this automatically while a known Stripe session is active. */
export function clearAllCheckoutIdempotencyKeys(): void {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    /* ignore */
  }
}

export function clearCheckoutIdempotencyKey(attemptSignature: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${attemptSignature}`)
  } catch {
    /* ignore */
  }
}

/** Builds the attempt signature used above from the values that define a
 *  distinct checkout attempt. */
export function ticketAttemptSignature(
  eventId: number,
  listingId: number,
  quantity: number,
): string {
  return `${eventId}:${listingId}:${quantity}`
}
