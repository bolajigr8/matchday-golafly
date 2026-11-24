// features/flights/fare-brands.ts
//
// Ported from Travels' app/(public)/flights/select/client.tsx. Lets the
// matchday Fare step offer the same "pick Economy / Comfort / Premium for
// this exact flight" choice Travels has, instead of only ever showing the
// one fare the user happened to click in Results.

import type { FlightOffer, SearchPassengerInput } from './types'

/** Identity key for "is this the same physical flight, different fare
 *  brand" — same carrier, same flight number(s), same departure time(s)
 *  across every slice. Also used to decide whether we already have the
 *  sibling fare list and can skip re-searching. */
export function offerFlightKey(offer: FlightOffer): string {
  return offer.slices
    .map((sl) =>
      sl.segments
        .map(
          (s) =>
            `${s.marketing_carrier.iata_code}${s.marketing_carrier_flight_number}@${s.departing_at}`,
        )
        .join('|'),
    )
    .join('||')
}

/** "premium_economy" -> "Premium Economy" */
function titleCaseCabin(cabin?: string | null): string | undefined {
  if (!cabin) return undefined
  return cabin
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Display name for an offer's fare, falling back through what the airline
 *  actually returned. `fare_brand_name` is the airline's own brand ("Light",
 *  "Flex"); when it is missing, the marketing cabin name ("Premium Economy
 *  Standard") is the next best label, then the raw cabin, then a constant. */
export function fareBrandOf(offer: FlightOffer): string {
  const sl = offer.slices[0]
  const pax = sl?.segments[0]?.passengers?.[0]
  return (
    sl?.fare_brand_name ??
    pax?.cabin_class_marketing_name ??
    pax?.cabin?.marketing_name ??
    titleCaseCabin(pax?.cabin_class ?? pax?.cabin?.name) ??
    'Standard'
  )
}

/** The fare an offer represents, as a key that survives being re-quoted.
 *
 *  Offer IDs cannot be compared across offer requests — the sibling search
 *  below always comes back with brand new ids, including for the fare the
 *  user is already on. Keying off the fare itself (cabin + brand) is what
 *  lets the UI recognise "this card is the one already selected". */
export function fareKey(offer: FlightOffer): string {
  const sl = offer.slices[0]
  const pax = sl?.segments[0]?.passengers?.[0]
  const cabin = pax?.cabin_class ?? pax?.cabin?.name ?? ''
  return `${cabin}|${fareBrandOf(offer)}`
}

export function offerToSearchPassengers(
  offer: FlightOffer,
): SearchPassengerInput[] {
  return offer.passengers.map((p) => ({
    type: (p.type as SearchPassengerInput['type']) ?? 'adult',
  }))
}

export interface FareCardData {
  offer: FlightOffer
  brandName: string
  checkedBagIncluded: boolean
  carryOnIncluded: boolean
  refundable: boolean
  changeable: boolean
}

export function offerToFareCard(offer: FlightOffer): FareCardData {
  const brandName = fareBrandOf(offer)

  // Baggage lives on the segment-level passenger record
  // (offer.slices[].segments[].passengers[].baggages), not on the
  // offer-level passengers[] array.
  const paxBags = offer.slices[0]?.segments[0]?.passengers?.[0]?.baggages ?? []
  const checkedBagIncluded = paxBags.some(
    (b) => b.type === 'checked' && b.quantity > 0,
  )
  const carryOnIncluded = paxBags.some(
    (b) => b.type === 'carry_on' && b.quantity > 0,
  )

  const refundable =
    offer.conditions?.refund_before_departure?.allowed ?? false
  const changeable =
    offer.conditions?.change_before_departure?.allowed ?? false

  return {
    offer,
    brandName,
    checkedBagIncluded,
    carryOnIncluded,
    refundable,
    changeable,
  }
}

/**
 * One card per fare available on this physical flight, cheapest first.
 * The offer the user is currently on is always seeded first and pinned to
 * its own slot, so re-quoting it under a new id during the sibling search
 * never bumps it off screen or drops its "selected" state.
 */
export function buildFareCards(
  currentOffer: FlightOffer,
  siblingOffers: FlightOffer[],
): FareCardData[] {
  const key = offerFlightKey(currentOffer)
  const matches = siblingOffers.filter((o) => offerFlightKey(o) === key)

  const selectedKey = fareKey(currentOffer)
  const byFare = new Map<string, FlightOffer>([[selectedKey, currentOffer]])
  for (const o of matches) {
    const k = fareKey(o)
    if (k === selectedKey) continue
    const existing = byFare.get(k)
    if (
      !existing ||
      parseFloat(o.total_amount) < parseFloat(existing.total_amount)
    ) {
      byFare.set(k, o)
    }
  }
  return [...byFare.values()]
    .sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
    .map(offerToFareCard)
}
