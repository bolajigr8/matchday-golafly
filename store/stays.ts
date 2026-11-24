// store/stays.ts
//
// Hotel (Stays) search and selection state, shared by the match builder's
// hotel step and the checkout. Same shape as the travels app's store:
// guests are a real per-room breakdown (`searchParams.guests`), and the main
// guest's citizenship is sent as `residency` on every hotel search
// (Citizenship, room name and failed hotel API contract v1.0).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  StayHotelDetail,
  StayRoom,
  StayGuest,
  PrebookRate,
  BookingFormResult,
} from '@/features/stays/types'
import { createEmptyRoom, normalizeRoomGuests } from '@/features/stays/utils'
import {
  DEFAULT_RESIDENCY,
  normalizeResidency,
} from '@/features/stays/residency-core'

export interface StaySearchParams {
  checkin: string
  checkout: string
  /** One entry per room: the per-room breakdown ETG prices. The single
   *  source of truth for guest counts (search, prebook, cart, checkout). */
  guests: StayGuest[]
  regionId: number | null
  regionName: string
  currency: string
  /** Citizenship of the main guest (ISO alpha-2, lowercase), sent as
   *  `residency`. Change it only through `setResidency`. */
  residency: string
}

interface ContactInfo {
  email: string
  phone: string
  countryCode: string
}

type PersistedStaysStore = {
  searchParams: StaySearchParams
  contactInfo: ContactInfo
  selectedExtraIds: string[]
  residencyConfirmed: boolean
  lastMatchId: string | null
}

interface StaysStore {
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void

  searchParams: StaySearchParams
  setSearchParams: (p: Partial<StaySearchParams>) => void

  /** True once the guest has picked a citizenship themselves (false while
   *  the visible pre-selection is still the default or a locale guess). */
  residencyConfirmed: boolean
  /**
   * Set the main guest's citizenship. Prices depend on it, so a change drops
   * the selected room and any prebooked rate: the guest must search again.
   * `auto` marks a pre-selection the guest has not confirmed yet.
   */
  setResidency: (code: string, opts?: { auto?: boolean }) => void

  selectedHotel: StayHotelDetail | null
  setSelectedHotel: (h: StayHotelDetail | null) => void

  selectedRoom: StayRoom | null
  setSelectedRoom: (r: StayRoom | null) => void

  prebookedRate: PrebookRate | null
  setPrebookedRate: (r: PrebookRate | null) => void

  priceChanged: boolean
  setPriceChanged: (v: boolean) => void

  selectedExtraIds: string[]
  setSelectedExtraIds: (ids: string[]) => void

  bookingFormResult: BookingFormResult | null
  setBookingFormResult: (r: BookingFormResult | null) => void

  contactInfo: ContactInfo
  setContactInfo: (c: Partial<ContactInfo>) => void

  /**
   * The match the persisted dates/region belong to. /builder/extras is
   * reused for every match, so a search saved for a PREVIOUS match must not
   * leak into a new one (same guard as store/flights.ts).
   */
  lastMatchId: string | null
  setLastMatchId: (id: string | null) => void

  resetBooking: () => void
}

const defaultSearchParams: StaySearchParams = {
  checkin: '',
  checkout: '',
  guests: [createEmptyRoom()],
  regionId: null,
  regionName: '',
  currency: 'EUR',
  residency: DEFAULT_RESIDENCY,
}

const defaultContactInfo: ContactInfo = {
  email: '',
  phone: '',
  countryCode: '+1',
}

// v2: guests moved from flat adults/rooms/childrenAges to a per-room array,
// and the citizenship choice is remembered. Nothing in v1 can be mapped
// safely, so older saved data is reset to the defaults.
const STORE_VERSION = 2

export const useStaysStore = create<StaysStore>()(
  persist<StaysStore, [], [], PersistedStaysStore>(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      searchParams: defaultSearchParams,
      setSearchParams: (p) =>
        set((s) => ({
          searchParams: {
            ...s.searchParams,
            ...p,
            guests: p.guests
              ? normalizeRoomGuests(p.guests)
              : s.searchParams.guests,
          },
        })),

      residencyConfirmed: false,
      setResidency: (code, opts) =>
        set((s) => {
          const residency = normalizeResidency(code)
          if (!residency) return {}
          const confirmed = opts?.auto ? s.residencyConfirmed : true
          if (residency === s.searchParams.residency) {
            return { residencyConfirmed: confirmed }
          }
          return {
            searchParams: { ...s.searchParams, residency },
            residencyConfirmed: confirmed,
            selectedRoom: null,
            prebookedRate: null,
            priceChanged: false,
            bookingFormResult: null,
          }
        }),

      selectedHotel: null,
      setSelectedHotel: (h) => set({ selectedHotel: h }),

      selectedRoom: null,
      setSelectedRoom: (r) => set({ selectedRoom: r }),

      prebookedRate: null,
      setPrebookedRate: (r) => set({ prebookedRate: r }),

      priceChanged: false,
      setPriceChanged: (v) => set({ priceChanged: v }),

      selectedExtraIds: [],
      setSelectedExtraIds: (ids) => set({ selectedExtraIds: ids }),

      bookingFormResult: null,
      setBookingFormResult: (r) => set({ bookingFormResult: r }),

      contactInfo: defaultContactInfo,
      setContactInfo: (c) =>
        set((s) => ({ contactInfo: { ...s.contactInfo, ...c } })),

      lastMatchId: null,
      setLastMatchId: (id) => set({ lastMatchId: id }),

      resetBooking: () =>
        set({
          selectedRoom: null,
          prebookedRate: null,
          priceChanged: false,
          bookingFormResult: null,
          selectedExtraIds: [],
        }),
    }),
    {
      name: 'matchday-stays',
      version: STORE_VERSION,
      migrate: () =>
        ({
          searchParams: defaultSearchParams,
          contactInfo: defaultContactInfo,
          selectedExtraIds: [],
          residencyConfirmed: false,
          lastMatchId: null,
        }) satisfies PersistedStaysStore,
      partialize: (state): PersistedStaysStore => ({
        searchParams: state.searchParams,
        contactInfo: state.contactInfo,
        selectedExtraIds: state.selectedExtraIds,
        residencyConfirmed: state.residencyConfirmed,
        lastMatchId: state.lastMatchId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
