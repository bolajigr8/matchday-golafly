'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Hotel, Plane, Smartphone } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { StatCard } from '@/components/admin/admin-ui'
import type { Column } from '@/components/admin/data-table'
import { QueryTable } from '@/components/admin/query-table'
import {
  DetailSheet,
  SheetFacts,
  SheetSection,
} from '@/components/admin/detail-sheet'
import { StatusPill } from '@/components/admin/status-pill'
import { useAdminLedgers, useTravelOverview } from '@/features/admin/hooks'
import {
  esimSummary,
  flightSummary,
  ledgerEur,
  staysSummary,
  type Ledger,
  type LedgerType,
} from '@/services/travel-admin'
import { esimProviderLabel } from '@/features/esim/types'
import { adminFreeEsim, FREE_ESIM_ADMIN_LABEL } from '@/features/free-esim/rules'
import { formatAmountString, formatCurrency, formatMinor } from '@/lib/money'
import { Routes } from '@/routes'

/* Orders is the travel-product order book — flights, eSIMs and stays.
 *
 * Deliberately separate from Transactions, which is programme/offer money on a
 * different endpoint. They are two different businesses that happen to share a
 * backend, and collapsing them would mean neither page answers its question.
 *
 * MONEY
 *   · Every figure that is shown or compared comes from the ledger's `eur`
 *     block (already euros, not cents) and is printed with the € symbol.
 *     A null field means "no exchange rate yet" and renders as "—", never 0.
 *   · `pricing` is what the customer paid in THEIR currency (EUR, GBP or USD).
 *     It is a reference only: shown beneath the EUR figure in the list, and in
 *     the "Paid by customer" section at the bottom of the side sheet. It is
 *     never added up or compared across orders.
 *   · `pricing.*_minor` on /v1/overview/ledgers IS minor units, so it is
 *     divided by 100 (formatMinor). The "already major" exception belongs to
 *     /v1/esim2/admin/orders, which this page does not call. */

const asDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '—')

const TABS = [
  { tab: 'all', label: 'All' },
  { tab: 'flights', label: 'Flights', type: 'flight' as LedgerType },
  { tab: 'esim', label: 'eSIMs', type: 'esim' as LedgerType },
  { tab: 'stays', label: 'Stays', type: 'stays' as LedgerType },
] as const

type Tab = (typeof TABS)[number]['tab']

const LEDGER_COLUMNS: Column<Ledger>[] = [
  {
    key: 'customer',
    label: 'Customer',
    render: (l) => (
      <span className='min-w-0'>
        <span className='block truncate font-semibold leading-tight'>
          {l.customer.full_name || '—'}
        </span>
        <span className='mt-px block truncate text-[11px] text-muted-foreground'>
          {l.customer.email}
        </span>
      </span>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (l) => {
      const fe = adminFreeEsim(l)
      if (!fe.free) return <span className='capitalize'>{l.ledger_type}</span>
      return (
        <span className='block'>
          <span className='block font-semibold'>{FREE_ESIM_ADMIN_LABEL}</span>
          {fe.matchRef && (
            <span className='block font-mono text-[10.5px] text-muted-foreground'>
              {fe.matchRef}
            </span>
          )}
        </span>
      )
    },
  },
  {
    /* The EUR total is the figure. What the customer actually paid sits
       beneath it as a reference — shown when it is in another currency, or
       when the EUR total is not available yet (so the row is never blank). */
    key: 'amount',
    label: 'Amount',
    numeric: true,
    nowrap: true,
    render: (l) => {
      /* Free eSIM (contract §7): no amount, never counted as a sale. Its
         currency is the provider's cost currency, so 0 is never printed. */
      if (adminFreeEsim(l).free) {
        return (
          <span className='block'>
            <span className='block font-semibold'>Free</span>
            <span className='block text-[10.5px] text-muted-foreground'>Not a sale</span>
          </span>
        )
      }
      const eur = ledgerEur(l)
      const paidCurrency = l.pricing.currency
      const showPaid = paidCurrency !== eur.currency || eur.total === null

      return (
        <span className='block'>
          <span className='block font-mono tabular-nums'>
            {formatCurrency(eur.total, eur.currency)}
          </span>
          {showPaid && (
            <span className='block text-[10.5px] text-muted-foreground'>
              paid {formatMinor(l.pricing.amount_paid_minor, paidCurrency)}
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
    render: (l) =>
      adminFreeEsim(l).free ? (
        <StatusPill
          label={l.status === 'confirmed' ? 'Free · issued' : `Free · ${l.status || 'pending'}`}
          tone={l.status === 'confirmed' ? 'good' : l.status === 'failed' ? 'danger' : 'info'}
        />
      ) : (
        <StatusPill label={l.payment_status} />
      ),
  },
  {
    key: 'date',
    label: 'Date',
    numeric: true,
    render: (l) => asDate(l.created_at),
  },
]

export default function OrdersClient() {
  const { openNav } = useAdminNav()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as Tab | null) ?? 'all'
  const active = TABS.find((t) => t.tab === tab) ?? TABS[0]
  const type = 'type' in active ? active.type : undefined

  const overviewQuery = useTravelOverview()
  const overview = overviewQuery.data?.data
  /* The overview is always EUR now. */
  const currency = overview?.currency ?? 'EUR'
  const byType = overview?.by_type
  const unconverted = Number(overview?.unconverted_count ?? 0) || 0

  const query = useAdminLedgers(type)
  const [viewing, setViewing] = useState<Ledger | null>(null)

  const count = (n: number | undefined) =>
    overviewQuery.isPending ? '—' : String(n ?? 0)
  const money = (amount: string | undefined) =>
    overviewQuery.isPending ? undefined : formatAmountString(amount, currency)

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'Orders', active.label]}
        title='Orders'
        tabs={TABS.map((t) => ({
          label: t.label,
          href:
            t.tab === 'all'
              ? Routes.adminOrders
              : Routes.adminWithTab(Routes.adminOrders, t.tab),
          active: tab === t.tab,
        }))}
        /* Paid orders that are counted but have no EUR figure yet. They are
           missing from the money totals, so say so. */
        stats={
          unconverted > 0
            ? [
                {
                  label: `${unconverted} ${unconverted === 1 ? 'order' : 'orders'} not yet converted to EUR`,
                  tone: 'var(--status-warn)',
                },
              ]
            : undefined
        }
        onOpenNav={openNav}
      />

      <div className='flex flex-col gap-4 px-4 pb-5 pt-3 lg:px-[18px]'>
        {/* The by-type cards. `amount` on these is already a major-unit
            decimal string in EUR, unlike the ledger's *_minor fields. */}
        <div className='grid gap-2.5 sm:grid-cols-3'>
          <StatCard
            label='Flight orders'
            icon={<Plane className='size-3' />}
            value={count(byType?.flight.count)}
            delta={money(byType?.flight.amount)}
          />
          <StatCard
            label='eSIM orders'
            icon={<Smartphone className='size-3' />}
            value={count(byType?.esim.count)}
            delta={money(byType?.esim.amount)}
          />
          <StatCard
            label='Stays orders'
            icon={<Hotel className='size-3' />}
            value={count(byType?.stays.count)}
            delta={money(byType?.stays.amount)}
          />
        </div>

        <QueryTable
          query={query}
          select={(d) => d.data}
          columns={LEDGER_COLUMNS}
          rowKey={(l) => String(l.ledger_id)}
          endpoint='/v1/overview/ledgers'
          onView={setViewing}
          emptyTitle='No orders yet'
          emptyBody='Flight, eSIM and stays purchases appear here once a customer pays.'
        />
      </div>

      {viewing && (
        <LedgerSheet ledger={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  )
}

function LedgerSheet({
  ledger,
  onClose,
}: {
  ledger: Ledger
  onClose: () => void
}) {
  const flight = flightSummary(ledger)
  const esim = esimSummary(ledger)
  const stays = staysSummary(ledger)
  const freeEsim = adminFreeEsim(ledger)

  /* EUR — the source of truth for the Payment section. */
  const eur = ledgerEur(ledger)

  /* What the customer actually paid, in their own currency, from `pricing`.
     Shown last, as a reference. */
  const { currency: paidCurrency } = ledger.pricing

  const eurText = (value: number | null) => formatCurrency(value, eur.currency)

  return (
    <DetailSheet
      title={ledger.customer.full_name || ledger.customer.email}
      subtitle={
        freeEsim.free
          ? `${FREE_ESIM_ADMIN_LABEL} · #${ledger.ledger_id}`
          : `${ledger.ledger_type} · #${ledger.ledger_id}`
      }
      onClose={onClose}
    >
      <SheetSection title='Customer'>
        <SheetFacts
          facts={[
            ['Name', ledger.customer.full_name || '—'],
            ['Email', ledger.customer.email],
            ['Phone', ledger.customer.phone || '—'],
          ]}
        />
      </SheetSection>

      {freeEsim.free ? (
        /* Free eSIM: no price, amount paid, receipt or refund (contract §7). */
        <SheetSection title='Free eSIM'>
          <SheetFacts
            facts={[
              ['Type', FREE_ESIM_ADMIN_LABEL],
              [
                'Match order',
                freeEsim.matchOrderId != null ? (
                  <Link
                    key='mo'
                    href={Routes.adminMatchTicket(String(freeEsim.matchOrderId))}
                    className='font-mono font-semibold underline'
                  >
                    {freeEsim.matchRef || `#${freeEsim.matchOrderId}`}
                  </Link>
                ) : (
                  freeEsim.matchRef || '—'
                ),
              ],
              ['Price', 'Free · not a sale'],
              ['Order status', ledger.status || '—'],
              ['Created', asDate(ledger.created_at)],
            ]}
          />
        </SheetSection>
      ) : (
      <SheetSection title='Payment'>
        <SheetFacts
          facts={[
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
            ['Status', <StatusPill key='s' label={ledger.payment_status} />],
            ['Order status', ledger.status || '—'],
            ['Paid at', asDate(ledger.paid_at)],
            ['Created', asDate(ledger.created_at)],
          ]}
        />
      </SheetSection>
      )}

      {/* The summary is a bare union — branch on ledger_type, which is the
          only reliable discriminant the API gives. */}
      {flight && (
        <SheetSection title='Flight'>
          <SheetFacts
            facts={[
              ['PNR', flight.pnr_reference || '—'],
              ['Airline', flight.airline_name || '—'],
              [
                'Route',
                flight.origin && flight.destination
                  ? `${flight.origin} → ${flight.destination}`
                  : '—',
              ],
              ['Departs', flight.departure_date?.slice(0, 10) ?? '—'],
              ['Duffel id', flight.duffel_order_id || '—'],
            ]}
          />
        </SheetSection>
      )}

      {esim && (
        <SheetSection title='eSIM'>
          <SheetFacts
            facts={[
              ['Package', esim.package || '—'],
              ['Package id', esim.package_id || '—'],
              ['Provider', esimProviderLabel(esim.provider)],
              ['ICCID', esim.iccid || '—'],
              ['Supplier order', esim.airalo_order_id || '—'],
            ]}
          />
        </SheetSection>
      )}

      {stays && (
        <SheetSection title='Stay'>
          <SheetFacts
            facts={[
              ['Property', stays.property_name || '—'],
              ['Check in', stays.checkin?.slice(0, 10) ?? '—'],
              ['Check out', stays.checkout?.slice(0, 10) ?? '—'],
              ['Reference', stays.booking_reference || '—'],
            ]}
          />
        </SheetSection>
      )}

      {/* Always the LAST section: what the customer really paid, in the
          currency they paid it, read from `pricing`. Reference only — never
          added to or compared with another order's figure. */}
      {!freeEsim.free && (
      <SheetSection title='Paid by customer'>
        <SheetFacts
          facts={[
            [
              'Amount paid',
              <span key='paid' className='font-mono font-semibold tabular-nums'>
                {formatMinor(ledger.pricing.amount_paid_minor, paidCurrency)}
              </span>,
            ],
            [
              'Order amount',
              <span key='amt' className='font-mono tabular-nums'>
                {formatMinor(ledger.pricing.amount_minor, paidCurrency)}
              </span>,
            ],
            ['Currency', paidCurrency],
          ]}
        />
      </SheetSection>
      )}
    </DetailSheet>
  )
}
