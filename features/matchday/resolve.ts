// features/matchday/resolve.ts
//
// Shared "display name -> real id" lookup for tournaments/teams sourced
// from the GET /tournaments and GET /teams catalogues (doc §03). Every
// place in the UI that lets someone pick a competition or club by name —
// the navbar, the /matches hero search, the trending chips, the teams
// strip — needs to turn that name into the tournament_id/team_id that
// GET /events actually filters on. This is the one place that does it,
// so the matching rules only need to be right once.
//
// Matching is intentionally forgiving (case/diacritic/whitespace
// insensitive, either side may be a substring of the other) because the
// names hardcoded in our nav/UI copy ("Champions League") won't always be
// byte-identical to whatever the supplier calls it right now ("UEFA
// Champions League 2026/27"). It is NOT fuzzy in the typo-tolerant sense —
// it won't match "Barca" to "FC Barcelona" — just tolerant of the supplier
// prefixing/suffixing/rewording their own catalogue names over time.

import type { MatchdayTeam, MatchdayTournament } from './types'

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (Atlético -> Atletico)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// was: function namesMatch(a: string, b: string): boolean {
export function namesMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** Resolve a display name (e.g. "Champions League", "World Cup 2026") to
 *  its tournament_id from the GET /tournaments catalogue. Returns
 *  undefined if the catalogue hasn't loaded yet or nothing matches —
 *  callers should fall back to an unfiltered /matches link rather than a
 *  dead one in that case. */
/* Tags that mark a competition as something other than the main one a
   nav label means. A candidate carrying a tag the query did not ask for is
   dropped ("Champions League" must not resolve to the Women's/Asian/
   qualifying version, "La Liga" must not resolve to La Liga Hypermotion). */
const TOURNAMENT_TAGS: [string, RegExp][] = [
  ['women', /\b(women|womens|woman|wsl|feminin\w*|femenin\w*)\b/],
  ['asia', /\b(asia|asian|afc)\b/],
  ['africa', /\b(caf|africa|african)\b/],
  ['concacaf', /\b(concacaf|gold cup)\b/],
  ['conmebol', /\b(conmebol|south america\w*|copa america|libertadores)\b/],
  ['youth', /\b(youth|junior|juniors|u ?(1[5-9]|2[0-3])|under ?(1[5-9]|2[0-3]))\b/],
  ['qualif', /\bqualif\w*/],
  ['hypermotion', /\b(hypermotion|segunda|smartbank|laliga 2|la liga 2|liga 2|liga ii)\b/],
  ['lower', /\b(serie [bc]|ligue 2|2 bundesliga|bundesliga 2|championship|league (one|two)|national league)\b/],
  ['supercup', /\bsuper ?cup\b/],
  ['friendly', /\bfriendl\w*/],
]

function tournamentTags(name: string): Set<string> {
  const n = normalize(name)
  return new Set(TOURNAMENT_TAGS.filter(([, re]) => re.test(n)).map(([t]) => t))
}

/** Best catalogue entry for a display name, or undefined. Exact name wins;
 *  otherwise the closest name that does not carry a tag the query lacks
 *  (and carries every tag the query has). Returns undefined rather than a
 *  wrong competition. */
export function pickTournament<T extends { name: string }>(
  list: T[] | undefined,
  name: string,
): T | undefined {
  if (!list?.length) return undefined
  const qn = normalize(name)
  if (!qn) return undefined
  const qTags = tournamentTags(name)
  const candidates = list.filter((t) => {
    if (!namesMatch(t.name, name)) return false
    const tags = tournamentTags(t.name)
    for (const tag of tags) if (!qTags.has(tag)) return false
    for (const tag of qTags) if (!tags.has(tag)) return false
    return true
  })
  if (!candidates.length) return undefined
  const rank = (t: T) => {
    const cn = normalize(t.name)
    return (cn === qn ? 0 : 1000) + (cn.includes(qn) ? 0 : 100) + Math.abs(cn.length - qn.length)
  }
  return [...candidates].sort((a, b) => rank(a) - rank(b))[0]
}

/** Resolve a display name (e.g. "Champions League", "La Liga", "World Cup
 *  2026") to its tournament_id from the GET /tournaments catalogue. Returns
 *  undefined if the catalogue hasn't loaded or nothing suitable matches —
 *  callers fall back to an unfiltered link rather than a wrong one. */
export function findTournamentIdByName(
  tournaments: MatchdayTournament[] | undefined,
  name: string,
): number | undefined {
  return pickTournament(tournaments, name)?.tournament_id
}

/* Club nicknames / short forms our UI copy uses that are NOT a substring
   of what the supplier calls the club. The plain substring rule in
   namesMatch() can't bridge these: "Paris SG" is not contained in "Paris
   Saint-Germain" (nor the reverse), which is exactly why the PSG tile on
   /matches never resolved to a team_id and showed no crest. Every alias
   group lists the names that mean the same club; the first entry is the
   supplier's canonical spelling. */
const TEAM_ALIASES: string[][] = [
  ['Paris Saint-Germain', 'Paris Saint Germain', 'Paris SG', 'PSG', 'Paris St Germain', 'Paris St-Germain'],
  ['Inter Milan', 'Inter', 'Internazionale', 'FC Internazionale Milano', 'Inter Milano'],
  ['Manchester United', 'Man United', 'Man Utd', 'Manchester Utd'],
  ['Manchester City', 'Man City'],
  ['Tottenham Hotspur', 'Tottenham', 'Spurs'],
  ['Bayern Munich', 'Bayern München', 'Bayern Munchen', 'FC Bayern', 'FC Bayern Munich'],
  ['Atletico Madrid', 'Atlético Madrid', 'Atletico de Madrid', 'Atlético de Madrid'],
  ['FC Barcelona', 'Barcelona', 'Barca'],
  ['Borussia Dortmund', 'Dortmund', 'BVB'],
  ['Wolverhampton Wanderers', 'Wolves'],
]

/* Tags that mark a club entry as a different squad from the senior men's
   team ("Arsenal" must never resolve to "Arsenal Women"). */
const TEAM_TAG_RE = /\b(women|womens|ladies|feminin\w*|femenin\w*|u ?(1[5-9]|2[0-3])|youth|reserves?|ii|b)\b/

function aliasesFor(name: string): string[] {
  const n = normalize(name)
  const group = TEAM_ALIASES.find((g) => g.some((a) => normalize(a) === n))
  return group ? group : [name]
}

/** Best catalogue entry for a club display name, or undefined.
 *  Order of preference: exact name (or exact alias) → substring match on
 *  any alias, closest length first. Women/youth/B squads are skipped
 *  unless the query itself asks for one. Previously this was a bare
 *  `teams.find(namesMatch)`, which (a) missed aliases like "Paris SG" and
 *  (b) returned whichever substring hit came first in the catalogue. */
export function pickTeam<T extends { name: string }>(
  list: T[] | undefined,
  name: string,
): T | undefined {
  if (!list?.length || !normalize(name)) return undefined
  const names = aliasesFor(name)
  const wanted = new Set(names.map(normalize))
  const queryTagged = TEAM_TAG_RE.test(normalize(name))

  const exact = list.find((t) => wanted.has(normalize(t.name)))
  if (exact) return exact

  const candidates = list.filter((t) => {
    if (!queryTagged && TEAM_TAG_RE.test(normalize(t.name))) return false
    return names.some((a) => namesMatch(t.name, a))
  })
  if (!candidates.length) return undefined
  const target = normalize(names[0]).length
  return [...candidates].sort(
    (a, b) =>
      Math.abs(normalize(a.name).length - target) -
      Math.abs(normalize(b.name).length - target),
  )[0]
}

/** Resolve a display name (e.g. "Real Madrid", "PSG") to its team_id from
 *  the GET /teams catalogue. Same fallback contract as above. */
export function findTeamIdByName(
  teams: MatchdayTeam[] | undefined,
  name: string,
): number | undefined {
  return pickTeam(teams, name)?.team_id
}

export function findTeamNameById(
  teams: MatchdayTeam[] | undefined,
  id: number | null | undefined,
): string | undefined {
  if (id == null) return undefined
  return teams?.find((t) => t.team_id === id)?.name
}

export function findTournamentNameById(
  tournaments: MatchdayTournament[] | undefined,
  id: number | null | undefined,
): string | undefined {
  if (id == null) return undefined
  return tournaments?.find((t) => t.tournament_id === id)?.name
}

/* ── Free-text search resolution ─────────────────────────────────── */

export interface ResolvedSearch {
  /** Free text sent as event_name (substring match on the fixture). */
  q?: string
  tourId?: number
  teamId?: number
  homeName?: string
  awayName?: string
}

function tokenMatches<T extends { name: string }>(list: T[] | undefined, text: string): T[] {
  const tokens = normalize(text).split(' ').filter(Boolean)
  if (!list || !tokens.length) return []
  return list.filter((item) => {
    const words = normalize(item.name).split(' ')
    return tokens.every((t) => words.some((w) => w.startsWith(t)))
  })
}

/** Turn what someone typed into the most precise /events filter we can:
 *  "Arsenal v Leeds" -> home/away, "premier" -> tour_id, "arsenal" ->
 *  team_id (matches home AND away games), anything ambiguous or unknown
 *  -> event_name so the server can still try. */
export function resolveSearchQuery(
  raw: string,
  teams: MatchdayTeam[] | undefined,
  tournaments: MatchdayTournament[] | undefined,
): ResolvedSearch {
  const text = raw.trim().replace(/\s+/g, ' ')
  if (!text) return {}

  const vs = text.match(/^(.+?)\s+(?:vs\.?|v\.?|versus|-|\u2013)\s+(.+)$/i)
  if (vs) return { homeName: vs[1].trim(), awayName: vs[2].trim() }

  const n = normalize(text)
  const exactTour = tournaments?.find((t) => normalize(t.name) === n) ?? pickTournament(tournaments, text)
  if (exactTour) return { tourId: exactTour.tournament_id }
  const exactTeam = teams?.find((t) => normalize(t.name) === n)
  if (exactTeam) return { teamId: exactTeam.team_id }

  const teamHits = tokenMatches(teams, text)
  if (teamHits.length === 1) return { teamId: teamHits[0].team_id }
  const tourHits = tokenMatches(tournaments, text)
  if (tourHits.length > 0 && teamHits.length === 0) {
    const best = pickTournament(tourHits, text)
    if (best) return { tourId: best.tournament_id }
  }

  return { q: text }
}

/* ── /matches search URLs ────────────────────────────────────────── */

/** Builds a /matches URL carrying the query params LiveFixturesSection
 *  reads (components/matches/live-fixtures-section.tsx): `q` for free text
 *  (-> event_name), `tour_id` / `team_id` for a resolved competition or
 *  club, `home_name`/`away_name` for a specific pairing and `date`
 *  (YYYY-MM-DD) for a single day. There is no dedicated results page —
 *  GET /events is the only endpoint that returns fixtures, so every search
 *  lands on the same live grid, pre-filtered. */
export function buildMatchesSearchUrl(params: {
  q?: string
  tourId?: number
  teamId?: number
  homeTeamName?: string
  awayTeamName?: string
  date?: string
}): string {
  const usp = new URLSearchParams()
  if (params.q) usp.set('q', params.q)
  if (params.tourId) usp.set('tour_id', String(params.tourId))
  if (params.teamId) usp.set('team_id', String(params.teamId))
  if (params.homeTeamName) usp.set('home_name', params.homeTeamName)
  if (params.awayTeamName) usp.set('away_name', params.awayTeamName)
  if (params.date) usp.set('date', params.date)
  const qs = usp.toString()
  return `/matches${qs ? `?${qs}` : ''}#matches`
}
