// lib/slug.ts
//
// Readable URLs for tournaments, teams and matches:
//   /tournament/premier-league
//   /team/manchester-united
//   /match/spanish-la-liga/real-madrid-vs-sevilla-fc-santiago-bernabeu-football-tickets/event/132072
//
// Deliberately dependency-free (no React, no Next, no app imports): the
// server pages, the sitemap, client components and the navbar search all
// import it, and every one of them has to produce byte-identical slugs.
//
// RULES
//   • slugify(): strip accents, "&" → "and", drop apostrophes, everything
//     else that isn't a-z/0-9 becomes a single "-".
//   • Catalogue slugs (teams, tournaments) are unique per catalogue. When two
//     names slugify to the same thing, the LOWEST id keeps the plain slug and
//     every later one gets "-<id>" appended. The index is built from the id
//     order, never the order the API happened to return, so the server and
//     the browser always agree.
//   • A slug that is all digits would collide with the old numeric URLs, so
//     it gets a prefix ("tournament-1899").
//   • The tournament segment of a MATCH url is plain slugify(tour.name) — it
//     is decorative (the page loads by the event id), so it needs no
//     catalogue and stays identical on the server and in every link.

/* ── Slugify ───────────────────────────────────────────────────────── */

/* Letters NFD does not split into "base + accent", so they would otherwise
   be dropped entirely (Lillestrøm → "lillestrm"). */
const FOLD: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
}

/** Lower-case, accent-free text with the special letters above folded. */
export function foldAscii(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[øæœßłđðþı]/g, (ch) => FOLD[ch] ?? ch)
}

/** "Brighton & Hove Albion" → "brighton-and-hove-albion",
 *  "Atlético Madrid" → "atletico-madrid", "Dall'Ara" → "dallara". */
export function slugify(text: string | null | undefined): string {
  if (!text) return ''
  return foldAscii(text)
    .replace(/&/g, ' and ')
    .replace(/['’‘`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* ── Catalogue index ───────────────────────────────────────────────── */

export interface SlugIndex {
  /** id → canonical slug */
  byId: ReadonlyMap<number, string>
  /** canonical slug → id */
  bySlug: ReadonlyMap<string, number>
  /** id → the plain slugify(name), before any "-<id>" suffix */
  baseById: ReadonlyMap<number, string>
}

export interface SlugSource {
  id: number
  name: string
}

/** Builds the canonical slug for every catalogue entry.
 *  `fallbackBase` is used for names that slugify to nothing (non-Latin
 *  script only) or to a bare number. */
export function buildSlugIndex(
  items: readonly SlugSource[],
  fallbackBase = 'item',
): SlugIndex {
  const byId = new Map<number, string>()
  const bySlug = new Map<string, number>()
  const baseById = new Map<number, string>()

  const sorted = [...items]
    .filter((it) => Number.isFinite(it.id))
    .sort((a, b) => a.id - b.id)

  for (const it of sorted) {
    if (byId.has(it.id)) continue // duplicate rows for one id
    let base = slugify(it.name) || fallbackBase
    if (/^\d+$/.test(base)) base = `${fallbackBase}-${base}`
    baseById.set(it.id, base)

    let slug = base
    if (bySlug.has(slug)) slug = `${base}-${it.id}`
    // Pathological case: "<base>-<id>" is already some other entry's plain
    // slug. Keep appending the id until it is unique.
    while (bySlug.has(slug)) slug = `${slug}-${it.id}`

    byId.set(it.id, slug)
    bySlug.set(slug, it.id)
  }

  return { byId, bySlug, baseById }
}

export function tournamentSlugIndex(
  list: readonly { tournament_id: number; name: string }[] | null | undefined,
): SlugIndex {
  return buildSlugIndex(
    (list ?? []).map((t) => ({ id: t.tournament_id, name: t.name })),
    'tournament',
  )
}

export function teamSlugIndex(
  list: readonly { team_id: number; name: string }[] | null | undefined,
): SlugIndex {
  return buildSlugIndex(
    (list ?? []).map((t) => ({ id: t.team_id, name: t.name })),
    'team',
  )
}

/* ── Resolving a route param ───────────────────────────────────────── */

export type CatalogueResolution =
  | { status: 'found'; id: number; slug: string }
  | { status: 'redirect'; id: number; slug: string }
  | { status: 'missing' }

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Words of a slug that can identify a club/competition: 3+ letters, not
 *  a bare number. Used to tell "manchester-utd-3" (redirect to id 3) apart
 *  from a stale "sc-paderborn-07" (must NOT redirect to whatever id 7 is). */
function significantWords(slug: string): Set<string> {
  return new Set(
    slug.split('-').filter((w) => w.length >= 3 && !/^\d+$/.test(w)),
  )
}

/** What a /tournament/<param> or /team/<param> URL points at.
 *   found    — param is exactly the canonical slug; render it.
 *   redirect — the old numeric id, the "<name>-<id>" link form, or a
 *              case/accent variant of a real slug; 308 to `slug`.
 *   missing  — nothing matches; 404. */
export function resolveCatalogueParam(
  rawParam: string,
  index: SlugIndex,
): CatalogueResolution {
  const param = safeDecode(rawParam).trim()
  if (!param) return { status: 'missing' }

  const exact = index.bySlug.get(param)
  if (exact != null) return { status: 'found', id: exact, slug: param }

  // "Premier-League", "atlético-madrid", "Manchester United" …
  const normalised = slugify(param)
  const loose = index.bySlug.get(normalised)
  if (loose != null) return { status: 'redirect', id: loose, slug: normalised }

  // Old numeric URL: /team/3
  if (/^\d+$/.test(param)) {
    const id = Number(param)
    const slug = index.byId.get(id)
    return slug ? { status: 'redirect', id, slug } : { status: 'missing' }
  }

  // "<name>-<id>" — the form links fall back to before the catalogue has
  // loaded. Only redirect when the words still look like that entry, so a
  // retired club whose name ends in a number cannot land on an unrelated one.
  const tail = normalised.match(/^(.*)-(\d+)$/)
  if (tail && !tail[2].startsWith('0')) {
    const id = Number(tail[2])
    const slug = index.byId.get(id)
    const base = index.baseById.get(id)
    if (slug && base) {
      const words = significantWords(tail[1])
      const own = significantWords(base)
      const related =
        tail[1] === '' ||
        tail[1] === base ||
        [...words].some((w) => own.has(w))
      if (related) return { status: 'redirect', id, slug }
    }
  }

  return { status: 'missing' }
}

/* ── Paths ─────────────────────────────────────────────────────────── */

export const TOURNAMENT_BASE = '/tournament'
export const TEAM_BASE = '/team'
export const MATCH_BASE = '/match'

/** Best link for a catalogue entry: the canonical slug when the index
 *  knows the id; otherwise "<name>-<id>" (redirects once to the canonical
 *  slug); otherwise the bare id (also redirects). */
function cataloguePath(
  base: string,
  index: SlugIndex | null | undefined,
  id: number,
  name?: string | null,
): string {
  const slug = index?.byId.get(id)
  if (slug) return `${base}/${slug}`
  const words = slugify(name)
  return words ? `${base}/${words}-${id}` : `${base}/${id}`
}

export function tournamentPath(
  index: SlugIndex | null | undefined,
  id: number,
  name?: string | null,
): string {
  return cataloguePath(TOURNAMENT_BASE, index, id, name)
}

export function teamPath(
  index: SlugIndex | null | undefined,
  id: number,
  name?: string | null,
): string {
  return cataloguePath(TEAM_BASE, index, id, name)
}

/** The parts of a fixture a match URL is built from (a MatchdayEvent fits). */
export interface MatchPathSource {
  id: number | string
  name?: string | null
  tour?: { name?: string | null } | null
  team1?: { name?: string | null } | null
  team2?: { name?: string | null } | null
  venue?: { venue_name?: string | null } | null
}

/** "real-madrid-vs-sevilla-fc-santiago-bernabeu-football-tickets" */
export function matchWordsSlug(m: MatchPathSource): string {
  const home = slugify(m.team1?.name)
  const away = slugify(m.team2?.name)
  const fixture = home && away ? `${home}-vs-${away}` : slugify(m.name)
  return [fixture, slugify(m.venue?.venue_name), 'football-tickets']
    .filter(Boolean)
    .join('-')
}

/** Canonical match URL:
 *    /match/<tournament>/<home>-vs-<away>-<venue>-football-tickets/event/<id>
 *  Without a tournament name it falls back to the short "/match/<name>-<id>"
 *  (or "/match/<id>"), which the match page 308s to the full address. */
export function matchPath(m: MatchPathSource): string {
  const id = String(m.id)
  const tour = slugify(m.tour?.name)
  const hasTeams = !!(m.team1?.name && m.team2?.name)
  if (tour && (hasTeams || m.name)) {
    return `${MATCH_BASE}/${tour}/${matchWordsSlug(m)}/event/${encodeURIComponent(id)}`
  }
  const words = hasTeams
    ? `${slugify(m.team1?.name)}-vs-${slugify(m.team2?.name)}`
    : slugify(m.name)
  return words
    ? `${MATCH_BASE}/${words}-${encodeURIComponent(id)}`
    : `${MATCH_BASE}/${encodeURIComponent(id)}`
}

/** Short form for links that only know an id and maybe a name. */
export function matchShortPath(id: number | string, name?: string | null): string {
  const words = slugify(name)
  const safe = encodeURIComponent(String(id))
  return words ? `${MATCH_BASE}/${words}-${safe}` : `${MATCH_BASE}/${safe}`
}

export type MatchParam =
  /** A real numeric event id was found in the URL. */
  | { kind: 'event'; id: number }
  /** Non-numeric id (demo data such as "wc1") — pass it through untouched. */
  | { kind: 'raw'; id: string }
  /** Not a match URL shape at all. */
  | { kind: 'invalid' }

/** Reads the event id out of the catch-all /match/[...slug] segments:
 *    ["127146"]                          → event 127146
 *    ["real-madrid-vs-sevilla-127146"]   → event 127146
 *    [tour, words, "event", "127146"]    → event 127146
 *    ["wc1"]                             → raw "wc1"            */
export function parseMatchSegments(segments: readonly string[]): MatchParam {
  const parts = segments.map(safeDecode).filter((s) => s !== '')
  if (!parts.length) return { kind: 'invalid' }

  const eventAt = parts.lastIndexOf('event')
  if (eventAt !== -1 && eventAt === parts.length - 2) {
    const id = parts[parts.length - 1]
    return /^\d+$/.test(id) ? { kind: 'event', id: Number(id) } : { kind: 'raw', id }
  }

  if (parts.length === 1) {
    const only = parts[0]
    if (/^\d+$/.test(only)) return { kind: 'event', id: Number(only) }
    const tail = only.match(/-(\d+)$/)
    if (tail) return { kind: 'event', id: Number(tail[1]) }
    return { kind: 'raw', id: only }
  }

  return { kind: 'invalid' }
}
