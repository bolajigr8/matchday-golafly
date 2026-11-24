// features/summit/api.ts
//
// The ONE place the summit screens get their data. Today it returns the mock
// values from mock-data.ts; when the backend exists, replace the bodies here
// (and make them async requests) without touching the screens.

import {
  MOCK_BOOKING_REFERENCE,
  MOCK_EARLY_BIRD_ENDS,
  MOCK_FX,
  MOCK_SUMMIT_EVENTS,
  MOCK_SUMMIT_TICKETS,
  MOCK_SUMMIT_TRIP,
} from './mock-data'
import type { SummitEvent, SummitEventKey, SummitTicketOption, SummitTripConfig } from './types'

export const SUMMIT_USES_MOCK_DATA = true

export function getSummitEvents(): SummitEvent[] {
  return [MOCK_SUMMIT_EVENTS.london, MOCK_SUMMIT_EVENTS.riyadh]
}

export function getSummitEvent(key: string | null | undefined): SummitEvent | null {
  return key && key in MOCK_SUMMIT_EVENTS ? MOCK_SUMMIT_EVENTS[key as SummitEventKey] : null
}

export function getSummitTickets(): SummitTicketOption[] {
  return MOCK_SUMMIT_TICKETS
}

export function getSummitTrip(): SummitTripConfig {
  return MOCK_SUMMIT_TRIP
}

/** When the early-bird price ends (ISO instant). */
export function getEarlyBirdEnds(): string {
  return MOCK_EARLY_BIRD_ENDS
}

export function getSummitFx(): { EUR: number; USD: number } {
  return MOCK_FX
}

/** MOCK payment: no card is charged and nothing is sent anywhere. */
export async function placeSummitOrder(): Promise<{ reference: string }> {
  await new Promise((r) => setTimeout(r, 900))
  return { reference: MOCK_BOOKING_REFERENCE }
}
