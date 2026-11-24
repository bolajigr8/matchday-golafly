// store/live-match-cache.ts
//
// When NEXT_PUBLIC_MATCHDAY_TICKETS_LIVE=true, every "match" flowing
// through the builder (seats → extras → checkout-tickets → confirmed) is
// a real MatchDay event, fetched asynchronously via GET /events. But
// useBuilderMatch() (features/builder/use-builder-match.ts) is consumed
// synchronously across 4+ pages that were all written against instant,
// always-available mock data.
//
// Rather than rewrite every consumer to handle a loading state, this
// store caches whichever real events have already been fetched (e.g. by
// the live fixtures list on /matches, or by useBuilderMatch() itself the
// first time a given id is requested) so a second read is instant. On a
// genuine cold start (e.g. someone opens /builder/seats?match=132889
// directly, bookmarked or shared, with nothing cached yet),
// useBuilderMatch() returns a brief loading placeholder for one render
// and this store updates reactively the moment the fetch resolves.

import { create } from 'zustand'
import type { MatchdayEvent } from '@/features/matchday/types'

interface LiveMatchCacheStore {
  events: Record<string, MatchdayEvent>
  upsert: (event: MatchdayEvent) => void
  getEvent: (id: string) => MatchdayEvent | undefined
}

export const useLiveMatchCache = create<LiveMatchCacheStore>((set, get) => ({
  events: {},
  upsert: (event) =>
    set((state) => ({
      events: { ...state.events, [String(event.id)]: event },
    })),
  getEvent: (id) => get().events[id],
}))
