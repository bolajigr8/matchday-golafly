// features/matchday/seats.ts
//
// Turns a raw GET /listings response into the shape the seats page renders.
// Every field the API gives us is surfaced here (block list, row, delivery
// type, view, seats-together rule, notes, fan side, stock) so the UI never
// shows empty "Block: · Row:" placeholders.

import type { MatchdayListing, ListingsMetaBlock } from './types'
import { listingAvailability } from './format'
import {
  priceWithoutGolaflyFee,
  providerPriceOf,
} from '@/features/price-breakdown/helpers'

export type Tier = 'lower' | 'upper' | 'club' | 'hospitality' | 'other'
export type Side = 'short' | 'long' | 'central' | 'all'

export interface CategoryInfo {
  id: number
  name: string
  shortName: string
  tier: Tier
  side: Side
  color: string
  blocks: string[]
  minPrice: number
  listingCount: number
}

export interface SeatListing {
  id: string
  isReal: boolean
  listingId?: number
  eventId?: number
  categoryId: number
  categoryName: string
  categoryBlocks: string[]
  blocks: string[]
  row: string
  /** The CHARGED all-in price per ticket (price_per_ticket). The cart,
   *  checkout and sorting rely on it — do NOT display it on a listing. */
  priceEach: number
  /** What a listing shows: the provider's ticket price only (contract
   *  rule 1 — price_details.ticket_price / first breakdown line). Equals
   *  priceEach when the backend sent no breakdown (screen as today). */
  shownPrice: number
  /** "From" figure for block/category/event headers: ticket + third-party
   *  fee, WITHOUT the Golafly booking fee. Equals priceEach without a
   *  breakdown. */
  fromPrice: number
  currency: string | null
  qtyOptions: number[]
  available: number
  delivery: string | null
  view: string | null
  seatsTogether: string | null
  singlesOnly: boolean
  fansSide: string | null
  instantDownload: string | null
  notes: string[]
  homeEnd: boolean
  hospitality: boolean
}

/** API sends seating_blocks as "97;98;99" (docs say array) — accept both. */
export function parseBlocks(v: string | string[] | null | undefined): string[] {
  if (!v) return []
  const list = Array.isArray(v) ? v : v.split(/[;,]/)
  return list.map((b) => String(b).trim()).filter(Boolean)
}

/** Strip decorative glyphs suppliers put in notes (⬤ etc). */
function cleanNote(s: string | null | undefined): string {
  return (s ?? '').replace(/[\u2b24\u25cf\u2022]/g, ' ').replace(/\s+/g, ' ').trim()
}

function sentence(s: string): string {
  const t = s.trim().toLowerCase()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}

/** Tier + side from the category NAME, then its DESCRIPTION. The name wins;
 *  the description fills in what the name doesn't say ("Category 2" with
 *  "Short Side Middle Tier Tickets." → club tier, short side). */
export function classifyCategory(
  name: string,
  description?: string | null,
): { tier: Tier; side: Side } {
  const own = classifyText(name)
  if (!description) return own
  const desc = classifyText(description)
  return {
    tier: own.tier !== 'other' ? own.tier : desc.tier,
    side: own.side !== 'all' ? own.side : desc.side,
  }
}

function classifyText(text: string): { tier: Tier; side: Side } {
  const n = text.toLowerCase()
  let tier: Tier = 'other'
  if (
    /(private box|executive private|cannon|hospitality|diamond|lounge|\bvip\b|\bbar\b|restaurant|package|dugout|suite|\bboxes?\b)/.test(
      n,
    )
  )
    tier = 'hospitality'
  else if (/(club|middle tier|mid tier|middle level)/.test(n)) tier = 'club'
  else if (/upper/.test(n)) tier = 'upper'
  else if (/lower/.test(n)) tier = 'lower'
  let side: Side = 'all'
  if (/central/.test(n)) side = 'central'
  else if (/short/.test(n)) side = 'short'
  else if (/long/.test(n)) side = 'long'
  return { tier, side }
}

function shortLabel(name: string): string {
  return name
    .replace(/\blevel\b/gi, '')
    .replace(/\btickets?\b/gi, '')
    .replace(/\bside\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* Stable colour per category (mid-tones: white labels read on all of them). */
export const CATEGORY_COLORS = [
  '#7c3aed', '#2563eb', '#0e9fbc', '#059669', '#d97706',
  '#dc2626', '#db2777', '#4f46e5', '#0d9488', '#9333ea', '#ea580c', '#65a30d',
]

export function toSeatListing(l: MatchdayListing): SeatListing {
  const available = listingAvailability(l.quantity, l.held_quantity)
  const sd = l.seat_details
  const note = cleanNote(l.note)
  const hosp = cleanNote(sd.extra_note_hospitality)
  const lowerNote = note.toLowerCase()
  const homeEnd = /home supporters|home fans|home end/.test(lowerNote)
  const together = (l.seats_together ?? '').trim()
  const singlesOnly = l.is_singles || /single seats? only/i.test(together)
  const notes = [note, hosp].filter((x, i, a) => x && a.indexOf(x) === i)
  const pd = l.price_details
  const explicit =
    typeof pd.ticket_price === 'number' &&
    Number.isFinite(pd.ticket_price) &&
    pd.ticket_price > 0
      ? pd.ticket_price
      : null
  const shownPrice =
    explicit ?? providerPriceOf(pd.price_breakdown)?.amount ?? pd.price_per_ticket
  const fromPrice =
    priceWithoutGolaflyFee(pd.price_breakdown)?.amount ?? pd.price_per_ticket
  return {
    id: String(l.listing_id),
    isReal: true,
    listingId: l.listing_id,
    eventId: l.event_id,
    categoryId: l.category.category_id,
    categoryName: l.category.category_name,
    categoryBlocks: parseBlocks(l.category.seating_blocks as string | string[]),
    blocks: parseBlocks(sd.block),
    row: (sd.row ?? '').trim(),
    priceEach: l.price_details.price_per_ticket,
    shownPrice,
    fromPrice,
    currency: l.price_details.currency,
    qtyOptions: l.split.splits.filter((q) => q <= available),
    available,
    delivery:
      l.type === 'ELECTRONIC' ? 'E-ticket' : l.type === 'MOBILE' ? 'Mobile ticket' : l.type ? sentence(l.type) : null,
    view:
      sd.view_type === 'CLEAR' ? 'Clear view' : sd.view_type === 'RESTRICTED' ? 'Restricted view' : null,
    seatsTogether: together ? sentence(together) : null,
    singlesOnly,
    fansSide: l.fans_side ? String(l.fans_side) : null,
    instantDownload: l.instant_download ? String(l.instant_download) : null,
    notes,
    homeEnd,
    hospitality:
      classifyCategory(l.category.category_name, l.category.description).tier === 'hospitality',
  }
}

export function buildCategories(
  listings: SeatListing[],
  metaCats?: { category_id: number; name: string; description?: string | null; min_price: number }[],
): CategoryInfo[] {
  const map = new Map<number, CategoryInfo>()
  const descById = new Map((metaCats ?? []).map((m) => [m.category_id, m.description ?? null]))
  const add = (id: number, name: string, blocks: string[], price: number) => {
    const ex = map.get(id)
    if (ex) {
      ex.minPrice = Math.min(ex.minPrice, price)
      if (!ex.blocks.length) ex.blocks = blocks
      return
    }
    const { tier, side } = classifyCategory(name, descById.get(id))
    map.set(id, { id, name, shortName: shortLabel(name), tier, side, color: '', blocks, minPrice: price, listingCount: 0 })
  }
  // Meta categories only register the category (name / description). Their
  // min_price is NOT used: it can be 0 for a category with nothing on sale
  // (it showed as "€0.00") and can disagree with the listings (fees). The
  // price is the cheapest live listing; Infinity = nothing on sale.
  for (const m of metaCats ?? []) add(m.category_id, m.name, [], Number.POSITIVE_INFINITY)
  for (const l of listings) {
    add(l.categoryId, l.categoryName, l.categoryBlocks, l.fromPrice)
    map.get(l.categoryId)!.listingCount++
  }
  return Array.from(map.values())
    .sort((a, b) => a.id - b.id)
    .map((c, i) => ({ ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
}

export function blockPrices(blocks: Record<string, ListingsMetaBlock> | undefined) {
  return Object.values(blocks ?? {}).sort(
    (a, b) => a.category_id - b.category_id || a.block.localeCompare(b.block, undefined, { numeric: true }),
  )
}

const norm = (b: string) => b.trim().toUpperCase()

/** Does a listing sit in this block? Explicit block list wins; otherwise
 *  a listing with no block is "somewhere in its category" — the category's
 *  seating_blocks, or (when the API sends none) `planBlocks`, the blocks the
 *  seating-plan SVG assigns to that category. Case-insensitive: the plan
 *  says "EXCLUSIVE_01" where a listing says "Exclusive_01". */
export function listingInBlock(l: SeatListing, block: string, planBlocks?: readonly string[]): boolean {
  const b = norm(block)
  if (l.blocks.length) return l.blocks.some((x) => norm(x) === b)
  if (l.categoryBlocks.length) return l.categoryBlocks.some((x) => norm(x) === b)
  return !!planBlocks?.some((x) => norm(x) === b)
}

export interface BlockPrice {
  minPrice: number
  count: number
}

/** Cheapest price + listing count per block, computed from the listings
 *  themselves (meta.blocks prices can disagree with the listings — seen on
 *  Real Madrid fixtures — so the bubbles on the map never use them).
 *  Keys are upper-case block names, matching seating-plan.ts. */
export function blockPricesFromListings(
  listings: SeatListing[],
  planBlocksByCat: ReadonlyMap<number, readonly string[]>,
): Map<string, BlockPrice> {
  const out = new Map<string, BlockPrice>()
  for (const l of listings) {
    const where = l.blocks.length
      ? l.blocks
      : l.categoryBlocks.length
        ? l.categoryBlocks
        : (planBlocksByCat.get(l.categoryId) ?? [])
    for (const raw of new Set(where.map(norm))) {
      const cur = out.get(raw)
      if (!cur) out.set(raw, { minPrice: l.fromPrice, count: 1 })
      else {
        cur.minPrice = Math.min(cur.minPrice, l.fromPrice)
        cur.count++
      }
    }
  }
  return out
}

/* ── Team-themed category colours ───────────────────────────────────────
 * The listings API and the seating-plan SVG carry no colours (Anfield's SVG
 * paints every block the same grey, #9f9e9e). Like footballticket.net's maps,
 * we theme the plan in the home club's colour: one hue (from the home crest),
 * darker for cheaper categories and lighter for dearer ones — outer cheap
 * rings read dark, premium inner rings light — plus slate greys for
 * hospitality. Falls back to a neutral blue when no crest colour is known. */

export interface BaseHue {
  h: number
  s: number
}

const DEFAULT_HUE: BaseHue = { h: 217, s: 72 }

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`
}

export function themeCategoryColors(categories: CategoryInfo[], base: BaseHue | null): CategoryInfo[] {
  const { h, s } = base ?? DEFAULT_HUE
  const sat = Math.min(Math.max(s, 45), 80)
  const seated = categories.filter((c) => c.tier !== 'hospitality').sort((a, b) => a.minPrice - b.minPrice)
  const hosp = categories.filter((c) => c.tier === 'hospitality').sort((a, b) => a.minPrice - b.minPrice)
  const colour = new Map<number, string>()
  const n = seated.length
  seated.forEach((c, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5
    // 26% → 60% lightness; a small hue walk keeps neighbours distinguishable
    colour.set(c.id, hsl(h + (t - 0.5) * 24, sat, 26 + t * 34))
  })
  hosp.forEach((c, i) => colour.set(c.id, hsl(220, 10, 22 + (i % 4) * 9)))
  return categories.map((c) => ({ ...c, color: colour.get(c.id) ?? c.color }))
}

/** White or near-black, whichever reads better on `color` (hex or hsl()). */
export function readableInk(color: string): string {
  let r = 0
  let g = 0
  let b = 0
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  const h = color.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    r = (n >> 16) / 255
    g = ((n >> 8) & 255) / 255
    b = (n & 255) / 255
  } else if (h) {
    const H = Number(h[1]) / 60
    const S = Number(h[2]) / 100
    const L = Number(h[3]) / 100
    const C = (1 - Math.abs(2 * L - 1)) * S
    const X = C * (1 - Math.abs((H % 2) - 1))
    const m = L - C / 2
    ;[r, g, b] = (
      H < 1 ? [C, X, 0] : H < 2 ? [X, C, 0] : H < 3 ? [0, C, X] : H < 4 ? [0, X, C] : H < 5 ? [X, 0, C] : [C, 0, X]
    ).map((v) => v + m)
  } else return '#ffffff'
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  // contrast vs white compared with contrast vs #111827
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.0601 ? '#ffffff' : '#111827'
}
