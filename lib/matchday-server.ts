// lib/matchday-server.ts
//
// Server-side reads of the MatchDay catalogue for the tournament, team and
// match pages (slug → id resolution, canonical redirects, metadata) and the
// sitemap. Plain `fetch` — lib/axios.ts is browser-only (cookies, the
// currency store) — cached by Next for an hour, and deduplicated within one
// request by React `cache` so generateMetadata and the page share a call.
//
// Every function returns `null` when the API can't be reached (network
// error, non-2xx, `success: false`, or no answer in time). The pages treat
// null as "unknown", never as "doesn't exist": a team page must not 404 just
// because the API blipped.
//
// Under a burst of requests (a crawler fetching 8 pages at once) single
// calls used to fail and the match page then rendered a generic fallback
// with HTTP 200, which Google could index (SEO brief, Task 2). So each call
// now gets a time limit and up to three retries with a growing, jittered
// wait (20 s ceiling in total), and a 429 or 5xx answer counts as "try
// again". A call that still fails logs why. Successful answers are cached by
// Next (REVALIDATE_S); when a refresh fails, the cached copy keeps serving.

import { cache } from 'react'
import type {
  MatchdayEvent,
  MatchdayTeam,
  MatchdayTournament,
} from '@/features/matchday/types'

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '')
/** Per attempt. Not the 4 s the SEO brief suggested: measured Nov 2026, the
 *  API answers a burst of 8–16 parallel requests in ~2.3 s typically, ~4 s
 *  for the slowest 10% and up to ~9 s, so 4 s cut off answers that were on
 *  their way and the retries joined the same queue. It is slow under load,
 *  not rate limited (no 429s). */
const TIMEOUT_MS = 8_000
/** Waits before retries 1, 2 and 3 (each ±25% jitter). The Nov 2026
 *  re-crawl still saw 21 of 1,000 match pages fail at 6 parallel requests
 *  with the old 300/600 ms: all three tries landed inside one busy second
 *  of the API. Longer, jittered waits spread the retries out. */
const RETRY_DELAYS_MS = [500, 1_500, 3_000]
/** Hard ceiling for one call, retries included, so a page never hangs. */
const TOTAL_BUDGET_MS = 20_000
/** Don't start an attempt with less time than this left. */
const MIN_ATTEMPT_MS = 1_500
const REVALIDATE_S = 3600

interface Envelope<T> {
  success?: boolean
  data?: T
  meta?: { total_events?: number; current_page?: number; per_page?: number }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 429 (rate limited) and 5xx are worth another try; other 4xx are not. */
const retryable = (status: number) => status === 429 || status >= 500

const jitter = (ms: number) => Math.round(ms * (0.75 + Math.random() * 0.5))

export async function fetchMatchday<T>(path: string): Promise<Envelope<T> | null> {
  if (!API) return null
  const token = process.env.NEXT_PUBLIC_API_TOKEN
  const deadline = Date.now() + TOTAL_BUDGET_MS
  const failures: string[] = []
  for (let attempt = 0; ; attempt++) {
    let again = false
    const timeLeft = deadline - Date.now()
    try {
      const res = await fetch(`${API}/api/v1/matchday${path}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, timeLeft)),
        next: { revalidate: REVALIDATE_S },
      })
      if (res.ok) {
        const json = (await res.json()) as Envelope<T>
        if (!json || json.success === false || json.data === undefined) return null
        return json
      }
      again = retryable(res.status)
      failures.push(`HTTP ${res.status}`)
    } catch (err) {
      again = true // network error or time limit
      failures.push(
        err instanceof Error && err.name === 'TimeoutError'
          ? 'time limit'
          : `network error${err instanceof Error ? ` (${err.message})` : ''}`,
      )
    }
    const wait = jitter(RETRY_DELAYS_MS[attempt] ?? 0)
    const outOfTries =
      !again ||
      attempt >= RETRY_DELAYS_MS.length ||
      deadline - Date.now() - wait < MIN_ATTEMPT_MS
    if (outOfTries) {
      // One line per failed call in the server logs: tells an upstream
      // error, a timeout and a rate limit apart (asked by the SEO team).
      console.warn(
        `[matchday-server] ${path} failed after ${attempt + 1} attempt(s): ${failures.join(', ')}`,
      )
      return null
    }
    await sleep(wait)
  }
}

/** GET /tournaments, or null if unreachable. */
export const getServerTournaments = cache(
  async (): Promise<MatchdayTournament[] | null> => {
    const json = await fetchMatchday<MatchdayTournament[]>('/tournaments')
    return Array.isArray(json?.data) ? json.data : null
  },
)

/** GET /teams, or null if unreachable. */
export const getServerTeams = cache(async (): Promise<MatchdayTeam[] | null> => {
  const json = await fetchMatchday<MatchdayTeam[]>('/teams')
  return Array.isArray(json?.data) ? json.data : null
})

export type ServerEventResult =
  | { status: 'found'; event: MatchdayEvent }
  | { status: 'missing' }
  | { status: 'unreachable' }

/** GET /events?id=<id>. `missing` only when the API answered and had no
 *  such event; `unreachable` when it couldn't be asked. */
export const getServerEvent = cache(async (id: number): Promise<ServerEventResult> => {
  const json = await fetchMatchday<MatchdayEvent[]>(`/events?id=${encodeURIComponent(String(id))}`)
  if (!json) return { status: 'unreachable' }
  const event = Array.isArray(json.data) ? json.data.find((e) => e?.id === id) ?? json.data[0] : undefined
  return event && event.id === id ? { status: 'found', event } : { status: 'missing' }
})

/** One page of GET /events, with its paging meta, or null if unreachable.
 *  Same shape as the browser's getEvents() (features/matchday/client.ts), so
 *  a server-loaded page can seed a client list. */
export interface ServerEventsPage {
  events: MatchdayEvent[]
  meta: { current_page: number; per_page: number; total_events: number }
}

export const getServerEventsPage = cache(
  async (query: string, perPage: number): Promise<ServerEventsPage | null> => {
    const json = await fetchMatchday<MatchdayEvent[]>(`/events?${query}`)
    if (!Array.isArray(json?.data)) return null
    return {
      events: json.data,
      meta: {
        current_page: json.meta?.current_page ?? 1,
        per_page: json.meta?.per_page ?? perPage,
        total_events: json.meta?.total_events ?? json.data.length,
      },
    }
  },
)
