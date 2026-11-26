/* ─── The Golafly family ──────────────────────────────────────────
   One list for every place Matchday points at its sibling products:
   the ecosystem bar above the navbar, the mobile menu, the home CTA bands
   and the footer. A product without `href` isn't live yet and renders as
   a "Soon" chip, never as a dead link. */

export type GolaflyProductKey = 'matchday' | 'travel' | 'academy' | 'camp' | 'summit'

export interface GolaflyProduct {
  key: GolaflyProductKey
  /** Short name used in the ecosystem bar ("Travel"). */
  name: string
  /** Full sub-brand name ("Golafly Travel"). */
  fullName: string
  tagline: string
  /** Optional second sentence, shown where there is room (footer, home band). */
  description?: string
  /** Omitted → not launched yet (shown with a "Soon" chip, no link). */
  href?: string
  external?: boolean
  status?: 'soon'
  /** A lime "NEW" chip next to the name (strip + phone menu). */
  badge?: 'new'
}

export const TRAVEL_URL = 'https://golaflytravel.com'

export const GOLAFLY_PRODUCTS: GolaflyProduct[] = [
  {
    key: 'matchday',
    name: 'Matchday',
    fullName: 'Golafly Matchday',
    tagline: 'Your ticket to the biggest matches',
    description: 'Discover football matches and book your next stadium experience.',
    href: '/',
  },
  {
    key: 'travel',
    name: 'Travel',
    fullName: 'Golafly Travel',
    tagline: 'Flights, stays and eSIM in one place',
    href: TRAVEL_URL,
    external: true,
  },
  {
    key: 'academy',
    name: 'Academy',
    fullName: 'Golafly Academy',
    tagline: 'Train with professional academies abroad',
    status: 'soon',
  },
  {
    key: 'camp',
    name: 'Scouting Camp',
    fullName: 'Golafly Scouting Camp',
    // Scouting Camp IS Golafly's tryouts product (trials in front of clubs
    // and scouts), so there is no separate "Tryouts" entry.
    tagline: 'Trials in front of professional clubs and scouts',
    // The camp is sold through the Football Tourism programme page. The
    // standalone /scouting-camp page is the Google Ads landing page only and
    // is deliberately not linked from the site.
    href: '/program/football-tourism',
  },
  {
    // World Football Summit: booked on Matchday (/world-football-summit).
    // Shown as "Summit · NEW", the same item the summit's own Figma header
    // has in this strip.
    key: 'summit',
    name: 'Summit',
    fullName: 'World Football Summit',
    tagline: 'Summit ticket, flights and hotel in one booking',
    href: '/world-football-summit',
    badge: 'new',
  },
]

export const GOLAFLY_PROGRAMS = [
  { label: 'Football Tourism', href: '/program/football-tourism' },
  { label: 'Player Management', href: '/program/player-management' },
  { label: 'Sports Marketing', href: '/program/sports-marketing' },
] as const

export function golaflyProduct(key: GolaflyProductKey): GolaflyProduct {
  return GOLAFLY_PRODUCTS.find((p) => p.key === key)!
}