'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  CircleAlert,
  CreditCard,
  GraduationCap,
  Hotel,
  Plane,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Ticket,
  TrendingUp,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton, Panel, StatCard } from '@/components/admin/admin-ui'
import {
  STREAM_COLOR,
  Sparkline,
  StackedRevenueBars,
} from '@/components/admin/overview-charts'
import {
  useAdminLedgers,
  useAdminMatchdayOrders,
  useAdminPartnerApplications,
  useAdminStaysCancellations,
  useAdminTransactions,
  useTravelOverview,
} from '@/features/admin/hooks'
import {
  buildActivity,
  buildAttention,
  campsBreakdown,
  countFailedPayments,
  countStalePartnerApps,
  countTicketsNeedingAttention,
  formatCount,
  formatMoney,
  groupTotals,
  overviewUnconverted,
  PERIODS,
  REPORTING_CURRENCY,
  revenueSeries,
  ticketsBreakdown,
  timeAgo,
  travelBreakdown,
  type ActivityItem,
  type AttentionItem,
  type Period,
  type StreamBreakdown,
} from '@/features/admin/overview'
import { paidForName } from '@/services/admin-resources'
import { Routes } from '@/routes'
import { cn } from '@/lib/utils'

/* The cross-business Overview. Three revenue streams — match tickets, camps
 * and travel — on one screen, matching the approved design-system card
 * (`screens/22-screen-overview.html`).
 *
 * EVERY AMOUNT HERE IS EUR, shown with the € symbol.
 *   · Match tickets — GET /v1/matchday/admin/orders (paid orders). Money is
 *     the sum of each order's `eur.total`; the customer-paid currency is
 *     never added up.
 *   · Camps — /v1/transactions, bucketed by period on the client because that
 *     endpoint is unpaginated and carries a `created_at` on every row.
 *   · Travel — /v1/overview, which is period-aware and now always EUR. It
 *     also includes football, which is taken back out here because football
 *     has its own card (see OVERVIEW_INCLUDES_MATCHDAY).
 *
 * All aggregation lives in features/admin/overview.ts; this file renders. */

const STREAM_META = {
  tickets: {
    label: 'Match tickets',
    icon: Ticket,
    color: STREAM_COLOR.tickets,
  },
  camps: {
    label: 'Camps & programs',
    icon: GraduationCap,
    color: STREAM_COLOR.camps,
  },
  travel: { label: 'Travel products', icon: Plane, color: STREAM_COLOR.travel },
} as const

const ACTIVITY_ICON = {
  flight: Plane,
  stays: Hotel,
  esim: Smartphone,
  camp: CreditCard,
  ticket: Ticket,
} as const

export default function DashboardClient() {
  const { openNav } = useAdminNav()
  const [period, setPeriod] = useState<Period>('this_month')

  const travelQuery = useTravelOverview()
  const transactionsQuery = useAdminTransactions()
  const ledgersQuery = useAdminLedgers()
  const partnersQuery = useAdminPartnerApplications()
  const cancellationsQuery = useAdminStaysCancellations(1)
  const ticketsQuery = useAdminMatchdayOrders()

  const overview = travelQuery.data?.data
  const transactions = transactionsQuery.data?.data
  const ledgers = ledgersQuery.data?.data
  const partners = partnersQuery.data?.data
  const cancellationPage = cancellationsQuery.data?.data
  const matchOrders = ticketsQuery.data?.data.orders

  /* The stat row and the stream cards need all three money sources, so they
     wait for all of them. The lower panels each have their own source and
     their own loading state, so a slow ledger call does not blank the whole
     page. */
  const moneyLoading =
    travelQuery.isPending ||
    transactionsQuery.isPending ||
    ticketsQuery.isPending

  const currency = REPORTING_CURRENCY
  const camps = campsBreakdown(transactions, period)
  const tickets = ticketsBreakdown(matchOrders, period)
  const travel = travelBreakdown(overview, period, tickets)
  const totals = groupTotals([tickets, camps, travel], currency)

  /* Two honest caveats for the header:
     · orders the backend has not converted to EUR yet — counted, but not in
       the money totals (`unconverted_count` from /v1/overview; falls back to
       the ticket orders when the overview has not loaded);
     · a camps total that is not in EUR and so cannot be added. */
  const unconverted =
    overviewUnconverted(overview) || (tickets.unconverted ?? 0)
  const excludedCurrencies = totals.excludedCurrencies

  /* Camps only stack when they share EUR with the other two. A stream with
     no rows yet has no currency to clash with, so it stacks fine. */
  const stackable = camps.currency === null || camps.currency === currency

  const series = revenueSeries(overview, transactions, {
    includeCamps: stackable,
    ticketOrders: matchOrders,
  })
  const campSpark = series.points.map((p) => p.camps)
  const travelSpark = series.points.map((p) => p.travel)
  const ticketSpark = matchOrders
    ? series.points.map((p) => p.tickets ?? 0)
    : null

  const attention = buildAttention({
    cancellationsRequested: (cancellationPage?.data ?? []).filter(
      (c) => c.cancellation_status === 'requested',
    ).length,
    cancellationsPaged: (cancellationPage?.last_page ?? 1) > 1,
    failedPayments: countFailedPayments(transactions, ledgers),
    stalePartnerApps: countStalePartnerApps(partners),
    ticketsNeedingAttention: countTicketsNeedingAttention(matchOrders),
    hrefs: {
      operations: Routes.adminOperations,
      orders: Routes.adminOrders,
      partnerApplications: Routes.adminPartnerApplications,
      matchTickets: Routes.adminMatchTickets,
    },
  })

  const activity = buildActivity(
    transactions,
    ledgers,
    paidForName,
    4,
    matchOrders,
  )

  const refetchAll = () => {
    travelQuery.refetch()
    transactionsQuery.refetch()
    ledgersQuery.refetch()
    partnersQuery.refetch()
    cancellationsQuery.refetch()
    ticketsQuery.refetch()
  }

  const periodCaption = PERIODS.find((p) => p.key === period)?.caption ?? ''
  const attentionTotal = attention.reduce((sum, a) => sum + a.count, 0)

  const money = (value: number | null) =>
    moneyLoading ? '…' : formatMoney(value, currency)

  return (
    <>
      <AdminPageHeader
        crumbs={['Overview']}
        title='Overview'
        stats={[
          { label: 'Live', tone: 'var(--status-good)' },
          { label: periodCaption },
          ...(unconverted > 0
            ? [
                {
                  label: `${unconverted} ${unconverted === 1 ? 'order' : 'orders'} not yet converted to EUR`,
                  tone: 'var(--status-warn)',
                },
              ]
            : []),
          ...(excludedCurrencies.length > 0
            ? [
                {
                  label: `${excludedCurrencies.join(', ')} revenue excluded from the ${currency} total`,
                  tone: 'var(--status-warn)',
                },
              ]
            : []),
        ]}
        action={
          <div className='flex items-center gap-2'>
            <div className='inline-flex overflow-hidden rounded-md shadow-[0_0_0_1px_var(--edge)]'>
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type='button'
                  onClick={() => setPeriod(p.key)}
                  aria-pressed={period === p.key}
                  className={cn(
                    'h-[26px] px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] transition-colors',
                    period === p.key
                      ? 'bg-accent text-brand-text'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <AdminButton variant='outline' size='sm' onClick={refetchAll}>
              <RefreshCw className='size-3' />
              Refresh
            </AdminButton>
          </div>
        }
        onOpenNav={openNav}
      />

      {/* pt-2 so the first row of cards clears the sticky header instead of
          sitting flush under it. */}
      <div className='flex-1 px-4 pb-5 pt-2 lg:px-[18px]'>
        {/* Band 1 — the group total, before it is split by business. */}
        <div className='grid grid-cols-2 gap-2.5 lg:grid-cols-4'>
          <StatCard
            label='Gross revenue'
            icon={<CreditCard className='size-3' />}
            value={money(totals.gross)}
            delta={
              totals.partial && !moneyLoading
                ? 'some streams unavailable'
                : undefined
            }
          />
          <StatCard
            label='Orders'
            icon={<ShoppingBag className='size-3' />}
            value={moneyLoading ? '…' : formatCount(totals.orders)}
            delta={
              totals.partial && !moneyLoading
                ? 'some streams unavailable'
                : undefined
            }
          />
          <StatCard
            label='Avg order value'
            icon={<TrendingUp className='size-3' />}
            value={moneyLoading ? '…' : formatMoney(totals.avgOrder, currency)}
          />
          <StatCard
            label='Needs attention'
            icon={<CircleAlert className='size-3' />}
            value={String(attentionTotal)}
            delta={
              attentionTotal === 0 ? 'nothing waiting' : 'across all streams'
            }
          />
        </div>

        {/* Band 2 — one card per business. */}
        <div className='mt-3 grid gap-3 lg:grid-cols-3'>
          <StreamCard
            stream='tickets'
            data={tickets}
            currency={currency}
            loading={ticketsQuery.isPending}
            spark={ticketSpark}
            unavailable={
              ticketsQuery.isError ? 'GET /v1/matchday/admin/orders' : undefined
            }
            href={Routes.adminMatchTickets}
            hrefLabel='View ticket orders'
          />
          <StreamCard
            stream='camps'
            data={camps}
            currency={currency}
            loading={moneyLoading}
            spark={campSpark}
            href={Routes.adminTransactions}
            hrefLabel='View in Transactions'
          />
          <StreamCard
            stream='travel'
            data={travel}
            currency={currency}
            loading={moneyLoading}
            spark={travelSpark}
            href={Routes.adminOrders}
            hrefLabel='View travel orders'
            partsNote='all time'
          />
        </div>

        {/* Band 3 — the chart, and the two queues that say what to do next. */}
        <div className='mt-3 grid items-start gap-3 xl:grid-cols-[1.1fr_1fr]'>
          <Panel
            title='Revenue by stream'
            subtitle={
              series.points.length > 0
                ? `${series.caption}, in euros. Stacked, because the question is the company total and its split.`
                : undefined
            }
          >
            {travelQuery.isPending ? (
              <ChartSkeleton />
            ) : series.points.length === 0 ? (
              <PanelEmpty
                title='Nothing to plot'
                body='/v1/overview returned no chart buckets, so there is no series to draw yet.'
              />
            ) : (
              <>
                <StackedRevenueBars
                  points={series.points}
                  currency={currency}
                  caption={series.caption}
                />
                <div className='mt-2 flex flex-wrap items-center gap-3.5 text-[11px]'>
                  {matchOrders && (
                    <LegendDot
                      color={STREAM_COLOR.tickets}
                      label='Match tickets'
                    />
                  )}
                  {stackable && (
                    <LegendDot
                      color={STREAM_COLOR.camps}
                      label='Camps & programs'
                    />
                  )}
                  <LegendDot
                    color={STREAM_COLOR.travel}
                    label='Travel products'
                  />
                  {!stackable && (
                    <span className='text-muted-foreground'>
                      Camps excluded — {camps.currency} cannot stack on{' '}
                      {currency}
                    </span>
                  )}
                </div>
              </>
            )}
          </Panel>

          <div className='flex flex-col gap-3'>
            <Panel
              title='Needs attention'
              subtitle='Ordered by cost of inaction, not by count.'
            >
              {attention.length === 0 ? (
                <p className='py-2 text-[11.5px] text-muted-foreground'>
                  Nothing waiting. Failed payments, stays cancellations,
                  match-ticket orders and stale partner applications all appear
                  here.
                </p>
              ) : (
                attention.map((item) => (
                  <AttentionRow key={item.id} item={item} />
                ))
              )}
            </Panel>

            <Panel title='Recent activity'>
              {activity.length === 0 ? (
                <p className='py-2 text-[11.5px] text-muted-foreground'>
                  No paid orders yet.
                </p>
              ) : (
                activity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Stream card ────────────────────────────────────────────────────────────
   Sub-rows step the SAME hue down rather than taking new chart slots, so hue
   always means "which business" and lightness means "which product inside
   it". A reader who learns three colours once can read every panel. */
function StreamCard({
  stream,
  data,
  currency,
  loading,
  spark,
  unavailable,
  href,
  hrefLabel,
  partsNote,
}: {
  stream: keyof typeof STREAM_META
  data: StreamBreakdown
  currency: string
  loading: boolean
  spark: number[] | null
  /** Set when the stream's source failed to load; names the endpoint. */
  unavailable?: string
  href: string
  hrefLabel: string
  partsNote?: string
}) {
  const { label, icon: Icon, color } = STREAM_META[stream]
  const steps = ['100%', '62%', '38%']
  /* A stream's own currency wins over the page's. Labelling non-EUR camp
     revenue "€" would be a lie about what the customer was charged. */
  const unit = data.currency ?? currency

  return (
    <section className='flex flex-col rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]'>
      <div className='flex items-center gap-2'>
        <span
          className='flex size-6 shrink-0 items-center justify-center rounded-md'
          style={{
            background: `color-mix(in oklch, ${color} 14%, transparent)`,
            color,
          }}
        >
          <Icon className='size-3.5' />
        </span>
        {/* nowrap: the pill beside it otherwise pushes the title onto two
            lines and makes one of three identical cards taller. */}
        <h2 className='m-0 whitespace-nowrap text-[13px] font-semibold'>
          {label}
        </h2>
        {unavailable && (
          <span className='ml-auto rounded-full bg-[var(--status-warn-bg)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.07em] text-[var(--status-warn)]'>
            Unavailable
          </span>
        )}
      </div>

      <div className='mt-3 flex items-end justify-between gap-3'>
        <span
          className={cn(
            'text-[22px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[26px]',
            data.money === null && 'text-muted-foreground',
          )}
        >
          {loading ? '…' : formatMoney(data.money, unit)}
        </span>
        <Sparkline values={spark} color={color} />
      </div>

      <div className='mt-2 flex items-center gap-2.5 pb-2.5'>
        <span className='font-mono text-[10px] tabular-nums text-muted-foreground'>
          {loading ? '…' : `${formatCount(data.orders)} orders`}
        </span>
        {partsNote && (
          <span className='ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>
            split: {partsNote}
          </span>
        )}
      </div>

      {/* Paid orders the backend has not converted to EUR yet: counted above,
          missing from the money. Say so on the card that has them. */}
      {!loading && !unavailable && (data.unconverted ?? 0) > 0 && (
        <p className='m-0 pb-2.5 text-[10.5px] leading-snug text-[var(--status-warn)]'>
          {data.unconverted} {data.unconverted === 1 ? 'order' : 'orders'} not
          yet converted to EUR
        </p>
      )}

      <div className='border-t border-[var(--edge)] pt-1.5' />

      {unavailable ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-1 py-5 text-center'>
          <span className='mb-1 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <Icon className='size-3.5' />
          </span>
          <p className='m-0 text-xs font-semibold'>Couldn’t load</p>
          <p className='m-0 font-mono text-[10px] text-muted-foreground'>
            {unavailable}
          </p>
        </div>
      ) : (
        data.parts.map((part, i) => (
          <div
            key={part.label}
            className='grid grid-cols-[8px_1fr_auto_auto] items-center gap-2 py-1 text-[11.5px]'
          >
            <span
              className='size-2 rounded-sm'
              style={{
                background:
                  i === 0
                    ? color
                    : `color-mix(in oklch, ${color} ${steps[i] ?? '38%'}, transparent)`,
              }}
            />
            <span>{part.label}</span>
            <span className='font-mono text-[9.5px] tabular-nums text-muted-foreground'>
              {loading ? '…' : formatCount(part.orders)}
            </span>
            <span className='min-w-[62px] text-right font-mono text-[11px] tabular-nums'>
              {loading ? '…' : formatMoney(part.money, unit)}
            </span>
          </div>
        ))
      )}

      <Link
        href={href}
        className='mt-auto flex items-center gap-1 pt-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.09em] text-brand-text hover:underline'
      >
        {hrefLabel}
        <ChevronRight className='size-3' />
      </Link>
    </section>
  )
}

/* ── Rows ──────────────────────────────────────────────────────────────── */

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    /* No `last:pb-0` here, unlike the activity feed below. This row has a
       hover background that paints the padding box, so symmetric padding is
       what makes the hover read as a button rather than a misaligned band.
       The negative inline margin lets the highlight bleed into the panel's
       own padding so it looks like a target, not a stripe. */
    <Link
      href={item.href}
      className='-mx-1.5 grid grid-cols-[26px_1fr_auto] items-center gap-2.5 rounded-md border-b border-[var(--edge)] px-1.5 py-2 text-[11.5px] transition-colors last:border-b-0 hover:bg-accent'
    >
      <span
        className={cn(
          'inline-flex h-5 items-center justify-center rounded-md font-mono text-[10.5px] font-bold tabular-nums',
          item.tone === 'danger'
            ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger)]'
            : 'bg-[var(--status-warn-bg)] text-[var(--status-warn)]',
        )}
      >
        {item.count}
        {item.atLeast && '+'}
      </span>
      <span className='leading-snug'>{item.label}</span>
      <span className='flex items-center gap-0.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground'>
        {item.target}
        <ChevronRight className='size-2.5' />
      </span>
    </Link>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = ACTIVITY_ICON[item.kind]
  const color =
    item.stream === 'camps'
      ? STREAM_COLOR.camps
      : item.stream === 'tickets'
        ? STREAM_COLOR.tickets
        : STREAM_COLOR.travel

  return (
    <div className='flex gap-2.5 border-b border-[var(--edge)] py-2.5 text-[11.5px] last:border-b-0 last:pb-0'>
      <span
        className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted'
        style={{ color }}
      >
        <Icon className='size-3' />
      </span>
      <span className='min-w-0'>
        <span className='block truncate leading-snug'>
          <b className='font-semibold'>{item.who}</b> paid for {item.what}.
        </span>
        <span className='mt-0.5 block font-mono text-[9px] text-muted-foreground'>
          {timeAgo(item.at)}
        </span>
      </span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      <span className='size-2 rounded-sm' style={{ background: color }} />
      {label}
    </span>
  )
}

function ChartSkeleton() {
  return (
    <div className='flex h-[300px] items-end gap-2 px-10 pb-8' aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className='flex-1 animate-pulse rounded-t-sm bg-muted'
          /* Varying heights so it reads as a chart loading rather than a
             progress bar that has stalled. */
          style={{ height: `${28 + ((i * 37) % 55)}%` }}
        />
      ))}
    </div>
  )
}

function PanelEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className='flex flex-col items-center gap-1 px-4 py-10 text-center'>
      <p className='m-0 text-[13px] font-semibold'>{title}</p>
      <p className='m-0 max-w-[40ch] text-[11.5px] leading-relaxed text-muted-foreground'>
        {body}
      </p>
    </div>
  )
}
