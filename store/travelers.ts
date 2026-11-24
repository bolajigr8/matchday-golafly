// store/travelers.ts
//
// Single source of truth for "who is this booking for" across every
// product in the combined checkout — see docs/checkout-api-contract.md
// §6. Replaces the previously-fragmented contact state that used to be
// written separately into store/flights.ts (`contactEmail`/`contactPhone`)
// and store/stays.ts (`contactInfo`): neither of those was ever read
// anywhere outside its own store file, so nothing depends on them and
// they're left as-is (dead fields) rather than touched here — see the
// README's "decisions made" section for why.
//
// A flight needs each passenger's own name/DOB/email/phone; a hotel
// needs each room's guests' names; eSIM/tickets just need the contact.
// This store holds one canonical contact plus a per-passenger and
// per-room-guest list that defaults from it, so the customer edits
// differences rather than retyping everything.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContactInfo, HotelGuestInput, PassengerInput } from '@/features/checkout/types'

const emptyContact: ContactInfo = { fullName: '', email: '', phone: '' }

function splitName(fullName: string): { given: string; family: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { given: '', family: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { given: parts[0], family: '' }
  return { given: parts.slice(0, -1).join(' '), family: parts[parts.length - 1] }
}

function passengerFromPrimary(id: string, contact: ContactInfo): PassengerInput {
  const { given, family } = splitName(contact.fullName)
  return {
    id,
    sameAsPrimary: true,
    title: 'mr',
    given_name: given,
    family_name: family,
    gender: 'm',
    born_on: '',
    email: contact.email,
    phone_number: contact.phone,
    offerType: undefined,
    infant_passenger_id: undefined,
    identity_documents: undefined,
  }
}

function blankPassenger(id: string): PassengerInput {
  return {
    id,
    sameAsPrimary: false,
    title: 'mr',
    given_name: '',
    family_name: '',
    gender: 'm',
    born_on: '',
    email: '',
    phone_number: '',
    offerType: undefined,
    infant_passenger_id: undefined,
    identity_documents: undefined,
  }
}

interface TravelersState {
  primaryContact: ContactInfo
  passengers: PassengerInput[]
  /** Flat list, split into rooms by the caller using each room's guest
   *  count — kept flat here because the count-per-room can change as the
   *  customer edits the stay, and re-slicing a flat list is simpler and
   *  less error-prone than reshaping a nested array in place. */
  hotelGuests: HotelGuestInput[]

  setPrimaryContact: (patch: Partial<ContactInfo>) => void

  /** Ensures exactly these passenger ids exist, in this order. New ids
   *  default to blank (2nd+ traveler) except the very first passenger
   *  overall, which defaults to "same as primary contact". Existing ids
   *  keep whatever the customer already typed. */
  ensurePassengers: (ids: string[]) => void
  updatePassenger: (id: string, patch: Partial<PassengerInput>) => void
  setPassengerSameAsPrimary: (id: string, same: boolean) => void

  /** Ensures exactly this many guest slots exist. The first slot
   *  defaults to the primary contact's name (the "lead guest"); the
   *  rest default blank. Existing entries (by index) are preserved. */
  ensureHotelGuests: (count: number) => void
  updateHotelGuest: (index: number, patch: Partial<HotelGuestInput>) => void

  reset: () => void
}

export const useTravelersStore = create<TravelersState>()(
  persist(
    (set, get) => ({
      primaryContact: emptyContact,
      passengers: [],
      hotelGuests: [],

      setPrimaryContact: (patch) =>
        set((s) => {
          const primaryContact = { ...s.primaryContact, ...patch }
          // Keep every passenger marked "same as primary" in sync live,
          // so editing the shared contact updates them without the
          // customer having to re-check the box.
          const passengers = s.passengers.map((p) =>
            p.sameAsPrimary ? passengerFromPrimary(p.id, primaryContact) : p,
          )
          const hotelGuests = s.hotelGuests.map((g, i) => {
            if (i !== 0) return g
            const { given, family } = splitName(primaryContact.fullName)
            return { firstName: given, lastName: family, isChild: false }
          })
          return { primaryContact, passengers, hotelGuests }
        }),

      ensurePassengers: (ids) =>
        set((s) => {
          const byId = new Map(s.passengers.map((p) => [p.id, p]))
          const passengers = ids.map((id, i) => {
            const existing = byId.get(id)
            if (existing) return existing
            return i === 0 ? passengerFromPrimary(id, s.primaryContact) : blankPassenger(id)
          })
          return { passengers }
        }),

      updatePassenger: (id, patch) =>
        set((s) => ({
          passengers: s.passengers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      setPassengerSameAsPrimary: (id, same) =>
        set((s) => ({
          passengers: s.passengers.map((p) =>
            p.id === id
              ? same
                ? passengerFromPrimary(id, s.primaryContact)
                : { ...p, sameAsPrimary: false }
              : p,
          ),
        })),

      ensureHotelGuests: (count) =>
        set((s) => {
          const guests: HotelGuestInput[] = Array.from({ length: count }, (_, i) => {
            const existing = s.hotelGuests[i]
            if (existing) return existing
            if (i === 0) {
              const { given, family } = splitName(get().primaryContact.fullName)
              return { firstName: given, lastName: family, isChild: false }
            }
            return { firstName: '', lastName: '', isChild: false }
          })
          return { hotelGuests: guests }
        }),

      updateHotelGuest: (index, patch) =>
        set((s) => ({
          hotelGuests: s.hotelGuests.map((g, i) => (i === index ? { ...g, ...patch } : g)),
        })),

      reset: () => set({ primaryContact: emptyContact, passengers: [], hotelGuests: [] }),
    }),
    { name: 'matchday-travelers' },
  ),
)
