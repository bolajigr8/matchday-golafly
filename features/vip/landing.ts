// features/vip/landing.ts
//
// Turns the featured match's real VIP listings into the landing page's
// "Hospitality" cards (Figma 346:2648). Nothing is invented: a card is one
// ticket category on sale, its price is the lowest browse price in that
// category, and its lines are the listings' own notes. Browse prices can be
// up to 2 minutes old; the price paid is set when the ticket goes into the
// package.

import type { VipListing } from './contract'

export interface VipHospitalityCard {
  /** category_name: also the seats page's filter value. */
  name: string
  categoryId: number
  /** Lowest price per ticket in this category. */
  price: number
  currency: string
  /** Up to 4 lines from the listings' own notes / the category description. */
  perks: string[]
  /** Tickets left across the category's listings. */
  left: number
}

const split = (s: string | null | undefined) =>
  (s ?? '')
    .split(/\s*[·•|]\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1)

/** First sentence of a long description, for categories without notes. */
const firstSentence = (s: string | null | undefined) => {
  const t = (s ?? '').trim()
  if (!t) return []
  const m = t.match(/^(.{20,140}?[.!])\s/)
  return [m ? m[1].replace(/[.!]$/, '') : t.slice(0, 120)]
}

export function hospitalityCards(listings: VipListing[], max = 3): VipHospitalityCard[] {
  const byName = new Map<string, VipHospitalityCard>()
  for (const l of listings) {
    const name = l.category.category_name
    const price = l.price_details.price_per_ticket
    const lines = [...split(l.seat_details.extra_note_hospitality), ...split(l.note)]
    const card = byName.get(name)
    if (!card) {
      byName.set(name, {
        name,
        categoryId: l.category.category_id,
        price,
        currency: l.price_details.currency,
        perks: lines,
        left: l.quantity,
      })
    } else {
      card.price = Math.min(card.price, price)
      card.perks.push(...lines)
      card.left += l.quantity
    }
  }
  const descriptions = new Map(listings.map((l) => [l.category.category_name, l.category.description]))
  return [...byName.values()]
    .map((c) => {
      const perks = [...new Set(c.perks.map((p) => p.replace(/\s+/g, ' ')))]
      return { ...c, perks: (perks.length ? perks : firstSentence(descriptions.get(c.name))).slice(0, 4) }
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, max)
}
