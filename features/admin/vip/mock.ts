/* In-browser stand-in for the VIP package admin endpoints, used only when
 * NEXT_PUBLIC_VIP_API_MODE=mock (features/vip/mode.ts). Nothing leaves the
 * browser. State resets on a page reload.
 *
 * The one package here is the contract's own example (Admin API contract §4
 * and the Postman "Package detail" answer): a flight that failed and is
 * with CS, and a hotel held for the ticket. Release, the override and the
 * held-item refund follow the contract's rules (§5, §6), with its exact
 * refusal sentences.
 *
 * Set MOCK_ON_REFUND_LIST = false to try the 403s an admin who is not on
 * the refund list gets (override and refund confirm). */

import type {
  VipAdminItem,
  VipAdminListFilters,
  VipAdminListResponse,
  VipAdminPackage,
  VipAdminPackageRow,
  VipAdminSettings,
  VipAdminSettingsPatch,
  VipEnvelope,
  VipRefundBody,
  VipRefundResult,
  VipReleaseBody,
  VipReleaseResult,
} from './types'

import { MOCK_SETTINGS_KEY, mockSettings } from '@/features/vip/mock/server'

export const MOCK_ON_REFUND_LIST = true
const MOCK_ADMIN_ID = 7

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

/** Throws like axios does, so extractApiMessage and status checks work. */
function httpError(status: number, data: unknown): never {
  throw Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } })
}

const actions = (id: number, withCs: boolean, held: boolean, product: string, needsAttention: boolean) => {
  const a = (available: boolean, method: string, path: string) => ({
    available,
    method,
    href: `/api/v1/admin/ledgers/${id}/${path}`,
  })
  return {
    attach_booking: a(withCs, 'POST', 'attach-booking'),
    manual_booking: a(withCs, 'POST', 'manual-booking'),
    retry: a(withCs && (product === 'esim' || product === 'esim_topup'), 'POST', 'retry'),
    refund: a(withCs || (held && needsAttention), 'POST', 'refund'),
    history: a(true, 'GET', 'actions'),
  }
}

function seed(): VipAdminPackage {
  return {
    id: '01JCXV8Q3N7M2ZK4T6R9YHCD5E',
    status: 'needs_attention',
    club: 'barcelona',
    mode: 'package',
    event_name: 'FC Barcelona vs Rival',
    event_date: '2027-03-06T21:00:00',
    quantity: 2,
    paid_at: '2027-02-20T10:15:00+00:00',
    attention_reason: 'The flight booking failed.',
    attention_at: '2027-02-20T10:46:00+00:00',
    held_items: 1,
    items_with_cs: 1,
    created_at: '2027-02-20T10:02:00+00:00',
    user_id: null,
    event_id: '2001',
    departure_iata: 'LHR',
    return_included: true,
    hotel_nights: 2,
    hotel_check_in: null,
    stripe_checkout_session_id: 'cs_test_a1B2c3D4e5F6g7H8',
    attention_alert_sent_at: '2027-02-20T10:46:03+00:00',
    ticket_secured_alert_sent_at: null,
    delay_email_sent_at: '2027-02-20T10:47:10+00:00',
    ticket_secured_at: null,
    completed_at: null,
    closed_at: null,
    ticket_confirmed_by_cs: { confirmed: false, warning: null, at: null, admin_id: null, ftn_order_reference: null },
    order: {
      id: 310,
      status: 'confirmed',
      payment_status: 'paid',
      ftn_order_id: 'FTN-310',
      currency: 'EUR',
      amount_paid: 920,
      eur: { currency: 'EUR', cost: 800, markup: 120, total: 920 },
    },
    items: [
      {
        ledger_id: 4821,
        reference: 'GF-00004821',
        product: 'flight',
        status: 'payment_received_booking_failed',
        customer_status: 'confirming',
        payment_status: 'paid',
        resolution: null,
        with_cs: true,
        held: false,
        action_required_at: '2027-02-20T10:46:00+00:00',
        currency: 'EUR',
        amount_paid: 1600,
        eur: { currency: 'EUR', cost: 1450, markup: 150, total: 1600 },
        actions: actions(4821, true, false, 'flight', true),
      },
      {
        ledger_id: 4822,
        reference: 'GF-00004822',
        product: 'hotel',
        status: 'held_for_ticket',
        customer_status: 'needs_reconciliation',
        payment_status: 'paid',
        resolution: null,
        with_cs: false,
        held: true,
        action_required_at: null,
        currency: 'EUR',
        amount_paid: 900,
        eur: { currency: 'EUR', cost: 780, markup: 120, total: 900 },
        actions: actions(4822, false, true, 'hotel', true),
      },
    ],
    earlier_checkouts: [
      { id: 4790, type: 'flight', status: 'failed', payment_status: 'failed', created_at: '2027-02-20T10:05:00+00:00' },
      { id: 4791, type: 'hotel', status: 'pending_payment', payment_status: 'expired', created_at: '2027-02-20T10:05:00+00:00' },
    ],
    eur_total: 3420,
    audit: [
      {
        source: 'ledger',
        ledger_id: 4821,
        action: 'note',
        admin_id: 7,
        note: 'Called the airline',
        reference: null,
        created_at: '2027-02-20T11:20:00+00:00',
      },
    ],
  }
}

let pkg: VipAdminPackage | null = null
const db = () => (pkg ??= seed())

const ROW_KEYS: (keyof VipAdminPackageRow)[] = [
  'id', 'status', 'club', 'event_name', 'event_date', 'quantity', 'paid_at',
  'attention_reason', 'attention_at', 'held_items', 'items_with_cs', 'created_at',
]
const toRow = (p: VipAdminPackage): VipAdminPackageRow =>
  Object.fromEntries(ROW_KEYS.map((k) => [k, p[k]])) as unknown as VipAdminPackageRow

/** Counts and actions follow the items, as the backend recomputes them. */
function refresh(p: VipAdminPackage) {
  p.held_items = p.items.filter((i) => i.held).length
  p.items_with_cs = p.items.filter((i) => i.with_cs).length
  const na = p.status === 'needs_attention'
  p.items = p.items.map((i) => ({ ...i, actions: actions(i.ledger_id, i.with_cs, i.held, i.product, na) }))
}

export async function mockListPackages(f: VipAdminListFilters): Promise<VipAdminListResponse> {
  await wait()
  if (f.from_date && f.to_date && f.to_date < f.from_date)
    httpError(422, { message: 'The to date field must be a date after or equal to from date.', errors: { to_date: ['The to date field must be a date after or equal to from date.'] } })
  const p = db()
  const day = p.created_at.slice(0, 10)
  const match =
    (!f.status || f.status === p.status) &&
    (!f.club || f.club === p.club) &&
    (!f.from_date || day >= f.from_date) &&
    (!f.to_date || day <= f.to_date)
  const data = match ? [toRow(p)] : []
  const per = f.per_page ?? 25
  return {
    success: true,
    message: 'VIP packages retrieved successfully.',
    data,
    meta: { current_page: 1, last_page: 1, per_page: per, total: data.length },
  }
}

export async function mockGetPackage(id: string): Promise<VipEnvelope<VipAdminPackage>> {
  await wait()
  const p = db()
  if (id !== p.id) httpError(404, { success: false, message: 'Package not found.', errors: null })
  return { success: true, message: 'VIP package retrieved successfully.', data: structuredClone(p) }
}

const refused = (reason: string, p: VipAdminPackage): VipEnvelope<VipReleaseResult> => ({
  success: true,
  message: 'Refused; nothing was changed.',
  data: { outcome: 'refused', reason, released: 0, package_status: p.status },
})

export async function mockRelease(id: string, body: VipReleaseBody): Promise<VipEnvelope<VipReleaseResult>> {
  await wait(450)
  const p = db()
  if (id !== p.id) httpError(404, { success: false, message: 'Package not found.', errors: null })
  if (!body.note?.trim())
    httpError(422, { message: 'The note field is required.', errors: { note: ['The note field is required.'] } })
  if ((body.ftn_order_reference ?? '').length > 64)
    httpError(422, {
      message: 'The ftn order reference field must not be greater than 64 characters.',
      errors: { ftn_order_reference: ['The ftn order reference field must not be greater than 64 characters.'] },
    })

  const override = body.ticket_confirmed_by_cs === true
  if (override) {
    if (!MOCK_ON_REFUND_LIST)
      httpError(403, { success: false, message: 'You are not allowed to confirm a ticket by hand. Ask an admin on the refund list.', errors: null })
    if (p.status !== 'needs_attention') return refused('Wait for the ticket sweep: this package is not waiting on CS.', p)
  } else {
    if (p.status !== 'needs_attention' && p.status !== 'paid') return refused(`A ${p.status} package cannot be released.`, p)
    if (!p.order) return refused('The ticket is not secured (no ticket order exists). Secure it first, or confirm it by hand as an allowed admin.', p)
    const secured = !!p.order.ftn_order_id && ['awaiting_attendees', 'confirmed'].includes(p.order.status)
    if (!secured)
      return refused(`The ticket is not secured (the ticket order is ${p.order.status}). Secure it first, or confirm it by hand as an allowed admin.`, p)
  }

  const held = p.items.filter((i) => i.held)
  if (!held.length) return refused('This package has no held items that can be released right now.', p)

  /* Hand each held item to its booking process: here it becomes "being booked". */
  p.items = p.items.map((i): VipAdminItem => (i.held ? { ...i, held: false, status: 'processing' } : i))
  const now = new Date().toISOString()
  if (override) {
    p.ticket_confirmed_by_cs = {
      confirmed: true,
      warning: 'The ticket was confirmed by CS outside the system.',
      at: now,
      admin_id: MOCK_ADMIN_ID,
      ftn_order_reference: body.ftn_order_reference?.trim() || null,
    }
  }
  const stillFailed = p.items.some((i) => i.with_cs)
  p.status = stillFailed ? 'needs_attention' : 'ticket_secured'
  if (!stillFailed) p.ticket_secured_at = now
  p.audit.unshift({
    source: 'package',
    ledger_id: null,
    action: override ? 'release_cs_confirmed' : 'release',
    admin_id: MOCK_ADMIN_ID,
    note: body.note.trim(),
    reference: override ? body.ftn_order_reference?.trim() || null : `${held.length} released`,
    created_at: now,
  })
  refresh(p)
  return {
    success: true,
    message: 'Done.',
    data: { outcome: 'done', reason: null, released: held.length, package_status: p.status },
  }
}

/** The held-item refund (contract §6). With-CS items go through the Booking
 *  resolution panels instead. */
export async function mockRefundItem(ledgerId: number, body: VipRefundBody): Promise<VipEnvelope<VipRefundResult>> {
  await wait(450)
  const p = db()
  const item = p.items.find((i) => i.ledger_id === ledgerId)
  if (!item) httpError(404, { success: false, message: 'Ledger not found.', errors: null })
  const ledger = () => ({
    id: item.ledger_id,
    reference: item.reference,
    status: item.status,
    customer_status: item.customer_status,
    payment_status: item.payment_status,
    resolution: item.resolution,
    with_cs: item.with_cs,
  })
  const answer = (outcome: VipRefundResult['outcome'], message: string, reason: string | null, details: string[]) => ({
    success: true,
    message,
    data: { outcome, reason, ledger: ledger(), details },
  })

  if (item.resolution === 'refunded') return answer('refused', 'Refused; nothing was changed.', 'This booking has already been refunded.', [])
  if (item.held && p.status !== 'needs_attention')
    return answer('refused', 'Refused; nothing was changed.', 'This item is held for its VIP package ticket; it can only be refunded while the package needs attention.', [])
  if (!body.confirm)
    return answer('report', 'Report only; nothing was changed.', null, [
      `refund ${item.amount_paid.toFixed(2)} ${item.currency} of this ledger's own share through Stripe`,
      'then the customer is emailed once',
    ])
  if (!body.note?.trim()) httpError(422, { message: 'The note field is required.', errors: { note: ['The note field is required.'] } })
  if (!MOCK_ON_REFUND_LIST)
    httpError(403, { success: false, message: 'You are not allowed to confirm a refund. Ask an admin on the refund list.', errors: null })

  item.held = false
  item.status = 'payment_received_booking_failed'
  item.customer_status = 'payment_received_booking_failed'
  item.payment_status = 'refunded'
  item.resolution = 'refunded'
  p.audit.unshift({
    source: 'ledger',
    ledger_id: item.ledger_id,
    action: 'refund',
    admin_id: MOCK_ADMIN_ID,
    note: body.note.trim(),
    reference: null,
    created_at: new Date().toISOString(),
  })
  refresh(p)
  return answer('done', 'Done.', null, [])
}

/* ── On/off switch and mode (contract §1.3) ─────────────────────────────
   Shared with the customer-side test mode through localStorage, so
   switching here changes what the test VIP pages do. */

let settingsMeta: { updated_by_admin_id: number | null; updated_at: string | null } = {
  updated_by_admin_id: null,
  updated_at: null,
}

export async function mockGetSettings(): Promise<VipEnvelope<VipAdminSettings>> {
  await wait()
  return { success: true, message: 'Hospitality settings retrieved successfully.', data: { ...mockSettings(), ...settingsMeta } }
}

export async function mockUpdateSettings(body: VipAdminSettingsPatch): Promise<VipEnvelope<VipAdminSettings>> {
  await wait()
  if (body.enabled === undefined && body.mode === undefined) {
    httpError(422, { message: 'The enabled field is required when mode is not present.', errors: {} })
  }
  if (body.mode !== undefined && body.mode !== 'package' && body.mode !== 'flexible') {
    httpError(422, { message: 'The selected mode is invalid.', errors: { mode: ['The selected mode is invalid.'] } })
  }
  const next = { ...mockSettings(), ...body }
  try {
    localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify({ enabled: next.enabled, mode: next.mode }))
  } catch {
    /* ignore */
  }
  settingsMeta = { updated_by_admin_id: MOCK_ADMIN_ID, updated_at: new Date().toISOString() }
  return { success: true, message: 'Hospitality settings updated successfully.', data: { ...next, ...settingsMeta } }
}
