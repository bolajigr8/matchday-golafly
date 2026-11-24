import type { MetadataRoute } from 'next'
import { getAllBlogSlugs } from '@/sanity/queries'
import { getInternshipPositions } from '@/sanity/internship'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { SITE_URL } from '@/lib/seo'
import { readSnapshot, writeSnapshot, SNAPSHOT_MAX_AGE_MS } from '@/lib/sitemap-snapshot'
import { matchPath, teamPath, teamSlugIndex, tournamentPath, tournamentSlugIndex, type MatchPathSource } from '@/lib/slug'

/**
 * Sitemap for golafly.com (served at /sitemap.xml).
 *
 * Replaces the old repo's sitemap, whose URLs (/trial-showcase, /faq,
 * /academy …) no longer exist here. Every URL below is exactly the page's
 * canonical (lib/seo.ts): https://golafly.com, no query string, no
 * trailing slash except the homepage. Login, checkout and account pages
 * are left out on purpose — they are noindex. So is /scouting-camp (a
 * noindex Google Ads landing page, per the client's brief).
 *
 * Rebuilt at most every 10 minutes. Each data source is wrapped in `safe`
 * with a time limit, so a CMS outage — or a slow API — drops that section
 * instead of breaking the file or the build. The match API lists (matches,
 * teams, tournaments) are different: if one fails or looks incomplete, the
 * last good list is reused (see `lastGood` below), never an empty one.
 *
 * SEO brief (Nov 2026), Task 4: every URL here must return 200. Matches come
 * from the same API the match page loads from, and both the file and the API
 * answers it is built from are refreshed every 10 minutes (it used to be up
 * to two hours), so a match the API has dropped leaves the sitemap quickly.
 * No `lastModified`: we don't know when a page's content really changed, and
 * the brief says to leave it out rather than send the rebuild time.
 */
export const revalidate = 600

/** How long one API answer may be reused. The same as `revalidate`: Next
 *  rebuilds the file as often as its shortest-lived data allows anyway. */
const API_REVALIDATE_S = 600

const STATIC: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/matches', changeFrequency: 'daily', priority: 0.9 },
  { path: '/tournaments', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/teams', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/international', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/program/football-tourism', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/program/player-management', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/program/sports-marketing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/tourism/trials', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/apply-now', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/stays', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/flights', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/help-faqs', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/internship', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/travel/blog', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/refund', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/terms', changeFrequency: 'yearly', priority: 0.3 },
]

/** Time limit per data source. All sources run at the same time, so the
 *  whole sitemap finishes in about this long even if an API hangs — well
 *  inside Next's 60-second build limit for a page. */
const SOURCE_TIMEOUT_MS = 20_000
/** Matches / teams / tournaments, retries included. */
const API_LIST_TIMEOUT_MS = 45_000

/** Runs one data source with a time limit. If it fails or is too slow,
 *  that section is left out and ONE line is logged (not the whole error
 *  object). The rest of the sitemap still builds. */
async function safe<T>(name: string, fn: () => Promise<T>, fallback: T, limitMs = SOURCE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${limitMs / 1000}s`)), limitMs)
      }),
    ])
  } catch (err) {
    console.warn(`[sitemap] skipped ${name}: ${err instanceof Error ? err.message : String(err)}`)
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

/* ── Matchday API (plain fetch: the shared axios client is browser-only) ── */

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

async function matchday<T>(path: string): Promise<{ data: T; meta?: { total_events?: number } }> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN
  const res = await fetch(`${API}/api/v1/matchday${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Never wait on a single request longer than the whole source may take.
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    next: { revalidate: API_REVALIDATE_S },
  })
  if (!res.ok) throw new Error(`${path} returned ${res.status}`)
  const json = await res.json()
  if (!json?.success) throw new Error(`${path} returned an unsuccessful response`)
  return json
}

const PER_PAGE = 100
// Safety cap only. It was 10 (1,000 fixtures) and the catalogue outgrew it:
// the Nov 2026 SEO re-crawl found match pages linked from the site but
// missing from the sitemap. 50 pages = 5,000 fixtures, far under the 50,000
// URLs one sitemap file may hold; only the pages that exist are fetched.
const MAX_PAGES = 50

/** One API call, tried up to 3 times (the match API fails in bursts). */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown
  for (const wait of [0, 1_000, 3_000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait))
    try {
      return await fn()
    } catch (err) {
      last = err
    }
  }
  throw last
}

/** Upcoming fixtures (just the fields a match URL is built from). Page 1
 *  tells us the total; the remaining pages are then fetched all at once
 *  rather than one after another. All or nothing: if any page still fails
 *  after retries this throws, so the last good list is used instead of a
 *  sitemap with part of the matches missing. */
async function upcomingEvents(): Promise<MatchPathSource[]> {
  const d = new Date()
  const from = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  const page = (n: number) =>
    withRetry(() => matchday<MatchPathSource[]>(`/events?from_date=${from}&per_page=${PER_PAGE}&page=${n}`))

  const first = await page(1)
  const total = first.meta?.total_events ?? first.data.length
  const pages = Math.min(MAX_PAGES, Math.ceil(total / PER_PAGE))
  const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => page(i + 2)))
  return [first, ...rest].flatMap((r) => r.data)
}

/* ── Keep the last good lists (SEO, 10 Nov 2026) ────────────────────────────
   The live sitemap once went from 1,000 match URLs to 0 because it was
   rebuilt while the match API failed. Now each API list (matches, teams,
   tournaments) replaces the saved one only when it looks complete:
     • it loaded, and is not empty, and
     • it is not less than half the size of the last good list.
   Otherwise the last good list (saved on disk, lib/sitemap-snapshot.ts) is
   used. With no usable saved list, a rebuild on the live server THROWS:
   Next.js then keeps serving the previous sitemap and tries again on the
   next request. Only a build with nothing saved yet publishes without. */

const MIN_KEEP_RATIO = 0.5
const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD

async function lastGood<T>(name: string, load: () => Promise<T[]>): Promise<T[] | null> {
  const saved = await readSnapshot<T>(name)
  const usable = saved && Date.now() - saved.savedAt < SNAPSHOT_MAX_AGE_MS ? saved : null
  // Longer limit than other sources: it includes up to two retries. Still
  // well inside Next's 60-second limit for building the file.
  const fresh = await safe(name, load, null as T[] | null, API_LIST_TIMEOUT_MS)

  let problem: string | null = null
  if (!fresh) problem = 'did not load'
  else if (fresh.length === 0) problem = 'came back empty'
  else if (usable && fresh.length < usable.items.length * MIN_KEEP_RATIO)
    problem = `has only ${fresh.length} (last good: ${usable.items.length})`

  if (!problem && fresh) {
    await writeSnapshot(name, fresh)
    return fresh
  }
  if (usable) {
    const ageMin = Math.round((Date.now() - usable.savedAt) / 60_000)
    console.warn(`[sitemap] ${name} ${problem}; using the last good list (${usable.items.length}, ${ageMin} min old)`)
    return usable.items
  }
  console.warn(`[sitemap] ${name} ${problem} and there is no saved list to fall back on`)
  return null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Tourism packages (/tourism-packages/{id}) are not listed: the program
  // list endpoint (GET /v1/program) needs a logged-in user, so the build
  // gets 401 Unauthenticated. The pages themselves are still crawlable
  // through links on the site.
  const [matchdaySlugs, travelSlugs, positions, teamsOrNull, toursOrNull, matchPathsOrNull] = await Promise.all([
    safe('matchday blog posts', () => getAllBlogSlugs('matchday'), [] as string[]),
    safe('travel blog posts', () => getAllBlogSlugs('travel'), [] as string[]),
    safe('internship positions', () => getInternshipPositions(), [] as Array<{ slug: string }>),
    lastGood('teams', async () =>
      (await withRetry(() => matchday<Array<{ team_id: number; name: string }>>('/teams'))).data,
    ),
    lastGood('tournaments', async () =>
      (await withRetry(() => matchday<Array<{ tournament_id: number; name: string }>>('/tournaments'))).data,
    ),
    // Saved as finished URL paths: small, and exactly what is published.
    lastGood('matches', async () => [...new Set((await upcomingEvents()).map((e) => matchPath(e)))]),
  ])

  // Never publish a sitemap without matches over a good one (see lastGood).
  if (matchPathsOrNull === null && !isBuild) {
    throw new Error('[sitemap] match list unavailable; keeping the previous sitemap')
  }
  const teams = teamsOrNull ?? []
  const tournaments = toursOrNull ?? []
  const matchPaths = matchPathsOrNull ?? []

  const url = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)
  const entry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({ url: url(path), changeFrequency, priority })

  const matchdaySet = new Set(matchdaySlugs)
  // Same slug rules as the pages themselves (lib/slug.ts), so every URL
  // here is the page's canonical and never a redirect.
  const teamIndex = teamSlugIndex(teams)
  const tourIndex = tournamentSlugIndex(tournaments)
  return [
    ...STATIC.map((s) => entry(s.path, s.changeFrequency, s.priority)),
    ...matchdaySlugs.filter(Boolean).map((slug) => entry(`/blog/${slug}`, 'monthly', 0.6)),
    // Matchday posts also show under /travel/blog but point their canonical
    // at /blog — only travel-only posts are listed under /travel/blog.
    ...travelSlugs
      .filter((slug) => slug && !matchdaySet.has(slug))
      .map((slug) => entry(`/travel/blog/${slug}`, 'monthly', 0.5)),
    ...positions.filter((p) => p.slug).map((p) => entry(`/internship/${p.slug}`, 'weekly', 0.4)),
    ...teams.map((t) => entry(teamPath(teamIndex, t.team_id, t.name), 'weekly', 0.7)),
    ...tournaments.map((t) =>
      entry(tournamentPath(tourIndex, t.tournament_id, t.name), 'weekly', 0.7),
    ),
    ...matchPaths.map((p) => entry(p, 'daily', 0.6)),
  ]
}
