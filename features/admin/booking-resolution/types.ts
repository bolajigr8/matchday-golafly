/* Booking resolution — admin "Action required" API types.
 *
 * Source: "Booking resolution: frontend handoff", backend API contract v1.0
 * (6 Nov 2026), section 2. All endpoints live under /api/v1/admin and use the
 * normal admin token. Every action is two-step: confirm:false → preview
 * (outcome "report"), confirm:true → do it.
 *
 * Match tickets are not in v1.0. A second backend doc will add them, so the
 * product union is left open ('ticket' is pre-declared). */

import type { BookingResolution } from '@/features/payment/status'

export type ResolutionProduct =
  | 'flight'
  | 'hotel'
  | 'esim'
  | 'esim_topup'
  /** Pre-declared for the match-ticket follow-up doc. Not sent by v1.0. */
  | 'ticket'

/** What an action decided. Always HTTP 200; non-2xx means a bad request. */
export type ActionOutcome = 'report' | 'done' | 'refused' | 'failed'

/** The small booking summary every action response carries (§2.1). */
export interface ResolutionLedger {
  id: number
  reference: string
  status: string
  /** The word the customer's pages are showing right now. */
  customer_status: string
  payment_status: string
  resolution: BookingResolution
  /** false once resolved (or confirmed). */
  with_cs: boolean
}

export interface ResolutionClaim {
  by: string
  since: string
  /** true while someone is working on it; lapses after 10 minutes. */
  active: boolean
}

/** One row of GET /v1/admin/bookings/action-required (§2.2). */
export interface ActionRequiredRow {
  ledger_id: number
  product: ResolutionProduct | string
  reference: string
  customer_email: string
  /** Major units as a string, e.g. "899.00". */
  amount: string
  amount_paid_minor: number
  currency: string
  status: string
  /** STAFF ONLY. Never show to customers. */
  reason: string | null
  action_required_at: string
  minutes_since_action_required: number
  /** null → CS was never alerted: show a red marker. */
  action_alert_sent_at: string | null
  delay_email_sent_at: string | null
  claim: ResolutionClaim | null
  /** An automatic booking attempt may still be running: disable all actions. */
  job_running: boolean
}

export interface ActionRequiredMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ActionRequiredFilters {
  product?: ResolutionProduct | ''
  /** YYYY-MM-DD, on when the booking was raised. */
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export interface ResolutionEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface ActionRequiredResponse extends ResolutionEnvelope<ActionRequiredRow[]> {
  meta: ActionRequiredMeta
}

/* ── History: GET /v1/admin/ledgers/{id}/actions ─────────────────────── */

export type ResolutionActionKind =
  | 'rebooked'
  | 'manual_booking'
  | 'retry'
  | 'refund'
  | 'refund_failed'
  | 'attach_refused'
  | 'action_refused'
  | string

export interface ResolutionHistoryItem {
  id: number
  action: ResolutionActionKind
  operator: string
  admin_id: number | null
  note: string | null
  reference: string | null
  stripe_refund_id: string | null
  amount_minor: number | null
  currency: string | null
  created_at: string
}

/* ── Action results ──────────────────────────────────────────────────── */

export interface Differences {
  /** Names, guest/passenger count, attached elsewhere. Always refuse. */
  hard: string[]
  /** Route/dates (flight), hotel/dates (hotel), package/quantity (eSIM).
   *  Flights only may override with accept_differences. */
  soft: string[]
}

export interface ActionResult {
  outcome: ActionOutcome
  /** Plain sentence for people. Show as written. */
  reason: string | null
  ledger: ResolutionLedger
  /** attach-booking only. */
  differences?: Differences
  supplier_id?: string | null
  cost?: { amount: string; currency: string } | null
  /** manual-booking / retry / refund: what will change / what happened. */
  details?: string[]
}

/* ── Action bodies ───────────────────────────────────────────────────── */

export interface AttachBody {
  supplier_reference: string
  note?: string
  /** Flights only. */
  accept_differences?: boolean
  confirm: boolean
}

export interface FlightSegmentDetails {
  from: string
  to: string
  flight_number: string
  /** "YYYY-MM-DD HH:mm" */
  departs_at: string
  arrives_at: string
}

export interface MoneyDetails {
  amount: string
  currency: string
}

export interface FlightManualDetails {
  airline: string
  pnr: string
  segments: FlightSegmentDetails[]
  cost?: MoneyDetails
}

export interface HotelManualDetails {
  hotel_name: string
  address: string
  checkin: string
  checkout: string
  confirmation_number: string
  cost?: MoneyDetails
}

/** Either smdp_address + activation_code, or qrcode. */
export interface EsimManualDetails {
  smdp_address?: string
  activation_code?: string
  qrcode?: string
  iccid: string
  cost?: MoneyDetails
}

export interface EsimTopupManualDetails {
  iccid: string
  package: string
  cost?: MoneyDetails
}

export type ManualDetails =
  | FlightManualDetails
  | HotelManualDetails
  | EsimManualDetails
  | EsimTopupManualDetails

export interface ManualBody {
  details: ManualDetails
  /** The supplier's reference. Required. */
  reference: string
  /** Required when confirm is true. */
  note?: string
  confirm: boolean
}

export interface RetryBody {
  note?: string
  confirm: boolean
}

export interface RefundBody {
  /** Required when confirm is true. */
  note?: string
  /** "I checked the supplier and no booking exists." */
  no_booking_confirmed?: boolean
  /** "I checked Stripe for an existing refund." Needed after a failed refund. */
  stripe_checked?: boolean
  confirm: boolean
}

export type ResolutionAction = 'attach' | 'manual' | 'retry' | 'refund'

/** 422 body: errors keyed by field (§2.4). */
export interface ValidationErrorBody {
  success?: false
  message: string
  errors: Record<string, string[]> | null
}
