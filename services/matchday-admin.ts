import golaflyAxios from '@/services/golafly-axios'
import { blobErrorMessage, blobFileName, saveBlob } from '@/lib/blob-download'
import type { ApiResponse } from '@/services/programs'
import type { AdminMatchdayOrder } from '@/features/matchday/types'

/**
 * Matchday ticket orders for the admin.
 *
 * `golaflyAxios` is based at `{API}/api`, so these paths resolve to
 * `/api/v1/matchday/admin/orders` — the contract named in
 * features/matchday/types.ts. Same admin bearer as every other back-office
 * call; the public MatchDay client in features/matchday/client.ts must not
 * be used here (it attaches a fan/guest token).
 */

export interface AdminMatchdayOrdersPage {
  orders: AdminMatchdayOrder[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** Local order statuses the list can filter on (Ticket dashboards §4). */
export const ADMIN_MATCHDAY_STATUSES = [
  'initiated',
  'awaiting_payment',
  'pending_payment',
  'paid',
  'awaiting_attendees',
  'confirming',
  'confirmed',
  'needs_reconciliation',
  'manual_review',
  'failed',
  'cancelled',
] as const

export const ADMIN_MATCHDAY_PAYMENT_STATUSES = [
  'pending',
  'paid',
  'expired',
  'failed',
  'refunding',
  'refunded',
] as const

export interface ListAdminMatchdayOrdersParams {
  page?: number
  /** 1–100, backend default 15. */
  per_page?: number
  status?: string
  payment_status?: string
  email?: string
  event_id?: string
  ftn_order_id?: string
  /** Inclusive creation-date range, YYYY-MM-DD. */
  from_date?: string
  to_date?: string
  /** Customer, match, local id, Golafly reference, supplier id, Stripe ids. */
  q?: string
}

/** Drops empty filters so the request only carries what is set. */
function cleanParams(params: ListAdminMatchdayOrdersParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== '',
    ).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
  )
}

function asOrders(value: unknown): AdminMatchdayOrder[] {
  return Array.isArray(value) ? (value as AdminMatchdayOrder[]) : []
}

function pageMeta(
  raw: Record<string, unknown>,
  orders: AdminMatchdayOrder[],
): Pick<
  AdminMatchdayOrdersPage,
  'current_page' | 'last_page' | 'per_page' | 'total'
> {
  return {
    current_page: Number(raw.current_page ?? 1),
    last_page: Number(raw.last_page ?? 1),
    per_page: Number(raw.per_page ?? orders.length),
    total: Number(raw.total ?? orders.length),
  }
}

/** Accepts a bare array or a Laravel paginator under `data` / `orders`. */
function normalizePage(raw: unknown): AdminMatchdayOrdersPage {
  if (Array.isArray(raw)) {
    return {
      orders: raw,
      current_page: 1,
      last_page: 1,
      per_page: raw.length,
      total: raw.length,
    }
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.orders)) {
      const orders = asOrders(obj.orders)
      return { orders, ...pageMeta(obj, orders) }
    }
    if (Array.isArray(obj.data)) {
      const orders = asOrders(obj.data)
      return { orders, ...pageMeta(obj, orders) }
    }
  }

  return { orders: [], current_page: 1, last_page: 1, per_page: 0, total: 0 }
}

export async function listAdminMatchdayOrders(
  params: ListAdminMatchdayOrdersParams = {},
): Promise<ApiResponse<AdminMatchdayOrdersPage>> {
  const { data } = await golaflyAxios.get<ApiResponse<unknown>>(
    '/v1/matchday/admin/orders',
    { params: cleanParams(params) },
  )
  return { ...data, data: normalizePage(data.data) }
}

export async function getAdminMatchdayOrder(
  orderId: number | string,
): Promise<ApiResponse<AdminMatchdayOrder>> {
  const { data } = await golaflyAxios.get<ApiResponse<AdminMatchdayOrder>>(
    `/v1/matchday/admin/orders/${orderId}`,
  )
  return data
}

/* ── Ticket files (Ticket dashboards §4) ──────────────────────
   Artifact metadata only — storage paths are never returned. A download is
   offered only for `available: true`; `links` are phone tickets to open. */

export interface AdminTicketArtifact {
  /** "files" (tickets) or "instructions". */
  group: string
  /** Supplier format, e.g. "E_TICKET", "INSTRUCTIONS". */
  format?: string | null
  checksum: string
  extension?: string | null
  size?: number | null
  available: boolean
}

export interface AdminOrderTickets {
  order_id: number
  reference?: string | null
  delivered_at?: string | null
  artifacts: AdminTicketArtifact[]
  links: string[]
}

export async function getAdminOrderTickets(
  orderId: number | string,
): Promise<ApiResponse<AdminOrderTickets>> {
  const { data } = await golaflyAxios.get<ApiResponse<AdminOrderTickets>>(
    `/v1/matchday/admin/orders/${orderId}/tickets`,
  )
  const raw = (data.data ?? {}) as Partial<AdminOrderTickets>
  return {
    ...data,
    data: {
      order_id: Number(raw.order_id ?? orderId),
      reference: raw.reference ?? null,
      delivered_at: raw.delivered_at ?? null,
      artifacts: Array.isArray(raw.artifacts) ? raw.artifacts : [],
      links: Array.isArray(raw.links) ? raw.links.filter((l) => typeof l === 'string' && l) : [],
    },
  }
}

/** Downloads one ticket/instruction file with the ADMIN token (never the fan
 *  client). Throws an Error with a message ready to show. */
export async function downloadAdminTicketFile(
  orderId: number | string,
  artifact: AdminTicketArtifact,
  fallbackName: string,
) {
  try {
    const res = await golaflyAxios.get<Blob>(
      `/v1/matchday/admin/orders/${orderId}/tickets/${encodeURIComponent(artifact.checksum)}`,
      { responseType: 'blob', headers: { Accept: '*/*' } },
    )
    saveBlob(res.data, blobFileName(res, fallbackName))
  } catch (error: unknown) {
    throw new Error(await blobErrorMessage(error))
  }
}

/** "142 KB" / "1.4 MB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ── Field helpers ─────────────────────────────────────────── */

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function adminOrderId(order: AdminMatchdayOrder): number {
  return Number(order.order_id ?? order.id ?? 0)
}

export function adminOrderCustomerName(order: AdminMatchdayOrder): string {
  const customer = order.customer
  if (!customer) return '—'
  if (customer.full_name?.trim()) return customer.full_name.trim()
  const name = [customer.first_name, customer.last_name]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
  return name || customer.email || '—'
}

export function adminOrderCustomerEmail(order: AdminMatchdayOrder): string {
  return order.customer?.email?.trim() || '—'
}

export function adminOrderEventLabel(order: AdminMatchdayOrder): string {
  const event = order.event
  if (!event) return '—'
  const home = event.home_team?.trim()
  const away = event.away_team?.trim()
  if (home && away) return `${home} vs ${away}`
  return event.event_name?.trim() || event.name?.trim() || '—'
}

export function adminOrderQuantity(order: AdminMatchdayOrder): number | null {
  if (typeof order.quantity === 'number') return order.quantity
  if (typeof order.ticket?.quantity === 'number') return order.ticket.quantity
  return null
}

/* ── Customer-paid money (the `charge` object) ───────────────
   What the customer actually handed over, in THEIR currency (EUR, GBP or
   USD). Reference only: never add these up or compare them across orders.
   Use the `eur` helpers below for anything that is summed or compared. */

/** What the customer was charged. The admin API nests this under `charge`;
 *  the top-level field is kept only as a fallback for older payloads. */
export function adminOrderAmount(order: AdminMatchdayOrder): number {
  return toNumber(order.charge?.amount_paid) ?? toNumber(order.amount_paid) ?? 0
}

/** The currency the order was charged in — an order keeps it forever. */
export function adminOrderCurrency(order: AdminMatchdayOrder): string {
  return order.charge?.currency || order.currency || 'EUR'
}

/** Golafly's markup on the order, in the charge (customer) currency. */
export function adminOrderMarkup(order: AdminMatchdayOrder): number {
  return toNumber(order.charge?.markup) ?? 0
}

/* ── EUR money (the `eur` object) — SOURCE OF TRUTH ──────────
   "eur": { currency: "EUR", cost, markup, total }
   · total  = what the customer paid, converted to EUR
   · cost   = what we paid the provider
   · markup = the difference (cost + markup === total)
   Values are euros, not cents. A field is `null` when the order could not
   be converted yet (no exchange rate) — that means "not available", never 0. */
export interface AdminOrderEur {
  currency: string
  cost: number | null
  markup: number | null
  total: number | null
}

export function adminOrderEur(order: AdminMatchdayOrder): AdminOrderEur {
  const raw = (order as unknown as { eur?: Record<string, unknown> | null }).eur
  return {
    currency: typeof raw?.currency === 'string' ? raw.currency : 'EUR',
    cost: toNumber(raw?.cost),
    markup: toNumber(raw?.markup),
    total: toNumber(raw?.total),
  }
}

export function adminOrderEurTotal(order: AdminMatchdayOrder): number | null {
  return adminOrderEur(order).total
}

/** True once money has actually been taken. On unpaid orders `charge` is the
 *  quoted price, not revenue. */
export function isAdminOrderPaid(order: AdminMatchdayOrder): boolean {
  return order.payment_status === 'paid' || order.status === 'confirmed'
}

export function humanizeAdminStatus(status: string | null | undefined): string {
  if (!status) return ''
  return status.replace(/_/g, ' ')
}

/* ── Overview summary (dashboard + MatchTickets header) ─────── */

/** The three money buckets a PAID order can sit in. */
export type RevenueBucket = 'confirmed' | 'awaiting_attendees' | 'in_review'

export interface BucketCell {
  orders: number
  amount: number
}

export interface MatchdayOrdersSummary {
  total: number
  paid: number
  confirmed: number
  awaitingAttendees: number
  unpaid: number
  failed: number
  /** Paid orders needing a human: reconciliation, review, or attendees. */
  attention: number
  /** Paid revenue in EUR (sum of eur.total). Converted orders only. */
  revenueEur: number
  /** Paid orders with no EUR figure yet — counted, but not in revenueEur. */
  unconverted: number
  /** Customer-paid money by charge currency — reference only, never summed
   *  across currencies. */
  revenueByCurrency: Record<string, number>
  /** How many paid orders make up each currency's revenue. */
  paidCountByCurrency: Record<string, number>
  markupByCurrency: Record<string, number>
  /** Real charged money per status bucket and currency — no conversion. */
  paidByBucket: Record<RevenueBucket, Record<string, BucketCell>>
}

const PAID_ATTENTION = new Set([
  'needs_reconciliation',
  'manual_review',
  'action_required',
  'awaiting_attendees',
])

const bucketOf = (order: AdminMatchdayOrder): RevenueBucket =>
  order.status === 'confirmed'
    ? 'confirmed'
    : order.status === 'awaiting_attendees'
      ? 'awaiting_attendees'
      : 'in_review'

export function summarizeMatchdayOrders(
  orders: AdminMatchdayOrder[],
): MatchdayOrdersSummary {
  const s: MatchdayOrdersSummary = {
    total: orders.length,
    paid: 0,
    confirmed: 0,
    awaitingAttendees: 0,
    unpaid: 0,
    failed: 0,
    attention: 0,
    revenueEur: 0,
    unconverted: 0,
    revenueByCurrency: {},
    paidCountByCurrency: {},
    markupByCurrency: {},
    paidByBucket: { confirmed: {}, awaiting_attendees: {}, in_review: {} },
  }

  for (const o of orders) {
    if (o.status === 'failed' || o.status === 'cancelled') s.failed += 1
    if (o.status === 'confirmed') s.confirmed += 1
    if (o.status === 'awaiting_attendees') s.awaitingAttendees += 1
    if (PAID_ATTENTION.has(o.status)) s.attention += 1

    if (isAdminOrderPaid(o)) {
      s.paid += 1

      const eurTotal = adminOrderEurTotal(o)
      if (eurTotal === null) s.unconverted += 1
      else s.revenueEur += eurTotal

      const cur = adminOrderCurrency(o)
      const amount = adminOrderAmount(o)
      s.revenueByCurrency[cur] = (s.revenueByCurrency[cur] ?? 0) + amount
      s.paidCountByCurrency[cur] = (s.paidCountByCurrency[cur] ?? 0) + 1
      s.markupByCurrency[cur] =
        (s.markupByCurrency[cur] ?? 0) + adminOrderMarkup(o)

      const cell = (s.paidByBucket[bucketOf(o)][cur] ??= {
        orders: 0,
        amount: 0,
      })
      cell.orders += 1
      cell.amount += amount
    } else if (o.status !== 'failed' && o.status !== 'cancelled') {
      s.unpaid += 1
    }
  }

  return s
}
