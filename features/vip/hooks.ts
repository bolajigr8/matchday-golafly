// features/vip/hooks.ts
//
// React Query hooks over features/vip/api.ts. Browse data is fetched in the
// visitor's browser on purpose: the backend limits the browse endpoints to
// 15 calls a minute PER IP, so calling them from our server would share one
// limit between every visitor.

import { useEffect, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { vipApi } from './api'
import type { VipClub, VipEvent, VipPackageView } from './contract'
import { VipApiError } from './errors'

export const vipKeys = {
  clubs: ['vip', 'clubs'] as const,
  events: (club: string) => ['vip', 'events', club] as const,
  listings: (club: string, eventId: number) => ['vip', 'listings', club, eventId] as const,
  package: (id: string) => ['vip', 'package', id] as const,
  esims: (id: string) => ['vip', 'esims', id] as const,
}

/* Browse prices are cached 2 minutes by the backend; never refetch faster. */
const BROWSE_STALE = 2 * 60_000

/** Never retry a 4xx: the message is the answer (and a 404 on clubs means
 *  VIP packages are switched off). */
function retry(count: number, err: unknown) {
  if (err instanceof VipApiError && err.status >= 400 && err.status < 500) return false
  return count < 1
}

export function useVipClubs() {
  return useQuery<VipClub[], VipApiError>({
    queryKey: vipKeys.clubs,
    queryFn: () => vipApi.getClubs(),
    staleTime: BROWSE_STALE,
    retry,
  })
}

/** Every page of a club's VIP home matches (keeps asking while has_more). */
async function allEvents(club: string): Promise<VipEvent[]> {
  const out: VipEvent[] = []
  for (let page = 1; page <= 10; page++) {
    const res = await vipApi.getEvents(club, page)
    out.push(...res.data)
    if (!res.meta.has_more) break
  }
  return out
}

export function useVipClubEvents(club: string | null) {
  return useQuery<VipEvent[], VipApiError>({
    queryKey: vipKeys.events(club ?? ''),
    queryFn: () => allEvents(club!),
    enabled: !!club,
    staleTime: BROWSE_STALE,
    retry,
  })
}

/** All clubs' matches, soonest first (landing page). */
export function useVipAllEvents(clubs: VipClub[] | undefined) {
  const results = useQueries({
    queries: (clubs ?? []).map((c) => ({
      queryKey: vipKeys.events(c.slug),
      queryFn: () => allEvents(c.slug),
      staleTime: BROWSE_STALE,
      retry,
    })),
  })
  const loading = !clubs || results.some((r) => r.isLoading)
  const events = results
    .flatMap((r) => r.data ?? [])
    .sort((a, b) => a.date.localeCompare(b.date))
  const error = results.find((r) => r.error)?.error as VipApiError | undefined
  return { events, loading, error: events.length ? undefined : error }
}

/** One match, found in its club's list (the backend has no single-event
 *  endpoint). `missing` once the list has loaded without it. */
export function useVipEvent(club: string, eventId: number) {
  const q = useVipClubEvents(club)
  const event = q.data?.find((e) => e.id === eventId) ?? null
  return { event, loading: q.isLoading, error: q.error, missing: q.isSuccess && !event }
}

export function useVipListings(club: string, eventId: number, enabled = true) {
  return useQuery({
    queryKey: vipKeys.listings(club, eventId),
    queryFn: () => vipApi.getListings(club, eventId),
    staleTime: BROWSE_STALE,
    retry,
    enabled: enabled && !!club && eventId > 0,
  })
}

/** The package as the backend sees it now (building view). */
export function useVipPackageQuery(id: string | null) {
  return useQuery<VipPackageView, VipApiError>({
    queryKey: vipKeys.package(id ?? ''),
    queryFn: () => vipApi.getPackage(id!),
    enabled: !!id,
    retry,
    refetchOnWindowFocus: true,
  })
}

/* ── Countdown ──────────────────────────────────────────────────────── */

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function remaining(targetMs: number, nowMs: number): Countdown {
  const total = Math.max(0, Math.floor((targetMs - nowMs) / 1000))
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  }
}

/**
 * Live countdown to `targetIso` (a real instant), ticking every second.
 * Returns null until the component has mounted: the server and the browser
 * would otherwise render different seconds and React would report a
 * hydration mismatch.
 */
export function useCountdown(targetIso: string | undefined): Countdown | null {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!targetIso) return
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [targetIso])

  if (!targetIso || now === null || Number.isNaN(new Date(targetIso).getTime())) return null
  return remaining(new Date(targetIso).getTime(), now)
}
