'use client'

// features/summit/store.ts
//
// The customer's choices through the four booking steps, kept for this
// browser tab only (sessionStorage). Card details are never put here.

import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { SummitAttendee, SummitBooking, SummitEventKey, SummitTraveller } from './types'

const emptyAttendee = (): SummitAttendee => ({ fullName: '', jobTitle: '', organisation: '', email: '' })
const emptyTraveller = (): SummitTraveller => ({ passportName: '', passportNumber: '' })

export const MAX_SUMMIT_ATTENDEES = 4

/* The trip the Figma screens show: 2 attendees, British Airways, the 4★
   hotel and a 10 GB eSIM switched on, chauffeur off. */
function initial(event: SummitEventKey = 'london'): SummitBooking {
  return {
    event,
    ticket: 'early',
    quantity: 2,
    attendees: [emptyAttendee(), emptyAttendee()],
    flightsOn: true,
    flightId: 'ba',
    cabin: 'economy',
    flyingFrom: '',
    hotelOn: true,
    hotelId: 'putney',
    esimOn: true,
    esimPlan: '10gb',
    chauffeurOn: false,
    billing: { bookingAs: 'company', company: '', taxId: '', invoiceEmail: '', address: '' },
    travellers: [emptyTraveller(), emptyTraveller()],
    payment: 'card',
    agreed: true,
    reference: null,
    paidTotal: null,
  }
}

function resize<T>(list: T[], n: number, make: () => T): T[] {
  return Array.from({ length: n }, (_, i) => list[i] ?? make())
}

interface SummitBookingState {
  booking: SummitBooking
  set: (patch: Partial<SummitBooking>) => void
  setQuantity: (n: number) => void
  setAttendee: (index: number, patch: Partial<SummitAttendee>) => void
  setTraveller: (index: number, patch: Partial<SummitTraveller>) => void
  setBilling: (patch: Partial<SummitBooking['billing']>) => void
  /** Ticket only: every trip extra off. */
  skipTrip: () => void
  reset: (event?: SummitEventKey) => void
}

export const useSummitBooking = create<SummitBookingState>()(
  persist(
    (set) => ({
      booking: initial(),
      set: (patch) => set((s) => ({ booking: { ...s.booking, ...patch } })),
      setQuantity: (n) =>
        set((s) => {
          const quantity = Math.max(1, Math.min(MAX_SUMMIT_ATTENDEES, n))
          return {
            booking: {
              ...s.booking,
              quantity,
              attendees: resize(s.booking.attendees, quantity, emptyAttendee),
              travellers: resize(s.booking.travellers, quantity, emptyTraveller),
            },
          }
        }),
      setAttendee: (index, patch) =>
        set((s) => ({
          booking: { ...s.booking, attendees: s.booking.attendees.map((a, i) => (i === index ? { ...a, ...patch } : a)) },
        })),
      setTraveller: (index, patch) =>
        set((s) => ({
          booking: { ...s.booking, travellers: s.booking.travellers.map((t, i) => (i === index ? { ...t, ...patch } : t)) },
        })),
      setBilling: (patch) => set((s) => ({ booking: { ...s.booking, billing: { ...s.booking.billing, ...patch } } })),
      skipTrip: () =>
        set((s) => ({ booking: { ...s.booking, flightsOn: false, hotelOn: false, esimOn: false, chauffeurOn: false } })),
      reset: (event) => set({ booking: initial(event) }),
    }),
    {
      name: 'golafly-summit-booking',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      /* Read on the client only, after the first paint (see the hook below),
         so the server and the first client render always match. */
      skipHydration: true,
    },
  ),
)

const subscribeHydration = (onChange: () => void) => useSummitBooking.persist.onFinishHydration(onChange)

/** Loads the saved booking once and says when it is safe to show it. */
export function useSummitBookingReady(): boolean {
  useEffect(() => {
    if (!useSummitBooking.persist.hasHydrated()) void useSummitBooking.persist.rehydrate()
  }, [])
  return useSyncExternalStore(
    subscribeHydration,
    () => useSummitBooking.persist.hasHydrated(),
    () => false,
  )
}
