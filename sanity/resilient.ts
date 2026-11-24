// sanity/resilient.ts
//
// Keeps `next build` from depending on Sanity being reachable.
//
// Why this exists: blog pages are statically generated, so `next build`
// itself calls Sanity. On a build machine that cannot reach
// <project>.apicdn.sanity.io (offline, VPN, firewall, a Sanity blip) a single
// timed-out request used to abort the WHOLE deploy:
//
//   Error occurred prerendering page "/blog/<slug>" ... fetch failed
//   [cause]: ConnectTimeoutError ... apicdn.sanity.io:443
//
// What happens now, during `next build` only:
//   - a network / 5xx failure on a PAGE read (getBlogPostBySlug, the index
//     lists, popular posts) calls `connection()`. That tells Next "this page
//     needs a real request", so it is left out of the build and rendered on
//     its first visit instead (then cached for `revalidate` seconds, exactly
//     like a post published after the deploy). Nothing is baked in: no empty
//     list, no 404.
//   - a failure on the slug LIST (getAllBlogSlugs) just throws; its callers
//     (generateStaticParams, the sitemap) already fall back to [].
//   - once one read has failed, the rest of that build worker skips Sanity
//     immediately instead of waiting out the client's own retries (it already
//     retries 5x, ~50s) on every page.
//
// What does NOT change:
//   - At runtime (production server, `next dev`) nothing is intercepted: an
//     error propagates exactly as before, so ISR keeps serving the last good
//     page when a background refresh fails.
//   - Real bugs still fail the build: only "could not reach Sanity" (no HTTP
//     status, or a 5xx) is treated as an outage. A 4xx (bad query, bad
//     project/dataset) is rethrown.

import { connection } from 'next/server'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

let outageSeenDuringBuild = false

const isBuilding = () => process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD

/** True when the failure means "Sanity could not be reached / is down",
 *  not "Sanity answered and rejected the request". */
export function isSanityOutage(error: unknown): boolean {
  const status = (error as { statusCode?: unknown } | null)?.statusCode
  if (typeof status === 'number') return status >= 500
  return true // no HTTP status: DNS, timeout, connection reset, fetch failed
}

export class SanityUnavailableError extends Error {
  constructor() {
    super('Sanity was unreachable earlier in this build; skipping it.')
    this.name = 'SanityUnavailableError'
  }
}

/**
 * Run one Sanity read.
 * @param bailoutPage true for reads that a PAGE depends on: if Sanity is
 *   unreachable while building, the page is deferred to its first request.
 */
export async function sanityRead<T>(
  label: string,
  run: () => Promise<T>,
  { bailoutPage }: { bailoutPage: boolean },
): Promise<T> {
  const building = isBuilding()

  if (building && outageSeenDuringBuild) {
    if (bailoutPage) await connection()
    throw new SanityUnavailableError()
  }

  try {
    return await run()
  } catch (error) {
    if (building && isSanityOutage(error)) {
      outageSeenDuringBuild = true
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(
        bailoutPage
          ? `[sanity] ${label}: Sanity is unreachable during build (${reason}). ` +
              'This page will be rendered on its first visit instead.'
          : `[sanity] ${label}: Sanity is unreachable during build (${reason}).`,
      )
      if (bailoutPage) await connection()
    }
    throw error
  }
}
