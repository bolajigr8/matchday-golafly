'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CircleAlert,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Ticket,
  TicketCheck,
  Wallet,
  X,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton, StatCard } from '@/components/admin/admin-ui'
import { Field, SelectInput, TextInput } from '@/components/admin/form-controls'
import { MatchTicketFiles } from '@/components/admin/match-ticket-files'
import { type Column } from '@/components/admin/data-table'
import { QueryTable } from '@/components/admin/query-table'
import {
  DetailSheet,
  SheetFacts,
  SheetSection,
} from '@/components/admin/detail-sheet'
import { StatusPill } from '@/components/admin/status-pill'
import { VipPackageLink } from '@/components/admin/vip/shared'
import {
  extractApiMessage,
  useAdminMatchdayOrder,
  useAdminMatchdayOrderSearch,
  useAdminMatchdayOrders,
} from '@/features/admin/hooks'
import { attendeeFieldLabel } from '@/features/matchday/attendees'
import { formatEventDateTime } from '@/features/matchday/format'
import type { AdminMatchdayOrder } from '@/features/matchday/types'
import {
  ADMIN_MATCHDAY_PAYMENT_STATUSES,
  ADMIN_MATCHDAY_STATUSES,
  type ListAdminMatchdayOrdersParams,
  adminOrderAmount,
  adminOrderCurrency,
  adminOrderCustomerEmail,
  adminOrderCustomerName,
  adminOrderEur,
  adminOrderEventLabel,
  adminOrderId,
  adminOrderMarkup,
  adminOrderQuantity,
  humanizeAdminStatus,
  summarizeMatchdayOrders,
} from '@/services/matchday-admin'
import { formatCurrency, paidReference } from '@/lib/money'
import { Routes } from '@/routes'

const asDate = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10) : '—'

const dash = (value: string | number | null | undefined) => {
  if (value == null || value === '') return '—'
  return String(value)
}

/** A EUR figure from the order's `eur` object. `null` (no exchange rate yet)
 *  renders as an em-dash, never 0. */
const eurText = (value: number | null) => formatCurrency(value, 'EUR')

/**
 * Matchday order table.
 *
 * Keep cells flexible and allow long content to truncate. This mirrors the
 * responsive behaviour used by the main Orders page.
 */
const COLUMNS: Column<AdminMatchdayOrder>[] = [
  {
    key: 'order',
    label: 'Order',
    nowrap: true,
    render: (o) => (
      <span className='flex flex-col items-start gap-1'>
        <span className='font-mono text-[11px] tabular-nums'>
          #{adminOrderId(o) || '—'}
        </span>
        {o.reference && (
          <span className='font-mono text-[10px] text-muted-foreground'>
            {o.reference}
          </span>
        )}
        {o.hospitality_package_id && (
          /* Its own link: don't also open the order row. */
          <span onClick={(e) => e.stopPropagation()}>
            <VipPackageLink id={o.hospitality_package_id} />
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'customer',
    label: 'Customer',
    render: (o) => {
      const name = adminOrderCustomerName(o)

      return (
        <span className='min-w-0'>
          <span className='block truncate font-semibold leading-tight'>
            {name}
          </span>

          <span className='mt-px block truncate text-[11px] text-muted-foreground'>
            {adminOrderCustomerEmail(o)}
          </span>
        </span>
      )
    },
  },
  {
    key: 'event',
    label: 'Event',
    render: (o) => (
      <span
        className='block min-w-0 max-w-[220px]'
        title={adminOrderEventLabel(o)}
      >
        <span className='block truncate font-medium'>
          {adminOrderEventLabel(o)}
        </span>

        <span className='block truncate text-[11px] text-muted-foreground'>
          {o.ticket?.category_name || o.ticket?.ticket_type || '—'}
        </span>
      </span>
    ),
  },
  {
    key: 'qty',
    label: 'Qty',
    numeric: true,
    render: (o) => {
      const qty = adminOrderQuantity(o)
      return qty == null ? '—' : String(qty)
    },
  },
  {
    /* The EUR total is the figure. What the customer actually paid sits
       beneath it as a reference, and only when it differs — "€100.00 / paid
       €100.00" would just be noise. */
    key: 'amount',
    label: 'Amount',
    numeric: true,
    nowrap: true,
    render: (o) => {
      const eur = adminOrderEur(o)
      const paidCurrency = adminOrderCurrency(o)
      const showPaid = paidCurrency !== eur.currency

      return (
        <span className='block'>
          <span className='block font-mono tabular-nums'>
            {formatCurrency(eur.total, eur.currency)}
          </span>
          {showPaid && (
            <span className='block text-[10.5px] text-muted-foreground'>
              {paidReference(adminOrderAmount(o), paidCurrency)}
            </span>
          )}
        </span>
      )
    },
  },
  {
    key: 'status',
    label: 'Status',
    nowrap: true,
    render: (o) => {
      const delivered = o.delivery?.tickets?.count
      return (
        <span className='flex flex-col items-start gap-1'>
          <StatusPill label={humanizeAdminStatus(o.status)} />
          <span className='text-[10.5px] text-muted-foreground'>
            {[
              o.payment_status ? `payment ${humanizeAdminStatus(o.payment_status)}` : null,
              o.delivery?.delivered_at
                ? `${delivered ? `${delivered} ` : ''}ticket${delivered === 1 ? '' : 's'} delivered`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      )
    },
  },
  {
    key: 'date',
    label: 'Date',
    numeric: true,
    nowrap: true,
    render: (o) => asDate(o.created_at ?? o.paid_at),
  },
]

const PER_PAGE = 25

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  ...ADMIN_MATCHDAY_STATUSES.map((v) => ({ value: v, label: humanizeAdminStatus(v) })),
]

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Any payment' },
  ...ADMIN_MATCHDAY_PAYMENT_STATUSES.map((v) => ({ value: v, label: humanizeAdminStatus(v) })),
]

/** Filters the table reads from (and writes to) the page URL, so a filtered
 *  view survives a reload and can be shared. Keys = backend query names. */
const FILTER_KEYS = [
  'q',
  'status',
  'payment_status',
  'from_date',
  'to_date',
  'email',
  'event_id',
  'ftn_order_id',
] as const
type FilterKey = (typeof FILTER_KEYS)[number]
const EXACT_KEYS: FilterKey[] = ['email', 'event_id', 'ftn_order_id']

export default function MatchTicketsClient() {
  const { openNav } = useAdminNav()
  const pathname = usePathname()
  const params = useSearchParams()

  /* Summary cards: the latest 100 orders, unfiltered — the same figures the
     dashboard shows. Filtering the table never changes them. */
  const summaryQuery = useAdminMatchdayOrders()
  const latest = summaryQuery.data?.data
  const summary = summarizeMatchdayOrders(latest?.orders ?? [])
  const { paid, attention, unconverted, revenueEur } = summary

  const filters = useMemo(() => {
    const f = {} as Record<FilterKey, string>
    for (const k of FILTER_KEYS) f[k] = params.get(k) ?? ''
    return f
  }, [params])
  const page = Math.max(1, Number(params.get('page')) || 1)

  /* Writes filters to the URL; any filter change goes back to page 1.
     Native replaceState, not router.replace: it syncs useSearchParams without
     a router transition or server round-trip (next/dist/docs …
     04-linking-and-navigating.md, "Native History API"). router.replace here
     could stall on a page first opened with filters in its URL. */
  const writeUrl = (qs: string) =>
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  const setParams = (patch: Partial<Record<FilterKey | 'page', string>>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v && v !== 'all') next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in patch)) next.delete('page')
    writeUrl(next.toString())
  }

  /* The search box types freely and reaches the URL after a short pause. */
  const [search, setSearch] = useDraft(filters.q)
  useEffect(() => {
    if (search.trim() === filters.q) return
    const t = setTimeout(() => setParams({ q: search.trim() }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters.q])

  const badRange = !!filters.from_date && !!filters.to_date && filters.to_date < filters.from_date
  const [moreOpen, setMoreOpen] = useState(() => EXACT_KEYS.some((k) => !!filters[k]))

  const request: ListAdminMatchdayOrdersParams = {
    page,
    per_page: PER_PAGE,
    q: filters.q || undefined,
    status: filters.status || undefined,
    payment_status: filters.payment_status || undefined,
    from_date: filters.from_date || undefined,
    to_date: badRange ? undefined : filters.to_date || undefined,
    email: filters.email || undefined,
    event_id: filters.event_id || undefined,
    ftn_order_id: filters.ftn_order_id || undefined,
  }
  const query = useAdminMatchdayOrderSearch(request)
  const meta = query.data?.data
  const filtered = FILTER_KEYS.some((k) => !!filters[k])

  const [viewingId, setViewingId] = useState<string | null>(null)

  /* Revenue is the sum of each paid order's `eur.total` — the same figure the
     dashboard uses, so the two always agree. Orders the backend has not
     converted yet are counted as paid but left out of the sum (and named),
     never treated as 0. */
  const revenueValue = paid === 0 ? '—' : eurText(revenueEur)

  const revenueDelta =
    paid === 0
      ? 'no paid orders yet'
      : unconverted > 0
        ? `${paid} paid · ${unconverted} not yet converted to EUR`
        : `${paid} paid ${paid === 1 ? 'order' : 'orders'}`

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'MatchTickets']}
        title='MatchTickets'
        stats={[
          {
            label: `${latest?.total ?? 0} orders`,
          },
          {
            label: `${paid} paid`,
            tone: 'var(--status-good)',
          },
          ...(attention > 0
            ? [
                {
                  label: `${attention} need attention`,
                  tone: 'var(--status-warn)',
                },
              ]
            : []),
          ...(unconverted > 0
            ? [
                {
                  label: `${unconverted} not yet converted to EUR`,
                  tone: 'var(--status-warn)',
                },
              ]
            : []),
        ]}
        onOpenNav={openNav}
      />

      <div className='flex min-w-0 flex-col gap-4 px-4 pb-5 pt-3 lg:px-[18px]'>
        {/* Same responsive card behaviour as Orders */}
        <div className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            label='Orders'
            icon={<Ticket className='size-3' />}
            value={summaryQuery.isPending ? '—' : String(latest?.total ?? 0)}
          />

          <StatCard
            label='Paid / confirmed'
            icon={<TicketCheck className='size-3' />}
            value={summaryQuery.isPending ? '—' : String(paid)}
          />

          <StatCard
            label='Revenue (paid)'
            icon={<Wallet className='size-3' />}
            value={summaryQuery.isPending ? '—' : revenueValue}
            delta={summaryQuery.isPending ? undefined : revenueDelta}
          />

          <StatCard
            label='Needs attention'
            icon={<CircleAlert className='size-3' />}
            value={summaryQuery.isPending ? '—' : String(attention)}
            delta={
              attention === 0
                ? 'nothing waiting'
                : 'reconciliation, review, attendees'
            }
          />
        </div>

        {/* Filters (Ticket dashboards contract §4). The list holds every local
            order — unpaid, failed and parked ones too — newest first. */}
        <div className='flex flex-col gap-2.5'>
          <div className='flex flex-wrap items-end gap-2.5'>
            <Field label='Search' className='w-full sm:w-[280px]'>
              <span className='relative block'>
                <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Customer, match, reference, supplier or Stripe id'
                  aria-label='Search match ticket orders'
                  className='h-8 w-full rounded-md bg-background pl-8 pr-2.5 text-[12.5px] text-foreground shadow-[0_0_0_1px_var(--edge)] outline-none placeholder:text-muted-foreground focus:shadow-[0_0_0_1px_var(--brand-edge),0_0_0_3px_var(--brand-glow)]'
                />
              </span>
            </Field>
            <Field label='Order status' className='w-[calc(50%-5px)] sm:w-[170px]'>
              <SelectInput
                value={filters.status || 'all'}
                onChange={(v) => setParams({ status: v })}
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label='Payment' className='w-[calc(50%-5px)] sm:w-[150px]'>
              <SelectInput
                value={filters.payment_status || 'all'}
                onChange={(v) => setParams({ payment_status: v })}
                options={PAYMENT_OPTIONS}
              />
            </Field>
            <Field label='Created from' className='w-[calc(50%-5px)] sm:w-[150px]'>
              <TextInput type='date' value={filters.from_date} onChange={(v) => setParams({ from_date: v })} />
            </Field>
            <Field
              label='Created to'
              className='w-[calc(50%-5px)] sm:w-[150px]'
              error={badRange ? 'Before the start date' : undefined}
            >
              <TextInput
                type='date'
                value={filters.to_date}
                onChange={(v) => setParams({ to_date: v })}
                error={badRange}
              />
            </Field>
            <AdminButton
              variant={moreOpen ? 'primary' : 'outline'}
              size='sm'
              className='mb-0.5'
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
            >
              <SlidersHorizontal className='size-3' />
              More filters
            </AdminButton>
            {filtered && (
              <AdminButton
                variant='ghost'
                size='sm'
                className='mb-0.5'
                onClick={() => {
                  setSearch('')
                  writeUrl('')
                }}
              >
                <X className='size-3' />
                Clear filters
              </AdminButton>
            )}
          </div>

          {moreOpen && (
            <div className='flex flex-wrap items-end gap-2.5'>
              <ExactFilter
                label='Customer email (exact)'
                value={filters.email}
                placeholder='name@example.com'
                onCommit={(v) => setParams({ email: v })}
              />
              <ExactFilter
                label='Event id'
                value={filters.event_id}
                placeholder='127730'
                onCommit={(v) => setParams({ event_id: v })}
              />
              <ExactFilter
                label='Supplier order id'
                value={filters.ftn_order_id}
                placeholder='FTN order id'
                onCommit={(v) => setParams({ ftn_order_id: v })}
              />
            </div>
          )}
        </div>

        {/* Prevent the table wrapper from forcing the whole page wider */}
        <div className='min-w-0'>
          <QueryTable
            query={query}
            select={(d) => d.data.orders}
            columns={COLUMNS}
            rowKey={(o) => String(adminOrderId(o))}
            endpoint='/v1/matchday/admin/orders'
            pageSize={0}
            emptyTitle={filtered ? 'Nothing matches these filters' : 'No match tickets yet'}
            emptyBody={
              filtered
                ? 'Try another search, status or date range, or clear the filters.'
                : 'Matchday ticket orders appear here as soon as a customer starts one.'
            }
            selectedKey={viewingId}
            onView={(row) => {
              const id = adminOrderId(row)

              if (id) {
                setViewingId(String(id))
              }
            }}
          />
        </div>

        {meta && meta.total > 0 && (
          <div className='flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground'>
            <span>
              Page {meta.current_page} of {Math.max(1, meta.last_page)} · {meta.total}{' '}
              {meta.total === 1 ? 'order' : 'orders'}
              {filtered ? ' match' : ''}
            </span>
            {meta.last_page > 1 && (
              <div className='flex gap-2'>
                <AdminButton
                  variant='outline'
                  size='sm'
                  disabled={page <= 1}
                  onClick={() => setParams({ page: String(Math.max(1, page - 1)) })}
                >
                  Previous
                </AdminButton>
                <AdminButton
                  variant='outline'
                  size='sm'
                  disabled={page >= meta.last_page}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  Next
                </AdminButton>
              </div>
            )}
          </div>
        )}
      </div>

      {viewingId && (
        <MatchTicketOrderSheet
          orderId={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    </>
  )
}

/* A text box that follows a URL value: what the admin types wins while it
   still matches that value (trimmed); when the URL changes elsewhere (Clear
   filters, back button) the box shows the new value. No effect needed. */
function useDraft(value: string): [string, (v: string) => void] {
  const [draft, setDraft] = useState({ base: value, text: value })
  const text = draft.base === value || draft.text.trim() === value ? draft.text : value
  return [text, (v: string) => setDraft({ base: value, text: v })]
}

/* An exact-match filter: applied on Enter or when the box loses focus, never
   per keystroke (a half-typed email would match nothing). */
function ExactFilter({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder: string
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useDraft(value)
  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim())
  }
  return (
    <Field label={label} className='w-full sm:w-[220px]'>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
        placeholder={placeholder}
        aria-label={label}
        className='h-8 w-full rounded-md bg-background px-2.5 text-[12.5px] text-foreground shadow-[0_0_0_1px_var(--edge)] outline-none placeholder:text-muted-foreground focus:shadow-[0_0_0_1px_var(--brand-edge),0_0_0_3px_var(--brand-glow)]'
      />
    </Field>
  )
}

function MatchTicketOrderSheet({
  orderId,
  onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const query = useAdminMatchdayOrder(orderId)
  const order = query.data?.data

  if (query.isPending) {
    return (
      <DetailSheet
        title={`Order #${orderId}`}
        subtitle='Loading order details...'
        onClose={onClose}
      >
        <SheetSection title='Order'>
          <SheetFacts facts={[['Status', 'Loading...']]} />
        </SheetSection>
      </DetailSheet>
    )
  }

  if (query.isError || !order) {
    return (
      <DetailSheet
        title={`Order #${orderId}`}
        subtitle='Matchday ticket order'
        onClose={onClose}
      >
        <SheetSection title='Order'>
          <SheetFacts
            facts={[
              ['Status', 'Could not load order'],
              ['Order', `#${orderId}`],
              ...(query.error
                ? [
                    ['Error', extractApiMessage(query.error)] as [
                      string,
                      React.ReactNode,
                    ],
                  ]
                : []),
            ]}
          />
        </SheetSection>
      </DetailSheet>
    )
  }

  const customer = order.customer
  const event = order.event
  const ticket = order.ticket
  const qty = adminOrderQuantity(order)
  const attendees = order.attendees ?? []
  const eventDate = event?.event_date || event?.date

  /* EUR — the source of truth for every figure in the Payment section. */
  const eur = adminOrderEur(order)

  /* What the customer actually paid, in their own currency, straight from the
     `charge` object. Shown last, as a reference. */
  const paidCurrency = adminOrderCurrency(order)
  const paidAmount = adminOrderAmount(order)

  return (
    <DetailSheet
      title={adminOrderEventLabel(order)}
      subtitle={`Order #${adminOrderId(order)}${order.reference ? ` · ${order.reference}` : ''}`}
      onClose={onClose}
    >
      <Link
        href={Routes.adminMatchTicket(adminOrderId(order))}
        className='inline-flex w-fit items-center gap-1.5 text-[11.5px] font-semibold text-foreground underline-offset-2 hover:underline'
      >
        <ExternalLink className='size-3.5' />
        Open the full order page
      </Link>

      <SheetSection title='Customer'>
        <SheetFacts
          facts={[
            ['Name', adminOrderCustomerName(order)],
            ['Email', adminOrderCustomerEmail(order)],
            ['Phone', dash(customer?.phone)],
            ['Country', dash(customer?.country)],
            ['City', dash(customer?.city)],
            ['Address', dash(customer?.address)],
            ['Postcode', dash(customer?.postal_code)],
          ]}
        />
      </SheetSection>

      <SheetSection title='Payment'>
        <SheetFacts
          facts={[
            [
              'Order',
              <span key='id' className='font-mono text-[11px]'>
                #{adminOrderId(order)}
              </span>,
            ],
            [
              'Total (EUR)',
              <span key='total' className='font-mono tabular-nums'>
                {eurText(eur.total)}
              </span>,
            ],
            [
              'Supplier cost (EUR)',
              <span key='cost' className='font-mono tabular-nums'>
                {eurText(eur.cost)}
              </span>,
            ],
            [
              'Markup (EUR)',
              <span key='mk' className='font-mono tabular-nums'>
                {eurText(eur.markup)}
              </span>,
            ],
            [
              'Status',
              <StatusPill key='st' label={humanizeAdminStatus(order.status)} />,
            ],
            [
              'Payment',
              order.payment_status ? (
                <StatusPill
                  key='pay'
                  label={humanizeAdminStatus(order.payment_status)}
                />
              ) : (
                '—'
              ),
            ],
            ['Paid at', asDate(order.paid_at)],
            ['Created', asDate(order.created_at)],
            ['Confirmed', asDate(order.confirmed_at)],
            [
              'Tickets sent',
              asDate(order.delivery?.delivered_at ?? order.tickets_sent_at),
            ],
            ['Supplier order', dash(order.ftn?.display_order_id)],
            ['Delivery', dash(order.ftn?.delivery_status)],
            ['Stripe intent', dash(order.stripe?.payment_intent_id)],
            ...(order.failure_message
              ? [
                  ['Failure', order.failure_message] as [
                    string,
                    React.ReactNode,
                  ],
                ]
              : []),
            ...(order.note
              ? [['Note', order.note] as [string, React.ReactNode]]
              : []),
          ]}
        />
      </SheetSection>

      <SheetSection title='Event'>
        <SheetFacts
          facts={[
            ['Fixture', adminOrderEventLabel(order)],
            [
              'Date',
              eventDate
                ? formatEventDateTime(eventDate) || asDate(eventDate)
                : '—',
            ],
            ['Venue', dash(event?.venue_name)],
            ['City', dash(event?.venue_city)],
            ['Event id', dash(event?.event_id)],
          ]}
        />
      </SheetSection>

      <SheetSection title='Ticket'>
        <SheetFacts
          facts={[
            ['Category', dash(ticket?.category_name)],
            ['Type', dash(ticket?.ticket_type)],
            ['Quantity', qty == null ? '—' : String(qty)],
            ['Block', dash(ticket?.block)],
            ['Row', dash(ticket?.row)],
            ['Listing', dash(ticket?.listing_id)],
          ]}
        />
      </SheetSection>

      <SheetSection title='Ticket files'>
        <MatchTicketFiles orderId={adminOrderId(order)} reference={order.reference} />
      </SheetSection>

      <SheetSection title='Attendees'>
        {attendees.length === 0 ? null : (
          <div className='grid gap-3 sm:grid-cols-2'>
            {attendees.map((attendee, index) => (
              <SheetSection key={index} title={`Attendee ${index + 1}`}>
                <SheetFacts
                  stacked
                  facts={Object.entries(attendee).map(([key, value]) => [
                    attendeeFieldLabel(key),
                    dash(value),
                  ])}
                />
              </SheetSection>
            ))}
          </div>
        )}
      </SheetSection>

      {/* Always the LAST section: what the customer really paid, in the
          currency they paid it, read from the `charge` object. Reference
          only — never added to or compared with another order's figure. */}
      <SheetSection title='Paid by customer'>
        <SheetFacts
          facts={[
            [
              'Amount paid',
              <span key='paid' className='font-mono font-semibold tabular-nums'>
                {formatCurrency(paidAmount, paidCurrency)}
              </span>,
            ],
            ['Currency', paidCurrency],
            [
              'Markup (charged)',
              <span key='pmk' className='font-mono tabular-nums'>
                {formatCurrency(adminOrderMarkup(order), paidCurrency)}
              </span>,
            ],
            ['FX rate', dash(order.fx?.rate)],
          ]}
        />
      </SheetSection>
    </DetailSheet>
  )
}
