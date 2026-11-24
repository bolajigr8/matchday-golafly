import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'
import type { FreeEsimRowFields } from '@/features/free-esim/types'
import type {
  FlightPromo,
  MatchPromo,
  UpdateFlightPromoPayload,
  UpdateMatchPromoPayload,
} from '@/features/promo/types'

/**
 * The travel-product side of the Golafly admin — orders (flight / eSIM /
 * stays), the stays back-office, markups and eSIM providers.
 *
 * Ported from the Golafly Travels dashboard (`Desktop/travels/features/admin`).
 * It is the **same backend**: travels calls `https://api.golafly.com` with
 * `/api/v1/...` paths, and `golaflyAxios` is based at
 * `https://api.golafly.com/api`, so every path here is the travels path with
 * the leading `/api` removed. Same admin token, same session.
 *
 * MONEY — two sources, never mixed:
 *   · `eur` is the SOURCE OF TRUTH for every figure that is shown, summed or
 *     compared. Already euros (not cents). A field is `null` when the order
 *     has no exchange rate yet: show "—", never 0.
 *   · `pricing` / `charge` / `amount_paid_minor` are what the customer paid in
 *     THEIR currency (EUR, GBP or USD). Reference only, never add them up.
 *   · Amounts ending in `_minor` are minor units — run them through
 *     `lib/money.ts`. EXCEPTION: eSIM admin orders' `pricing.amount_paid_minor`
 *     is already in major units despite its name. Do not divide it again.
 */

/* ── EUR block ────────────────────────────────────────── */

/** `"eur": { currency, cost, markup, total }` on every admin order.
 *  total = what the customer paid, in EUR; cost = what we paid the provider;
 *  markup = the difference (cost + markup === total). */
export interface EurBlock {
  currency: string
  cost: number | null
  markup: number | null
  total: number | null
}

const eurNumber = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Reads an order's `eur` block defensively. A missing block (older payload,
 *  unconverted order) gives all-null, which renders as "—". */
export function normalizeEur(raw: unknown): EurBlock {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    currency: typeof r.currency === 'string' ? r.currency : 'EUR',
    cost: eurNumber(r.cost),
    markup: eurNumber(r.markup),
    total: eurNumber(r.total),
  }
}

/* ── Overview ─────────────────────────────────────────── */

export interface OverviewPeriodStat {
  count: number
  amount_minor: number
  /** Already a major-unit decimal string — do NOT divide this one. */
  amount: string
}

export interface OverviewByType {
  esim: OverviewPeriodStat
  flight: OverviewPeriodStat
  stays: OverviewPeriodStat
  /** Football tickets (matchday). Present once the backend deploy is live. */
  matchday?: OverviewPeriodStat
}

export interface OverviewWeeklyChartItem {
  label: string
  date: string
  count: number
  amount_minor: number
  amount: string
}

export interface OverviewBreakdownItem {
  /** "flight" | "esim" | "stays" | "matchday" */
  product: string
  /** "Football tickets" for matchday. */
  label: string
  count?: number
  amount_minor?: number
  amount?: string
  percentage: number
}

export interface Overview {
  /** Always "EUR" now. */
  currency: string
  summary: {
    today: OverviewPeriodStat
    this_week: OverviewPeriodStat
    this_month: OverviewPeriodStat
    all_time: OverviewPeriodStat
  }
  by_type: OverviewByType
  weekly_chart: OverviewWeeklyChartItem[]
  product_breakdown: {
    by_count: OverviewBreakdownItem[]
    by_amount: OverviewBreakdownItem[]
  }
  /** Paid orders that are counted but have no EUR figure yet, so they are
   *  missing from every money total above. */
  unconverted_count?: number
}

export async function getTravelOverview(): Promise<ApiResponse<Overview>> {
  const { data } = await golaflyAxios.get<ApiResponse<Overview>>('/v1/overview')
  return data
}

/* ── Ledgers (orders) ─────────────────────────────────── */

export type LedgerType = 'flight' | 'esim' | 'stays'

export interface LedgerCustomer {
  full_name: string | null
  email: string
  phone: string | null
}

/** What the customer paid, in their own currency. Reference only. */
export interface LedgerPricing {
  amount_minor: number
  amount_paid_minor: number
  currency: string
}

export interface FlightLedgerSummary {
  pnr_reference: string | null
  airline_name: string | null
  origin: string | null
  destination: string | null
  departure_date: string | null
  duffel_order_id: string | null
}

/** Free eSIM contract §5.1: free eSIMs add is_free_with_ticket,
 *  free_with_matchday_order_id and free_with_matchday_reference. */
export interface EsimLedgerSummary extends FreeEsimRowFields {
  package: string
  package_id: string
  provider?: string | null
  iccid: string | null
  airalo_order_id: string | null
}

export interface StaysLedgerSummary {
  property_name?: string | null
  checkin?: string | null
  checkout?: string | null
  booking_reference?: string | null
}

/* One field per variant is enough to tell them apart, but `ledger_type` is
   authoritative and is what the UI should branch on. */
export type LedgerSummary =
  | FlightLedgerSummary
  | EsimLedgerSummary
  | StaysLedgerSummary

export interface Ledger {
  ledger_id: number
  ledger_type: LedgerType | string
  request_type: string
  status: string
  payment_status: 'paid' | 'pending' | 'failed' | 'expired' | string
  customer: LedgerCustomer
  pricing: LedgerPricing
  /** EUR source of truth. Optional only until the backend deploy is live. */
  eur?: EurBlock | null
  summary: LedgerSummary
  paid_at: string | null
  created_at: string
}

export async function listLedgers(
  type?: LedgerType,
): Promise<ApiResponse<Ledger[]>> {
  const { data } = await golaflyAxios.get<ApiResponse<Ledger[]>>(
    '/v1/overview/ledgers',
    {
      params: type ? { type } : undefined,
    },
  )
  return data
}

/** The ledger's EUR figures, all-null when it has none yet. */
export const ledgerEur = (l: Ledger): EurBlock => normalizeEur(l.eur)

/* Narrowing helpers — `summary` is a bare union with no discriminant of its
   own, so branch on `ledger_type` and assert once, here, rather than at every
   call site. */
export const flightSummary = (l: Ledger) =>
  l.ledger_type === 'flight' ? (l.summary as FlightLedgerSummary) : null
export const esimSummary = (l: Ledger) =>
  l.ledger_type === 'esim' ? (l.summary as EsimLedgerSummary) : null
export const staysSummary = (l: Ledger) =>
  l.ledger_type === 'stays' ? (l.summary as StaysLedgerSummary) : null

/* ── Markups ──────────────────────────────────────────── */

export interface MarkupCategory {
  amount: number | null
  type: string | null
}

export interface Markup {
  id: number
  title: string
  categories: Record<string, MarkupCategory>
  created_at: string
  updated_at: string
}

export interface UpdateMarkupPayload {
  categories: Record<string, { amount: number; type: string }>
}

export async function listMarkups(): Promise<ApiResponse<Markup[]>> {
  const { data } = await golaflyAxios.get<ApiResponse<Markup[]>>('/v1/markups')
  return data
}

export async function listMarkupTypes(): Promise<ApiResponse<string[]>> {
  const { data } =
    await golaflyAxios.get<ApiResponse<string[]>>('/v1/markups/types')
  return data
}

export async function updateMarkup(
  id: number,
  payload: UpdateMarkupPayload,
): Promise<ApiResponse<Markup>> {
  const { data } = await golaflyAxios.patch<ApiResponse<Markup>>(
    `/v1/markups/${id}`,
    payload,
  )
  return data
}

/** GET /v1/markups/products: every markup product and its categories.
 *  The markup screen must read the products from here (VIP packages added
 *  "hospitality" as a fifth product with six categories). */
export interface MarkupProduct {
  title: string
  categories: string[]
}

export async function listMarkupProducts(): Promise<ApiResponse<MarkupProduct[]>> {
  const { data } = await golaflyAxios.get<ApiResponse<MarkupProduct[]>>('/v1/markups/products')
  return data
}

export interface CreateMarkupPayload {
  title: string
  /** Every category of the product, each with an amount and a type. */
  categories: Record<string, { amount: number; type: string }>
}

/** POST /v1/markups. One markup per product (a second create is a 422). */
export async function createMarkup(payload: CreateMarkupPayload): Promise<ApiResponse<Markup>> {
  const { data } = await golaflyAxios.post<ApiResponse<Markup>>('/v1/markups', payload)
  return data
}

/* ── Discount coupons ─────────────────────────────────── */

export interface Discount {
  id: number
  label: string
  code: string
  value: number
  expires_in_days: number
  expires_at: string
  is_expired: boolean
  days_remaining: number
  created_at: string
  updated_at: string
}

export interface CreateDiscountPayload {
  label: string
  code?: string
  value: number
  expires_in_days: number
}

export interface UpdateDiscountPayload {
  label?: string
  code?: string
  value?: number
  expires_in_days?: number
}

export async function listDiscounts(): Promise<ApiResponse<Discount[]>> {
  const { data } = await golaflyAxios.get<ApiResponse<Discount[]>>(
    '/v1/discounts',
    { params: { per_page: 100 } },
  )
  return data
}

export async function createDiscount(
  payload: CreateDiscountPayload,
): Promise<ApiResponse<Discount>> {
  const { data } = await golaflyAxios.post<ApiResponse<Discount>>(
    '/v1/discounts',
    payload,
  )
  return data
}

export async function updateDiscount(
  id: number,
  payload: UpdateDiscountPayload,
): Promise<ApiResponse<Discount>> {
  const { data } = await golaflyAxios.patch<ApiResponse<Discount>>(
    `/v1/discounts/${id}`,
    payload,
  )
  return data
}

/* ── Match promo ──────────────────────────────────────── */

export async function getMatchPromo(): Promise<ApiResponse<MatchPromo>> {
  const { data } = await golaflyAxios.get<ApiResponse<MatchPromo>>('/v1/match-promo')
  return data
}

export async function updateMatchPromo(
  payload: UpdateMatchPromoPayload,
): Promise<ApiResponse<MatchPromo>> {
  const { data } = await golaflyAxios.patch<ApiResponse<MatchPromo>>('/v1/match-promo', payload)
  return data
}

/* ── Flight promo ─────────────────────────────────────── */

export async function getFlightPromo(): Promise<ApiResponse<FlightPromo>> {
  const { data } = await golaflyAxios.get<ApiResponse<FlightPromo>>('/v1/flight-promo')
  return data
}

export async function updateFlightPromo(
  payload: UpdateFlightPromoPayload,
): Promise<ApiResponse<FlightPromo>> {
  const { data } = await golaflyAxios.patch<ApiResponse<FlightPromo>>('/v1/flight-promo', payload)
  return data
}

export async function deleteDiscount(id: number): Promise<ApiResponse<null>> {
  const { data } = await golaflyAxios.delete<ApiResponse<null>>(
    `/v1/discounts/${id}`,
  )
  return data
}

/* ── eSIM providers ───────────────────────────────────── */

export interface EsimProvider {
  id: number
  slug: string
  name: string
  enabled: boolean
  display_order: number
}

export async function listEsimProviders(): Promise<
  ApiResponse<EsimProvider[]>
> {
  const { data } =
    await golaflyAxios.get<ApiResponse<EsimProvider[]>>('/v1/esim-providers')
  return data
}

export async function toggleEsimProvider(
  id: number,
): Promise<ApiResponse<EsimProvider>> {
  const { data } = await golaflyAxios.patch<ApiResponse<EsimProvider>>(
    `/v1/esim-providers/${id}/toggle-status`,
  )
  return data
}

/* ── Stays (hotel) providers ──────────────────────────── */
// Contract "Citizenship, room name and failed hotel" v1.1, section 5.3.
// PATCH …/toggle-status switches the given provider ON and every other one
// off (it never turns the live one off), like the eSIM switch.

export interface StaysProviderRow {
  id: number
  slug: string
  name: string
  enabled: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export async function listStaysProviders(): Promise<
  ApiResponse<StaysProviderRow[]>
> {
  const { data } =
    await golaflyAxios.get<ApiResponse<StaysProviderRow[]>>('/v1/stays-providers')
  return data
}

export async function switchStaysProvider(
  id: number,
): Promise<ApiResponse<StaysProviderRow>> {
  const { data } = await golaflyAxios.patch<ApiResponse<StaysProviderRow>>(
    `/v1/stays-providers/${id}/toggle-status`,
  )
  return data
}

/* ── Stays operations ─────────────────────────────────── */

export interface MoneyAmount {
  amount: string
  currency_code: string
}

export interface StaysGuest {
  first_name: string | null
  first_name_original: string | null
  last_name: string | null
  last_name_original: string | null
  is_child: boolean
  age: number | null
}

export interface StaysRoomData {
  bedding_name: string[]
  guest_data: {
    adults_number: number
    children_number: number
    guests: StaysGuest[]
  }
  meal_name: string
  has_breakfast: boolean
  no_child_meal: boolean
  room_idx: number
  room_name: string
}

export interface StaysCancellationPenaltyPolicy {
  end_at: string | null
  start_at: string | null
  penalty: {
    amount: string
    currency_code: string
    amount_info: string | null
  }
}

export interface StaysSupplierOrder {
  agreement_number: string
  amount_payable: MoneyAmount
  amount_payable_vat: MoneyAmount
  amount_refunded: MoneyAmount
  amount_sell: MoneyAmount
  amount_sell_b2b2c: MoneyAmount
  amount_sell_b2b2c_commission: MoneyAmount | null
  amount_payable_with_upsells: MoneyAmount
  api_auth_key_id: number
  cancelled_at: string | null
  checkin_at: string
  checkout_at: string
  contract_slug: string
  created_at: string
  modified_at: string
  hotel_data: { id: string; hid: number; order_id: string | null }
  is_cancellable: boolean
  is_package: boolean
  is_checked: boolean
  nights: number
  order_id: number
  order_type: string
  roomnights: number
  rooms_data: StaysRoomData[]
  source: string
  status: string
  supplier_data: {
    confirmation_id: string | null
    name: string | null
    order_id: string | null
  }
  taxes: unknown[]
  total_vat: { amount: string; currency_code: string; included: boolean }
  partner_data: { order_comment: string | null; order_id: string }
  cancellation_info: {
    free_cancellation_before: string | null
    policies: StaysCancellationPenaltyPolicy[]
  }
  invoice_id: string | null
  meta_data: { voucher_order_comment: string | null }
  payment_data: {
    payment_type: string
    invoice_id: number | null
    invoice_id_v2: string | null
    paid_at: string | null
    payment_by: string | null
    payment_due: string | null
    payment_pending: string | null
  }
  upsells: unknown[]
  has_tickets: boolean
  user_data: {
    email: string
    arrival_datetime: string | null
    user_comment: string | null
  }
  /** EUR source of truth, when the backend attaches it to this row. */
  eur?: EurBlock | null
  /** VIP package (ULID) of this hotel; null/absent when not VIP (contract §7). */
  hospitality_package_id?: string | null
  /** e.g. "Paid; held until the VIP package ticket is secured. Not booked yet." */
  status_message?: string | null
}

export interface StaysOrdersListData {
  current_page_number: number
  total_orders: number
  total_pages: number
  found_orders: number
  found_pages: number
  orders: StaysSupplierOrder[]
}

export interface StaysOrdersListResponse {
  data: StaysOrdersListData
  debug?: unknown
  status: string
  error: unknown
}

export async function listStaysOrders(
  page = 1,
): Promise<ApiResponse<StaysOrdersListResponse>> {
  const { data } = await golaflyAxios.get<ApiResponse<StaysOrdersListResponse>>(
    '/v1/stays/orders',
    { params: { page } },
  )
  return data
}

export async function listEtgOrders(
  page = 1,
): Promise<ApiResponse<StaysOrdersListResponse>> {
  const { data } = await golaflyAxios.get<ApiResponse<StaysOrdersListResponse>>(
    '/v1/stays/etg-orders',
    { params: { page } },
  )
  return data
}

/* ── Stays cancellation queue ─────────────────────────── */

export interface StaysCancellationCommission {
  amount_net: string
  amount_gross: string
  amount_commission: string
}

export interface StaysCancellationPolicy {
  end_at: string | null
  start_at: string | null
  amount_show: string
  amount_charge: string
  commission_info: {
    show: StaysCancellationCommission
    charge: StaysCancellationCommission
  }
}

export interface StaysCancellationRequest {
  id: number
  parent_ledger_id: number
  booking_reference: string
  order_id: string
  hotel_id: number
  hotel_name: string
  checkin: string
  checkout: string
  request_type: string
  booking_status: string
  cancellation_status: 'requested' | 'cancelled' | 'rejected' | string
  cancellation_requested_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
  cancellation_policy: {
    policies: StaysCancellationPolicy[]
    free_cancellation_before: string | null
  }
  service_fee_forfeited: string | null
  refund_amount: string | null
  refund_currency: string | null
  cancelled_by_admin_id: number | null
  full_name: string | null
  email: string
  phone: string | null
  /** The customer's own currency and amount: reference only. */
  currency: string
  amount_paid: string
  /** EUR source of truth. */
  eur?: EurBlock | null
  /** VIP package (ULID) this hotel belongs to; null for a normal booking
   *  (VIP Admin API contract §7). Information only: nothing is blocked. */
  hospitality_package_id?: string | null
  /** Show prominently next to Confirm cancellation. null when not VIP. */
  vip_package_warning?: string | null
}

/** Laravel paginator — the rows are under `.data`, not the envelope's `.data`. */
export interface StaysCancellationsListResponse {
  current_page: number
  data: StaysCancellationRequest[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  next_page_url: string | null
  prev_page_url: string | null
  path: string
  per_page: number
  to: number | null
  total: number
}

export async function listStaysCancellations(
  page = 1,
): Promise<ApiResponse<StaysCancellationsListResponse>> {
  const { data } = await golaflyAxios.get<
    ApiResponse<StaysCancellationsListResponse>
  >('/v1/stays/order-cancellations', { params: { page } })
  return data
}

/**
 * Confirms a cancellation with the supplier and issues the refund.
 * Irreversible and moves real money — always behind an explicit confirm that
 * names the amount.
 */
export async function confirmStaysCancellation(
  cancellationId: number,
): Promise<ApiResponse<StaysCancellationRequest>> {
  const { data } = await golaflyAxios.post<
    ApiResponse<StaysCancellationRequest>
  >(`/v1/stays/order-cancellations/${cancellationId}`)
  return data
}

/* ── Flight cancellation requests ─────────────────────── */

/**
 * A customer's request to cancel a flight (GET /v1/flights/order-cancellations).
 * Only an admin executes it, and the refund is part of executing it (VIP Admin
 * API contract §7). The API documents only part of the row, so every field
 * beyond `id` is optional and the screen shows "—" for what is missing.
 */
export interface FlightCancellationRequest {
  id: number
  parent_ledger_id?: number | null
  booking_reference?: string | null
  /** The airline order id (ord_…). */
  order_id?: string | null
  /** requested | cancelled | rejected … (some payloads say `status`). */
  cancellation_status?: string | null
  status?: string | null
  cancellation_requested_at?: string | null
  requested_at?: string | null
  cancelled_at?: string | null
  reason?: string | null
  cancellation_reason?: string | null
  airline_penalty_amount?: string | null
  service_fee_forfeited?: string | null
  fee?: string | null
  refund_amount?: string | null
  refund_currency?: string | null
  full_name?: string | null
  email?: string | null
  /** The customer's own currency and amount: reference only. */
  currency?: string | null
  amount_paid?: string | null
  /** EUR source of truth. */
  eur?: EurBlock | null
  /** VIP package (ULID) this flight belongs to; null for a normal booking. */
  hospitality_package_id?: string | null
  /** Show prominently next to Confirm cancellation. null when not VIP. */
  vip_package_warning?: string | null
}

/** The list comes as a bare array, a Laravel paginator or a named list. */
function cancellationRows(payload: unknown): FlightCancellationRequest[] {
  if (Array.isArray(payload)) return payload as FlightCancellationRequest[]
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['data', 'cancellations', 'items', 'results']) {
      const v = obj[key]
      if (Array.isArray(v)) return v as FlightCancellationRequest[]
      if (v && typeof v === 'object') {
        const inner = (v as Record<string, unknown>).data
        if (Array.isArray(inner)) return inner as FlightCancellationRequest[]
      }
    }
  }
  return []
}

export async function listFlightCancellations(): Promise<
  FlightCancellationRequest[]
> {
  const { data } = await golaflyAxios.get<ApiResponse<unknown>>(
    '/v1/flights/order-cancellations',
  )
  return cancellationRows(data?.data)
}

/**
 * Cancels the flight with the airline and issues the refund. Irreversible and
 * moves real money — always behind an explicit confirm.
 */
export async function confirmFlightCancellation(
  cancellationId: number,
): Promise<ApiResponse<FlightCancellationRequest>> {
  const { data } = await golaflyAxios.post<
    ApiResponse<FlightCancellationRequest>
  >(`/v1/flights/order-cancellations/${cancellationId}`)
  return data
}

/* ── Single stays order + supplier status lookup ──────── */

export interface StaysOrderDetail {
  ledger_id: number
  /** VIP package (ULID); a held VIP hotel reads status_message "Paid; held
   *  until the VIP package ticket is secured. Not booked yet." (contract §7). */
  hospitality_package_id?: string | null
  request_type: string
  status: string
  status_message: string
  payment_status: string
  provider: string
  customer: { full_name: string | null; email: string; phone: string | null }
  hotel: {
    id: number
    name: string
    checkin: string
    checkout: string
    adults: number
    children: number
  }
  reference: {
    partner_order_id: string | null
    provider_order_id: string | null
    booking_id: number | null
    confirmation_number: string | null
    voucher_number: string | null
    supplier_reference: string | null
  }
  /** What the customer paid, in their own currency. Reference only. */
  pricing: {
    amount_minor: number
    fee_minor: number
    amount_paid_minor: number
    currency: string
  }
  /** EUR source of truth. */
  eur?: EurBlock | null
  payment: {
    stripe_checkout_session_id: string | null
    paid_at: string | null
    confirmed_at: string | null
  }
  meta: {
    is_cancellable: boolean
    book_hash: string | null
    match_hash: string | null
    created_at: string
    updated_at: string
  }
}

export async function getStaysOrder(
  ledgerId: number,
): Promise<ApiResponse<StaysOrderDetail>> {
  const { data } = await golaflyAxios.get<ApiResponse<StaysOrderDetail>>(
    `/v1/stays/orders/${ledgerId}`,
  )
  return data
}

export interface StaysBookingStatusResult {
  data: {
    data_3ds: unknown
    partner_order_id: string
    percent: number
    prepayment: unknown
  }
  debug?: unknown
  status: string
  error: string | null
}

export async function getStaysBookingStatus(
  partnerOrderId: string,
): Promise<ApiResponse<StaysBookingStatusResult>> {
  const { data } = await golaflyAxios.get<
    ApiResponse<StaysBookingStatusResult>
  >(`/v1/stays/booking/finish/status/${partnerOrderId}`)
  return data
}
