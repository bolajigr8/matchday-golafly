'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton, EmptyState, Panel } from '@/components/admin/admin-ui'
import { SheetFacts, SheetSection } from '@/components/admin/sheet-shell'
import { StatusPill } from '@/components/admin/status-pill'
import { VipPackageLink } from '@/components/admin/vip/shared'
import { FreeEsimOrderPanel } from '@/components/admin/free-esim-order-panel'
import { MatchTicketFiles } from '@/components/admin/match-ticket-files'
import {
  extractApiMessage,
  useAdminMatchdayOrder,
} from '@/features/admin/hooks'
import { attendeeFieldLabel } from '@/features/matchday/attendees'
import {
  formatEventDateTime,
  formatMatchdayMoney,
} from '@/features/matchday/format'
import type { AdminMatchdayOrder } from '@/features/matchday/types'
import {
  adminOrderAmount,
  adminOrderCurrency,
  adminOrderCustomerEmail,
  adminOrderCustomerName,
  adminOrderEventLabel,
  adminOrderId,
  adminOrderMarkup,
  adminOrderQuantity,
  humanizeAdminStatus,
} from '@/services/matchday-admin'
import { Routes } from '@/routes'

const asDate = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10) : '—'

const dash = (value: string | number | null | undefined) => {
  if (value == null || value === '') return '—'
  return String(value)
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function MatchTicketOrderClient({
  orderId,
}: {
  orderId: string
}) {
  const { openNav } = useAdminNav()
  const query = useAdminMatchdayOrder(orderId)
  const order = query.data?.data
  const id = order ? adminOrderId(order) : Number(orderId) || orderId

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'MatchTickets', `#${id}`]}
        title={order ? adminOrderEventLabel(order) : `Order #${id}`}
        stats={
          order
            ? [
                { label: humanizeAdminStatus(order.status) || '—' },
                ...(order.payment_status
                  ? [{ label: humanizeAdminStatus(order.payment_status) }]
                  : []),
              ]
            : undefined
        }
        onOpenNav={openNav}
      />

      <div className='flex flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]'>
        <Link
          href={Routes.adminMatchTickets}
          className='inline-flex w-fit items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-3.5' />
          All match tickets
        </Link>

        {query.isPending && <OrderSkeleton />}

        {query.isError && (
          <div className='overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]'>
            <EmptyState
              icon={<TriangleAlert className='size-5 text-destructive' />}
              title='Couldn’t load this order'
              body={extractApiMessage(query.error)}
              action={
                <div className='flex flex-col items-center gap-2.5'>
                  <code className='rounded-md bg-muted px-2 py-1 font-mono text-[10.5px] text-muted-foreground'>
                    GET /v1/matchday/admin/orders/{orderId}
                  </code>
                  <AdminButton
                    variant='outline'
                    size='sm'
                    onClick={() => query.refetch()}
                  >
                    <RefreshCw className='size-3' />
                    Retry
                  </AdminButton>
                </div>
              }
            />
          </div>
        )}

        {order && <OrderBody order={order} />}
      </div>
    </>
  )
}

function OrderBody({ order }: { order: AdminMatchdayOrder }) {
  const customer = order.customer
  const event = order.event
  const ticket = order.ticket
  const qty = adminOrderQuantity(order)
  const attendees = order.attendees ?? []
  const eventDate = event?.event_date || event?.date

  return (
    <div className='grid items-start gap-3 lg:grid-cols-2'>
      {order.hospitality_package_id && (
        <div className='flex flex-wrap items-center gap-2 rounded-lg bg-status-warn-bg px-3 py-2.5 text-[11.5px] text-status-warn lg:col-span-2'>
          <b className='font-semibold'>Part of a VIP package.</b>
          <span className='text-foreground/85'>
            The flight, hotel and eSIM wait for this ticket. Release or refund them from the package.
          </span>
          <VipPackageLink id={order.hospitality_package_id} className='font-semibold underline' />
        </div>
      )}
      <Panel title='Customer'>
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
      </Panel>

      {/* <Panel title='Payment'>
        <SheetFacts
          facts={[
            [
              'Order',
              <span key='id' className='font-mono text-[11px]'>
                #{adminOrderId(order)}
              </span>,
            ],
            [
              'Amount',
              <span key='amt' className='font-mono tabular-nums'>
                {formatMatchdayMoney(
                  adminOrderAmount(order),
                  order.currency || 'EUR',
                )}
              </span>,
            ],
            ['Currency', dash(order.currency)],
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
            ['Tickets sent', asDate(order.tickets_sent_at)],
            ...(order.note
              ? ([['Note', order.note]] as [string, ReactNode][])
              : []),
          ]}
        />
      </Panel> */}

      <Panel title='Payment'>
        {(() => {
          const currency = adminOrderCurrency(order)
          const cost = num(order.cost?.amount)
          return (
            <SheetFacts
              facts={[
                [
                  'Order',
                  <span key='id' className='font-mono text-[11px]'>
                    #{adminOrderId(order)}
                  </span>,
                ],
                ['Reference', <span key='ref' className='font-mono text-[11px]'>{dash(order.reference)}</span>],
                [
                  'Amount paid',
                  <span key='amt' className='font-mono tabular-nums'>
                    {formatMatchdayMoney(adminOrderAmount(order), currency)}
                  </span>,
                ],
                ['Currency', currency],
                [
                  'Markup',
                  <span key='mk' className='font-mono tabular-nums'>
                    {formatMatchdayMoney(adminOrderMarkup(order), currency)}
                  </span>,
                ],
                [
                  'Supplier cost',
                  cost == null ? (
                    '—'
                  ) : (
                    <span key='cost' className='font-mono tabular-nums'>
                      {formatMatchdayMoney(
                        cost,
                        order.cost?.currency || currency,
                      )}
                    </span>
                  ),
                ],
                ['FX rate', dash(order.fx?.rate)],
                [
                  'Status',
                  <StatusPill
                    key='st'
                    label={humanizeAdminStatus(order.status)}
                  />,
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
                  ? ([['Failure', order.failure_message]] as [
                      string,
                      ReactNode,
                    ][])
                  : []),
                ...(order.note
                  ? ([['Note', order.note]] as [string, ReactNode][])
                  : []),
              ]}
            />
          )
        })()}
      </Panel>

      <Panel title='Event'>
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
      </Panel>

      <Panel title='Ticket'>
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
      </Panel>

      {order.free_esim && <FreeEsimOrderPanel block={order.free_esim} />}

      <Panel
        title='Ticket files'
        subtitle='Download what the supplier delivered, or open phone tickets. Files are never emailed from here.'
        className={order.free_esim ? undefined : 'lg:col-span-2'}
      >
        <MatchTicketFiles orderId={adminOrderId(order) || order.id || ''} reference={order.reference} />
      </Panel>

      <Panel
        title='Attendees'
        subtitle={
          attendees.length === 0
            ? (order.attendees_required?.length ?? 0) > 0
              ? 'Details have not been submitted yet.'
              : 'None on this order.'
            : `${attendees.length} ${attendees.length === 1 ? 'person' : 'people'}`
        }
        className='lg:col-span-2'
      >
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
      </Panel>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className='rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]'
        >
          <div className='mb-3 h-3 w-24 animate-pulse rounded-sm bg-muted' />
          <div className='flex flex-col gap-2'>
            <div className='h-2.5 w-3/4 animate-pulse rounded-sm bg-muted' />
            <div className='h-2.5 w-1/2 animate-pulse rounded-sm bg-muted' />
            <div className='h-2.5 w-2/3 animate-pulse rounded-sm bg-muted' />
          </div>
        </div>
      ))}
    </div>
  )
}
