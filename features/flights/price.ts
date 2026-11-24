// features/flights/price.ts
//
// What a flight OFFER shows as its price.
//
// Price-breakdown contract: a flight offer (product page) shows the
// `flight_ticket_price` line only — never the Golafly fee or the all-in
// total. `total_amount` is unchanged and is still the CHARGED price, so the
// cart and checkout keep using it; it is only what the page DISPLAYS that
// changes. With no usable breakdown the offer shows `total_amount` exactly
// as before.
//
// Anything that filters or ranks offers by the number the customer sees
// (price slider bounds, "max price", per-airline minimums) must use this
// too, otherwise a card showing 300 would be filtered out by a 300 limit
// because its charged total is 324.

import { providerPriceOf } from '@/features/price-breakdown/helpers'
import type { FlightOffer } from './types'

export interface OfferDisplayPrice {
  amount: number
  currency: string
}

export function offerDisplayPrice(
  offer: Pick<FlightOffer, 'total_amount' | 'total_currency' | 'price_breakdown'>,
): OfferDisplayPrice {
  const provider = providerPriceOf(offer.price_breakdown)
  if (provider) return provider
  return {
    amount: parseFloat(offer.total_amount),
    currency: offer.total_currency,
  }
}
