// features/esim/price.ts
//
// What an eSIM package shows on a product page: the `esim_price` line of its
// per-unit price_breakdown — not the Golafly fee, not the all-in `price`
// (which is unchanged and is still what the cart charges). No usable
// breakdown → `price` exactly as before.

import { providerPriceOf } from '@/features/price-breakdown/helpers'
import type { PriceBreakdown } from '@/features/price-breakdown/types'

export function esimDisplayPrice(pkg: {
  price: number
  currency: string
  price_breakdown?: PriceBreakdown | null
}): { amount: number; currency: string } {
  return (
    providerPriceOf(pkg.price_breakdown) ?? {
      amount: pkg.price,
      currency: pkg.currency,
    }
  )
}
