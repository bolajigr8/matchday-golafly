// features/matchday/international.ts
//
// ============================================================================
// ⚠ FLAGGED STATIC DATA — see chat writeup for full context.
// ============================================================================
// `MatchdayTeam` and `MatchdayTournament` (features/matchday/types.ts) are
// only `{ id, name, banner }`. There is no `is_national`, no `country`, no
// `category` — nothing that would let us ask the backend "give me only the
// international teams/competitions" the way GET /teams and GET /tournaments
// already do for everything else on this site.
//
// footballticketnet.com's /international page (national teams + Nations
// League etc.) can't be reproduced from real data alone with the contract
// we have today. So this file hardcodes:
//   1. NATIONAL_TEAM_NAMES — country names we treat as "this row in
//      GET /teams is a national team, not a club".
//   2. INTERNATIONAL_TOURNAMENT_KEYWORDS — substrings that mark a row in
//      GET /tournaments as an international competition (World Cup, Euros,
//      Nations League, continental cups, qualifiers, etc.).
//
// Everything else about the resulting page IS real: the id, banner image,
// and link for every match found here comes straight from the live
// GET /teams / GET /tournaments catalogues (see app/international/client.tsx)
// — a country only shows up if the supplier's catalogue actually has a team
// or tournament whose name matches one of the strings below. This file only
// decides *which* real catalogue rows count as "international"; it does not
// invent ids, images, or fixtures.
//
// TO MAKE THIS FULLY BACKEND-DRIVEN: ask the backend team to add either
// - a `type: 'club' | 'national'` field on GET /teams, and/or
// - a `category: 'domestic' | 'international'` field on GET /tournaments
// and swap the matching below for a direct field check. Until then, this
// list needs manual upkeep whenever a new confederation/competition is
// added to the supplier's catalogue.

/** Same normalisation rule as features/matchday/resolve.ts's matcher, kept
 *  local so this file doesn't need to export internals from there. */
function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** ⚠ STATIC — curated list of country names we treat as national teams. */
export const NATIONAL_TEAM_NAMES: string[] = [
  'England', 'Wales', 'Scotland', 'Northern Ireland', 'Republic of Ireland', 'Ireland',
  'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Holland',
  'Belgium', 'Croatia', 'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Czechia',
  'Denmark', 'Sweden', 'Norway', 'Ukraine', 'Serbia', 'Turkey', 'Türkiye', 'Greece',
  'Hungary', 'Romania', 'Slovakia', 'Slovenia', 'Bosnia and Herzegovina', 'Albania',
  'Iceland', 'Finland', 'Russia', 'Georgia', 'Israel',
  'Brazil', 'Argentina', 'Uruguay', 'Colombia', 'Chile', 'Peru', 'Ecuador', 'Paraguay',
  'Venezuela', 'Bolivia',
  'United States', 'USA', 'Mexico', 'Canada', 'Costa Rica', 'Jamaica', 'Panama',
  'Nigeria', 'Ghana', 'Senegal', 'Morocco', 'Egypt', 'Algeria', 'Tunisia', 'Cameroon',
  'Ivory Coast', "Cote d'Ivoire", 'South Africa', 'Mali', 'DR Congo',
  'Japan', 'South Korea', 'Korea Republic', 'Saudi Arabia', 'Iran', 'Qatar',
  'Australia', 'New Zealand', 'China',
]

/** ⚠ STATIC — substrings that mark a GET /tournaments row as international. */
export const INTERNATIONAL_TOURNAMENT_KEYWORDS: string[] = [
  'world cup', 'nations league', 'euro', 'copa america', 'africa cup',
  'afcon', 'asian cup', 'gold cup', 'confederations cup', 'qualif',
  'friendly international', 'international friendlies',
]

const normalizedNationalNames = NATIONAL_TEAM_NAMES.map(normalize)
const normalizedTournamentKeywords = INTERNATIONAL_TOURNAMENT_KEYWORDS.map(normalize)

/** True if this GET /teams row's name matches one of the curated country names. */
export function isCuratedNationalTeamName(name: string): boolean {
  const n = normalize(name)
  if (!n) return false
  return normalizedNationalNames.some((c) => n === c || n.includes(c) || c.includes(n))
}

/** True if this GET /tournaments row's name contains one of the curated keywords. */
export function isCuratedInternationalTournamentName(name: string): boolean {
  const n = normalize(name)
  if (!n) return false
  return normalizedTournamentKeywords.some((k) => n.includes(k))
}
