/* VIP packages — admin API types.
 *
 * Source: "MatchDay VIP packages: Admin API contract" (12 Nov 2026) and the
 * Postman collection "MatchDay hospitality (VIP packages)", folder 8 Admin.
 * Only the fields the screens read are typed; real answers carry more.
 *
 * The actions on a single item (attach, enter by hand, retry, refund) are
 * the Booking resolution endpoints (features/admin/booking-resolution);
 * this file covers the package list, the detail, Release, the held-item
 * refund and the hospitality markup. */

import type { BookingResolution } from '@/features/payment/status'

/** Internal package statuses (contract §1). The admin shows these. */
export type VipAdminStatus =
  | 'building'
  | 'checkout_started'
  | 'paid'
  | 'ticket_secured'
  | 'needs_attention'
  | 'completed'
  | 'closed'
  | 'abandoned'

export const VIP_ADMIN_STATUSES: VipAdminStatus[] = [
  'needs_attention',
  'paid',
  'ticket_secured',
  'completed',
  'closed',
  'checkout_started',
  'building',
  'abandoned',
]

/** "package" (ticket + flight + hotel) or "flexible" (ticket only
 *  required). A package keeps the mode it was created under. */
export type VipAdminMode = 'package' | 'flexible'

/** GET/PATCH /v1/admin/hospitality/settings (contract §1.3). */
export interface VipAdminSettings {
  enabled: boolean
  mode: VipAdminMode
  updated_by_admin_id: number | null
  updated_at: string | null
}

/** PATCH body: send only what changes. */
export type VipAdminSettingsPatch = Partial<Pick<VipAdminSettings, 'enabled' | 'mode'>>

/** Configured clubs (contract §3 filter values). */
export const VIP_ADMIN_CLUBS = ['barcelona', 'real_madrid', 'atletico_madrid'] as const

export interface VipEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface VipAdminListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** One row of GET /v1/admin/hospitality/packages (contract §3). */
export interface VipAdminPackageRow {
  id: string
  status: VipAdminStatus | string
  club: string
  /** The mode the package was created under (contract of 17 Nov). */
  mode?: VipAdminMode | string
  event_name: string
  /** Local kick-off in Spain, no offset. */
  event_date: string
  quantity: number
  paid_at: string | null
  /** Kept as history after a release: read together with status. */
  attention_reason: string | null
  attention_at: string | null
  held_items: number
  items_with_cs: number
  created_at: string
}

export interface VipAdminListResponse extends VipEnvelope<VipAdminPackageRow[]> {
  meta: VipAdminListMeta
}

export interface VipAdminListFilters {
  status?: VipAdminStatus | ''
  club?: string
  /** YYYY-MM-DD, on the creation date. */
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

/** `eur` on the order and each item: nulls where no rate is stored. */
export interface VipEurBlock {
  currency: 'EUR' | string
  cost: number | null
  markup: number | null
  total: number | null
}

export interface VipItemAction {
  available: boolean
  method: 'GET' | 'POST' | string
  /** The endpoint to call, e.g. /api/v1/admin/ledgers/4821/refund. */
  href: string
}

export type VipItemProduct = 'flight' | 'hotel' | 'esim' | 'esim_topup'

export interface VipAdminItem {
  ledger_id: number
  reference: string
  product: VipItemProduct | string
  /** Internal status. */
  status: string
  /** What the customer's page shows for it. */
  customer_status: string
  payment_status: string
  resolution: BookingResolution
  /** Failed and not resolved: also listed in Action required. */
  with_cs: boolean
  /** Waiting for the ticket. */
  held: boolean
  action_required_at: string | null
  currency: string
  /** Charge currency, major units. */
  amount_paid: number
  eur: VipEurBlock
  actions: {
    attach_booking: VipItemAction
    manual_booking: VipItemAction
    retry: VipItemAction
    refund: VipItemAction
    history: VipItemAction
  }
}

export interface VipTicketConfirmedByCs {
  confirmed: boolean
  warning: string | null
  at: string | null
  admin_id: number | null
  ftn_order_reference: string | null
}

/** The package's match ticket order. ftn_order_id is internal only. */
export interface VipAdminOrder {
  id: number
  status: string
  payment_status: string
  ftn_order_id: string | null
  currency: string
  amount_paid: number
  eur: VipEurBlock
}

export interface VipEarlierCheckout {
  id: number
  type: VipItemProduct | string
  status: string
  payment_status: string
  created_at: string
}

export interface VipAuditRow {
  /** "package" = written by Release; "ledger" = an item's history. */
  source: 'package' | 'ledger' | string
  ledger_id: number | null
  /** e.g. note, release, release_cs_confirmed, refund … */
  action: string
  admin_id: number | null
  note: string | null
  reference: string | null
  created_at: string
}

/** GET /v1/admin/hospitality/packages/{id} (contract §4). */
export interface VipAdminPackage extends VipAdminPackageRow {
  user_id: number | null
  event_id: string
  departure_iata: string | null
  return_included: boolean
  hotel_nights: number | null
  /** Flexible packages with a hotel chosen without a flight: the check-in
   *  the customer picked (YYYY-MM-DD); null otherwise. */
  hotel_check_in?: string | null
  stripe_checkout_session_id: string | null
  attention_alert_sent_at: string | null
  ticket_secured_alert_sent_at: string | null
  delay_email_sent_at: string | null
  ticket_secured_at: string | null
  completed_at: string | null
  closed_at: string | null
  ticket_confirmed_by_cs: VipTicketConfirmedByCs
  order: VipAdminOrder | null
  items: VipAdminItem[]
  earlier_checkouts: VipEarlierCheckout[]
  /** null if any figure has no stored rate. */
  eur_total: number | null
  /** Newest first. */
  audit: VipAuditRow[]
}

/* ── Release (contract §5) ── */

export interface VipReleaseBody {
  /** Required, up to 1000 characters. */
  note: string
  /** true = the override: the ticket was bought by hand. */
  ticket_confirmed_by_cs?: boolean
  /** Up to 64 characters. Only used with the override. */
  ftn_order_reference?: string
}

export interface VipReleaseResult {
  outcome: 'done' | 'refused'
  /** Plain sentence for staff. Show as written. */
  reason: string | null
  released: number
  /** Internal status after the call. */
  package_status: VipAdminStatus | string
}

/* ── Held-item refund (contract §6, the existing refund endpoint) ── */

export interface VipRefundBody {
  /** Required when confirming. */
  note?: string
  confirm: boolean
}

export interface VipRefundLedger {
  id: number
  reference: string
  status: string
  customer_status: string
  payment_status: string
  resolution: BookingResolution
  with_cs: boolean
}

export interface VipRefundResult {
  outcome: 'report' | 'done' | 'refused' | 'failed'
  reason: string | null
  ledger: VipRefundLedger
  details: string[]
}

/* ── Markup products (contract §8) ── */

export interface MarkupProduct {
  title: string
  categories: string[]
}

export interface CreateMarkupBody {
  title: string
  categories: Record<string, { amount: number; type: string }>
}
