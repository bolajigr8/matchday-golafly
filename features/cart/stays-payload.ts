// features/cart/stays-payload.ts
//
// The body of POST /cart/stays for each hotel supplier. Copied from the
// travels app; the ETG rate goes through rateForCart so the display-only
// price_breakdown is never echoed back to the backend.

import type { CartApiStayPayload } from '@/features/cart/types'
import type { PrebookRate } from '@/features/stays/types'
import type { StayGuest } from '@/features/stays/types'
import { rateForCart } from '@/features/stays/price'
import { normalizeResidency } from '@/features/stays/residency-core'
import type { DuffelAccommodation, DuffelQuote } from '@/features/duffel-stays/types'
import type { DuffelSearchGuestInput } from '@/features/duffel-stays/types'

/** Major units -> minor units (cents), exactly as shown to the customer.
 *  `toFixed` first so 1.005 * 100 = 100.49999... still rounds to 101. */
function toMinor(amount: number): number {
  return Math.max(1, Math.round(Number((amount * 100).toFixed(4))))
}

export function etgStayCartPayload(input: {
  hotelCode: number | string
  hotelName: string
  hotelImage?: string | null
  hotelAddress?: string | null
  rate: PrebookRate
  checkin: string
  checkout: string
  occupancy: StayGuest[]
  residency?: string
  genderRequired?: boolean
}): CartApiStayPayload {
  const adults = input.occupancy.reduce((sum, room) => sum + room.adults, 0)
  const children = input.occupancy.reduce(
    (sum, room) => sum + room.children.length,
    0,
  )

  return {
    provider: 'etg',
    book_hash: input.rate.book_hash,
    match_hash: input.rate.match_hash,
    hotel_id: String(input.hotelCode),
    hotel_name: input.hotelName,
    hotel_image: input.hotelImage ?? undefined,
    hotel_address: input.hotelAddress ?? undefined,
    room_name: input.rate.room_name,
    checkin: input.checkin,
    checkout: input.checkout,
    adults: Math.max(1, adults),
    children,
    rooms: Math.max(1, input.occupancy.length),
    occupancy: input.occupancy.map((room) => ({
      adults: room.adults,
      children: room.children,
    })),
    language: 'en',
    // Same citizenship as the searches (contract 2.3), sent trimmed.
    residency: input.residency ? normalizeResidency(input.residency) : undefined,
    gender_required: Boolean(input.genderRequired),
    currency: input.rate.currency,
    amount_paid_minor: toMinor(input.rate.total_price),
    prebooked_rate: rateForCart(input.rate),
  }
}

export function duffelStayCartPayload(input: {
  quote: DuffelQuote
  accommodation: DuffelAccommodation
  occupancy: DuffelSearchGuestInput[]
  rateExpiresAt?: string | null
  /** The room the guest picked (Duffel names rooms, not rates). */
  roomName?: string | null
}): CartApiStayPayload {
  const adults = input.occupancy.filter((guest) => guest.type !== 'child').length
  const children = input.occupancy.filter((guest) => guest.type === 'child').length

  return {
    provider: 'duffel',
    quote_id: input.quote.id,
    hotel_id: input.accommodation.id,
    hotel_name: input.accommodation.name,
    hotel_image: input.accommodation.photos?.[0]?.url,
    hotel_address: input.accommodation.location?.address?.line_one,
    room_name: input.roomName?.trim() || input.quote.board_type || 'Stay',
    checkin: input.quote.check_in_date,
    checkout: input.quote.check_out_date,
    adults: Math.max(1, adults || input.occupancy.length || 1),
    children,
    rooms: 1,
    guests_expected: Math.max(1, input.occupancy.length),
    currency: input.quote.total_currency,
    amount_paid_minor: toMinor(Number.parseFloat(input.quote.total_amount) || 0),
    expires_at: input.rateExpiresAt ?? undefined,
  }
}
