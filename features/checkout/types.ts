// features/checkout/types.ts
//
// Shared shapes used by the checkout form sections (contact, passengers,
// hotel guests, eSIM confirmations). These are reused across the real
// single-ticket MatchDay checkout (app/builder/checkout-tickets) and the
// real unified cart checkout (app/builder/pay), which is why they live
// here rather than inside either feature.
//
// NOTE: this file used to also hold the request/response contract for a
// mock "combined checkout" backend (ValidateSessionRequest/Response,
// PayRequest/Response, OrderStatusResponse, etc.), served by
// app/api/checkout/*. That mock backend has been removed — every real
// checkout now goes through either features/matchday/client.ts (single
// ticket) or features/cart/api.ts (unified cart). Only the form types
// below survive from that file.

/* ─── Shared contact / traveler shapes ────────────────────────────── */

export interface ContactInfo {
  fullName: string
  email: string
  phone: string
}

export interface PassengerInput {
  /** Duffel passenger id when a real offer is loaded; a stable synthetic
   *  id (`pax_0`, `pax_1`, ...) when the flight item has no live offer
   *  data yet, so the form still has something to key rows on. */
  id: string
  sameAsPrimary: boolean
  offerType?: 'adult' | 'child' | 'infant_without_seat'
  title: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr'
  given_name: string
  family_name: string
  gender: 'm' | 'f'
  born_on: string
  email: string
  phone_number: string
  /** Only collected when the offer says identity docs are required. */
  passportNumber?: string
  passportCountry?: string
  passportExpiry?: string
  infant_passenger_id?: string
  identity_documents?: {
    type: string
    unique_identifier: string
    issuing_country_code: string
    expires_on?: string
  }[]
}

export interface HotelGuestInput {
  firstName: string
  lastName: string
  isChild?: boolean
  age?: number
}

export interface HotelRoomGuestsInput {
  guests: HotelGuestInput[]
}

export interface EsimCheckoutInput {
  packageId: string
  type: 'local' | 'global'
  country: string
  quantity: number
  deviceConfirmed: boolean
  activationConfirmed: boolean
  autoActivate?: boolean
}
