// store/flights.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FlightSearchParams {
  origin: string
  destination: string
  departure_date: string
  return_date: string
  adults: number
  children_ages: number[] // e.g. [4, 15] — actual ages entered at search time
  infants: number
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first'
}

const defaultSearchParams: FlightSearchParams = {
  origin: '',
  destination: '',
  departure_date: '',
  return_date: '',
  adults: 1,
  children_ages: [],
  infants: 0,
  cabin_class: 'economy',
}

type PersistedFlightsStore = {
  searchParams: FlightSearchParams
  contactEmail: string
  contactPhone: string
  lastMatchId: string | null
}

interface FlightsStore {
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void

  searchParams: FlightSearchParams
  setSearchParams: (p: Partial<FlightSearchParams>) => void

  contactEmail: string
  contactPhone: string
  setContact: (email: string, phone: string) => void

  /**
   * Bug: `searchParams` (including `destination`) persists to localStorage
   * indefinitely with no awareness of which match it was searched for. A
   * buyer who searched flights for a Munich fixture, then later opened the
   * builder for an unrelated Lincoln fixture on the SAME browser, would see
   * "MUC" pre-filled as the destination instead of Lincoln's airport — the
   * stale value from the earlier match silently won over the new match's
   * real destination. This field records which match the current
   * `searchParams` actually belong to, so the builder can tell a genuinely
   * fresh match apart from a stale cross-match cache hit and discard the
   * stale bits (see app/builder/extras/client.tsx).
   */
  lastMatchId: string | null
  setLastMatchId: (id: string | null) => void

  /**
   * Given the same 0-indexed position used everywhere else (offer.passengers
   * order == search request order, per the API docs), returns which "band"
   * that passenger falls into based on what was actually searched — not on
   * whatever `type` the backend echoes back. This is what makes the
   * "traveling with an infant" gating and DOB prefill work correctly even
   * if the backend's returned `type` field is ever unreliable.
   */
  passengerBandAt: (index: number) => {
    band: 'adult' | 'child' | 'infant'
    approxAge?: number
  }
}

export const useFlightsStore = create<FlightsStore>()(
  persist<FlightsStore, [], [], PersistedFlightsStore>(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      searchParams: defaultSearchParams,
      setSearchParams: (p) =>
        set((s) => ({ searchParams: { ...s.searchParams, ...p } })),

      contactEmail: '',
      contactPhone: '',
      setContact: (email, phone) =>
        set({ contactEmail: email, contactPhone: phone }),

      lastMatchId: null,
      setLastMatchId: (id) => set({ lastMatchId: id }),

      passengerBandAt: (index) => {
        const { adults, children_ages, infants } = get().searchParams
        if (index < adults) return { band: 'adult' }
        if (index < adults + children_ages.length) {
          return {
            band: 'child',
            approxAge: children_ages[index - adults],
          }
        }
        if (index < adults + children_ages.length + infants) {
          return { band: 'infant', approxAge: 0 }
        }
        // Fallback if counts don't line up for any reason — treat as adult
        // so the UI never silently hides required fields.
        return { band: 'adult' }
      },
    }),
    {
      name: 'matchday-flights',
      partialize: (state): PersistedFlightsStore => ({
        searchParams: state.searchParams,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
        lastMatchId: state.lastMatchId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

/** Approximate a date of birth from a whole-number age, for prefilling —
 * the user still confirms/adjusts the exact date, this just saves them
 * from having to remember what age they searched with. */
export function approxDobFromAge(age: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age)
  d.setMonth(0, 1) // Jan 1 — a safe, obviously-approximate default
  return `${d.getFullYear()}-01-01`
}
