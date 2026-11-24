import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NO_INDEX } from '@/lib/seo'
import { SITES, siteByKey, siteOrigin } from '@/lib/sites'
import { getServerTournaments } from '@/lib/matchday-server'
import { pickTournament } from '@/features/matchday/resolve'
import LandingClient from './client'

/* A landing site: one page per competition, reached through its own hostname
 * (championsleague.golafly.com …) — proxy.ts rewrites "/" on those hosts to
 * /lp/<key>. This route is not reachable directly; see lib/sites.ts.
 *
 * Only the three keys in SITES exist; any other /lp/<x> is a 404. The tournament
 * id is looked up here on the server (GET /tournaments, cached for an hour) so
 * the page can start fetching fixtures straight away; if the API is
 * unreachable the browser looks it up instead (features/landing/scope.tsx). */

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(SITES).map((site) => ({ site }))
}

type Props = { params: Promise<{ site: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: key } = await params
  const site = siteByKey(key)
  if (!site) return { title: 'Not found', robots: NO_INDEX }

  const url = `${siteOrigin(site.key)}/`
  // Landing pages stay out of search results until launch: flip
  // NEXT_PUBLIC_LANDING_INDEXABLE=true in the production build to allow them.
  const indexable = process.env.NEXT_PUBLIC_LANDING_INDEXABLE === 'true'

  return {
    title: site.seoTitle,
    description: site.seoDescription,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : NO_INDEX,
    openGraph: {
      title: site.seoTitle,
      description: site.seoDescription,
      url,
      type: 'website',
      siteName: 'Golafly Matchday',
    },
  }
}

export default async function LandingPage({ params }: Props) {
  const { site: key } = await params
  const site = siteByKey(key)
  if (!site) notFound()

  const tournaments = await getServerTournaments()
  const tournament = pickTournament(tournaments ?? undefined, site.tournamentName)

  // No page-wide <Suspense>: the only thing here that reads the URL's search
  // parameters is the fixtures list, which has its own boundary. Wrapping the
  // whole page would leave the server-rendered HTML empty until JavaScript
  // loads, which is what an ad visitor on a phone would stare at.
  return (
    <LandingClient
      siteKey={site.key}
      tourId={tournament?.tournament_id ?? null}
      tourName={tournament?.name ?? site.tournamentName}
    />
  )
}
