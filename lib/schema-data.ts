// lib/schema-data.ts
//
// Server-side data for the JSON-LD builders in lib/golafly-schema.tsx.
// Uses the SAME sources as the pages and their generateMetadata
// (lib/matchday-server.ts, cached + request-deduplicated), so the schema can
// never drift from what the visitor sees. Every fetch fails soft: when data
// can't be read, the matching ItemList is left out — never an empty list.

import type { Metadata } from 'next'
import {
  getServerEventsPage,
  getServerTeams,
  getServerTournaments,
  type ServerEventsPage,
} from '@/lib/matchday-server'
import { matchPath, teamSlugIndex, tournamentSlugIndex } from '@/lib/slug'
import { countryCodeFromName } from '@/lib/match-destinations'
import { venueAddress } from '@/lib/venue-addresses'
import { compareEventDates, isTimeTba } from '@/features/matchday/format'
import type { MatchdayEvent } from '@/features/matchday/types'
import type { ListEntry, MatchSchemaInput } from '@/lib/golafly-schema'

/** Title + description strings out of a page's Next metadata object. */
export function metaText(m: Metadata): { metaTitle: string; metaDescription?: string } {
  const t = m.title
  const metaTitle =
    typeof t === 'string'
      ? t
      : t && typeof t === 'object' && 'absolute' in t && t.absolute
        ? t.absolute
        : t && typeof t === 'object' && 'default' in t
          ? t.default
          : ''
  return { metaTitle, metaDescription: m.description ?? undefined }
}

/** "Home vs Away" — the event name format the SEO plan requires. */
export function fixtureName(e: Pick<MatchdayEvent, 'team1' | 'team2' | 'name'>): string {
  return e.team1?.name && e.team2?.name ? `${e.team1.name} vs ${e.team2.name}` : e.name
}

/** Everything matchSchema() needs, read from the event the page renders. */
export async function matchSchemaInput(
  e: MatchdayEvent,
  path: string,
  seo: { title: string; description?: string },
): Promise<MatchSchemaInput> {
  const [teams, tours] = await Promise.all([getServerTeams(), getServerTournaments()])
  // Link a team / league only when its page exists (it is in the catalogue
  // the /team and /tournament routes resolve against). Greek Cup is 404 today
  // because it isn't in /tournaments — so it drops out on its own.
  const teamIdx = teams ? teamSlugIndex(teams) : null
  const tourIdx = tours ? tournamentSlugIndex(tours) : null

  const raw = e.date ?? ''
  const dm = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/)
  const date = dm ? dm[1] : null
  const time = dm && dm[2] && !isTimeTba(raw) ? dm[2] : null
  // Street + postal code: not in the API, supplied by the SEO team per venue.
  const address = venueAddress(e.venue?.venue_id)

  return {
    path,
    metaTitle: seo.title,
    metaDescription: seo.description,
    home: e.team1.name,
    away: e.team2.name,
    homeSlug: teamIdx?.byId.get(e.team1.id),
    awaySlug: teamIdx?.byId.get(e.team2.id),
    venue: e.venue?.venue_name || undefined,
    city: e.venue?.venue_city_name || undefined,
    street: address.streetAddress,
    postalCode: address.postalCode,
    countryCode: countryCodeFromName(e.venue?.venue_country_name) || undefined,
    date,
    timeLocal: time,
    status: e.postponed ? 'postponed' : 'scheduled',
    // Same "from" price + currency the match page shows (features/builder/match.ts).
    price: e.min_price?.price ?? null,
    currency: e.min_price?.currency_code || null,
    leagueName: e.tour?.name || undefined,
    leagueSlug: e.tour?.id != null ? tourIdx?.byId.get(e.tour.id) : undefined,
    image: e.venue?.venue_image || e.team1?.image || e.team2?.image || null,
  }
}

const toEntry = (e: MatchdayEvent): ListEntry => ({ path: matchPath(e), name: fixtureName(e) })

/** Fixtures per page on the team page (app/team/[slug]/client.tsx PER_PAGE). */
export const TEAM_FIXTURES_PER_PAGE = 100
/** Fixtures per page on the tournament page (app/tournament/[slug]/client.tsx). */
export const TOURNAMENT_FIXTURES_PER_PAGE = 50

/** Page 1 of a team's home and away fixtures: rendered into the team page's
 *  server HTML (SEO brief, Task 1) and listed in its JSON-LD. Null when the
 *  API can't be reached; the browser then loads them as before. */
export async function teamFixturePages(
  teamId: number,
): Promise<{ home: ServerEventsPage; away: ServerEventsPage } | null> {
  const n = TEAM_FIXTURES_PER_PAGE
  const [home, away] = await Promise.all([
    getServerEventsPage(`home_team_id=${teamId}&per_page=${n}&page=1`, n),
    getServerEventsPage(`away_team_id=${teamId}&per_page=${n}&page=1`, n),
  ])
  return home && away ? { home, away } : null
}

/** Page 1 of a tournament's fixtures (same use as teamFixturePages). */
export function tournamentFixturePage(tourId: number): Promise<ServerEventsPage | null> {
  const n = TOURNAMENT_FIXTURES_PER_PAGE
  return getServerEventsPage(`tour_id=${tourId}&per_page=${n}&page=1`, n)
}

/** The fixtures a team page shows on first load, in the same order:
 *  page 1 of home + away (100 each, app/team/[slug]/client.tsx), merged,
 *  sorted by date, then ticketed → coming soon → postponed. */
export async function teamPageFixtures(teamId: number): Promise<ListEntry[]> {
  const pages = await teamFixturePages(teamId)
  if (!pages) return []
  const map = new Map<number, MatchdayEvent>()
  for (const e of pages.home.events) map.set(e.id, e)
  for (const e of pages.away.events) map.set(e.id, e)
  const all = Array.from(map.values()).sort((a, b) => compareEventDates(a.date, b.date))
  const ticketed = all.filter((e) => !e.postponed && e.min_price?.price != null)
  const soon = all.filter((e) => !e.postponed && e.min_price?.price == null)
  const postponed = all.filter((e) => e.postponed)
  return [...ticketed, ...soon, ...postponed].map(toEntry)
}

/** The fixtures a tournament page shows on first load: page 1 (50 per page,
 *  API order, app/tournament/[slug]/client.tsx), ticketed then coming soon.
 *  Postponed fixtures aren't rendered there, so they aren't listed here. */
export async function tournamentPageFixtures(tourId: number): Promise<ListEntry[]> {
  const res = await tournamentFixturePage(tourId)
  if (!res) return []
  const page = res.events
  const ticketed = page.filter((e) => e.min_price?.price != null && !e.postponed)
  const soon = page.filter((e) => e.min_price?.price == null && !e.postponed)
  return [...ticketed, ...soon].map(toEntry)
}

/** /teams and /tournaments: the A–Z directory's default view (no letter
 *  picked) is every entry, sorted by name, linked to its canonical slug. */
export async function teamDirectoryEntries(): Promise<ListEntry[]> {
  const teams = await getServerTeams()
  if (!teams) return []
  const idx = teamSlugIndex(teams)
  return [...teams]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((t) => {
      const slug = idx.byId.get(t.team_id)
      return slug ? [{ path: `/team/${slug}`, name: t.name }] : []
    })
}

export async function tournamentDirectoryEntries(): Promise<ListEntry[]> {
  const tours = await getServerTournaments()
  if (!tours) return []
  const idx = tournamentSlugIndex(tours)
  return [...tours]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((t) => {
      const slug = idx.byId.get(t.tournament_id)
      return slug ? [{ path: `/tournament/${slug}`, name: t.name }] : []
    })
}

/** Blog dates as YYYY-MM-DD (Sanity sends a date or an ISO timestamp). */
export function isoDate(v: string | null | undefined): string | undefined {
  if (!v) return undefined
  const m = v.match(/^\d{4}-\d{2}-\d{2}/)
  if (m) return m[0]
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10)
}

/** "By Jane Doe" → "Jane Doe"; the house byline ("By Golafly Team") → undefined
 *  so the Organization is used as author (never an invented person). */
export function bylineAuthor(byline: string | null | undefined): string | undefined {
  const name = (byline ?? '').replace(/^\s*by\s+/i, '').trim()
  if (!name || /golafly/i.test(name)) return undefined
  return name
}
