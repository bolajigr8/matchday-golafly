import type { AdminTransactionRecord } from '@/services/admin-resources'
import type {
  Ledger,
  Overview,
  OverviewWeeklyChartItem,
} from '@/services/travel-admin'
import type { AdminMatchdayOrder } from '@/features/matchday/types'
import {
  adminOrderCurrency,
  adminOrderCustomerName,
  adminOrderEurTotal,
  isAdminOrderPaid,
} from '@/services/matchday-admin'
import { EM_DASH, formatCurrency } from '@/lib/money'

export { EM_DASH }

/* ── Periods ──────────────────────────────────────────────────────────────
   These four are NOT a free choice — they are exactly the buckets
   /v1/overview already serves (`summary.today | this_week | this_month |
   all_time`). Labels follow the real contract.                              */
export type Period = 'today' | 'this_week' | 'this_month' | 'all_time'

export const PERIODS: { key: Period; label: string; caption: string }[] = [
  { key: 'today', label: 'Today', caption: 'Today' },
  { key: 'this_week', label: 'Week', caption: 'This week' },
  { key: 'this_month', label: 'Month', caption: 'This month' },
  { key: 'all_time', label: 'All', caption: 'All time' },
]

/** Every amount on the admin dashboard is EUR. The backend converts each
 *  order into the `eur` object; nothing is converted on the client. */
export const REPORTING_CURRENCY = 'EUR'

/** /v1/overview now includes football tickets in `summary.*` and in
 *  `weekly_chart[]`. The dashboard also shows football as its own stream
 *  (from the matchday orders' `eur.total`), so the travel stream and the
 *  chart's travel bars subtract it to avoid counting it twice.
 *
 *  Set to false if the backend says the overview does NOT include matchday. */
export const OVERVIEW_INCLUDES_MATCHDAY = true

/** Inclusive lower bound for a period, or null for all time.
 *
 *  WARNING: these boundaries are the client's guess at what the server means.
 *  /v1/overview computes its own `this_week` / `this_month` server-side, in
 *  whatever timezone and with whatever week-start the API uses. Week starts
 *  Monday here, matching ISO-8601 and Laravel's default. */
export function periodStart(period: Period, now = new Date()): Date | null {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
      return d
    case 'this_week': {
      /* getDay() is 0 for Sunday; shift so Monday is the start. */
      const weekday = (d.getDay() + 6) % 7
      d.setDate(d.getDate() - weekday)
      return d
    }
    case 'this_month':
      d.setDate(1)
      return d
    case 'all_time':
      return null
  }
}

const parsed = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

const within = (iso: string | null | undefined, from: Date | null): boolean => {
  if (from === null) return true
  const d = parsed(iso)
  return d !== null && d >= from
}

/* ── Shapes ───────────────────────────────────────────────────────────────
   `money: null` means NOT MEASURED, and is rendered as an em-dash. It is
   never conflated with 0, which is a claim that nothing sold. */
export interface StreamTotals {
  money: number | null
  orders: number | null
  /** The currency this stream's own rows are denominated in. Null when the
   *  stream is unmeasured. */
  currency: string | null
}

export interface StreamBreakdown extends StreamTotals {
  parts: { label: string; money: number | null; orders: number | null }[]
  /** Currencies present in the data but left out of `money`. */
  excludedCurrencies?: string[]
  /** Paid orders counted in `orders` that have no EUR figure yet, so they are
   *  missing from `money`. */
  unconverted?: number
  note?: string
}

export interface OverviewTotals {
  gross: number
  orders: number
  /** Null when there are no orders — an average of nothing is not zero. */
  avgOrder: number | null
  /** True while any stream is still unmeasured, so the UI can caveat totals. */
  partial: boolean
  /** Currencies left out because they cannot be added to the primary one. */
  excludedCurrencies: string[]
}

/* ── Camps: programs, academies, offers ───────────────────────────────────
   Money and order count both come from PAID rows only. */
const CAMP_PARTS: {
  key: AdminTransactionRecord['product_type']
  label: string
}[] = [
  { key: 'program', label: 'Programs' },
  { key: 'academy', label: 'Academies' },
  { key: 'offer', label: 'Offers' },
]

const isPaid = (t: AdminTransactionRecord) => t.payment_status === 'paid'
const amountOf = (t: AdminTransactionRecord) => {
  const n = Number(t.amount)
  return Number.isFinite(n) ? n : 0
}

export function campsBreakdown(
  rows: AdminTransactionRecord[] | undefined,
  period: Period,
  now = new Date(),
): StreamBreakdown {
  if (!rows) return { money: null, orders: null, currency: null, parts: [] }

  const from = periodStart(period, now)
  const paid = rows.filter((t) => isPaid(t) && within(t.created_at, from))

  const parts = CAMP_PARTS.map(({ key, label }) => {
    const matching = paid.filter((t) => t.product_type === key)
    return {
      label,
      money: matching.reduce((sum, t) => sum + amountOf(t), 0),
      orders: matching.length,
    }
  })

  const currency =
    dominantCurrency(paid.map((t) => t.currency)) ??
    dominantCurrency(rows.filter(isPaid).map((t) => t.currency))

  return {
    money: paid.reduce((sum, t) => sum + amountOf(t), 0),
    orders: paid.length,
    currency,
    parts,
  }
}

/** Most frequent non-empty code, or null. */
export function dominantCurrency(
  codes: (string | null | undefined)[],
): string | null {
  const tally = new Map<string, number>()
  for (const code of codes)
    if (code) tally.set(code, (tally.get(code) ?? 0) + 1)
  let best: string | null = null
  let bestCount = 0
  for (const [code, count] of tally) {
    if (count > bestCount) {
      best = code
      bestCount = count
    }
  }
  return best
}

/* ── Travel: flights, stays, eSIMs ────────────────────────────────────────
   `summary.*.amount` is a major-unit decimal string — the one place in this
   API that does NOT use minor units. It is now always EUR. */
const major = (
  amount: string | undefined,
  amountMinor: number | undefined,
): number => {
  const fromString = Number(amount)
  if (Number.isFinite(fromString) && amount != null) return fromString
  return typeof amountMinor === 'number' ? amountMinor / 100 : 0
}

/** `unconverted_count` on /v1/overview: paid orders that are counted but have
 *  no EUR figure yet, so they are not in the money totals. */
export function overviewUnconverted(overview: Overview | undefined): number {
  const n = Number(
    (overview as unknown as { unconverted_count?: number } | undefined)
      ?.unconverted_count,
  )
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function travelBreakdown(
  overview: Overview | undefined,
  period: Period,
  /** The football stream for the same period, subtracted when the overview
   *  already contains it (see OVERVIEW_INCLUDES_MATCHDAY). */
  tickets?: StreamTotals,
): StreamBreakdown {
  if (!overview) return { money: null, orders: null, currency: null, parts: [] }

  const bucket = overview.summary?.[period]
  const byType = overview.by_type
  const dupMoney = OVERVIEW_INCLUDES_MATCHDAY ? (tickets?.money ?? 0) : 0
  const dupOrders = OVERVIEW_INCLUDES_MATCHDAY ? (tickets?.orders ?? 0) : 0

  return {
    money: bucket
      ? Math.max(0, major(bucket.amount, bucket.amount_minor) - dupMoney)
      : 0,
    orders: Math.max(0, (bucket?.count ?? 0) - dupOrders),
    /* The overview is always EUR now; the envelope label can be trusted. */
    currency: overview.currency ?? REPORTING_CURRENCY,
    /* by_type is NOT period-scoped — the API returns it for the whole
       window it computes over, so the sub-rows are labelled as such in the
       UI rather than pretending to follow the period control. Football has
       its own card, so only the travel products are listed here. */
    parts: [
      {
        label: 'Flights',
        money: major(byType?.flight.amount, byType?.flight.amount_minor),
        orders: byType?.flight.count ?? 0,
      },
      {
        label: 'Stays',
        money: major(byType?.stays.amount, byType?.stays.amount_minor),
        orders: byType?.stays.count ?? 0,
      },
      {
        label: 'eSIMs',
        money: major(byType?.esim.amount, byType?.esim.amount_minor),
        orders: byType?.esim.count ?? 0,
      },
    ],
  }
}

/* ── FX between charge currencies — DEPRECATED ────────────────────────────
   The backend now returns every order's `eur` object, so nothing on the
   dashboard converts on the client any more. Kept exported only so older
   imports keep compiling; delete once nothing references them. */
export type FxRates = Map<string, number>

export function deriveFxRates(
  orders: AdminMatchdayOrder[] | undefined,
): FxRates {
  const newest = new Map<string, { rate: number; at: number }>()

  for (const o of orders ?? []) {
    const from = o.cost?.currency
    const to = o.charge?.currency
    const rate = Number(o.fx?.rate)
    if (!from || !to || from === to) continue
    if (!Number.isFinite(rate) || rate <= 0) continue

    const at =
      parsed(o.fx?.captured_at ?? o.created_at)?.getTime() ??
      Number.NEGATIVE_INFINITY
    const key = `${from}>${to}`
    const seen = newest.get(key)
    if (!seen || at >= seen.at) newest.set(key, { rate, at })
  }

  return new Map([...newest].map(([key, v]) => [key, v.rate]))
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: FxRates,
): number | null {
  if (from === to) return amount
  const direct = rates.get(`${from}>${to}`)
  if (direct) return amount * direct
  const inverse = rates.get(`${to}>${from}`)
  if (inverse) return amount / inverse
  return null
}

/* ── Match tickets ────────────────────────────────────────────────────────
   GET /v1/matchday/admin/orders. Kept as the loading / error state: while
   the query has no data the card shows dashes rather than zeros. */
export const TICKETS_UNAVAILABLE: StreamBreakdown = {
  money: null,
  orders: null,
  currency: null,
  parts: [
    { label: 'Confirmed', money: null, orders: null },
    { label: 'Awaiting attendees', money: null, orders: null },
  ],
}

/* Paid orders in these states need a human. `failed` is deliberately NOT
   here: it now means "failed before payment, nothing charged". */
const TICKET_ATTENTION_STATUSES = new Set([
  'needs_reconciliation',
  'manual_review',
  'action_required',
  'awaiting_attendees',
])

/** When the sale happened: paid_at, falling back to created_at. */
const orderAt = (o: AdminMatchdayOrder) => o.paid_at ?? o.created_at

/** Match tickets for one period. Paid orders only.
 *
 *  Money is the sum of each order's `eur.total` — already euros, so nothing
 *  is converted here and the customer-paid currency never enters the sum.
 *  A paid order with no EUR figure yet is still counted as an order but adds
 *  nothing to `money` (never 0 by guess); `unconverted` says how many. */
export function ticketsBreakdown(
  orders: AdminMatchdayOrder[] | undefined,
  period: Period,
  now = new Date(),
): StreamBreakdown {
  if (!orders) return TICKETS_UNAVAILABLE

  const from = periodStart(period, now)
  const paid = orders.filter(
    (o) => isAdminOrderPaid(o) && within(orderAt(o), from),
  )

  const sum = (list: AdminMatchdayOrder[]) =>
    list.reduce((s, o) => s + (adminOrderEurTotal(o) ?? 0), 0)
  const part = (label: string, list: AdminMatchdayOrder[]) => ({
    label,
    money: sum(list),
    orders: list.length,
  })

  return {
    money: sum(paid),
    orders: paid.length,
    currency: REPORTING_CURRENCY,
    unconverted: paid.filter((o) => adminOrderEurTotal(o) === null).length,
    parts: [
      part(
        'Confirmed',
        paid.filter((o) => o.status === 'confirmed'),
      ),
      part(
        'Awaiting attendees',
        paid.filter((o) => o.status === 'awaiting_attendees'),
      ),
    ],
  }
}

/** Paid match-ticket orders that need a human. Not period-scoped: a stuck
 *  order is stuck regardless of the period switch. */
export function countTicketsNeedingAttention(
  orders: AdminMatchdayOrder[] | undefined,
): number {
  return (orders ?? []).filter(
    (o) => isAdminOrderPaid(o) && TICKET_ATTENTION_STATUSES.has(o.status),
  ).length
}

/* ── Group totals ─────────────────────────────────────────────────────────
   Two ways a stream can fail to reach the headline figure:

   · unmeasured — no data yet (loading or errored). Counted in `partial`.
   · off-currency — measured, but not in EUR (only camps can be, until their
     endpoint carries `eur`). Excluded and named.

   Skipping silently in either case would show a total that looks complete
   and is not. */
export function groupTotals(
  streams: StreamTotals[],
  primaryCurrency: string,
): OverviewTotals {
  let gross = 0
  let orders = 0
  let partial = false
  const excludedCurrencies = new Set<string>()

  for (const s of streams) {
    if (s.money === null || s.orders === null) {
      partial = true
      continue
    }
    if (s.currency != null && s.currency !== primaryCurrency && s.money !== 0) {
      excludedCurrencies.add(s.currency)
      continue
    }
    gross += s.money
    orders += s.orders
  }

  return {
    gross,
    orders,
    avgOrder: orders > 0 ? gross / orders : null,
    partial,
    excludedCurrencies: [...excludedCurrencies],
  }
}

/* ── Revenue series for the stacked chart ─────────────────────────────────
   Travel's chart defines the buckets and the camp / ticket rows are summed
   into the SAME ones. Deriving our own boundaries would produce series that
   look aligned and are not.

   `weekly_chart` IS MISNAMED: it returns SEVEN DAILY entries for the current
   week. Bucket width is therefore measured from the data rather than
   assumed, so this stays correct if the endpoint ever really does go weekly.

   The overview's daily amounts now include football orders, so the travel
   bar has the ticket amount for that bucket taken out (see
   OVERVIEW_INCLUDES_MATCHDAY). */
export interface SeriesPoint {
  label: string
  date: string
  tickets: number | null
  camps: number
  travel: number
  /** Measured streams only. */
  total: number
}

export type Granularity = 'day' | 'week' | 'other'

export interface RevenueSeries {
  points: SeriesPoint[]
  granularity: Granularity
  /** Ready-made phrase for the panel subtitle. */
  caption: string
}

const DAY = 24 * 60 * 60 * 1000

const EMPTY_SERIES: RevenueSeries = {
  points: [],
  granularity: 'other',
  caption: '',
}

export function revenueSeries(
  overview: Overview | undefined,
  rows: AdminTransactionRecord[] | undefined,
  options: {
    includeCamps?: boolean
    now?: Date
    /** Match-ticket orders to stack, valued by `eur.total`. Omit (undefined)
     *  to leave tickets out. */
    ticketOrders?: AdminMatchdayOrder[]
  } = {},
): RevenueSeries {
  const chart: OverviewWeeklyChartItem[] = overview?.weekly_chart ?? []
  if (chart.length === 0) return EMPTY_SERIES

  const { includeCamps = true, now = new Date(), ticketOrders } = options
  const paid = includeCamps ? (rows ?? []).filter(isPaid) : []

  const paidTickets: { at: Date | null; value: number }[] = []
  for (const o of (ticketOrders ?? []).filter(isAdminOrderPaid)) {
    const value = adminOrderEurTotal(o)
    if (value !== null) paidTickets.push({ at: parsed(orderAt(o)), value })
  }

  const starts = chart.map((item) => parsed(item.date))

  /* Width of bucket i is the gap to the next bucket. The last one has no
     successor, so it borrows the previous gap. */
  const gaps = starts.map((start, i) => {
    const next = starts[i + 1]
    return start && next ? next.getTime() - start.getTime() : null
  })
  const known = gaps.filter((g): g is number => g != null && g > 0)
  const typical =
    known.length > 0
      ? known.sort((a, b) => a - b)[Math.floor(known.length / 2)]
      : DAY
  const widthAt = (i: number) => gaps[i] ?? typical

  const points = chart.map((item, i) => {
    const start = starts[i]
    const width = widthAt(i)
    const overviewAmount = major(item.amount, item.amount_minor)

    /* An unparseable date contributes travel only; guessing a boundary would
       put camp money in the wrong bar. */
    const camps =
      start === null
        ? 0
        : paid.reduce((sum, t) => {
            const at = parsed(t.created_at)
            if (at === null) return sum
            const offset = at.getTime() - start.getTime()
            return offset >= 0 && offset < width ? sum + amountOf(t) : sum
          }, 0)

    /* null = tickets not part of this chart; 0 = part of it, none sold. */
    const tickets: number | null =
      ticketOrders === undefined
        ? null
        : start === null
          ? 0
          : paidTickets.reduce((sum, t) => {
              if (t.at === null) return sum
              const offset = t.at.getTime() - start.getTime()
              return offset >= 0 && offset < width ? sum + t.value : sum
            }, 0)

    const travel =
      OVERVIEW_INCLUDES_MATCHDAY && tickets !== null
        ? Math.max(0, overviewAmount - tickets)
        : overviewAmount

    return {
      label: item.label,
      date: item.date,
      tickets,
      camps,
      travel,
      total: camps + travel + (tickets ?? 0),
    }
  })

  const granularity: Granularity =
    typical <= 1.5 * DAY
      ? 'day'
      : typical >= 6 * DAY && typical <= 8 * DAY
        ? 'week'
        : 'other'

  /* The current week's buckets run to Sunday, so several are in the future
     and "last 7 days" would be wrong. Say which it is. */
  const last = starts[starts.length - 1]
  const spansFuture = last != null && last.getTime() > now.getTime()

  const caption =
    granularity === 'day'
      ? spansFuture
        ? 'Current week, by day'
        : `Last ${points.length} days`
      : granularity === 'week'
        ? `Last ${points.length} weeks`
        : `${points.length} periods`

  return { points, granularity, caption }
}

/* ── Currency (camps only, now) ───────────────────────────────────────────
   Travel and tickets are always EUR. This still reads the camp rows' own
   currency so a non-EUR camp total is excluded and named rather than added
   in silently. */
export function currencyReport(
  overview: Overview | undefined,
  rows: AdminTransactionRecord[] | undefined,
  ledgers: Ledger[] | undefined,
): {
  primary: string
  mixed: string[]
  envelope: string | null
  envelopeDisagrees: boolean
} {
  const tally = new Map<string, number>()
  const note = (code: string | null | undefined) => {
    if (!code) return
    tally.set(code, (tally.get(code) ?? 0) + 1)
  }

  for (const t of rows ?? []) if (isPaid(t)) note(t.currency)
  for (const l of ledgers ?? [])
    if (l.payment_status === 'paid') note(l.pricing?.currency)

  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1])
  const envelope = overview?.currency ?? null
  const primary = ranked[0]?.[0] ?? envelope ?? 'EUR'

  return {
    primary,
    mixed: ranked.map(([code]) => code).filter((code) => code !== primary),
    envelope,
    envelopeDisagrees:
      envelope != null && ranked.length > 0 && envelope !== primary,
  }
}

/* ── Attention queue ──────────────────────────────────────────────────────
   Ordered by cost of inaction, not by count: the stays cancellations move
   real supplier money and sit at the top even when they are the smallest
   number on the list. */
export interface AttentionItem {
  id: string
  tone: 'danger' | 'warn'
  count: number
  /** True when the real number may be higher than `count` (paged source). */
  atLeast?: boolean
  label: string
  href: string
  target: string
}

const DAY_MS = 24 * 60 * 60 * 1000

export function buildAttention(input: {
  cancellationsRequested: number
  cancellationsPaged: boolean
  failedPayments: number
  stalePartnerApps: number
  ticketsNeedingAttention?: number
  hrefs: {
    operations: string
    orders: string
    partnerApplications: string
    matchTickets?: string
  }
}): AttentionItem[] {
  const items: AttentionItem[] = [
    {
      id: 'cancellations',
      tone: 'danger',
      count: input.cancellationsRequested,
      atLeast: input.cancellationsPaged,
      label: 'Stays cancellations awaiting supplier confirm',
      href: input.hrefs.operations,
      target: 'Operations',
    },
    {
      id: 'failed',
      tone: 'danger',
      count: input.failedPayments,
      label: 'Payments failed in the last 24h',
      href: input.hrefs.orders,
      target: 'Orders',
    },
    {
      id: 'tickets',
      tone: 'warn',
      count: input.ticketsNeedingAttention ?? 0,
      label: 'Paid match-ticket orders awaiting attendees or review',
      href: input.hrefs.matchTickets ?? input.hrefs.orders,
      target: 'MatchTickets',
    },
    {
      id: 'partners',
      tone: 'warn',
      count: input.stalePartnerApps,
      label: 'Partner applications pending > 5 days',
      href: input.hrefs.partnerApplications,
      target: 'Partner Apps',
    },
  ]

  /* Rows that are at zero are dropped, not greyed out. */
  return items.filter((i) => i.count > 0)
}

export function countFailedPayments(
  transactions: AdminTransactionRecord[] | undefined,
  ledgers: Ledger[] | undefined,
  now = new Date(),
): number {
  const since = new Date(now.getTime() - DAY_MS)
  const recentFailed = (status: string, iso: string | null | undefined) =>
    status === 'failed' && within(iso, since)

  return (
    (transactions ?? []).filter((t) =>
      recentFailed(t.payment_status, t.created_at),
    ).length +
    (ledgers ?? []).filter((l) => recentFailed(l.payment_status, l.created_at))
      .length
  )
}

export function countStalePartnerApps(
  apps: { status: string; created_at: string }[] | undefined,
  now = new Date(),
): number {
  const cutoff = new Date(now.getTime() - 5 * DAY_MS)
  return (apps ?? []).filter((a) => {
    if (a.status?.toLowerCase() !== 'pending') return false
    const at = parsed(a.created_at)
    return at !== null && at < cutoff
  }).length
}

/* ── Activity feed ────────────────────────────────────────────────────────
   Built from the order sources we actually have rather than a mock list, so
   it is real from day one. */
export interface ActivityItem {
  id: string
  stream: 'camps' | 'travel' | 'tickets'
  kind: 'flight' | 'stays' | 'esim' | 'camp' | 'ticket'
  who: string
  what: string
  at: string
}

const ledgerKind = (type: string): ActivityItem['kind'] =>
  type === 'flight' || type === 'stays' || type === 'esim' ? type : 'camp'

export function buildActivity(
  transactions: AdminTransactionRecord[] | undefined,
  ledgers: Ledger[] | undefined,
  campLabel: (t: AdminTransactionRecord) => string,
  limit = 4,
  matchOrders?: AdminMatchdayOrder[],
): ActivityItem[] {
  const fromCamps: ActivityItem[] = (transactions ?? [])
    .filter(isPaid)
    .map((t) => ({
      id: `txn-${t.id}`,
      stream: 'camps' as const,
      kind: 'camp' as const,
      who: t.full_name || t.email,
      what: campLabel(t),
      at: t.created_at,
    }))

  const fromTravel: ActivityItem[] = (ledgers ?? [])
    .filter((l) => l.payment_status === 'paid')
    .map((l) => ({
      id: `ledger-${l.ledger_id}`,
      stream: 'travel' as const,
      kind: ledgerKind(l.ledger_type),
      who: l.customer.full_name || l.customer.email,
      what: l.ledger_type,
      at: l.paid_at ?? l.created_at,
    }))

  const fromTickets: ActivityItem[] = (matchOrders ?? [])
    .filter(isAdminOrderPaid)
    .map((o) => ({
      id: `match-${o.order_id ?? o.id}`,
      stream: 'tickets' as const,
      kind: 'ticket' as const,
      who: adminOrderCustomerName(o),
      what: 'a match ticket',
      at: o.paid_at ?? o.created_at ?? '',
    }))

  return [...fromCamps, ...fromTravel, ...fromTickets]
    .filter((a) => parsed(a.at) !== null)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

/* ── Formatting ───────────────────────────────────────────────────────────
   Symbols, not codes: "€1,234", never "EUR 1,234". `null` renders as an
   em-dash so "we are not measuring this" can never read as "this is zero". */
export function formatMoney(value: number | null, currency: string): string {
  return formatCurrency(value, currency, 0)
}

export function formatCount(value: number | null): string {
  return value === null ? EM_DASH : value.toLocaleString('en')
}

/** Relative time for the activity feed. Coarse on purpose. */
export function timeAgo(iso: string, now = new Date()): string {
  const at = parsed(iso)
  if (at === null) return EM_DASH
  const mins = Math.floor((now.getTime() - at.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return at.toISOString().slice(0, 10)
}
