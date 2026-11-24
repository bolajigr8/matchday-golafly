const STORAGE_KEY = 'gf-matchday-active-checkout'

export interface ActiveMatchdayCheckout {
  attemptSignature: string
  orderId: number
  checkoutToken: string
  checkoutUrl: string
  startedAt: number
}

export function getActiveMatchdayCheckout(): ActiveMatchdayCheckout | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ActiveMatchdayCheckout>
    if (
      typeof parsed.attemptSignature !== 'string' ||
      typeof parsed.orderId !== 'number' ||
      typeof parsed.checkoutToken !== 'string' ||
      typeof parsed.checkoutUrl !== 'string' ||
      typeof parsed.startedAt !== 'number'
    ) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as ActiveMatchdayCheckout
  } catch {
    return null
  }
}

export function setActiveMatchdayCheckout(
  checkout: ActiveMatchdayCheckout,
): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checkout))
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

export function clearActiveMatchdayCheckout(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
