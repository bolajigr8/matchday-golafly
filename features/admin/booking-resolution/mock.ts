/* In-browser stand-in for the six booking-resolution admin endpoints, shaped
 * exactly like contract v1.0. Used until the backend is confirmed live (see
 * USE_MOCK in ./api.ts). Nothing here leaves the browser.
 *
 * It behaves like the contract says the backend will, so every screen state
 * can be tried:
 *   · attach: a reference containing "other" → hard difference (refused);
 *     containing "diff" → soft difference (flights: "Attach anyway" allowed;
 *     hotels/eSIMs refused with "Use manual details instead.");
 *     anything else → clean match. ETG hotels always refuse (attach off).
 *   · manual: missing fields → 422 with errors.details; no note on confirm → 422.
 *   · retry: eSIM only; GF-00004824 refuses (a supplier order may exist).
 *   · refund: flights/hotels need no_booking_confirmed; GF-00004826 fails
 *     once (Stripe timeout), after which stripe_checked is required.
 *     Set MOCK_CAN_CONFIRM_REFUND = false to see the 403.
 *   · GF-00004825 has job_running (all actions refused); GF-00004826 is
 *     claimed by admin:3.
 * State resets on a page reload. */

import type {
  ActionRequiredFilters,
  ActionRequiredResponse,
  ActionRequiredRow,
  ActionResult,
  AttachBody,
  ManualBody,
  RefundBody,
  ResolutionEnvelope,
  ResolutionHistoryItem,
  ResolutionLedger,
  RetryBody,
} from './types'

/** Flip to false to try the "not on the refund list" 403. */
export const MOCK_CAN_CONFIRM_REFUND = true

const MOCK_OPERATOR = 'admin:you'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

interface MockLedger {
  row: ActionRequiredRow
  ledger: ResolutionLedger
  /** ETG hotel: attach is switched off for now. */
  etg?: boolean
  /** A supplier order may already exist (retry refused, refund needs the tick). */
  supplierOrderMayExist?: boolean
  /** The next refund attempt fails like a Stripe timeout. */
  refundFailsOnce?: boolean
  refundFailedBefore?: boolean
  history: ResolutionHistoryItem[]
}

function makeLedger(
  id: number,
  product: string,
  customerStatus: string,
  amount: string,
  currency: string,
  reason: string,
  minutes: number,
  extra: Partial<ActionRequiredRow> = {},
): { row: ActionRequiredRow; ledger: ResolutionLedger } {
  const reference = `GF-0000${id}`
  return {
    row: {
      ledger_id: id,
      product,
      reference,
      customer_email: `customer${id - 4820}@example.com`,
      amount,
      amount_paid_minor: Math.round(Number(amount) * 100),
      currency,
      status: 'payment_received_booking_failed',
      reason,
      action_required_at: minutesAgo(minutes),
      minutes_since_action_required: minutes,
      action_alert_sent_at: minutesAgo(minutes - 0.1),
      delay_email_sent_at: minutesAgo(minutes - 1),
      claim: null,
      job_running: false,
      ...extra,
    },
    ledger: {
      id,
      reference,
      status: 'payment_received_booking_failed',
      customer_status: customerStatus,
      payment_status: 'paid',
      resolution: null,
      with_cs: true,
    },
  }
}

function seed(): Map<number, MockLedger> {
  const list: MockLedger[] = [
    {
      ...makeLedger(4821, 'flight', 'needs_reconciliation', '300.00', 'GBP',
        'The flight offer expired before the booking could be confirmed.', 187),
      supplierOrderMayExist: true,
      history: [],
    },
    {
      ...makeLedger(4822, 'hotel', 'needs_reconciliation', '899.00', 'GBP',
        'The rate expired before the booking could be made.', 95),
      etg: true,
      supplierOrderMayExist: true,
      history: [],
    },
    {
      ...makeLedger(4823, 'esim', 'processing', '19.99', 'EUR',
        'The eSIM provider returned an error before an order was created.', 34),
      history: [],
    },
    {
      ...makeLedger(4824, 'esim_topup', 'processing', '9.00', 'EUR',
        'The top-up request timed out; the provider may have created the order.', 52),
      supplierOrderMayExist: true,
      history: [],
    },
    {
      ...makeLedger(4825, 'flight', 'needs_reconciliation', '512.40', 'EUR',
        'The airline did not answer in time.', 6, { job_running: true }),
      supplierOrderMayExist: true,
      history: [],
    },
    {
      ...makeLedger(4826, 'hotel', 'needs_reconciliation', '1240.00', 'USD',
        'The hotel sold out between payment and booking.', 241, {
          claim: { by: 'admin:3', since: minutesAgo(4), active: true },
          action_alert_sent_at: null,
        }),
      supplierOrderMayExist: true,
      refundFailsOnce: true,
      history: [
        {
          id: 9,
          action: 'attach_refused',
          operator: 'admin:3',
          admin_id: 3,
          note: 'Tried the similar hotel booking',
          reference: 'HTL-1102',
          stripe_refund_id: null,
          amount_minor: null,
          currency: null,
          created_at: minutesAgo(20),
        },
      ],
    },
  ]
  return new Map(list.map((l) => [l.row.ledger_id, l]))
}

let store: Map<number, MockLedger> | null = null
let historyId = 100
const db = () => (store ??= seed())

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms))

/** Throws like axios does, so extractApiMessage and the 422 handling work. */
function httpError(status: number, data: unknown): never {
  throw Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  })
}

function find(id: number): MockLedger {
  const l = db().get(id)
  if (!l) httpError(404, { success: false, message: 'Ledger not found.', errors: null })
  return l
}

function log(l: MockLedger, action: string, extra: Partial<ResolutionHistoryItem> = {}) {
  l.history.unshift({
    id: ++historyId,
    action,
    operator: MOCK_OPERATOR,
    admin_id: null,
    note: null,
    reference: null,
    stripe_refund_id: null,
    amount_minor: null,
    currency: null,
    created_at: new Date().toISOString(),
    ...extra,
  })
}

function envelope(result: ActionResult): ResolutionEnvelope<ActionResult> {
  const message =
    result.outcome === 'report'
      ? 'Report only; nothing was changed.'
      : result.outcome === 'refused'
        ? 'Refused; nothing was changed.'
        : result.outcome === 'failed'
          ? 'The action ran but did not succeed.'
          : 'Done.'
  return { success: true, message, data: { ...result, ledger: { ...result.ledger } } }
}

/** The shared "can anything run right now?" check. */
function blocked(l: MockLedger): string | null {
  if (!l.ledger.with_cs) return 'This booking is no longer waiting on CS.'
  if (l.row.job_running)
    return 'An automatic booking attempt may still be running. Try again in a few minutes.'
  return null
}

function resolve(l: MockLedger, patch: Partial<ResolutionLedger>) {
  Object.assign(l.ledger, patch, { with_cs: false })
}

/* ── Endpoints ─────────────────────────────────────────────────────────── */

export async function mockListActionRequired(
  f: ActionRequiredFilters,
): Promise<ActionRequiredResponse> {
  await wait()
  const perPage = f.per_page ?? 25
  const page = f.page ?? 1
  const rows = [...db().values()]
    .filter((l) => l.ledger.with_cs)
    .map((l) => l.row)
    .filter((r) => !f.product || r.product === f.product)
    .filter((r) => !f.from || r.action_required_at.slice(0, 10) >= f.from)
    .filter((r) => !f.to || r.action_required_at.slice(0, 10) <= f.to)
    // Oldest first.
    .sort((a, b) => a.action_required_at.localeCompare(b.action_required_at))
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage))
  return {
    success: true,
    message: 'Bookings waiting on CS retrieved successfully.',
    data: rows.slice((page - 1) * perPage, page * perPage),
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total: rows.length },
  }
}

export async function mockLedgerActions(
  id: number,
): Promise<ResolutionEnvelope<ResolutionHistoryItem[]>> {
  await wait(200)
  return {
    success: true,
    message: 'Ledger actions retrieved successfully.',
    data: [...find(id).history],
  }
}

export async function mockAttach(id: number, body: AttachBody) {
  await wait()
  const l = find(id)
  if (!body.supplier_reference?.trim()) {
    httpError(422, {
      message: 'The supplier reference field is required.',
      errors: { supplier_reference: ['The supplier reference field is required.'] },
    })
  }
  const base = { ledger: l.ledger, supplier_id: null, cost: null, differences: { hard: [], soft: [] } }
  const stop = blocked(l)
  if (stop) {
    if (body.confirm) log(l, 'action_refused', { note: body.note ?? null })
    return envelope({ ...base, outcome: 'refused', reason: stop })
  }
  if (l.etg) {
    if (body.confirm) log(l, 'attach_refused', { reference: body.supplier_reference })
    return envelope({ ...base, outcome: 'refused', reason: "ETG attach isn't verified yet; use manual details." })
  }
  const ref = body.supplier_reference.toLowerCase()
  if (ref.includes('other')) {
    if (body.confirm) log(l, 'attach_refused', { reference: body.supplier_reference })
    return envelope({
      ...base,
      outcome: 'refused',
      reason: 'The booking does not belong to this ledger.',
      differences: {
        hard: [`${l.row.product === 'flight' ? 'passenger' : 'guest'} names: booking has [someone else], ledger has [amelia earhart]`],
        soft: [],
      },
    })
  }
  const soft = ref.includes('diff')
    ? l.row.product === 'flight'
      ? ['departure date: booking has "2027-04-02", ledger has "2027-03-01"']
      : l.row.product === 'hotel'
        ? ['hotel: booking has "Hotel Nord", ledger has "Hotel Central"']
        : ['package: booking has "5GB, 30 days", ledger has "3GB, 30 days"']
    : []
  if (soft.length && !(l.row.product === 'flight' && body.accept_differences)) {
    if (body.confirm) log(l, 'attach_refused', { reference: body.supplier_reference })
    return envelope({
      ...base,
      outcome: 'refused',
      reason:
        l.row.product === 'flight'
          ? "The booking differs from the ledger. Accept the differences to attach it anyway; the booking record is rewritten from the supplier's booking."
          : 'The booking differs from the ledger. Use manual details instead.',
      differences: { hard: [], soft },
    })
  }
  const found = {
    differences: { hard: [], soft },
    supplier_id: `bok_${body.supplier_reference.replace(/\W/g, '').slice(0, 12)}`,
    cost: { amount: l.row.amount, currency: l.row.currency },
  }
  if (!body.confirm) return envelope({ ...found, ledger: l.ledger, outcome: 'report', reason: null })
  resolve(l, { status: 'confirmed', customer_status: 'confirmed', resolution: 'rebooked' })
  log(l, 'rebooked', { reference: body.supplier_reference, note: body.note ?? null })
  return envelope({ ...found, ledger: l.ledger, outcome: 'done', reason: null })
}

const REQUIRED: Record<string, string[]> = {
  flight: ['airline', 'pnr', 'segments'],
  hotel: ['hotel_name', 'address', 'checkin', 'checkout', 'confirmation_number'],
  esim: ['iccid'],
  esim_topup: ['iccid', 'package'],
}

export async function mockManual(id: number, body: ManualBody) {
  await wait()
  const l = find(id)
  const d = (body.details ?? {}) as unknown as Record<string, unknown>
  const missing: string[] = []
  if (!body.reference?.trim()) {
    httpError(422, { message: 'The reference field is required.', errors: { reference: ['The reference field is required.'] } })
  }
  for (const k of REQUIRED[l.row.product] ?? []) {
    const v = d[k]
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) missing.push(`details.${k} is required`)
  }
  if (l.row.product === 'flight' && Array.isArray(d.segments)) {
    ;(d.segments as Record<string, string>[]).forEach((s, i) => {
      for (const k of ['from', 'to', 'flight_number', 'departs_at', 'arrives_at']) {
        if (!s[k]?.trim()) missing.push(`details.segments.${i}.${k} is required`)
      }
    })
  }
  if (l.row.product === 'esim' && !d.qrcode && !(d.smdp_address && d.activation_code)) {
    missing.push('details.smdp_address and details.activation_code, or details.qrcode, are required')
  }
  if (missing.length) {
    httpError(422, { success: false, message: 'The booking details are incomplete.', errors: { details: missing } })
  }
  if (body.confirm && !body.note?.trim()) {
    httpError(422, { message: 'The note field is required when confirm is true.', errors: { note: ['The note field is required when confirm is true.'] } })
  }
  const stop = blocked(l)
  if (stop) {
    if (body.confirm) log(l, 'action_refused', { note: body.note ?? null })
    return envelope({ outcome: 'refused', reason: stop, ledger: l.ledger, details: [] })
  }
  const details = Object.entries(d)
    .filter(([k, v]) => k !== 'cost' && v != null && v !== '')
    .map(([k, v]) =>
      Array.isArray(v) ? `${k} → ${v.length} segment${v.length === 1 ? '' : 's'}` : `${k} → ${String(v)}`,
    )
  if (!body.confirm) return envelope({ outcome: 'report', reason: null, ledger: l.ledger, details })
  resolve(l, { status: 'fulfilled_manually', customer_status: 'confirmed', resolution: 'rebooked' })
  log(l, 'manual_booking', { reference: body.reference, note: body.note ?? null })
  return envelope({ outcome: 'done', reason: null, ledger: l.ledger, details })
}

export async function mockRetry(id: number, body: RetryBody) {
  await wait()
  const l = find(id)
  const stop =
    blocked(l) ??
    (l.row.product !== 'esim' && l.row.product !== 'esim_topup'
      ? 'Retry is only available for eSIM orders and top-ups.'
      : l.supplierOrderMayExist
        ? 'A supplier order may already exist, so a retry could buy it twice. Attach a booking or use manual details instead.'
        : null)
  if (stop) {
    if (body.confirm) log(l, 'action_refused', { note: body.note ?? null })
    return envelope({ outcome: 'refused', reason: stop, ledger: l.ledger, details: [] })
  }
  const details = [
    'status → paid, failure cleared, the CS flag cleared; the delay email is not repeated',
    'then the eSIM order is placed again',
  ]
  if (!body.confirm) return envelope({ outcome: 'report', reason: null, ledger: l.ledger, details })
  resolve(l, { status: 'paid', customer_status: 'processing' })
  log(l, 'retry', { note: body.note ?? null })
  return envelope({ outcome: 'done', reason: null, ledger: l.ledger, details })
}

export async function mockRefund(id: number, body: RefundBody) {
  await wait()
  const l = find(id)
  if (body.confirm && !MOCK_CAN_CONFIRM_REFUND) {
    httpError(403, {
      success: false,
      message: 'You are not allowed to confirm a refund. Ask an admin on the refund list.',
      errors: null,
    })
  }
  if (body.confirm && !body.note?.trim()) {
    httpError(422, { message: 'The note field is required when confirm is true.', errors: { note: ['The note field is required when confirm is true.'] } })
  }
  const refuse = (reason: string) => {
    if (body.confirm) log(l, 'action_refused', { note: body.note ?? null })
    return envelope({ outcome: 'refused', reason, ledger: l.ledger, details: [] })
  }
  const stop = blocked(l)
  if (stop) return refuse(stop)
  if (l.refundFailedBefore && !body.stripe_checked) {
    return refuse(
      `An earlier refund failed, and Stripe may have created it anyway (a timeout looks the same). Look for the refund in Stripe (metadata ledger_id = ${id}), then confirm you have checked Stripe for an existing refund.`,
    )
  }
  if (l.supplierOrderMayExist && !body.no_booking_confirmed) {
    return refuse(
      'A supplier booking may exist for this ledger. Look for one first, then confirm that no booking exists at the supplier.',
    )
  }
  const details = [
    `refund ${l.row.amount} ${l.row.currency} of this ledger's own share through Stripe`,
    'then the customer is emailed once',
  ]
  if (!body.confirm) return envelope({ outcome: 'report', reason: null, ledger: l.ledger, details })
  if (l.refundFailsOnce) {
    l.refundFailsOnce = false
    l.refundFailedBefore = true
    log(l, 'refund_failed', { note: body.note ?? null, amount_minor: l.row.amount_paid_minor, currency: l.row.currency })
    return envelope({
      outcome: 'failed',
      reason:
        'The refund failed: Stripe timed out. Stripe replays a cached error for the same idempotency key for 24 hours, so an immediate retry may fail the same way.',
      ledger: l.ledger,
      details: [],
    })
  }
  resolve(l, { payment_status: 'refunded', resolution: 'refunded', customer_status: 'failed', status: 'payment_received_booking_failed' })
  log(l, 'refund', {
    note: body.note ?? null,
    stripe_refund_id: `re_mock${id}`,
    amount_minor: l.row.amount_paid_minor,
    currency: l.row.currency,
  })
  return envelope({ outcome: 'done', reason: null, ledger: l.ledger, details })
}
