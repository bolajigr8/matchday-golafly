// features/summit/routes.ts
import type { SummitEventKey } from './types'

export const SUMMIT_BASE = '/world-football-summit'

export type SummitStep = 'ticket' | 'trip' | 'pay' | 'confirmed'
export const SUMMIT_STEPS: { key: SummitStep; label: string }[] = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'trip', label: 'Trip' },
  { key: 'pay', label: 'Pay' },
  { key: 'confirmed', label: 'Confirmed' },
]

export function summitLandingHref(event?: SummitEventKey): string {
  return event && event !== 'london' ? `${SUMMIT_BASE}?event=${event}` : SUMMIT_BASE
}

export function summitStepHref(event: SummitEventKey, step: SummitStep): string {
  return `${SUMMIT_BASE}/${event}/${step}`
}

/** Any summit page. */
export function isSummitPath(pathname: string): boolean {
  return pathname === SUMMIT_BASE || pathname.startsWith(`${SUMMIT_BASE}/`)
}

/** The booking steps (their own slim header and footer). */
export function isSummitFlowPath(pathname: string): boolean {
  return pathname.startsWith(`${SUMMIT_BASE}/`)
}
