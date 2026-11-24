// // features/matchday/hooks.ts
// //
// // React-query wrappers over features/matchday/client.ts, following the
// // same shape as features/flights/hooks.ts (queries for browsing,
// // mutations for the money-moving calls) and features/payment/hooks.ts
// // (the polling pattern, adapted to the doc's own cadence for this API).

// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { useEffect, useRef } from 'react'
// import { QueryKeys } from '@/models/query'
// import {
//   MatchdayApiError,
//   getEvent,
//   getEvents,
//   getListings,
//   getOrderByCheckoutSession,
//   getTeams,
//   getTournaments,
//   getVenues,
//   payCheckout,
//   prepareCheckout,
//   submitAttendees,
//   type EventsResult,
//   type ListingsResult,
// } from './client'
// import type {
//   CreateCheckoutPayload,
//   EventFilters,
//   ListingFilters,
//   MatchdayEvent,
//   MatchdayOrder,
//   MatchdayTeam,
//   MatchdayTournament,
//   MatchdayVenue,
//   SubmitAttendeesPayload,
// } from './types'

// /* ── Catalogue ──────────────────────────────────────────────────── */

// /** Every competition with a sellable listing (doc §03). Static-ish, so
//  *  cached for the session. */
// export function useMatchdayTournaments() {
//   return useQuery<MatchdayTournament[], MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Tournaments],
//     queryFn: getTournaments,
//     staleTime: 5 * 60 * 1000,
//     retry: false,
//   })
// }

// export function useMatchdayTeams() {
//   return useQuery<MatchdayTeam[], MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Teams],
//     queryFn: getTeams,
//     staleTime: 5 * 60 * 1000,
//     retry: false,
//   })
// }

// export function useMatchdayVenues() {
//   return useQuery<MatchdayVenue[], MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Venues],
//     queryFn: getVenues,
//     staleTime: 5 * 60 * 1000,
//     retry: false,
//   })
// }

// /** GET /events with pagination + date/team filters (doc §03). Disabled
//  *  entirely when `enabled` is explicitly false, so callers that don't yet
//  *  have a real fixture context (today: every mock match) never fire it. */
// export function useMatchdayEvents(
//   filters: EventFilters = {},
//   options: { enabled?: boolean } = {},
// ) {
//   return useQuery<EventsResult, MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Events, filters],
//     queryFn: () => getEvents(filters),
//     enabled: options.enabled ?? true,
//     staleTime: 60 * 1000,
//     retry: false,
//   })
// }

// /** Single fixture by id — thin wrapper over GET /events?id=. */
// export function useMatchdayEvent(eventId: number | null | undefined) {
//   return useQuery<MatchdayEvent | null, MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Event, eventId],
//     queryFn: () => getEvent(eventId as number),
//     enabled: !!eventId,
//     staleTime: 60 * 1000,
//     retry: false,
//   })
// }

// /** GET /listings?event_id=… — the ticket page's main data source.
//  *  Doc §04 rule 04: "Prices move — re-fetch before checkout", so this is
//  *  deliberately kept at a short staleTime rather than cached hard. */
// export function useMatchdayListings(
//   filters: ListingFilters | null,
//   options: { enabled?: boolean } = {},
// ) {
//   return useQuery<ListingsResult, MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Listings, filters],
//     queryFn: () => getListings(filters as ListingFilters),
//     enabled: (options.enabled ?? true) && !!filters?.event_id,
//     staleTime: 30 * 1000,
//     retry: false,
//   })
// }

// /* ── Checkout ───────────────────────────────────────────────────── */

// /** POST /checkout — prices the booking, creates an awaiting_payment
//  *  order. Safe to call, reserves nothing (doc §02/§04). */
// export function usePrepareTicketCheckout() {
//   return useMutation<
//     MatchdayOrder,
//     MatchdayApiError,
//     { payload: CreateCheckoutPayload; idempotencyKey: string }
//   >({
//     mutationKey: [QueryKeys.Matchday_Checkout_Prepare],
//     mutationFn: ({ payload, idempotencyKey }) =>
//       prepareCheckout(payload, idempotencyKey),
//   })
// }

// /** POST /checkout/{order_id}/pay — reserves seats, returns checkout_url.
//  *  Revised 4 Sept 2026: requires the checkout_token from prepare. Caller
//  *  must redirect immediately on success (doc §08 rule 10), and must check
//  *  for MatchdayPriceChangedError specifically before treating any 409 as
//  *  fatal — see checkoutErrorGuidance() in client.ts. */
// export function usePayTicketCheckout() {
//   return useMutation<
//     MatchdayOrder,
//     MatchdayApiError,
//     { orderId: number; checkoutToken: string }
//   >({
//     mutationKey: [QueryKeys.Matchday_Checkout_Pay],
//     mutationFn: ({ orderId, checkoutToken }) =>
//       payCheckout(orderId, checkoutToken),
//   })
// }

// const POLL_INTERVAL_MS = 2_000
// export const MATCHDAY_POLL_MAX_DURATION_MS = 60_000

// /**
//  * Terminal statuses from Integration Docs 3. `needs_reconciliation` is
//  * deliberately NOT terminal: the new contract says it means the paid order
//  * is still being recovered/confirmed and the client should keep polling.
//  * `manual_review` is terminal from the frontend's perspective — a person
//  * owns the case and the UI should not offer a retry.
//  */
// const TERMINAL_POLL_STATUSES = new Set<MatchdayOrder['status']>([
//   'confirmed',
//   'manual_review',
//   'cancelled',
//   'failed',
// ])

// /**
//  * GET /orders/by-checkout-session/{session_id} — the post-payment poll.
//  *
//  * Docs 3 requires the client to keep polling while the order is still in
//  * flight, including `needs_reconciliation`, and to treat unknown statuses as
//  * in-progress rather than as errors. We use the documented ~60 second
//  * foreground polling window for the normal `paid` / `confirming` path.
//  * `needs_reconciliation` may continue longer because it is explicitly
//  * still in-flight.
//  */
// export function useTicketOrderStatus(sessionId: string | null) {
//   const startedAtRef = useRef<number>(Date.now())
//   const previousSessionRef = useRef<string | null>(sessionId)

//   useEffect(() => {
//     if (previousSessionRef.current !== sessionId) {
//       previousSessionRef.current = sessionId
//       startedAtRef.current = Date.now()
//     }
//   }, [sessionId])

//   return useQuery<MatchdayOrder, MatchdayApiError>({
//     queryKey: [QueryKeys.Matchday_Order_Status, sessionId],
//     queryFn: () => getOrderByCheckoutSession(sessionId as string),
//     enabled: !!sessionId,
//     retry: false,
//     refetchInterval: (query) => {
//       if (!sessionId) return false
//       const status = query.state.data?.status

//       // Never settle the screen on a non-terminal/unknown state.
//       if (status && TERMINAL_POLL_STATUSES.has(status)) return false

//       // Docs 3 gives the ~60s foreground ceiling specifically for the
//       // normal paid/confirming path. `needs_reconciliation` is explicitly
//       // still in-flight and may take minutes, so keep polling it rather than
//       // incorrectly settling the customer on a failure/timeout screen.
//       if (
//         (status === 'paid' || status === 'confirming') &&
//         Date.now() - startedAtRef.current >= MATCHDAY_POLL_MAX_DURATION_MS
//       ) {
//         return false
//       }

//       return POLL_INTERVAL_MS
//     },
//   })
// }

// /** POST /orders/{order_id}/attendees. The API response may still say
//  * `awaiting_attendees`; invalidate the status query and let it continue
//  * polling until `confirmed` (Docs 3 rule 5). */
// export function useSubmitTicketAttendees(sessionId: string | null) {
//   const queryClient = useQueryClient()
//   return useMutation<
//     MatchdayOrder,
//     MatchdayApiError,
//     { orderId: number; payload: SubmitAttendeesPayload }
//   >({
//     mutationKey: [QueryKeys.Matchday_Attendees_Submit],
//     mutationFn: ({ orderId, payload }) => submitAttendees(orderId, payload),
//     onSuccess: () => {
//       if (sessionId) {
//         queryClient.invalidateQueries({
//           queryKey: [QueryKeys.Matchday_Order_Status, sessionId],
//         })
//       }
//     },
//   })
// }

// /** Fetches a page of upcoming events purely to extract team + tournament
//  *  image URLs. The FTN CDN blocks direct requests, but event.team1.image /
//  *  team2.image / tour.image are served correctly when the browser loads
//  *  them as <img> src (the page origin acts as a valid referer).
//  *
//  *  Returns two lookup maps: teamImages[team_id] and tourImages[tour_id].
//  *  Used by featured-clubs and anywhere else that needs real crest/badge images
//  *  without constructing CDN URLs manually. */
// export function useMatchdayImageCache() {
//   const query = useQuery({
//     queryKey: [
//       QueryKeys.Matchday_Events,
//       { _imageCache: true, per_page: 100, page: 1 },
//     ],
//     queryFn: () => getEvents({ per_page: 100, page: 1 }),
//     staleTime: 10 * 60 * 1000,
//     retry: false,
//     select: (result) => {
//       const teamImages: Record<number, string> = {}
//       const tourImages: Record<number, string> = {}
//       for (const e of result.events) {
//         if (e.team1.image && e.team1.id) teamImages[e.team1.id] = e.team1.image
//         if (e.team2.image && e.team2.id) teamImages[e.team2.id] = e.team2.image
//         if (e.tour.image && e.tour.id) tourImages[e.tour.id] = e.tour.image
//       }
//       return { teamImages, tourImages }
//     },
//   })
//   return {
//     teamImages: query.data?.teamImages ?? {},
//     tourImages: query.data?.tourImages ?? {},
//     isLoading: query.isLoading,
//   }
// }

// features/matchday/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { QueryKeys } from '@/models/query'
import {
  MatchdayApiError,
  getEvent,
  getEvents,
  getListings,
  getOrderByCheckoutSession,
  getTeams,
  getTournaments,
  getVenues,
  payCheckout,
  prepareCheckout,
  submitAttendees,
  type EventsResult,
  type ListingsResult,
} from './client'
import type {
  CreateCheckoutPayload,
  EventFilters,
  ListingFilters,
  MatchdayEvent,
  MatchdayOrder,
  MatchdayTeam,
  MatchdayTournament,
  MatchdayVenue,
  SubmitAttendeesPayload,
} from './types'

/* ── Catalogue ──────────────────────────────────────────────────── */

export function useMatchdayTournaments() {
  return useQuery<MatchdayTournament[], MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Tournaments],
    queryFn: getTournaments,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useMatchdayTeams() {
  return useQuery<MatchdayTeam[], MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Teams],
    queryFn: getTeams,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useMatchdayVenues() {
  return useQuery<MatchdayVenue[], MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Venues],
    queryFn: getVenues,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useMatchdayEvents(
  filters: EventFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery<EventsResult, MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Events, filters],
    queryFn: () => getEvents(filters),
    enabled: options.enabled ?? true,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useMatchdayEvent(eventId: number | null | undefined) {
  return useQuery<MatchdayEvent | null, MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Event, eventId],
    queryFn: () => getEvent(eventId as number),
    enabled: !!eventId,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useMatchdayListings(
  filters: ListingFilters | null,
  options: { enabled?: boolean } = {},
) {
  return useQuery<ListingsResult, MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Listings, filters],
    queryFn: () => getListings(filters as ListingFilters),
    enabled: (options.enabled ?? true) && !!filters?.event_id,
    staleTime: 30 * 1000,
    retry: false,
  })
}

/* ── Checkout ───────────────────────────────────────────────────── */

export function usePrepareTicketCheckout() {
  return useMutation<
    MatchdayOrder,
    MatchdayApiError,
    { payload: CreateCheckoutPayload; idempotencyKey: string }
  >({
    mutationKey: [QueryKeys.Matchday_Checkout_Prepare],
    mutationFn: ({ payload, idempotencyKey }) =>
      prepareCheckout(payload, idempotencyKey),
  })
}

export function usePayTicketCheckout() {
  return useMutation<
    MatchdayOrder,
    MatchdayApiError,
    { orderId: number; checkoutToken: string; couponCode?: string }
  >({
    mutationKey: [QueryKeys.Matchday_Checkout_Pay],
    mutationFn: ({ orderId, checkoutToken, couponCode }) =>
      payCheckout(orderId, checkoutToken, couponCode),
  })
}

const POLL_INTERVAL_MS = 2_000
export const MATCHDAY_POLL_MAX_DURATION_MS = 60_000

const TERMINAL_POLL_STATUSES = new Set<MatchdayOrder['status']>([
  'confirmed',
  'manual_review',
  'cancelled',
  'failed',
])

// Fix error TS2554: added the second optional `options` argument.
// When `pausedForAttendees` is true the refetchInterval returns false,
// which stops react-query from polling while the attendee form is open.
// The query keeps its last data — it does not reset — so the UI stays
// stable. Polling resumes automatically the next time this hook renders
// with pausedForAttendees: false (i.e. after useSubmitTicketAttendees
// invalidates the query on success).
export function useTicketOrderStatus(
  sessionId: string | null,
  options: { pausedForAttendees?: boolean } = {},
) {
  const { pausedForAttendees = false } = options
  // Clock read once, in a state initialiser (not on every render).
  const [startedAt] = useState(() => Date.now())
  const startedAtRef = useRef<number>(startedAt)
  const previousSessionRef = useRef<string | null>(sessionId)

  useEffect(() => {
    if (previousSessionRef.current !== sessionId) {
      previousSessionRef.current = sessionId
      startedAtRef.current = Date.now()
    }
  }, [sessionId])

  return useQuery<MatchdayOrder, MatchdayApiError>({
    queryKey: [QueryKeys.Matchday_Order_Status, sessionId],
    queryFn: () => getOrderByCheckoutSession(sessionId as string),
    enabled: !!sessionId,
    retry: false,
    refetchInterval: (query) => {
      // Pause polling while the attendee form is open so a background
      // refetch can't clobber in-progress answers.
      if (pausedForAttendees) return false

      if (!sessionId) return false
      const status = query.state.data?.status

      if (status && TERMINAL_POLL_STATUSES.has(status)) return false

      if (
        (status === 'paid' || status === 'confirming') &&
        Date.now() - startedAtRef.current >= MATCHDAY_POLL_MAX_DURATION_MS
      ) {
        return false
      }

      return POLL_INTERVAL_MS
    },
  })
}

export function useSubmitTicketAttendees(sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation<
    MatchdayOrder,
    MatchdayApiError,
    { orderId: number; payload: SubmitAttendeesPayload }
  >({
    mutationKey: [QueryKeys.Matchday_Attendees_Submit],
    mutationFn: ({ orderId, payload }) => submitAttendees(orderId, payload),
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.Matchday_Order_Status, sessionId],
        })
      }
    },
  })
}

/* ── Teams of a tournament ─────────────────────────────────────────
   There is no teams-of-tournament endpoint, so this reads the
   tournament's first page of fixtures (GET /events?tour_id=…, 100 per
   page — the API maximum) and collects the distinct home/away teams,
   A–Z. A competition with more than 100 listed fixtures can miss a team
   that only appears after the first page.

   `enabled` lets callers hold the request back (the Competitions
   dropdown only arms it once the menu has been opened). Cached for 30
   minutes: who plays in a competition barely changes. */
export interface TournamentTeam {
  id: number
  name: string
}

const TOURNAMENT_TEAMS_TTL_MS = 30 * 60 * 1000

export function useTournamentTeams(
  tourId: number | null | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<EventsResult, MatchdayApiError, TournamentTeam[]>({
    queryKey: [
      QueryKeys.Matchday_Events,
      { _tournamentTeams: true, tour_id: tourId, per_page: 100, page: 1 },
    ],
    queryFn: () => getEvents({ tour_id: tourId as number, per_page: 100, page: 1 }),
    enabled: (options.enabled ?? true) && !!tourId,
    staleTime: TOURNAMENT_TEAMS_TTL_MS,
    gcTime: TOURNAMENT_TEAMS_TTL_MS,
    retry: false,
    select: (result) => {
      const byId = new Map<number, TournamentTeam>()
      for (const e of result.events) {
        for (const t of [e.team1, e.team2]) {
          if (t?.id && t.name && !byId.has(t.id)) byId.set(t.id, { id: t.id, name: t.name })
        }
      }
      return [...byId.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      )
    },
  })
}

export function useMatchdayImageCache() {
  const query = useQuery({
    queryKey: [
      QueryKeys.Matchday_Events,
      { _imageCache: true, per_page: 100, page: 1 },
    ],
    queryFn: () => getEvents({ per_page: 100, page: 1 }),
    staleTime: 10 * 60 * 1000,
    retry: false,
    select: (result) => {
      const teamImages: Record<number, string> = {}
      const tourImages: Record<number, string> = {}
      for (const e of result.events) {
        if (e.team1.image && e.team1.id) teamImages[e.team1.id] = e.team1.image
        if (e.team2.image && e.team2.id) teamImages[e.team2.id] = e.team2.image
        if (e.tour.image && e.tour.id) tourImages[e.tour.id] = e.tour.image
      }
      return { teamImages, tourImages }
    },
  })
  return {
    teamImages: query.data?.teamImages ?? {},
    tourImages: query.data?.tourImages ?? {},
    isLoading: query.isLoading,
  }
}
