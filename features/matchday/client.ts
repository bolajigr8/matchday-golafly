// // features/matchday/client.ts
// //
// // Thin, doc-accurate client for the Golafly MatchDay API. Mirrors the
// // conventions already used by features/flights/api.ts (same axiosInstance,
// // same "unwrap `data`, keep the envelope typed" shape) so this slots into
// // the codebase the same way every other real product's API layer does.
// //
// // Revised for Integration Docs 3 (latest MatchDay frontend contract),
// // which made 4 breaking changes to the three checkout calls:
// //   1. POST /checkout's response now returns `checkout_token` — store it.
// //   2. POST /…/pay now REQUIRES a body: { checkout_token }. It used to take
// //      none at all.
// //   3. POST /…/pay has a new 409 for a price change mid-checkout, carrying
// //      `errors.code: "price_changed"` plus before/after totals — see
// //      MatchdayPriceChangedError below.
// //   4. POST /…/attendees now REQUIRES `checkout_session_id` (the Stripe
// //      session id from the redirect) in the body.
// //
// // Per the backend team: browsing (tournaments/teams/venues/events/
// // listings) now returns real data — supplier access was restored in
// // September 2026. The call that actually places a real ticket order with
// // the supplier is still behind a dry-run flag, so a checkout will price
// // correctly and take real payment via Stripe, but will not yet produce a
// // real ticket order. Do not add a mock/fake success path here regardless —
// // doc §01 is explicit the shapes below are the finished contract.
// //
// // Auth (doc §01, now settled): MatchDay is guest checkout — no bearer
// // token, no login. The "auth" is the checkout_token / session_id already
// // modelled as ordinary request fields on the types in ./types.ts, so
// // there's no separate header to add here.

// import axiosInstance from '@/lib/axios'
// import type { AxiosError } from 'axios'
// import type {
//   CreateCheckoutPayload,
//   EventFilters,
//   EventsMeta,
//   ListingFilters,
//   ListingsMeta,
//   MatchdayEvent,
//   MatchdayFailure,
//   MatchdayListing,
//   MatchdayOrder,
//   MatchdaySuccess,
//   MatchdayTeam,
//   MatchdayTournament,
//   MatchdayVenue,
//   PayCheckoutPayload,
//   PriceChangedErrorDetails,
//   SubmitAttendeesPayload,
// } from './types'

// const BASE = '/api/v1/matchday'

// /** Normalised error shape every matchday hook/UI branches on, regardless
//  *  of whether the failure was a network error, a Laravel validation 422
//  *  (per-field `errors`), or a supplier business-rule 422 (`message` only,
//  *  `errors: null`) — doc §07: "if `errors` is present map it to fields,
//  *  otherwise show `message`." */
// export class MatchdayApiError extends Error {
//   readonly status: number | null
//   readonly fieldErrors: Record<string, string[]> | null
//   /** True for the errors the doc says are safe to retry once after a
//    *  pause (502) — never surface a "retry" affordance for anything else,
//    *  and never retry in a loop for 503 (doc §07). */
//   readonly retryable: boolean
//   /** Machine-readable supplier business-rule code from errors.error_num. */
//   readonly errorNum: number | null
//   /** Raw machine-readable error details; internal diagnostics are never shown directly. */
//   readonly details: Record<string, unknown> | null

//   constructor(
//     message: string,
//     status: number | null,
//     fieldErrors: Record<string, string[]> | null = null,
//     details: Record<string, unknown> | null = null,
//   ) {
//     super(message)
//     this.name = 'MatchdayApiError'
//     this.status = status
//     this.fieldErrors = fieldErrors
//     this.retryable = status === 502
//     this.details = details as PriceChangedErrorDetails & Record<string, unknown>
//     this.errorNum =
//       typeof details?.error_num === 'number' ? details.error_num : null
//   }
// }

// /** The /pay endpoint's special 409 (doc §04, new 4 Sept 2026 revision) —
//  *  the supplier re-priced the seats between prepare and pay. Recoverable:
//  *  show both totals, get the customer to confirm, then call payCheckout()
//  *  again with the *same* checkout_token. Always branch on `error.details`
//  *  being present here, never on the error message (doc: "Tell the two
//  *  409s apart by errors.code" — a plain 409 without this shape means
//  *  "already paying elsewhere," not a price change, and is NOT recoverable
//  *  the same way). */
// export class MatchdayPriceChangedError extends MatchdayApiError {
//   readonly details: PriceChangedErrorDetails

//   constructor(message: string, details: PriceChangedErrorDetails) {
//     super(message, 409, null, details as unknown as Record<string, unknown>)
//     this.name = 'MatchdayPriceChangedError'
//     this.details = details
//   }
// }

// /** Carries Idempotency-Key when the caller passes one (doc §04/§08 rule
//  *  11). There's no separate auth header — see the file header comment. */
// function buildMatchdayHeaders(idempotencyKey?: string): Record<string, string> {
//   const headers: Record<string, string> = {}
//   if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
//   return headers
// }

// function toMatchdayApiError(err: unknown): MatchdayApiError {
//   // Preserve errors we created locally (especially MatchdayPriceChangedError)
//   // instead of wrapping them and losing their machine-readable details.
//   if (err instanceof MatchdayApiError) return err

//   const axiosErr = err as AxiosError<MatchdayFailure>
//   if (axiosErr?.isAxiosError) {
//     const status = axiosErr.response?.status ?? null
//     const body = axiosErr.response?.data
//     const message =
//       (body && typeof body.message === 'string' && body.message) ||
//       axiosErr.message ||
//       'The ticketing service is temporarily unavailable.'
//     const details =
//       body?.errors && typeof body.errors === 'object'
//         ? (body.errors as Record<string, unknown>)
//         : null

//     // Doc §04/§08: a price-changed 409 is the one recoverable 409 and must
//     // be identified by errors.code, never by the human message.
//     if (
//       status === 409 &&
//       details?.code === 'price_changed' &&
//       typeof details.order_id === 'number' &&
//       typeof details.currency === 'string' &&
//       typeof details.quantity === 'number' &&
//       typeof details.previous_amount_minor === 'number' &&
//       typeof details.new_amount_minor === 'number'
//     ) {
//       return new MatchdayPriceChangedError(
//         message,
//         details as unknown as PriceChangedErrorDetails,
//       )
//     }

//     // Laravel field validation is the only shape where errors is a map of
//     // arrays. Supplier 422s instead use { error_num, reference,
//     // upstream_message }. Keep those machine-readable details on the error
//     // and deliberately ignore the two internal diagnostic strings in UI code.
//     let fieldErrors: Record<string, string[]> | null = null
//     if (details) {
//       const entries = Object.entries(details)
//       const isFieldErrorMap =
//         entries.length > 0 &&
//         entries.every(
//           ([, value]) =>
//             Array.isArray(value) &&
//             value.every((item) => typeof item === 'string'),
//         )
//       if (isFieldErrorMap) fieldErrors = details as Record<string, string[]>
//     }

//     return new MatchdayApiError(message, status, fieldErrors, details)
//   }

//   return new MatchdayApiError(
//     err instanceof Error ? err.message : 'Something went wrong.',
//     null,
//   )
// }

// /** Unwraps `{ success, data, meta }`, throwing MatchdayApiError on
//  *  `success: false` even though the HTTP status was 2xx (defensive —
//  *  the doc doesn't document this happening, but every other envelope
//  *  consumer in this codebase treats the envelope as the source of truth
//  *  over the transport status). */
// function unwrap<T>(payload: MatchdaySuccess<T> | MatchdayFailure): T {
//   if (payload.success) return payload.data
//   const details =
//     payload.errors && typeof payload.errors === 'object' ? payload.errors : null
//   const fieldErrors =
//     details &&
//     Object.values(details).every(
//       (value) =>
//         Array.isArray(value) && value.every((item) => typeof item === 'string'),
//     )
//       ? (details as Record<string, string[]>)
//       : null
//   throw new MatchdayApiError(payload.message, null, fieldErrors, details)
// }

// /* ── Catalogue (all read-only, all safe to call freely — doc §03) ──── */

// export async function getTournaments(): Promise<MatchdayTournament[]> {
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayTournament[]> | MatchdayFailure
//     >(`${BASE}/tournaments`)
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// export async function getTeams(): Promise<MatchdayTeam[]> {
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayTeam[]> | MatchdayFailure
//     >(`${BASE}/teams`)
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// export async function getVenues(): Promise<MatchdayVenue[]> {
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayVenue[]> | MatchdayFailure
//     >(`${BASE}/venues`)
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// export interface EventsResult {
//   events: MatchdayEvent[]
//   meta: EventsMeta
// }

// /** GET /events — paginated, per_page clamped to 100 server-side (doc §03). */
// export async function getEvents(
//   filters: EventFilters = {},
// ): Promise<EventsResult> {
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayEvent[]> | MatchdayFailure
//     >(`${BASE}/events`, { params: filters })
//     const events = unwrap(data)
//     const meta = (data.success ? data.meta : undefined) as
//       | EventsMeta
//       | undefined
//     return {
//       events,
//       meta: meta ?? {
//         current_page: 1,
//         per_page: filters.per_page ?? 50,
//         total_events: events.length,
//       },
//     }
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /** Convenience wrapper over GET /events?id= for a single fixture. */
// export async function getEvent(eventId: number): Promise<MatchdayEvent | null> {
//   const { events } = await getEvents({ id: eventId })
//   return events[0] ?? null
// }

// export interface ListingsResult {
//   listings: MatchdayListing[]
//   meta: ListingsMeta
// }

// /** GET /listings — the main one. event_id is required (422 if missing,
//  *  enforced here too so a missing id fails fast with a clear message
//  *  instead of a supplier 422). */
// export async function getListings(
//   filters: ListingFilters,
// ): Promise<ListingsResult> {
//   if (!filters.event_id) {
//     throw new MatchdayApiError('event_id is required to load listings.', 422)
//   }
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayListing[]> | MatchdayFailure
//     >(`${BASE}/listings`, { params: filters })
//     const listings = unwrap(data)
//     const meta = (data.success ? data.meta : undefined) as
//       | ListingsMeta
//       | undefined
//     if (!meta) {
//       throw new MatchdayApiError(
//         'Listings response was missing its meta block.',
//         null,
//       )
//     }
//     return { listings, meta }
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /* ── Checkout (doc §02, §04) ─────────────────────────────────────── */

// /** POST /checkout — prices the booking, creates an order in
//  *  awaiting_payment. Reserves nothing, safe to call and safe to abandon. */
// export async function prepareCheckout(
//   payload: CreateCheckoutPayload,
//   idempotencyKey?: string,
// ): Promise<MatchdayOrder> {
//   try {
//     const { data } = await axiosInstance.post<
//       MatchdaySuccess<MatchdayOrder> | MatchdayFailure
//     >(`${BASE}/checkout`, payload, {
//       headers: buildMatchdayHeaders(idempotencyKey),
//     })
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /** POST /checkout/{order_id}/pay — reserves the seats (~10 min hold) and
//  *  opens a Stripe Checkout session. Revised 4 Sept 2026: now REQUIRES
//  *  `checkout_token` in the body (previously took no body at all) — refused
//  *  without it. Redirect to `checkout_url` immediately on success — do not
//  *  hold it behind another confirmation step (doc §04, §08 rule 10).
//  *
//  *  Throws MatchdayPriceChangedError (not a plain MatchdayApiError) if the
//  *  price moved since prepare — callers should check for that type before
//  *  treating any 409 here as fatal. */
// export async function payCheckout(
//   orderId: number,
//   checkoutToken: string,
// ): Promise<MatchdayOrder> {
//   try {
//     const payload: PayCheckoutPayload = { checkout_token: checkoutToken }
//     const { data } = await axiosInstance.post<
//       MatchdaySuccess<MatchdayOrder> | MatchdayFailure
//     >(`${BASE}/checkout/${orderId}/pay`, payload, {
//       headers: buildMatchdayHeaders(),
//     })
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /** GET /orders/by-checkout-session/{session_id} — the post-payment poll.
//  *  Pass Stripe's `?session_id=` straight through.
//  *  Threads the envelope `message` into `order.statusMessage` for the
//  *  `failed` status — doc §10: "show message; invite them to try again". */
// export async function getOrderByCheckoutSession(
//   sessionId: string,
// ): Promise<MatchdayOrder> {
//   try {
//     const { data } = await axiosInstance.get<
//       MatchdaySuccess<MatchdayOrder> | MatchdayFailure
//     >(`${BASE}/orders/by-checkout-session/${encodeURIComponent(sessionId)}`)
//     const order = unwrap(data)
//     // Thread the envelope message through for failed orders so the UI
//     // can display it (doc §07/§10: "422 message is frequently a real
//     // explanation ... show message").
//     if (order.status === 'failed' && data.success) {
//       order.statusMessage = data.message
//     }
//     return order
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /** POST /orders/{order_id}/attendees — only valid while status is
//  *  awaiting_attendees. Resubmitting to fix a typo is allowed until the
//  *  order confirms. Revised 4 Sept 2026: `payload.checkout_session_id` is
//  *  now required (the type enforces this) — the same Stripe session_id
//  *  used to poll status. Missing returns 422; a wrong capability returns 404
//  *  (Docs 3 rule 6). */
// export async function submitAttendees(
//   orderId: number,
//   payload: SubmitAttendeesPayload,
// ): Promise<MatchdayOrder> {
//   try {
//     const { data } = await axiosInstance.post<
//       MatchdaySuccess<MatchdayOrder> | MatchdayFailure
//     >(`${BASE}/orders/${orderId}/attendees`, payload, {
//       headers: buildMatchdayHeaders(),
//     })
//     return unwrap(data)
//   } catch (err) {
//     throw toMatchdayApiError(err)
//   }
// }

// /** What to do with an error at each of the two checkout calls, per doc §07's
//  *  code table plus the phase-specific notes under each endpoint's "Common
//  *  failures" (§04). The raw `message` from the API is usually the right
//  *  thing to show for a 422 (it's the supplier's own business-rule text) —
//  *  this only adds guidance for the codes where the raw message alone would
//  *  be confusing or where the doc calls for specific UI behaviour. */
// export type CheckoutErrorAction =
//   | 'fix-and-retry' // 422 — let them correct input and press the button again
//   | 'back-to-listings' // 404 on prepare — the listing disappeared
//   | 'restart' // 404 on pay — the order/session is gone
//   | 'price-changed' // 409 with errors.code === 'price_changed' — recoverable in place
//   | 'poll' // plain 409 — another tab/session is already paying, don't resubmit
//   | 'retry-once' // 502 — safe to retry once after a pause
//   | 'wait' // 503 — do not retry in a loop

// export interface CheckoutErrorGuidance {
//   message: string
//   action: CheckoutErrorAction
// }

// export function checkoutErrorGuidance(
//   error: MatchdayApiError,
//   phase: 'prepare' | 'pay',
// ): CheckoutErrorGuidance {
//   // Doc §04/§08 rule 02: check this BEFORE the generic 409 branch — a
//   // price change is recoverable in place, a plain 409 is not.
//   if (error instanceof MatchdayPriceChangedError) {
//     return { message: error.message, action: 'price-changed' }
//   }
//   switch (error.status) {
//     case 422:
//       // Docs 3: supplier rejections are 422 and carry errors.error_num.
//       // Branch on the machine-readable number, never on the human message.
//       // Inventory-related failures should take the buyer back to the seat
//       // selector; other 422s remain fix-and-retry. The message is always
//       // safe to display verbatim.
//       if (
//         phase === 'pay' &&
//         [244, 258, 234, 242, 231].includes(error.errorNum ?? -1)
//       ) {
//         return { message: error.message, action: 'back-to-listings' }
//       }
//       return { message: error.message, action: 'fix-and-retry' }
//     case 404:
//       return phase === 'prepare'
//         ? {
//             message:
//               'This listing is no longer available. Please choose another one.',
//             action: 'back-to-listings',
//           }
//         : {
//             message:
//               'This checkout session has expired, or the wrong session was used. Please start again.',
//             action: 'restart',
//           }
//     case 409:
//       // Doc: "Otherwise: already paid, or another tab is paying — poll
//       // the status endpoint instead of retrying." We may not have a
//       // session_id to actually poll with from this tab, so the message
//       // is deliberately about checking elsewhere rather than promising
//       // an automatic recovery.
//       return {
//         message:
//           'This order is already being paid for — check any other open tab or window before trying again.',
//         action: 'poll',
//       }
//     case 502:
//       return {
//         message: 'Payment could not be started. Please try again in a moment.',
//         action: 'retry-once',
//       }
//     case 503:
//       return {
//         message:
//           phase === 'prepare'
//             ? 'Pricing is temporarily unavailable. Please try again shortly.'
//             : 'The ticketing service is temporarily unavailable. Please try again shortly.',
//         action: 'wait',
//       }
//     default:
//       return { message: error.message, action: 'fix-and-retry' }
//   }
// }

// features/matchday/client.ts
//
// Thin, doc-accurate client for the Golafly MatchDay API. Mirrors the
// conventions already used by features/flights/api.ts (same axiosInstance,
// same "unwrap `data`, keep the envelope typed" shape) so this slots into
// the codebase the same way every other real product's API layer does.
//
// Revised for Integration Docs 3 (latest MatchDay frontend contract),
// which made 4 breaking changes to the three checkout calls:
//   1. POST /checkout's response now returns `checkout_token` — store it.
//   2. POST /…/pay now REQUIRES a body: { checkout_token }. It used to take
//      none at all.
//   3. POST /…/pay has a new 409 for a price change mid-checkout, carrying
//      `errors.code: "price_changed"` plus before/after totals — see
//      MatchdayPriceChangedError below.
//   4. POST /…/attendees now REQUIRES `checkout_session_id` (the Stripe
//      session id from the redirect) in the body.

import axiosInstance from '@/lib/axios'
import type { AxiosError } from 'axios'
import type {
  CreateCheckoutPayload,
  EventFilters,
  EventsMeta,
  ListingFilters,
  ListingsMeta,
  MatchdayEvent,
  MatchdayFailure,
  MatchdayListing,
  MatchdayOrder,
  MatchdaySuccess,
  MatchdayTeam,
  MatchdayTournament,
  MatchdayVenue,
  PayCheckoutPayload,
  PriceChangedErrorDetails,
  SubmitAttendeesPayload,
} from './types'

// Re-export MatchdayOrder so consumers can import it from this module
// (fixes: app/payment-success/client.tsx error TS2459)
export type { MatchdayOrder } from './types'

const BASE = '/api/v1/matchday'

export class MatchdayApiError extends Error {
  readonly status: number | null
  readonly fieldErrors: Record<string, string[]> | null
  readonly retryable: boolean
  readonly errorNum: number | null
  readonly details: Record<string, unknown> | null

  constructor(
    message: string,
    status: number | null,
    fieldErrors: Record<string, string[]> | null = null,
    details: Record<string, unknown> | null = null,
  ) {
    super(message)
    this.name = 'MatchdayApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryable = status === 502
    this.details = details
    this.errorNum =
      typeof details?.error_num === 'number' ? details.error_num : null
  }
}

// Fix errors TS2416 & TS2322:
// PriceChangedErrorDetails doesn't have an index signature so it can't
// directly satisfy `Record<string, unknown>`. Intersecting it with
// Record<string, unknown> on the property type satisfies the base class
// constraint while keeping the named fields fully typed.
export class MatchdayPriceChangedError extends MatchdayApiError {
  readonly details: PriceChangedErrorDetails & Record<string, unknown>

  constructor(message: string, details: PriceChangedErrorDetails) {
    super(message, 409, null, details as unknown as Record<string, unknown>)
    this.name = 'MatchdayPriceChangedError'
    this.details = details as PriceChangedErrorDetails & Record<string, unknown>
  }
}

function buildMatchdayHeaders(idempotencyKey?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  return headers
}

function toMatchdayApiError(err: unknown): MatchdayApiError {
  if (err instanceof MatchdayApiError) return err

  const axiosErr = err as AxiosError<MatchdayFailure>
  if (axiosErr?.isAxiosError) {
    const status = axiosErr.response?.status ?? null
    const body = axiosErr.response?.data
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      axiosErr.message ||
      'The ticketing service is temporarily unavailable.'
    const details =
      body?.errors && typeof body.errors === 'object'
        ? (body.errors as Record<string, unknown>)
        : null

    if (
      status === 409 &&
      details?.code === 'price_changed' &&
      typeof details.order_id === 'number' &&
      typeof details.currency === 'string' &&
      typeof details.quantity === 'number' &&
      typeof details.previous_amount_minor === 'number' &&
      typeof details.new_amount_minor === 'number'
    ) {
      return new MatchdayPriceChangedError(
        message,
        details as unknown as PriceChangedErrorDetails,
      )
    }

    let fieldErrors: Record<string, string[]> | null = null
    if (details) {
      const entries = Object.entries(details)
      const isFieldErrorMap =
        entries.length > 0 &&
        entries.every(
          ([, value]) =>
            Array.isArray(value) &&
            value.every((item) => typeof item === 'string'),
        )
      if (isFieldErrorMap) fieldErrors = details as Record<string, string[]>
    }

    return new MatchdayApiError(message, status, fieldErrors, details)
  }

  return new MatchdayApiError(
    err instanceof Error ? err.message : 'Something went wrong.',
    null,
  )
}

function unwrap<T>(payload: MatchdaySuccess<T> | MatchdayFailure): T {
  if (payload.success) return payload.data
  const details =
    payload.errors && typeof payload.errors === 'object' ? payload.errors : null
  const fieldErrors =
    details &&
    Object.values(details).every(
      (value) =>
        Array.isArray(value) && value.every((item) => typeof item === 'string'),
    )
      ? (details as Record<string, string[]>)
      : null
  throw new MatchdayApiError(payload.message, null, fieldErrors, details)
}

/* ── Catalogue ──────────────────────────────────────────────────── */

export async function getTournaments(): Promise<MatchdayTournament[]> {
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayTournament[]> | MatchdayFailure
    >(`${BASE}/tournaments`)
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function getTeams(): Promise<MatchdayTeam[]> {
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayTeam[]> | MatchdayFailure
    >(`${BASE}/teams`)
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function getVenues(): Promise<MatchdayVenue[]> {
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayVenue[]> | MatchdayFailure
    >(`${BASE}/venues`)
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export interface EventsResult {
  events: MatchdayEvent[]
  meta: EventsMeta
}

export async function getEvents(
  filters: EventFilters = {},
): Promise<EventsResult> {
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayEvent[]> | MatchdayFailure
    >(`${BASE}/events`, { params: filters })
    const events = unwrap(data)
    const meta = (data.success ? data.meta : undefined) as
      | EventsMeta
      | undefined
    return {
      events,
      meta: meta ?? {
        current_page: 1,
        per_page: filters.per_page ?? 50,
        total_events: events.length,
      },
    }
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function getEvent(eventId: number): Promise<MatchdayEvent | null> {
  const { events } = await getEvents({ id: eventId })
  return events[0] ?? null
}

export interface ListingsResult {
  listings: MatchdayListing[]
  meta: ListingsMeta
}

export async function getListings(
  filters: ListingFilters,
): Promise<ListingsResult> {
  if (!filters.event_id) {
    throw new MatchdayApiError('event_id is required to load listings.', 422)
  }
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayListing[]> | MatchdayFailure
    >(`${BASE}/listings`, { params: filters })
    const listings = unwrap(data)
    const meta = (data.success ? data.meta : undefined) as
      | ListingsMeta
      | undefined
    if (!meta) {
      throw new MatchdayApiError(
        'Listings response was missing its meta block.',
        null,
      )
    }
    return { listings, meta }
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

/* ── Checkout ─────────────────────────────────────────────────── */

export async function prepareCheckout(
  payload: CreateCheckoutPayload,
  idempotencyKey?: string,
): Promise<MatchdayOrder> {
  try {
    const { data } = await axiosInstance.post<
      MatchdaySuccess<MatchdayOrder> | MatchdayFailure
    >(`${BASE}/checkout`, payload, {
      headers: buildMatchdayHeaders(idempotencyKey),
    })
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function payCheckout(
  orderId: number,
  checkoutToken: string,
  couponCode?: string,
): Promise<MatchdayOrder> {
  try {
    const payload: PayCheckoutPayload = {
      checkout_token: checkoutToken,
      ...(couponCode ? { coupon_code: couponCode } : {}),
    }
    const { data } = await axiosInstance.post<
      MatchdaySuccess<MatchdayOrder> | MatchdayFailure
    >(`${BASE}/checkout/${orderId}/pay`, payload, {
      headers: buildMatchdayHeaders(),
    })
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function getOrderByCheckoutSession(
  sessionId: string,
): Promise<MatchdayOrder> {
  try {
    const { data } = await axiosInstance.get<
      MatchdaySuccess<MatchdayOrder> | MatchdayFailure
    >(`${BASE}/orders/by-checkout-session/${encodeURIComponent(sessionId)}`)
    const order = unwrap(data)
    if (order.status === 'failed' && data.success) {
      order.statusMessage = data.message
    }
    return order
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export async function submitAttendees(
  orderId: number,
  payload: SubmitAttendeesPayload,
): Promise<MatchdayOrder> {
  try {
    const { data } = await axiosInstance.post<
      MatchdaySuccess<MatchdayOrder> | MatchdayFailure
    >(`${BASE}/orders/${orderId}/attendees`, payload, {
      headers: buildMatchdayHeaders(),
    })
    return unwrap(data)
  } catch (err) {
    throw toMatchdayApiError(err)
  }
}

export type CheckoutErrorAction =
  | 'fix-and-retry'
  | 'back-to-listings'
  | 'restart'
  | 'price-changed'
  | 'poll'
  | 'retry-once'
  | 'wait'

export interface CheckoutErrorGuidance {
  message: string
  action: CheckoutErrorAction
}

export function checkoutErrorGuidance(
  error: MatchdayApiError,
  phase: 'prepare' | 'pay',
): CheckoutErrorGuidance {
  if (error instanceof MatchdayPriceChangedError) {
    return { message: error.message, action: 'price-changed' }
  }
  switch (error.status) {
    case 422:
      if (
        phase === 'pay' &&
        [244, 258, 234, 242, 231].includes(error.errorNum ?? -1)
      ) {
        return { message: error.message, action: 'back-to-listings' }
      }
      return { message: error.message, action: 'fix-and-retry' }
    case 404:
      return phase === 'prepare'
        ? {
            message:
              'This listing is no longer available. Please choose another one.',
            action: 'back-to-listings',
          }
        : {
            message:
              'This checkout session has expired, or the wrong session was used. Please start again.',
            action: 'restart',
          }
    case 409:
      return {
        message:
          'This order is already being paid for — check any other open tab or window before trying again.',
        action: 'poll',
      }
    case 502:
      return {
        message: 'Payment could not be started. Please try again in a moment.',
        action: 'retry-once',
      }
    case 503:
      return {
        message:
          phase === 'prepare'
            ? 'Pricing is temporarily unavailable. Please try again shortly.'
            : 'The ticketing service is temporarily unavailable. Please try again shortly.',
        action: 'wait',
      }
    default:
      return { message: error.message, action: 'fix-and-retry' }
  }
}
