import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { canonical, NO_INDEX } from '@/lib/seo'
import { matchSeo } from '@/lib/seo-copy'
import { getServerEvent } from '@/lib/matchday-server'
import { MATCH_BASE, matchPath, parseMatchSegments } from '@/lib/slug'
import { isMatchdayLive } from '@/features/matchday/config'
import {
  formatKickoffTime,
  isTimeTba,
  parseEventDate,
} from '@/features/matchday/format'
import type { MatchdayEvent } from '@/features/matchday/types'
import { JsonLd, matchSchema } from '@/lib/golafly-schema'
import { matchSchemaInput } from '@/lib/schema-data'
import { MatchDetailClient } from './client'

/* /match/<tournament>/<home>-vs-<away>-<venue>-football-tickets/event/<id>
 *
 * Catch-all, because the canonical address has several segments. The page
 * loads by the number after /event/ only — the words are for people and
 * search engines. Older forms 308 to the full address, built from the event
 * that GET /events?id= returns:
 *   /match/127146, /match/<name>-127146, or the right id with wrong words.
 * Every id is passed through untouched when live tickets are switched off
 * (demo mode). With live tickets, a non-numeric id (old demo data such as
 * /match/wc1) is a 404.
 *
 * SEO brief (Nov 2026), Tasks 1 and 2:
 *  • The match details (H1, date, kick-off, venue, competition, About This
 *    Match, stadium) are rendered from the server's event, so they are in
 *    the HTML crawlers read, not filled in later by the browser.
 *  • If the API can't be reached even after retries (lib/matchday-server.ts)
 *    the page fails with a 500, which Google retries later. It never renders
 *    a generic "Match Tickets | Golafly" page with HTTP 200 any more.
 *  • The page is cached (ISR, `revalidate` below): Next sends
 *    `Cache-Control: s-maxage=300, stale-while-revalidate`, crawler bursts
 *    are served from the cache, and if a refresh fails the last good copy
 *    keeps being served.
 * `params` is a Promise in this version of Next and must be awaited. */

type Props = { params: Promise<{ slug: string[] }> }

/** Seconds a rendered match page is served from the cache before it is
 *  refreshed in the background. */
export const revalidate = 300

/** No match is rendered at build time; each one is rendered on its first
 *  request and then cached (see `revalidate`). */
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return []
}

type Lookup =
  | { status: 'missing' }
  | { status: 'passthrough'; id: string }
  | { status: 'found' | 'redirect'; path: string; event: MatchdayEvent }

/** Thrown when the API can't be reached: the page answers 500, never a
 *  generic page with 200. */
class MatchUnavailableError extends Error {
  constructor(id: number) {
    super(`Match ${id}: the MatchDay API could not be reached`)
    this.name = 'MatchUnavailableError'
  }
}

function decode(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

async function lookup(segments: string[]): Promise<Lookup> {
  const parsed = parseMatchSegments(segments)

  if (!isMatchdayLive()) {
    // Demo mode: the old single-segment /match/<id> keeps working as-is.
    if (segments.length === 1)
      return { status: 'passthrough', id: decode(segments[0]) }
    if (parsed.kind === 'invalid') return { status: 'missing' }
    return { status: 'passthrough', id: String(parsed.id) }
  }

  if (parsed.kind === 'invalid' || parsed.kind === 'raw') return { status: 'missing' }

  const r = await getServerEvent(parsed.id)
  if (r.status === 'missing') return { status: 'missing' }
  if (r.status === 'unreachable') throw new MatchUnavailableError(parsed.id)

  const path = matchPath(r.event)
  const current = `${MATCH_BASE}/${segments.map(decode).join('/')}`
  return {
    status: current === path ? 'found' : 'redirect',
    path,
    event: r.event,
  }
}

/** Title + description from the SEO brief (lib/seo-copy.ts). The date and
 *  kick-off come from the same helpers the page uses, so they cannot differ
 *  from what the visitor sees. */
function seoFor(e: MatchdayEvent) {
  const parsed = parseEventDate(e.date)
  const kickoff = isTimeTba(e.date) ? null : formatKickoffTime(e.date)
  return matchSeo({
    home: e.team1.name,
    away: e.team2.name,
    tournament: e.tour?.name,
    venue: e.venue?.venue_name,
    city: e.venue?.venue_city_name,
    date: Number.isNaN(parsed.getTime()) ? null : parsed,
    kickoff: kickoff === 'TBA' ? null : kickoff,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') {
    return {
      title: 'Match not found | Golafly',
      description: 'This fixture is not listed on Golafly.',
      robots: NO_INDEX,
    }
  }
  if (r.status === 'passthrough') {
    // Demo mode only (live tickets switched off).
    return {
      title: 'Match Tickets | Golafly',
      description:
        'Buy football match tickets on Golafly. Compare seats from verified sellers and book securely with our 150% order guarantee. Book flights and hotels too.',
      alternates: canonical(`${MATCH_BASE}/${encodeURIComponent(r.id)}`),
    }
  }

  const e = r.event
  const { title, description } = seoFor(e)
  return {
    title,
    description,
    alternates: canonical(r.path),
    openGraph: {
      title,
      description,
      url: r.path,
      type: 'website',
      siteName: 'Golafly Matchday',
      ...(e.venue.venue_image
        ? { images: [{ url: e.venue.venue_image, alt: e.venue.venue_name }] }
        : {}),
    },
  }
}

export default async function MatchDetailPage({ params }: Props) {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') notFound()
  if (r.status === 'redirect') permanentRedirect(r.path)
  if (r.status === 'passthrough') return <MatchDetailClient id={r.id} />
  // JSON-LD (SEO schema plan §6): built on the server from the same event and
  // the same title/description as generateMetadata, so it is in the raw HTML.
  // Only for a verified event — never on the generic fallback pages above.
  const { title, description } = seoFor(r.event)
  const schema = matchSchema(
    await matchSchemaInput(r.event, r.path, { title, description }),
  )
  return (
    <>
      <JsonLd data={schema} />
      {/* initialEvent: the match details are rendered on the server. */}
      <MatchDetailClient id={String(r.event.id)} initialEvent={r.event} />
    </>
  )
}
