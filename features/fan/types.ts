/* Fan auth + ledger API types.
 *
 * The envelope is declared locally rather than imported: `ApiResponse<T>`
 * already means slightly different things in services/programs.ts and
 * services/travel-admin.ts, and a shared name that quietly differs per feature
 * is worse than three honest copies.
 *
 * Shapes verified against the travels app, which runs these same endpoints in
 * production (Desktop/travels/features/auth/types.ts).
 */

import type { BookingResolution } from '@/features/payment/status'
import type { FreeEsimRowFields } from '@/features/free-esim/types'

export interface FanApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/* ── Auth ─────────────────────────────────────────────────────────────── */

export interface FanUser {
  id: string
  name: string
  email: string
  role: string
  /* Which player record a "player" account belongs to. Not confirmed on the
     login response yet — read from either shape if the API sends one. */
  player_id?: number | string | null
  player?: { id: number | string } | null
  status: number
  /** Email verification (MatchDay Email verification collection). False
   *  until the 6-digit emailed code is entered. Missing on responses from a
   *  backend without verification: treat missing as verified. */
  email_verified?: boolean
  email_verified_at?: string | null
  created_at: string
  updated_at: string
}

export interface FanAuthData {
  user: FanUser
  token: string
  /** Seconds. Drives the session cookie's lifetime — see features/fan/session.ts. */
  expires_in: number
}

export interface FanLoginPayload {
  email: string
  password: string
}

export interface FanRegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  /* The account's role. /register only ever sends "fan" (SIGNUP_ROLE in
     features/scout/roles.ts) — scouts and players get their accounts from
     Golafly. Optional so the backend default still applies if omitted. */
  role?: string
}

export interface FanForgotPasswordPayload {
  email: string
}

/* ── Email verification ───────────────────────────────────────────────
   POST /v1/auth/email/verify and /v1/auth/email/resend are public (no
   token); both take the email. */
export interface FanVerifyEmailPayload {
  email: string
  code: string
}

export interface FanResendCodeData {
  expires_in_minutes: number
  resend_after_seconds: number
}

export interface FanResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface FanChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

/* ── Ledgers — the fan's own orders ───────────────────────────────────────
   GET /v1/auth/ledgers. Note this is a DIFFERENT endpoint from the admin's
   /v1/overview/ledgers: same records, but scoped to the caller instead of the
   whole business. */

export type FanLedgerType = 'flight' | 'esim' | 'stays'

/** Match tickets have no ledger type yet — see design/tickets-endpoint.md.
 *  Declared here so the union is ready and the UI can already branch on it. */
export type FanLedgerTypeFuture = FanLedgerType | 'ticket'

/** 'complimentary' = a free eSIM with match tickets (Free eSIM contract §5). */
export type FanPaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'complimentary' | string

export type FanLedgerStatus =
  | 'initiated'
  | 'confirmed'
  | 'payment_received_booking_failed'
  /* Booking resolution: a paid booking Golafly support is finishing. */
  | 'needs_reconciliation'
  | 'processing'
  | string

export interface FanLedgerCustomer {
  full_name: string | null
  email: string | null
  phone: string | null
}

export interface FanLedgerPricing {
  /** MINOR UNITS. 391473 is 3,914.73 — see features/fan/ledgers.ts. */
  amount_paid_minor: number
  currency: string
}

export interface FanFlightSummary {
  pnr_reference: string | null
  airline_name: string | null
  origin: string | null
  destination: string | null
  departure_date: string | null
  duffel_order_id: string | null
}

export interface FanEsimSummary extends FreeEsimRowFields {
  package: string | null
  package_id: string | null
  provider?: string | null
  iccid: string | null
  airalo_order_id: string | null
}

export interface FanStaysSummary {
  hotel_name: string | null
  hotel_id: number | null
  checkin: string | null
  checkout: string | null
  booking_id: string | null
  confirmation_number: string | null
}

interface FanLedgerBase {
  ledger_id: number
  request_type: string | null
  status: FanLedgerStatus
  payment_status: FanPaymentStatus
  customer: FanLedgerCustomer
  pricing: FanLedgerPricing
  paid_at: string | null
  created_at: string
  /** Booking resolution: "rebooked" (support completed it, status confirmed),
   *  "refunded" (refunded by hand), null/absent = as before. */
  resolution?: BookingResolution
}

export interface FanFlightLedger extends FanLedgerBase {
  ledger_type: 'flight'
  summary: FanFlightSummary
}

export interface FanEsimLedger extends FanLedgerBase {
  ledger_type: 'esim'
  summary: FanEsimSummary
}

export interface FanStaysLedger extends FanLedgerBase {
  ledger_type: 'stays'
  summary: FanStaysSummary
}

export type FanLedger = FanFlightLedger | FanEsimLedger | FanStaysLedger

export interface FanLedgerListParams {
  type?: FanLedgerType
  page?: number
  per_page?: number
}
