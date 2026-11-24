'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton, Panel } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import type { Column } from '@/components/admin/data-table'
import { QueryTable } from '@/components/admin/query-table'
import {
  DetailSheet,
  SheetFacts,
  SheetSection,
} from '@/components/admin/detail-sheet'
import { StatusPill } from '@/components/admin/status-pill'
import { VipPackageLink } from '@/components/admin/vip/shared'
import { TextInput } from '@/components/admin/form-controls'
import {
  useAdminEtgOrders,
  useAdminFlightCancellations,
  useAdminStaysCancellations,
  useAdminStaysOrders,
  useConfirmFlightCancellation,
  useConfirmStaysCancellation,
  useStaysBookingStatus,
} from '@/features/admin/hooks'
import {
  normalizeEur,
  type FlightCancellationRequest,
  type MoneyAmount,
  type StaysCancellationRequest,
  type StaysSupplierOrder,
} from '@/services/travel-admin'
import { EM_DASH, formatAmountString, formatCurrency } from '@/lib/money'
import { Routes } from '@/routes'

/* Stays back-office. Cancellations move real money, so that tab is the one
   place in this admin with an irreversible action behind a confirm.

   MONEY
   · The `eur` block (already euros, not cents) is the source of truth for
     every headline figure, printed with the € symbol. null → "—", never 0.
   · What the customer paid (`currency` + `amount_paid`) is a reference only:
     beneath the EUR figure in lists, and in the last sheet section.
   · A cancellation's refund has no EUR figure in the API, so it is shown in
     the currency it is actually refunded in, with its symbol.
   · Supplier amounts (`amount_payable`, `amount_sell`, …) are in the
     supplier's currency and are never added up. */

const asDate = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10) : '—'

/** `{ amount: "85.00", currency_code: "GBP" }` → "£85.00". */
const supplierMoney = (m: MoneyAmount | null | undefined) =>
  m ? formatAmountString(m.amount, m.currency_code) : EM_DASH

/** EUR figure on top, a muted reference line beneath when there is one. */
function MoneyCell({ main, reference }: { main: string; reference?: string }) {
  return (
    <span className='block'>
      <span className='block font-mono tabular-nums'>{main}</span>
      {reference && (
        <span className='block text-[10.5px] text-muted-foreground'>
          {reference}
        </span>
      )}
    </span>
  )
}

const TABS = [
  { tab: 'cancellations', label: 'Hotel cancellations' },
  { tab: 'flights', label: 'Flight cancellations' },
  { tab: 'orders', label: 'Platform orders' },
  { tab: 'etg', label: 'ETG orders' },
  { tab: 'lookup', label: 'Status lookup' },
] as const

type Tab = (typeof TABS)[number]['tab']

export default function OperationsClient() {
  const { openNav } = useAdminNav()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as Tab | null) ?? 'cancellations'
  const active = TABS.find((t) => t.tab === tab) ?? TABS[0]

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'Operations', active.label]}
        title='Operations'
        tabs={TABS.map((t) => ({
          label: t.label,
          href:
            t.tab === 'cancellations'
              ? Routes.adminOperations
              : Routes.adminWithTab(Routes.adminOperations, t.tab),
          active: tab === t.tab,
        }))}
        onOpenNav={openNav}
      />

      <div className='flex-1 px-4 pb-5 pt-3 lg:px-[18px]'>
        {tab === 'cancellations' && <CancellationsTab />}
        {tab === 'flights' && <FlightCancellationsTab />}
        {tab === 'orders' && <SupplierOrdersTab source='platform' />}
        {tab === 'etg' && <SupplierOrdersTab source='etg' />}
        {tab === 'lookup' && <StatusLookupTab />}
      </div>
    </>
  )
}

/* ── Cancellations ────────────────────────────────────── */

/** The refund, in the currency it is refunded in, with its symbol. */
const refundText = (c: StaysCancellationRequest) =>
  c.refund_amount
    ? formatAmountString(c.refund_amount, c.refund_currency ?? c.currency)
    : EM_DASH

const CANCELLATION_COLUMNS: Column<StaysCancellationRequest>[] = [
  {
    key: 'guest',
    label: 'Guest',
    render: (c) => (
      <span className='min-w-0'>
        <span className='block truncate font-semibold leading-tight'>
          {c.full_name || '—'}
        </span>
        <span className='mt-px block truncate text-[11px] text-muted-foreground'>
          {c.email}
        </span>
        {c.hospitality_package_id && (
          /* Own link: don't also open the row. */
          <span className='mt-1 block' onClick={(e) => e.stopPropagation()}>
            <VipPackageLink id={c.hospitality_package_id} />
          </span>
        )}
      </span>
    ),
  },
  { key: 'hotel', label: 'Property', render: (c) => c.hotel_name || '—' },
  {
    key: 'stay',
    label: 'Stay',
    numeric: true,
    render: (c) => `${asDate(c.checkin)} → ${asDate(c.checkout)}`,
  },
  {
    /* EUR total of the booking; what the guest paid sits beneath it when it
       is in another currency, or when the EUR total is not available yet. */
    key: 'paid',
    label: 'Paid',
    numeric: true,
    nowrap: true,
    render: (c) => {
      const eur = normalizeEur(c.eur)
      const showPaid = c.currency !== eur.currency || eur.total === null
      return (
        <MoneyCell
          main={formatCurrency(eur.total, eur.currency)}
          reference={
            showPaid
              ? `paid ${formatAmountString(c.amount_paid, c.currency)}`
              : undefined
          }
        />
      )
    },
  },
  {
    key: 'refund',
    label: 'Refund',
    numeric: true,
    nowrap: true,
    render: (c) => (
      <span className='font-mono tabular-nums'>{refundText(c)}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    nowrap: true,
    render: (c) => <StatusPill label={c.cancellation_status} />,
  },
]

function CancellationsTab() {
  const query = useAdminStaysCancellations(1)
  const [viewing, setViewing] = useState<StaysCancellationRequest | null>(null)
  const [confirming, setConfirming] = useState<StaysCancellationRequest | null>(
    null,
  )
  const confirmMutation = useConfirmStaysCancellation()

  return (
    <>
      <QueryTable
        query={query}
        /* Laravel paginator — the rows are one level deeper than usual. */
        select={(d) => d.data.data}
        columns={CANCELLATION_COLUMNS}
        rowKey={(c) => String(c.id)}
        endpoint='/v1/stays/order-cancellations'
        onView={setViewing}
        emptyTitle='No cancellation requests'
        emptyBody='Guest cancellation requests awaiting action appear here.'
      />

      {viewing &&
        (() => {
          const row = viewing
          const policies = row.cancellation_policy?.policies ?? []
          const eur = normalizeEur(row.eur)
          const eurText = (v: number | null) => formatCurrency(v, eur.currency)
          const mono = (text: string, key: string, bold = false) => (
            <span
              key={key}
              className={`font-mono tabular-nums${bold ? ' font-semibold' : ''}`}
            >
              {text}
            </span>
          )

          return (
            <DetailSheet
              title={row.hotel_name || 'Cancellation'}
              subtitle={row.booking_reference}
              onClose={() => setViewing(null)}
              footer={
                row.cancellation_status === 'requested' ? (
                  <div className='flex w-full flex-col items-stretch gap-2'>
                    {/* VIP contract §7: the warning sits next to the button. */}
                    {row.vip_package_warning && (
                      <VipWarning
                        text={row.vip_package_warning}
                        packageId={row.hospitality_package_id}
                      />
                    )}
                    <div className='flex justify-end'>
                      <AdminButton
                        size='sm'
                        onClick={() => {
                          setConfirming(row)
                          setViewing(null)
                        }}
                      >
                        Confirm cancellation
                      </AdminButton>
                    </div>
                  </div>
                ) : undefined
              }
            >
              {row.vip_package_warning &&
                row.cancellation_status !== 'requested' && (
                  <VipWarning
                    text={row.vip_package_warning}
                    packageId={row.hospitality_package_id}
                  />
                )}
              <SheetSection title='Guest'>
                <SheetFacts
                  facts={[
                    ['Name', row.full_name || '—'],
                    ['Email', row.email],
                    ['Phone', row.phone || '—'],
                  ]}
                />
              </SheetSection>

              <SheetSection title='Booking'>
                <SheetFacts
                  facts={[
                    ['Property', row.hotel_name || '—'],
                    ['Reference', row.booking_reference],
                    ['Order id', row.order_id],
                    ['Check in', asDate(row.checkin)],
                    ['Check out', asDate(row.checkout)],
                    ['Booking status', row.booking_status || '—'],
                  ]}
                />
              </SheetSection>

              <SheetSection title='Refund'>
                <SheetFacts
                  facts={[
                    ['Total (EUR)', mono(eurText(eur.total), 'total')],
                    ['Supplier cost (EUR)', mono(eurText(eur.cost), 'cost')],
                    ['Markup (EUR)', mono(eurText(eur.markup), 'mk')],
                    [
                      'Fee forfeited',
                      row.service_fee_forfeited
                        ? formatAmountString(
                            row.service_fee_forfeited,
                            row.currency,
                          )
                        : '—',
                    ],
                    [
                      'Free until',
                      row.cancellation_policy?.free_cancellation_before?.slice(
                        0,
                        10,
                      ) ?? '—',
                    ],
                    [
                      'Status',
                      <StatusPill key='s' label={row.cancellation_status} />,
                    ],
                    ['Requested', asDate(row.cancellation_requested_at)],
                    ['Cancelled', asDate(row.cancelled_at)],
                    ['Reason', row.cancellation_reason || '—'],
                  ]}
                />
              </SheetSection>

              {policies.length > 0 && (
                <SheetSection title='Penalty policy'>
                  <SheetFacts
                    stacked
                    facts={policies.map(
                      (p, i) =>
                        [
                          `From ${p.start_at?.slice(0, 10) ?? '—'} to ${p.end_at?.slice(0, 10) ?? '—'}`,
                          `Charge ${p.amount_charge} · show ${p.amount_show}`,
                        ] as [string, React.ReactNode],
                    )}
                  />
                </SheetSection>
              )}

              {/* Always the LAST section: what the guest really paid, and what
                is refunded, in the currency it moves in. Reference only. */}
              <SheetSection title='Paid by customer'>
                <SheetFacts
                  facts={[
                    [
                      'Amount paid',
                      mono(
                        formatAmountString(row.amount_paid, row.currency),
                        'paid',
                        true,
                      ),
                    ],
                    ['Refund', mono(refundText(row), 'refund', true)],
                    ['Currency', row.currency],
                  ]}
                />
              </SheetSection>
            </DetailSheet>
          )
        })()}

      {confirming && (
        <ConfirmDialog
          title='Confirm this cancellation?'
          body={
            <>
              This cancels{' '}
              <b className='font-semibold text-foreground'>
                {confirming.booking_reference}
              </b>{' '}
              with the supplier and refunds{' '}
              <b className='font-semibold text-foreground'>
                {confirming.refund_amount
                  ? refundText(confirming)
                  : 'the calculated amount'}
              </b>{' '}
              to {confirming.full_name || confirming.email}. This moves real
              money and cannot be undone.
              {confirming.vip_package_warning && (
                <span className='mt-2 block font-semibold text-status-warn'>
                  {confirming.vip_package_warning}
                </span>
              )}
            </>
          }
          confirmLabel='Confirm cancellation'
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            confirmMutation.mutate(confirming.id)
            setConfirming(null)
          }}
        />
      )}
    </>
  )
}

/* ── Flight cancellations ─────────────────────────────── */

/* A customer's request to cancel a flight. Confirming it cancels with the
   airline and refunds: real money, so it sits behind a confirm, with the VIP
   warning (VIP Admin API contract §7) beside the button and in the dialog. */

const flightStatus = (c: FlightCancellationRequest) =>
  c.cancellation_status ?? c.status ?? null

const flightRefundText = (c: FlightCancellationRequest) =>
  c.refund_amount
    ? formatAmountString(c.refund_amount, c.refund_currency ?? c.currency ?? 'EUR')
    : EM_DASH

const flightMoney = (amount: string | null | undefined, c: FlightCancellationRequest) =>
  amount ? formatAmountString(amount, c.currency ?? c.refund_currency ?? 'EUR') : EM_DASH

const FLIGHT_CANCELLATION_COLUMNS: Column<FlightCancellationRequest>[] = [
  {
    key: 'booking',
    label: 'Booking',
    render: (c) => (
      <span className='min-w-0'>
        <span className='block truncate font-semibold leading-tight'>
          {c.booking_reference ||
            (c.parent_ledger_id ? `Ledger ${c.parent_ledger_id}` : `#${c.id}`)}
        </span>
        <span className='mt-px block truncate text-[11px] text-muted-foreground'>
          {c.full_name || c.email || c.order_id || EM_DASH}
        </span>
        {c.hospitality_package_id && (
          /* Own link: don't also open the row. */
          <span className='mt-1 block' onClick={(e) => e.stopPropagation()}>
            <VipPackageLink id={c.hospitality_package_id} />
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'requested',
    label: 'Requested',
    numeric: true,
    render: (c) => asDate(c.cancellation_requested_at ?? c.requested_at),
  },
  {
    key: 'paid',
    label: 'Paid',
    numeric: true,
    nowrap: true,
    render: (c) => {
      if (!c.eur) return <MoneyCell main={flightMoney(c.amount_paid, c)} />
      const eur = normalizeEur(c.eur)
      const showPaid =
        !!c.amount_paid && (c.currency !== eur.currency || eur.total === null)
      return (
        <MoneyCell
          main={formatCurrency(eur.total, eur.currency)}
          reference={showPaid ? `paid ${flightMoney(c.amount_paid, c)}` : undefined}
        />
      )
    },
  },
  {
    key: 'refund',
    label: 'Refund',
    numeric: true,
    nowrap: true,
    render: (c) => (
      <span className='font-mono tabular-nums'>{flightRefundText(c)}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    nowrap: true,
    render: (c) => {
      const s = flightStatus(c)
      return s ? <StatusPill label={s} /> : EM_DASH
    },
  },
]

function FlightCancellationsTab() {
  const query = useAdminFlightCancellations()
  const [viewing, setViewing] = useState<FlightCancellationRequest | null>(null)
  const [confirming, setConfirming] = useState<FlightCancellationRequest | null>(
    null,
  )
  const confirmMutation = useConfirmFlightCancellation()

  return (
    <>
      <QueryTable
        query={query}
        select={(d) => d}
        columns={FLIGHT_CANCELLATION_COLUMNS}
        rowKey={(c) => String(c.id)}
        endpoint='/v1/flights/order-cancellations'
        onView={setViewing}
        emptyTitle='No flight cancellation requests'
        emptyBody='Customer requests to cancel a flight appear here.'
      />

      {viewing &&
        (() => {
          const row = viewing
          const status = flightStatus(row)
          const eur = normalizeEur(row.eur)
          const mono = (text: string, key: string, bold = false) => (
            <span
              key={key}
              className={`font-mono tabular-nums${bold ? ' font-semibold' : ''}`}
            >
              {text}
            </span>
          )

          return (
            <DetailSheet
              title={row.booking_reference || 'Flight cancellation'}
              subtitle={row.order_id ?? undefined}
              onClose={() => setViewing(null)}
              footer={
                status === 'requested' ? (
                  <div className='flex w-full flex-col items-stretch gap-2'>
                    {/* VIP contract §7: the warning sits next to the button. */}
                    {row.vip_package_warning && (
                      <VipWarning
                        text={row.vip_package_warning}
                        packageId={row.hospitality_package_id}
                      />
                    )}
                    <div className='flex justify-end'>
                      <AdminButton
                        size='sm'
                        onClick={() => {
                          setConfirming(row)
                          setViewing(null)
                        }}
                      >
                        Confirm cancellation
                      </AdminButton>
                    </div>
                  </div>
                ) : undefined
              }
            >
              {row.vip_package_warning && status !== 'requested' && (
                <VipWarning
                  text={row.vip_package_warning}
                  packageId={row.hospitality_package_id}
                />
              )}
              <SheetSection title='Booking'>
                <SheetFacts
                  facts={[
                    ['Reference', row.booking_reference || EM_DASH],
                    ['Airline order', row.order_id || EM_DASH],
                    [
                      'Ledger',
                      row.parent_ledger_id ? String(row.parent_ledger_id) : EM_DASH,
                    ],
                    ['Customer', row.full_name || row.email || EM_DASH],
                  ]}
                />
              </SheetSection>

              <SheetSection title='Cancellation'>
                <SheetFacts
                  facts={[
                    [
                      'Status',
                      status ? <StatusPill key='s' label={status} /> : EM_DASH,
                    ],
                    [
                      'Requested',
                      asDate(row.cancellation_requested_at ?? row.requested_at),
                    ],
                    ['Cancelled', asDate(row.cancelled_at)],
                    ['Reason', row.cancellation_reason || row.reason || EM_DASH],
                    [
                      'Airline penalty',
                      mono(flightMoney(row.airline_penalty_amount, row), 'pen'),
                    ],
                    [
                      'Fee forfeited',
                      mono(flightMoney(row.service_fee_forfeited ?? row.fee, row), 'fee'),
                    ],
                    ['Refund', mono(flightRefundText(row), 'refund', true)],
                  ]}
                />
              </SheetSection>

              {row.eur && (
                <SheetSection title='EUR'>
                  <SheetFacts
                    facts={[
                      ['Total (EUR)', mono(formatCurrency(eur.total, eur.currency), 'total')],
                      ['Cost (EUR)', mono(formatCurrency(eur.cost, eur.currency), 'cost')],
                      ['Markup (EUR)', mono(formatCurrency(eur.markup, eur.currency), 'mk')],
                    ]}
                  />
                </SheetSection>
              )}

              {/* Always the LAST section: what the customer really paid.
                  Reference only. */}
              <SheetSection title='Paid by customer'>
                <SheetFacts
                  facts={[
                    ['Amount paid', mono(flightMoney(row.amount_paid, row), 'paid', true)],
                    ['Currency', row.currency || EM_DASH],
                  ]}
                />
              </SheetSection>
            </DetailSheet>
          )
        })()}

      {confirming && (
        <ConfirmDialog
          title='Confirm this flight cancellation?'
          body={
            <>
              This cancels{' '}
              <b className='font-semibold text-foreground'>
                {confirming.booking_reference ||
                  confirming.order_id ||
                  `request #${confirming.id}`}
              </b>{' '}
              with the airline and refunds{' '}
              <b className='font-semibold text-foreground'>
                {confirming.refund_amount
                  ? flightRefundText(confirming)
                  : 'the calculated amount'}
              </b>
              {confirming.full_name || confirming.email
                ? ` to ${confirming.full_name || confirming.email}`
                : ''}
              . This moves real money and cannot be undone.
              {confirming.vip_package_warning && (
                <span className='mt-2 block font-semibold text-status-warn'>
                  {confirming.vip_package_warning}
                </span>
              )}
            </>
          }
          confirmLabel='Confirm cancellation'
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            confirmMutation.mutate(confirming.id)
            setConfirming(null)
          }}
        />
      )}
    </>
  )
}

/* ── Supplier orders (platform / ETG) ─────────────────── */

const SUPPLIER_COLUMNS: Column<StaysSupplierOrder>[] = [
  {
    key: 'order',
    label: 'Order',
    render: (o) => (
      <span className='min-w-0'>
        <span className='block truncate font-semibold leading-tight'>
          #{o.order_id}
        </span>
        <span className='mt-px block truncate text-[11px] text-muted-foreground'>
          {o.user_data?.email ?? '—'}
        </span>
        {o.hospitality_package_id && (
          <span className='mt-1 block' onClick={(e) => e.stopPropagation()}>
            <VipPackageLink id={o.hospitality_package_id} />
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'stay',
    label: 'Stay',
    numeric: true,
    render: (o) => `${asDate(o.checkin_at)} → ${asDate(o.checkout_at)}`,
  },
  {
    key: 'nights',
    label: 'Nights',
    numeric: true,
    render: (o) => String(o.nights ?? '—'),
  },
  {
    /* EUR total first. The supplier's payable amount sits beneath it when it
       is in another currency. A row with no `eur` block at all (older
       payload) falls back to the payable amount so it is never blank. */
    key: 'amount',
    label: 'Amount',
    numeric: true,
    nowrap: true,
    render: (o) => {
      const payable = supplierMoney(o.amount_payable)
      if (!o.eur) return <MoneyCell main={payable} />

      const eur = normalizeEur(o.eur)
      const showRef =
        !!o.amount_payable &&
        (o.amount_payable.currency_code !== eur.currency || eur.total === null)
      return (
        <MoneyCell
          main={formatCurrency(eur.total, eur.currency)}
          reference={showRef ? `payable ${payable}` : undefined}
        />
      )
    },
  },
  {
    key: 'status',
    label: 'Status',
    nowrap: true,
    render: (o) => (
      <span className='flex flex-col items-start gap-1'>
        <StatusPill label={o.status} />
        {/* e.g. a held VIP hotel: "Paid; held until the VIP package ticket
            is secured. Not booked yet." */}
        {o.status_message && (
          <span className='max-w-[220px] whitespace-normal text-[10.5px] leading-snug text-muted-foreground'>
            {o.status_message}
          </span>
        )}
      </span>
    ),
  },
]

/** VIP contract §7: a hotel that belongs to a VIP package. Information
 *  only; cancelling it leaves the rest of the package (the match ticket
 *  cannot be cancelled with the supplier). */
function VipWarning({
  text,
  packageId,
}: {
  text: string
  packageId?: string | null
}) {
  return (
    <div className='flex flex-col items-start gap-1.5 rounded-md bg-status-warn-bg px-3 py-2.5 text-[11.5px] leading-relaxed text-status-warn'>
      <span className='font-semibold'>{text}</span>
      {packageId && <VipPackageLink id={packageId} className='font-semibold underline' />}
    </div>
  )
}

function SupplierOrdersTab({ source }: { source: 'platform' | 'etg' }) {
  const [page, setPage] = useState(1)
  /* Both hooks are called every render — calling one conditionally would break
     the rules of hooks. The unused one is cheap: its query key differs and
     React Query dedupes, and only the active source is read. */
  const platformQuery = useAdminStaysOrders(page)
  const etgQuery = useAdminEtgOrders(page)
  const query = source === 'platform' ? platformQuery : etgQuery

  const meta = query.data?.data?.data
  const [viewing, setViewing] = useState<StaysSupplierOrder | null>(null)

  return (
    <>
      <QueryTable
        query={query}
        select={(d) => d.data?.data?.orders ?? []}
        columns={SUPPLIER_COLUMNS}
        rowKey={(o) => String(o.order_id)}
        endpoint={
          source === 'platform' ? '/v1/stays/orders' : '/v1/stays/etg-orders'
        }
        onView={setViewing}
        emptyTitle={
          source === 'platform' ? 'No platform orders' : 'No ETG orders'
        }
        emptyBody='Supplier-side bookings appear here for reconciliation.'
      />

      {meta && meta.total_pages > 1 && (
        <div className='mt-3 flex items-center justify-between text-[11px] text-muted-foreground'>
          <span>
            Page {meta.current_page_number} of {meta.total_pages} ·{' '}
            {meta.total_orders} orders
          </span>
          <div className='flex gap-2'>
            <AdminButton
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant='outline'
              size='sm'
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}

      {viewing &&
        (() => {
          const row = viewing
          const eur = normalizeEur(row.eur)
          const eurText = (v: number | null) => formatCurrency(v, eur.currency)
          const mono = (text: string, key: string) => (
            <span key={key} className='font-mono tabular-nums'>
              {text}
            </span>
          )

          return (
            <DetailSheet
              title={`Order #${row.order_id}`}
              subtitle={row.hotel_data?.id ?? row.source}
              onClose={() => setViewing(null)}
            >
              <SheetSection title='Booking'>
                <SheetFacts
                  facts={[
                    ['Agreement', row.agreement_number || '—'],
                    ['Source', row.source || '—'],
                    ['Type', row.order_type || '—'],
                    ['Check in', asDate(row.checkin_at)],
                    ['Check out', asDate(row.checkout_at)],
                    ['Nights', String(row.nights ?? '—')],
                    ['Room nights', String(row.roomnights ?? '—')],
                    ['Status', <StatusPill key='s' label={row.status} />],
                    ['Cancellable', row.is_cancellable ? 'Yes' : 'No'],
                    ['Cancelled', asDate(row.cancelled_at)],
                  ]}
                />
              </SheetSection>

              <SheetSection title='Amounts'>
                <SheetFacts
                  facts={[
                    ['Total (EUR)', mono(eurText(eur.total), 'total')],
                    ['Supplier cost (EUR)', mono(eurText(eur.cost), 'cost')],
                    ['Markup (EUR)', mono(eurText(eur.markup), 'mk')],
                  ]}
                />
              </SheetSection>

              <SheetSection title='Guest'>
                <SheetFacts
                  facts={[
                    ['Email', row.user_data?.email ?? '—'],
                    ['Arrival', row.user_data?.arrival_datetime ?? '—'],
                    ['Comment', row.user_data?.user_comment ?? '—'],
                    ['Partner order', row.partner_data?.order_id ?? '—'],
                    ['Supplier ref', row.supplier_data?.confirmation_id ?? '—'],
                  ]}
                />
              </SheetSection>

              {(row.rooms_data ?? []).length > 0 && (
                <SheetSection title='Rooms'>
                  <SheetFacts
                    stacked
                    facts={row.rooms_data.map(
                      (r) =>
                        [
                          r.room_name || `Room ${r.room_idx + 1}`,
                          `${r.guest_data?.adults_number ?? 0} adults · ${r.guest_data?.children_number ?? 0} children · ${r.meal_name || 'no meal'}`,
                        ] as [string, React.ReactNode],
                    )}
                  />
                </SheetSection>
              )}

              {/* Always the LAST section: the supplier's own figures, in the
                supplier's currency, with symbols. Reference only — never
                added to another order's. */}
              <SheetSection title='Supplier amounts'>
                <SheetFacts
                  facts={[
                    [
                      'Payable',
                      mono(supplierMoney(row.amount_payable), 'payable'),
                    ],
                    ['Sell', mono(supplierMoney(row.amount_sell), 'sell')],
                    [
                      'Refunded',
                      mono(supplierMoney(row.amount_refunded), 'refunded'),
                    ],
                    ['VAT', mono(supplierMoney(row.amount_payable_vat), 'vat')],
                  ]}
                />
              </SheetSection>
            </DetailSheet>
          )
        })()}
    </>
  )
}

/* ── Status lookup ────────────────────────────────────── */

function StatusLookupTab() {
  const [input, setInput] = useState('')
  /* Only set on submit — typing an id must not fire a request per keystroke. */
  const [submitted, setSubmitted] = useState<string | null>(null)
  const query = useStaysBookingStatus(submitted)

  const result = query.data?.data?.data

  return (
    <Panel
      title='Booking status lookup'
      subtitle='Ask the supplier for the live status of a partner order.'
    >
      <form
        className='flex items-start gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = input.trim()
          if (trimmed) setSubmitted(trimmed)
        }}
      >
        <span className='min-w-0 flex-1'>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder='Partner order id'
          />
        </span>
        <AdminButton size='sm' disabled={!input.trim() || query.isFetching}>
          <Search className='size-3' />
          {query.isFetching ? 'Checking…' : 'Look up'}
        </AdminButton>
      </form>

      <div className='mt-3'>
        {!submitted && (
          <p className='m-0 text-xs text-muted-foreground'>
            Enter a partner order id to check its status with the supplier.
          </p>
        )}

        {submitted && query.isError && (
          <p className='m-0 text-xs text-destructive'>
            No status returned for{' '}
            <span className='font-mono'>{submitted}</span>. Check the id.
          </p>
        )}

        {submitted && result && (
          <SheetFacts
            facts={[
              ['Partner order', result.partner_order_id],
              ['Progress', `${result.percent}%`],
              [
                'Status',
                <StatusPill
                  key='s'
                  label={query.data?.data?.status ?? 'unknown'}
                />,
              ],
            ]}
          />
        )}
      </div>
    </Panel>
  )
}
