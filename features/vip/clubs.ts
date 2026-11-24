// features/vip/clubs.ts
//
// Design imagery for the VIP pages, per club (the backend sends names and
// ids, no pictures). These are the Figma "Golafly-Real" assets in
// /public/figma/vip, keyed by the backend's club slug. A club without its
// own picture uses the hero poster; a team without a crest shows initials.

import type { VipEvent } from './contract'

const PHOTO: Record<string, string> = {
  barcelona: '/figma/vip/match-fcb-sev.png',
  real_madrid: '/figma/vip/match-rma-fcb.jpg',
  atletico_madrid: '/figma/vip/match-atm-rma.jpg',
}

const CREST_BY_TEAM: Record<string, string> = {
  'fc barcelona': '/figma/vip/crest-fc-barcelona.png',
  barcelona: '/figma/vip/crest-fc-barcelona.png',
  'real madrid': '/figma/vip/crest-real-madrid.png',
}

export const VIP_FALLBACK_PHOTO = '/figma/vip/hero-fans-poster.jpg'

export function vipClubPhoto(club: string): string {
  return PHOTO[club] ?? VIP_FALLBACK_PHOTO
}

export function vipTeamCrest(team: string): string | null {
  return CREST_BY_TEAM[team.trim().toLowerCase()] ?? null
}

/** The supplier's transparent club crest, keyed by the backend's team id
 *  (same file the main Matchday site uses: components/tickets/primitives
 *  teamCrestUrl). The event's `team.image` is a large squad PHOTO (~1 MB),
 *  not a crest, so it is never used for a crest. */
export function vipSupplierCrest(teamId: number | null | undefined): string | null {
  return teamId ? `https://cdn.footballticketnet.com/teams/${teamId}/logo.webp` : null
}

/** What every match card and banner shows, from one backend event. */
export interface VipEventView {
  club: string
  eventId: number
  home: string
  away: string
  /** Local kick-off in Spain, as the backend sends it. */
  date: string
  venue: string
  city: string
  airport: string
  priceFrom: { amount: number; currency: string } | null
  /** The club's Figma photo: sharp at full width (match banner, About). */
  image: string
  /** Match cards: the backend's stadium photo when sent (small, ~430px,
   *  no supplier logo), otherwise the club's Figma photo. */
  cardImage: string
  /** Team crests: Figma's own for Barcelona / Real Madrid, otherwise the
   *  supplier crest for the backend's team id; initials if it fails. */
  homeCrest: string | null
  awayCrest: string | null
  /** "Spanish La Liga", "Champions League" … (null if not sent). */
  competition: string | null
}

export function vipEventView(e: VipEvent): VipEventView {
  return {
    club: e.hospitality.club,
    eventId: e.id,
    home: e.team1.name,
    away: e.team2.name,
    date: e.date,
    venue: e.venue.venue_name,
    city: e.hospitality.city,
    airport: e.hospitality.airports[0] ?? '',
    priceFrom: e.vip_price_from ? { amount: e.vip_price_from.price, currency: e.vip_price_from.currency_code } : null,
    image: vipClubPhoto(e.hospitality.club),
    cardImage: e.venue.venue_image || vipClubPhoto(e.hospitality.club),
    homeCrest: vipTeamCrest(e.team1.name) ?? vipSupplierCrest(e.team1.id),
    awayCrest: vipTeamCrest(e.team2.name) ?? vipSupplierCrest(e.team2.id),
    competition: e.tour?.name ?? null,
  }
}
