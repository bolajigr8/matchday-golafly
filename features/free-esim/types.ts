// features/free-esim/types.ts
//
// Free eSIM with match tickets — "Free eSIM - Frontend API contract" (20 Nov 2026)
// + Postman collection "Free eSIM with match tickets".
// The backend gives every confirmed match-ticket order one free 1 GB / 7 day
// eSIM by itself. The frontend makes NO grant call: it shows the admin
// switch, advertises the offer while it is live, and shows a free eSIM as free.

export type FreeEsimScope = 'europe' | 'all'

/** Contract §3: GET/PATCH /api/v1/admin/free-esim/settings (admin token). */
export interface AdminFreeEsimSettings {
  is_enabled: boolean
  /** Kept while the switch is off. "europe" until first saved. */
  scope: FreeEsimScope
  /** Last off → on. Only orders confirmed after this get a free eSIM. */
  enabled_at: string | null
  /** Whether an eSIM provider is switched on (Settings → Providers). */
  provider_active: boolean
  active_provider: string | null
  /** is_enabled && provider_active: what decides whether free eSIMs go out. */
  is_available: boolean
  updated_by_admin_id: number | null
  updated_at: string | null
}

/** Contract §3: always both fields, even when only one changes. */
export interface UpdateFreeEsimSettings {
  is_enabled: boolean
  scope: FreeEsimScope
}

/** Contract §4: GET /api/v1/free-esim/settings (no token). */
export interface PublicFreeEsimSettings {
  is_available: boolean
  /** Always null when is_available is false. */
  scope: FreeEsimScope | null
}

export interface FreeEsimEnvelope<T> {
  success: boolean
  message: string
  data: T
}

/** Contract §5: the three fields an eSIM row gains (customer + admin
 *  overview rows: inside `summary`; admin eSIM orders: top level). */
export interface FreeEsimRowFields {
  is_free_with_ticket?: boolean
  free_with_matchday_order_id?: number | null
  free_with_matchday_reference?: string | null
}

/* ── Contract §6: free_esim block on the admin match order detail ── */

export type FreeEsimOrderStatus =
  | 'delivered'
  | 'in_progress'
  | 'failed'
  | 'not_sent'
  | 'not_eligible'
  | 'unknown'

export interface FreeEsimOrderEsim {
  ledger_id: number
  reference: string | null
  status: string | null
  provider: string | null
  package: string | null
  iccid: string | null
  confirmed_at: string | null
  customer_email_sent_at: string | null
  failure_message: string | null
  /** true: an eSIM may exist at the provider — check before re-ordering. */
  requires_reconciliation: boolean
}

export interface FreeEsimOrderReason {
  code: string
  text: string
  /** When the team was emailed (not_sent only); null if not yet. */
  alert_sent_at?: string | null
}

export interface FreeEsimOrderBlock {
  status: FreeEsimOrderStatus | string
  esim: FreeEsimOrderEsim | null
  /** failed: the failure message (string); not_sent / not_eligible: object. */
  reason: FreeEsimOrderReason | string | null
}
