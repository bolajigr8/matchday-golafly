import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { canonical, canonicalForSlug, NO_INDEX } from '@/lib/seo'
import { tournamentSeo } from '@/lib/seo-copy'
import { getServerTournaments } from '@/lib/matchday-server'
import {
  TOURNAMENT_BASE,
  resolveCatalogueParam,
  tournamentSlugIndex,
} from '@/lib/slug'
import type { MatchdayTournament } from '@/features/matchday/types'
import { JsonLd, tournamentSchema } from '@/lib/golafly-schema'
import { tournamentFixturePage, tournamentPageFixtures } from '@/lib/schema-data'
import { TournamentPageClient } from './client'
import { TournamentResolve } from './resolve'

/* /tournament/<slug> — e.g. /tournament/premier-league.
 *
 * The slug is resolved to a tournament_id against GET /tournaments on the
 * server (lib/matchday-server.ts, cached for an hour):
 *   • exact canonical slug          → render
 *   • /tournament/1, /…/name-1, or a
 *     case/accent variant           → 308 to the canonical slug
 *   • anything else                 → 404
 *   • catalogue unreachable         → <TournamentResolve>, which does the
 *                                     same lookup in the browser instead of
 *                                     showing a false 404.
 * `params` is a Promise in this version of Next and must be awaited. */

type Props = { params: Promise<{ slug: string }> }

type Lookup =
  | { status: 'unreachable' }
  | { status: 'missing' }
  | { status: 'found' | 'redirect'; slug: string; tournament: MatchdayTournament }

async function lookup(param: string): Promise<Lookup> {
  const list = await getServerTournaments()
  if (!list) return { status: 'unreachable' }
  const r = resolveCatalogueParam(param, tournamentSlugIndex(list))
  if (r.status === 'missing') return r
  const tournament = list.find((t) => t.tournament_id === r.id)
  return tournament ? { status: r.status, slug: r.slug, tournament } : { status: 'missing' }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') {
    return {
      title: 'Tournament not found | Golafly',
      description: 'This competition is not listed on Golafly.',
      robots: NO_INDEX,
    }
  }
  if (r.status === 'unreachable') {
    const own = canonicalForSlug(TOURNAMENT_BASE, slug)
    return {
      title: 'Tournament Tickets | Golafly',
      description: 'Browse all upcoming fixtures in this competition and book tickets.',
      ...(own ? { alternates: own } : {}),
    }
  }

  const name = r.tournament.name
  const path = `${TOURNAMENT_BASE}/${r.slug}`
  // Copy from the SEO brief (lib/seo-copy.ts), 50–60 / 140–155 characters.
  const { title, description } = tournamentSeo(name)
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
      ...(r.tournament.banner ? { images: [{ url: r.tournament.banner, alt: name }] } : {}),
    },
  }
}

export default async function TournamentPage({ params }: Props) {
  const { slug } = await params
  const r = await lookup(slug)

  if (r.status === 'missing') notFound()
  if (r.status === 'redirect') permanentRedirect(`${TOURNAMENT_BASE}/${r.slug}`)
  if (r.status === 'unreachable') {
    return (
      <Suspense fallback={null}>
        <TournamentResolve param={slug} />
      </Suspense>
    )
  }

  // JSON-LD (SEO schema plan §8): CollectionPage + ItemList of the fixtures
  // shown on first load + breadcrumb. Never an Event for the league itself.
  const { title, description } = tournamentSeo(r.tournament.name)
  // Both read the same cached, request-deduplicated API page.
  const [matches, initialPage] = await Promise.all([
    tournamentPageFixtures(r.tournament.tournament_id),
    tournamentFixturePage(r.tournament.tournament_id),
  ])
  return (
    <>
      <JsonLd
        data={tournamentSchema({
          slug: r.slug,
          name: r.tournament.name,
          metaTitle: title,
          metaDescription: description,
          matches,
        })}
      />
      <Suspense fallback={null}>
        <TournamentPageClient
          tourId={r.tournament.tournament_id}
          initialName={r.tournament.name}
          initialPage={initialPage ?? undefined}
        />
      </Suspense>
    </>
  )
}
