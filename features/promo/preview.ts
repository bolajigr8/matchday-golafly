// The Black Friday saving the cart and checkout show before payment.
//
// Same figure as the seat card: the percent is chosen from the charged
// price of one ticket, and it comes off the match ticket price only.
// Fees stay on their own lines. A coupon already on the summary wins,
// because payment never applies both.

import {
  currencyFractionDigits,
  discountFromMajor,
} from '@/features/price-breakdown/helpers'
import { PRICE_LINE_KEYS, type PriceSummary } from '@/features/price-breakdown/types'
import { promoPercentFor, promoTicketPrice } from './pricing'
import type { MatchPromo } from './types'

export interface PromoTicket {
  /** Server cart item id, when this ticket has been saved. */
  id: string | null
  /** Charged price of one ticket, the band checkout uses. */
  priceEach: number
  quantity: number
}

export function withMatchPromoPreview(
  summary: PriceSummary | null,
  promo: MatchPromo | null | undefined,
  tickets: PromoTicket[],
): PriceSummary | null {
  if (!summary || summary.discount || !promo?.applies_discount || tickets.length === 0) {
    return summary
  }

  const shownByItem = new Map<string, number>()
  for (const line of summary.lines) {
    if (line.item_type !== 'matchday' || line.key !== PRICE_LINE_KEYS.matchTicket) continue
    shownByItem.set(line.item_id, (shownByItem.get(line.item_id) ?? 0) + line.amount)
  }
  if (shownByItem.size === 0) return summary

  const soleItemId = shownByItem.size === 1 ? [...shownByItem.keys()][0] : null
  let saving = 0
  let percent: number | null = null
  let mixed = false

  for (const ticket of tickets) {
    const quantity = Math.max(1, ticket.quantity)
    const shownTotal =
      (ticket.id != null ? shownByItem.get(ticket.id) : undefined) ??
      (tickets.length === 1 && soleItemId != null ? shownByItem.get(soleItemId) : undefined)
    if (shownTotal == null || shownTotal <= 0) continue

    const rate = promoPercentFor(promo, ticket.priceEach)
    if (rate <= 0) continue
    const shownEach = shownTotal / quantity
    const off = (shownEach - promoTicketPrice(shownEach, rate)) * quantity
    if (off <= 0) continue

    saving += off
    if (percent == null) percent = rate
    else if (percent !== rate) mixed = true
  }

  if (saving <= 0 || percent == null) return summary

  const code = mixed ? promo.label : `${promo.label} · ${percent}% OFF`
  const discount = discountFromMajor(code, saving, summary.currency)
  if (!discount || discount.amount_minor >= summary.total.amount_minor) return summary

  const amountMinor = summary.total.amount_minor - discount.amount_minor
  const scale = 10 ** currencyFractionDigits(summary.currency)

  return {
    ...summary,
    discount,
    total: {
      amount_minor: amountMinor,
      amount: amountMinor / scale,
    },
  }
}
