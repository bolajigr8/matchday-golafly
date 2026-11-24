// features/promo/flight-pricing.ts
//
// Same cabin and fare bands as the backend flight promo. The band is chosen
// from the charged fare (total_amount); the sale price is taken off the
// amount the card shows, the same way a match listing discounts its shown price.

import type { FlightOffer } from '@/features/flights/types'
import { offerDisplayPrice, type OfferDisplayPrice } from '@/features/flights/price'
import { promoTicketPrice } from './pricing'
import type { FlightPromo, FlightPromoBand, FlightPromoCabin } from './types'

export const FLIGHT_PROMO_CABINS: { key: FlightPromoCabin; label: string }[] = [
  { key: 'economy', label: 'Economy' },
  { key: 'business', label: 'Business' },
  { key: 'first_class', label: 'First class' },
]

export const FLIGHT_PROMO_BANDS: { key: FlightPromoBand; label: string }[] = [
  { key: 'below_100', label: 'Below 100' },
  { key: '100_500', label: '100 – 500' },
  { key: 'above_500', label: '500 and above' },
]

/** Premium economy is priced as economy, matching the backend. */
export function flightPromoCabinFor(cabinClass: string | null | undefined): FlightPromoCabin {
  switch ((cabinClass ?? '').toLowerCase()) {
    case 'first':
    case 'first_class':
      return 'first_class'
    case 'business':
      return 'business'
    default:
      return 'economy'
  }
}

/** Below 100, 100–500, and 500 and above. Each band includes its lower bound. */
export function flightPromoBandFor(amount: number): FlightPromoBand {
  if (amount < 100) return 'below_100'
  if (amount < 500) return '100_500'
  return 'above_500'
}

/** Percent off this flight right now, or 0 when the promo does not apply. */
export function flightPromoPercentFor(
  promo: FlightPromo | null | undefined,
  cabinClass: string | null | undefined,
  amount: number,
): number {
  if (!promo?.applies_discount || !Number.isFinite(amount) || amount <= 0) return 0
  const percent = Number(
    promo.flight_percents?.[flightPromoCabinFor(cabinClass)]?.[flightPromoBandFor(amount)] ?? 0,
  )
  return Number.isFinite(percent) && percent > 0 && percent <= 90 ? percent : 0
}

export interface FlightOfferQuote {
  promo: FlightPromo | null
  percent: number
  shown: OfferDisplayPrice
  saleAmount: number
}

/** What a flight card should show: the band from the charged fare, the sale on the shown fare. */
export function flightOfferQuote(
  promo: FlightPromo | null | undefined,
  offer: Pick<FlightOffer, 'total_amount' | 'total_currency' | 'price_breakdown' | 'slices'>,
): FlightOfferQuote {
  const shown = offerDisplayPrice(offer)
  const charged = Number.parseFloat(offer.total_amount)
  const cabin = offer.slices[0]?.segments[0]?.passengers?.[0]?.cabin_class
  const percent = flightPromoPercentFor(
    promo,
    cabin,
    Number.isFinite(charged) ? charged : shown.amount,
  )
  return {
    promo: promo ?? null,
    percent,
    shown,
    saleAmount: promoTicketPrice(shown.amount, percent),
  }
}
