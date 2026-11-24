'use client'

// The cart total with the Black Friday saving folded in, for every
// surface that shows that total (extras, pay, cart, drawer).

import { useMemo } from 'react'
import { useCart } from '@/features/cart/context'
import { serverIdOf } from '@/features/price-breakdown/helpers'
import type { PriceSummary } from '@/features/price-breakdown/types'
import { withMatchPromoPreview, type PromoTicket } from './preview'
import { useMatchPromo } from './use-match-promo'

export function useSummaryWithMatchPromo(
  summary: PriceSummary | null,
): PriceSummary | null {
  const promo = useMatchPromo()
  const { items } = useCart()
  const tickets = useMemo<PromoTicket[]>(
    () =>
      items
        .filter((item) => item.type === 'tickets' && !isHospitality(item.checkoutPayload))
        .map((item) => ({
          id: serverIdOf(item),
          priceEach: item.price,
          quantity: item.qty,
        })),
    [items],
  )

  return useMemo(
    () => withMatchPromoPreview(summary, promo, tickets),
    [summary, promo, tickets],
  )
}

function isHospitality(payload: Record<string, unknown> | undefined): boolean {
  if (!payload) return false
  const id = payload.hospitalityPackageId ?? payload.hospitality_package_id
  return typeof id === 'string' && id !== ''
}
