"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { resolveBuilderMatch, fromLiveEvent, type BuilderMatch } from "./match";
import { readRememberedBuilderMatch } from "./enter";
import { isMatchdayLive } from "@/features/matchday/config";
import { useMatchdayEvent } from "@/features/matchday/hooks";
import { useLiveMatchCache } from "@/store/live-match-cache";
import type { MatchdayEvent } from "@/features/matchday/types";

/* The selected match id for the current builder step: the `?match=` URL
   param, falling back to sessionStorage (survives a hard refresh where
   the param is dropped). Returns null when nothing has been picked yet. */
export function useBuilderMatchId(): string | null {
  const params = useSearchParams();
  const fromUrl = params.get("match");
  if (fromUrl) return fromUrl;
  if (typeof window !== "undefined") return readRememberedBuilderMatch();
  return null;
}

/** Shown for the one render (typically well under a second) between a
 *  live id being requested and its GET /events response landing — e.g. a
 *  bookmarked or shared /builder/seats?match=<id> link opened cold, with
 *  nothing in the live-match cache yet. Every consumer already renders
 *  `match.home`/`match.away`/etc. unconditionally, so this exists purely
 *  to avoid each one needing its own loading branch — see
 *  store/live-match-cache.ts for the full rationale. */
const LIVE_LOADING_PLACEHOLDER: BuilderMatch = {
  id: "",
  home: "Loading…",
  away: "",
  date: "",
  venue: "",
  priceFrom: 0,
};

/** Shown once a live lookup has genuinely settled with nothing found —
 *  either the id wasn't a number at all, or GET /events?id= came back
 *  empty. Distinct from the loading placeholder above: without this, an
 *  invalid or non-existent event id would show "Loading…" forever with
 *  no explanation, since the query itself completes successfully with a
 *  null result rather than erroring. */
const LIVE_NOT_FOUND_PLACEHOLDER: BuilderMatch = {
  id: "",
  home: "Match not found",
  away: "",
  date: "",
  venue: "",
  priceFrom: 0,
};

/** Resolves any match/fixture id to a normalized BuilderMatch, live or
 *  mock. Shared by useBuilderMatch() below (id from the builder's own
 *  `?match=` param) and app/match/[id]/client.tsx (id from its own route
 *  segment) — both need the exact same live/mock branching, just sourced
 *  from a different id.
 *
 *  NEXT_PUBLIC_MATCHDAY_TICKETS_LIVE=true (features/matchday/config):
 *  every id is a real MatchDay event_id. Serves instantly from
 *  store/live-match-cache.ts if already fetched (e.g. arrived via the
 *  live fixtures list on /matches, which seeds the cache as it loads);
 *  otherwise fetches it directly and caches the result, showing
 *  LIVE_LOADING_PLACEHOLDER for the one render that takes, or
 *  LIVE_NOT_FOUND_PLACEHOLDER if the lookup settles with nothing found.
 *
 *  false: unchanged — resolves synchronously from the static demo arrays
 *  via features/builder/match.ts, exactly as before this flag existed.
 *
 *  `initialEvent` (the match page passes the event its server loaded) is
 *  shown until the browser's own copy arrives, so the server HTML carries
 *  the real match instead of "Loading…". The browser copy still wins once
 *  it is in: it is priced in the visitor's chosen currency.
 *
 *  All hooks below run unconditionally regardless of `live`/`id` — only
 *  the final return branches, per the rules of hooks. */
export function useResolvedMatch(
  id: string | null,
  initialEvent?: MatchdayEvent | null,
): BuilderMatch {
  const live = isMatchdayLive();
  const eventId = live && id ? Number(id) || null : null;

  const cached = useLiveMatchCache((s) => (id ? s.getEvent(id) : undefined));
  const upsert = useLiveMatchCache((s) => s.upsert);

  const shouldFetch = live && !!eventId && !cached;
  const {
    data: fetched,
    isFetching,
    isFetched,
  } = useMatchdayEvent(shouldFetch ? eventId : null);

  useEffect(() => {
    if (fetched) upsert(fetched);
  }, [fetched, upsert]);

  const mockMatch = useMemo(() => resolveBuilderMatch(id), [id]);

  if (!live) return mockMatch;

  const event = cached ?? fetched ?? initialEvent ?? null;
  if (event) return fromLiveEvent(event);

  // No id, or an id that isn't a valid number — nothing will ever fetch.
  if (!eventId) return LIVE_NOT_FOUND_PLACEHOLDER;

  // A real fetch was attempted and has settled (successfully, with no
  // matching event) rather than still being in flight.
  if (isFetched && !isFetching) return LIVE_NOT_FOUND_PLACEHOLDER;

  return LIVE_LOADING_PLACEHOLDER;
}

/** The resolved BuilderMatch for the current builder step. */
export function useBuilderMatch(): BuilderMatch {
  const id = useBuilderMatchId();
  return useResolvedMatch(id);
}
