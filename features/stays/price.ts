// features/stays/price.ts
//
// What a hotel ROOM / prebooked rate shows. Contract: the first line of
// `price_breakdown` (hotel_price) is the room price; the Golafly fee is not
// shown on a product page. `total_price` is unchanged (the charged price,
// used by the cart). Fees payable at the property are NOT part of the
// breakdown and keep being shown separately, exactly as before.

import { providerPriceOf } from '@/features/price-breakdown/helpers'
import type { PriceBreakdown } from '@/features/price-breakdown/types'

export interface StayDisplayPrice {
  total: number
  perNight: number
  currency: string
}

/**
 * The prebooked rate as it is sent BACK to the backend when a hotel is added
 * to the cart (`prebooked_rate`). The backend now puts `price_breakdown` in
 * its prebook response for DISPLAY; echoing that display-only field back in
 * a request nothing documents it for would risk a strict-validation
 * rejection. The request is therefore exactly what it was before the
 * breakdown existed: the same rate, without the new field. (The backend
 * prices the stay from `book_hash`, not from this object.)
 */
export function rateForCart<T extends { price_breakdown?: unknown }>(
  rate: T,
): T {
  const copy = { ...rate }
  delete copy.price_breakdown
  return copy
}

export function stayDisplayPrice(rate: {
  total_price: number
  price_per_night: number
  currency: string
  price_breakdown?: PriceBreakdown | null
}): StayDisplayPrice {
  const provider = providerPriceOf(rate.price_breakdown)
  if (!provider) {
    return {
      total: rate.total_price,
      perNight: rate.price_per_night,
      currency: rate.currency,
    }
  }
  // The breakdown only carries the stay total. Keep the per-night figure in
  // the same proportion to it as the charged per-night is to the charged
  // total (i.e. 1 / nights), so the two lines stay consistent.
  const ratio =
    rate.total_price > 0 ? rate.price_per_night / rate.total_price : 0
  return {
    total: provider.amount,
    perNight: Math.round(provider.amount * ratio * 100) / 100,
    currency: provider.currency,
  }
}
