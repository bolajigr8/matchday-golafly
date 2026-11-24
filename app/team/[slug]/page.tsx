import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { canonical, canonicalForSlug, NO_INDEX } from '@/lib/seo'
import { teamSeo } from '@/lib/seo-copy'
import { getServerTeams } from '@/lib/matchday-server'
import {
  TEAM_BASE,
  resolveCatalogueParam,
  teamSlugIndex,
} from '@/lib/slug'
import type { MatchdayTeam } from '@/features/matchday/types'
import { JsonLd, teamSchema } from '@/lib/golafly-schema'
import { teamFixturePages, teamPageFixtures } from '@/lib/schema-data'
import { TeamPageClient } from './client'
import { TeamResolve } from './resolve'

/* /team/<slug> — e.g. /team/manchester-united.
 *
 * The slug is resolved to a team_id against GET /teams on the
 * server (lib/matchday-server.ts, cached for an hour):
 *   • exact canonical slug          → render
 *   • /team/3, /…/name-3, or a
 *     case/accent variant           → 308 to the canonical slug
 *   • anything else                 → 404
 *   • catalogue unreachable         → <TeamResolve>, which does the
 *                                     same lookup in the browser instead of
 *                                     showing a false 404.
 * `params` is a Promise in this version of Next and must be awaited. */

type Props = { params: Promise<{ slug: string }> }

type Lookup =
  | { status: 'unreachable' }
  | { status: 'missing' }
  | { status: 'found' | 'redirect'; slug: string; team: MatchdayTeam }

async function lookup(param: string): Promise<Lookup> {
  const list = await getServerTeams()
  if (!list) return { status: 'unreachable' }
  const r = resolveCatalogueParam(param, teamSlugIndex(list))
  if (r.status === 'missing') return r
  const team = list.find((t) => t.team_id === r.id)
  return team ? { status: r.status, slug: r.slug, team } : { status: 'missing' }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') {
    return {
      title: 'Team not found | Golafly',
      description: 'This team is not listed on Golafly.',
      robots: NO_INDEX,
    }
  }
  if (r.status === 'unreachable') {
    const own = canonicalForSlug(TEAM_BASE, slug)
    return {
      title: 'Team Tickets | Golafly',
      description: 'Browse all upcoming fixtures for this team and book tickets.',
      ...(own ? { alternates: own } : {}),
    }
  }

  const name = r.team.name
  const path = `${TEAM_BASE}/${r.slug}`
  // Club or national-team copy from the SEO brief (lib/seo-copy.ts).
  const { title, description } = teamSeo(name)
  return {
    title,
    description,
    alternates: canonical(path),
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: 'Golafly Matchday',
      // The club crest, not team.banner: the supplier's team photo carries
      // their ticket-site logo.
      // (Same CDN path as components/tickets/primitives.tsx teamCrestUrl —
      // that module is client-only, so it can't be called from here.)
      images: [
        { url: `https://cdn.footballticketnet.com/teams/${r.team.team_id}/logo.webp`, alt: name },
      ],
    },
  }
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') notFound()
  if (r.status === 'redirect') permanentRedirect(`${TEAM_BASE}/${r.slug}`)
  if (r.status === 'unreachable') {
    return (
      <Suspense fallback={null}>
        <TeamResolve param={slug} />
      </Suspense>
    )
  }

  // JSON-LD (SEO schema plan §7). Name/title/description from the same data
  // as generateMetadata; the ItemList is the fixtures the page shows on first
  // load, in the same order (left out if they can't be read on the server).
  const { title, description } = teamSeo(r.team.name)
  // Both read the same cached, request-deduplicated API pages.
  const [matches, initialPages] = await Promise.all([
    teamPageFixtures(r.team.team_id),
    teamFixturePages(r.team.team_id),
  ])
  return (
    <>
      <JsonLd
        data={teamSchema({
          slug: r.slug,
          name: r.team.name,
          metaTitle: title,
          metaDescription: description,
          matches,
        })}
      />
      <Suspense fallback={null}>
        {/* initialName / initialPages: the H1 and the first page of fixtures
            are in the server HTML instead of "Loading…" (SEO brief, Task 1). */}
        <TeamPageClient
          teamId={r.team.team_id}
          initialName={r.team.name}
          initialPages={initialPages ?? undefined}
        />
      </Suspense>
    </>
  )
}
