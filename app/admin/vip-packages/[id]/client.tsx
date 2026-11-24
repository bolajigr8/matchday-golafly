'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton, EmptyState, Panel } from '@/components/admin/admin-ui'
import { SheetFacts } from '@/components/admin/sheet-shell'
import { StatusPill } from '@/components/admin/status-pill'
import { Notice, ProductIcon, humanStatus, productLabel } from '@/components/admin/booking-resolution/shared'
import { HeldRefundSheet, HistorySheet, ResolveSheet } from '@/components/admin/vip/item-sheets'
import { ReleasePanel } from '@/components/admin/vip/release-panel'
import {
  VipStatusPill,
  clubLabel,
  eurText,
  instantText,
  matchDateText,
  moneyText,
  vipStatusLabel,
} from '@/components/admin/vip/shared'
import { extractApiMessage } from '@/features/admin/hooks'
import { VIP_ADMIN_ENDPOINT, VIP_ADMIN_MOCK } from '@/features/admin/vip/api'
import { useVipPackage } from '@/features/admin/vip/hooks'
import type { VipAdminItem, VipAdminPackage, VipAuditRow } from '@/features/admin/vip/types'
import { cn } from '@/lib/utils'
import { Routes } from '@/routes'

/* One VIP package (Admin API contract §4–§6). Internal statuses are shown;
 * supplier names and order ids here are staff-only. */

type Opened = { kind: 'resolve' | 'refund' | 'history'; item: VipAdminItem } | null

const HELD_REASON = /^Paid items were found held on a package marked/i

export default function VipPackageClient({ id }: { id: string }) {
  const { openNav } = useAdminNav()
  const query = useVipPackage(id)
  const pkg = query.data?.data

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'VIP packages', id.slice(-8)]}
        title={pkg ? pkg.event_name : 'VIP package'}
        stats={
          pkg
            ? [
                { label: vipStatusLabel(pkg.status), ...(pkg.status === 'needs_attention' ? { tone: 'var(--status-danger)' } : {}) },
                { label: clubLabel(pkg.club) },
                { label: `${pkg.quantity} traveller${pkg.quantity === 1 ? '' : 's'}` },
              ]
            : undefined
        }
        onOpenNav={openNav}
      />

      <div className='flex flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]'>
        <Link
          href={Routes.adminVipPackages}
          className='inline-flex w-fit items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-3.5' />
          All VIP packages
        </Link>

        {VIP_ADMIN_MOCK && (
          <Notice tone='warn' title='Sample data'>
            VIP packages run in test mode (NEXT_PUBLIC_VIP_API_MODE=mock). Nothing you do here reaches a customer, a
            supplier or Stripe.
          </Notice>
        )}

        {query.isPending && <p className='m-0 text-[12px] text-muted-foreground'>Loading package…</p>}

        {query.isError && (
          <div className='overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]'>
            <EmptyState
              icon={<TriangleAlert className='size-5 text-destructive' />}
              title='Couldn’t load this package'
              body={extractApiMessage(query.error)}
              action={
                <div className='flex flex-col items-center gap-2.5'>
                  <code className='rounded-md bg-muted px-2 py-1 font-mono text-[10.5px] text-muted-foreground'>
                    GET {VIP_ADMIN_ENDPOINT}/{id}
                  </code>
                  <AdminButton variant='outline' size='sm' onClick={() => query.refetch()}>
                    <RefreshCw className='size-3' />
                    Retry
                  </AdminButton>
                </div>
              }
            />
          </div>
        )}

        {pkg && <PackageBody pkg={pkg} />}
      </div>
    </>
  )
}

function PackageBody({ pkg }: { pkg: VipAdminPackage }) {
  const [opened, setOpened] = useState<Opened>(null)
  const cs = pkg.ticket_confirmed_by_cs
  const needsAttention = pkg.status === 'needs_attention'

  return (
    <>
      {/* ── Banners ── */}
      {cs.confirmed && (
        <Notice tone='warn' title={cs.warning ?? 'The ticket was confirmed by CS outside the system.'}>
          Confirmed by admin #{cs.admin_id ?? '—'} on {instantText(cs.at)}
          {cs.ftn_order_reference && (
            <>
              {' '}
              · supplier reference <span className='font-mono'>{cs.ftn_order_reference}</span>
            </>
          )}
          . The ticket order itself was not changed, so it may still read failed.
        </Notice>
      )}

      {needsAttention && (
        <Notice tone='danger' title={`Needs attention: ${pkg.attention_reason ?? 'no reason given'}`}>
          Since {instantText(pkg.attention_at)}. Held items stay held until CS releases or refunds them. Nothing is
          refunded automatically.
          {pkg.attention_reason && HELD_REASON.test(pkg.attention_reason) && (
            <p className='m-0 mt-1 font-semibold'>
              Paid items were found on a package that looked unpaid. The ticket order may be fine: check it below before
              doing anything.
            </p>
          )}
        </Notice>
      )}

      {needsAttention && pkg.ticket_secured_alert_sent_at && pkg.held_items > 0 && (
        <Notice tone='info' title='The ticket has now secured'>
          The flight, hotel and eSIM are still held and not booked. Check the package, then Release before buying another
          ticket or refunding anything.
        </Notice>
      )}

      <div className='grid items-start gap-3 lg:grid-cols-2'>
        {/* ── Package ── */}
        <Panel title='Package' subtitle={pkg.id}>
          <SheetFacts
            facts={[
              ['Status', <VipStatusPill key='s' status={pkg.status} />],
              ['Club', clubLabel(pkg.club)],
              ['Match', pkg.event_name],
              ['Kick-off', `${matchDateText(pkg.event_date)} (Spain)`],
              ['Event id', <span key='e' className='font-mono'>{pkg.event_id}</span>],
              ['Travellers', String(pkg.quantity)],
              ['Mode', pkg.mode === 'flexible' ? 'Flexible (ticket only required)' : 'Package (ticket, flight, hotel)'],
              ['Flies from', pkg.departure_iata ?? '—'],
              ['Return flight', pkg.return_included ? 'Yes' : 'No'],
              ['Hotel nights', pkg.hotel_nights != null ? String(pkg.hotel_nights) : '—'],
              ...(pkg.hotel_check_in ? [['Hotel check-in (chosen, no flight)', pkg.hotel_check_in] as [string, string]] : []),
              ['Customer', pkg.user_id ? `User #${pkg.user_id}` : 'Guest'],
              ['Stripe session', <span key='st' className='break-all font-mono text-[11px]'>{pkg.stripe_checkout_session_id ?? '—'}</span>],
            ]}
          />
        </Panel>

        {/* ── Timeline / alerts ── */}
        <Panel title='Timeline'>
          <SheetFacts
            facts={[
              ['Created', instantText(pkg.created_at)],
              ['Paid', instantText(pkg.paid_at)],
              ['Ticket secured', instantText(pkg.ticket_secured_at)],
              ['Completed', instantText(pkg.completed_at)],
              ['Closed', instantText(pkg.closed_at)],
              [
                'Attention',
                pkg.attention_reason ? (
                  <span key='a' className={cn(needsAttention ? 'text-status-danger' : 'text-muted-foreground')}>
                    {pkg.attention_reason} · {instantText(pkg.attention_at)}
                    {!needsAttention && ' (earlier)'}
                  </span>
                ) : (
                  '—'
                ),
              ],
              [
                'CS alerted',
                pkg.attention_alert_sent_at ? (
                  instantText(pkg.attention_alert_sent_at)
                ) : needsAttention ? (
                  <span key='al' className='font-semibold text-status-danger'>Not sent</span>
                ) : (
                  '—'
                ),
              ],
              ['Delay email', pkg.delay_email_sent_at ? instantText(pkg.delay_email_sent_at) : 'Not sent'],
              ['Late-secure alert', pkg.ticket_secured_alert_sent_at ? instantText(pkg.ticket_secured_alert_sent_at) : '—'],
            ]}
          />
        </Panel>

        {/* ── Match ticket order ── */}
        <Panel
          title='Match ticket order'
          action={
            pkg.order ? (
              <Link href={Routes.adminMatchTicket(pkg.order.id)} className='text-[11px] font-medium text-foreground hover:underline'>
                Open order #{pkg.order.id}
              </Link>
            ) : undefined
          }
        >
          {pkg.order ? (
            <SheetFacts
              facts={[
                ['Order', `#${pkg.order.id}`],
                ['Status', <StatusPill key='s' label={humanStatus(pkg.order.status)} />],
                ['Payment', <StatusPill key='p' label={humanStatus(pkg.order.payment_status)} />],
                ['Supplier order', <span key='f' className='font-mono'>{pkg.order.ftn_order_id ?? 'None yet'}</span>],
                ['Paid', <span key='a' className='font-mono tabular-nums'>{moneyText(pkg.order.amount_paid, pkg.order.currency)}</span>],
                [
                  'EUR',
                  <span key='e' className='font-mono tabular-nums'>
                    {eurText(pkg.order.eur.total)}
                    <span className='text-muted-foreground'>
                      {' '}
                      (cost {eurText(pkg.order.eur.cost)} · markup {eurText(pkg.order.eur.markup)})
                    </span>
                  </span>,
                ],
              ]}
            />
          ) : (
            <p className='m-0 text-[11.5px] text-muted-foreground'>No ticket order exists for this package.</p>
          )}
          <p className='m-0 mt-2.5 text-[10.5px] leading-relaxed text-muted-foreground'>
            The match ticket can’t be refunded from the admin. A developer refunds it (matchday:refund-order), only once
            the supplier confirms no order exists. The supplier order id is internal: never share it with the customer.
          </p>
        </Panel>

        <ReleasePanel pkg={pkg} />
      </div>

      {/* ── Items ── */}
      <Panel
        title='Flight, hotel and eSIM'
        subtitle={`${pkg.items.length} item${pkg.items.length === 1 ? '' : 's'} · ${pkg.held_items} held · ${pkg.items_with_cs} with CS · package total ${eurText(pkg.eur_total)}`}
      >
        {pkg.items.length === 0 ? (
          <p className='m-0 text-[11.5px] text-muted-foreground'>Nothing paid yet. Earlier attempts are listed below.</p>
        ) : (
          <ul className='m-0 flex list-none flex-col p-0'>
            {pkg.items.map((item) => (
              <ItemRow key={item.ledger_id} item={item} onOpen={(kind) => setOpened({ kind, item })} />
            ))}
          </ul>
        )}
      </Panel>

      <div className='grid items-start gap-3 lg:grid-cols-2'>
        <Panel title='Audit trail' subtitle='Newest first · Release actions and every item’s history'>
          <AuditList rows={pkg.audit} items={pkg.items} />
        </Panel>

        <Panel title='Earlier payment attempts' subtitle='For the audit trail only: never items, never in the totals'>
          {pkg.earlier_checkouts.length === 0 ? (
            <p className='m-0 text-[11.5px] text-muted-foreground'>None.</p>
          ) : (
            <ul className='m-0 flex list-none flex-col gap-1.5 p-0'>
              {pkg.earlier_checkouts.map((c) => (
                <li key={c.id} className='flex flex-wrap items-center justify-between gap-2 text-[11.5px]'>
                  <span>
                    <span className='font-medium'>{productLabel(c.type)}</span>{' '}
                    <span className='font-mono text-[10.5px] text-muted-foreground'>#{c.id}</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <StatusPill label={humanStatus(c.status)} />
                    <StatusPill label={humanStatus(c.payment_status)} />
                    <span className='font-mono text-[10.5px] text-muted-foreground'>{instantText(c.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {opened?.kind === 'resolve' && <ResolveSheet item={opened.item} pkg={pkg} onClose={() => setOpened(null)} />}
      {opened?.kind === 'refund' && <HeldRefundSheet item={opened.item} onClose={() => setOpened(null)} />}
      {opened?.kind === 'history' && <HistorySheet item={opened.item} onClose={() => setOpened(null)} />}
    </>
  )
}

function ItemRow({ item, onOpen }: { item: VipAdminItem; onOpen: (kind: 'resolve' | 'refund' | 'history') => void }) {
  const a = item.actions
  const canResolve = item.with_cs && (a.attach_booking.available || a.manual_booking.available || a.retry.available || a.refund.available)
  const canRefundHeld = item.held && a.refund.available

  return (
    <li className='flex flex-col gap-2 border-b border-[var(--edge)] py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-start gap-2.5'>
        <ProductIcon product={item.product} className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
        <div className='min-w-0'>
          <p className='m-0 flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold'>
            {productLabel(item.product)}
            <span className='font-mono text-[10.5px] font-normal text-muted-foreground'>{item.reference}</span>
            {item.with_cs && <StatusPill label='with CS' tone='danger' />}
            {item.held && <StatusPill label='held' tone='warn' />}
            {item.resolution && (
              <StatusPill label={item.resolution} tone={item.resolution === 'rebooked' ? 'good' : 'warn'} />
            )}
          </p>
          <p className='m-0 mt-0.5 text-[11px] text-muted-foreground'>
            <span className='font-mono'>{item.status}</span> · customer sees <b>{humanStatus(item.customer_status)}</b> ·
            payment {humanStatus(item.payment_status)}
            {item.action_required_at && <> · raised {instantText(item.action_required_at)}</>}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 flex-wrap items-center gap-2 sm:justify-end'>
        <span className='mr-1 text-right'>
          <span className='block font-mono text-[12px] tabular-nums'>{eurText(item.eur.total)}</span>
          <span className='block text-[10.5px] text-muted-foreground'>{moneyText(item.amount_paid, item.currency)}</span>
        </span>
        {canResolve && (
          <AdminButton size='sm' onClick={() => onOpen('resolve')}>
            Resolve
          </AdminButton>
        )}
        {canRefundHeld && (
          <AdminButton size='sm' variant='outline' onClick={() => onOpen('refund')}>
            Refund held…
          </AdminButton>
        )}
        {a.history.available && (
          <AdminButton size='sm' variant='ghost' onClick={() => onOpen('history')}>
            History
          </AdminButton>
        )}
      </div>
    </li>
  )
}

const AUDIT_LABEL: Record<string, string> = {
  release: 'Released',
  release_cs_confirmed: 'Released (ticket bought by hand)',
  note: 'Note',
  rebooked: 'Rebooking attached',
  manual_booking: 'Entered by hand',
  retry: 'Retried',
  refund: 'Refunded',
  refund_failed: 'Refund failed',
  attach_refused: 'Attach refused',
  action_refused: 'Action refused',
}

function AuditList({ rows, items }: { rows: VipAuditRow[]; items: VipAdminItem[] }) {
  if (!rows.length) return <p className='m-0 text-[11.5px] text-muted-foreground'>No actions yet.</p>
  const refOf = (ledgerId: number | null) => items.find((i) => i.ledger_id === ledgerId)?.reference
  return (
    <ol className='m-0 flex list-none flex-col gap-2.5 p-0'>
      {rows.map((r, i) => (
        <li key={`${r.created_at}-${i}`} className='flex gap-2.5 text-[11.5px]'>
          <span
            className={cn(
              'mt-[5px] size-[7px] shrink-0 rounded-full',
              r.source === 'package' ? 'bg-status-info' : 'bg-muted-foreground',
            )}
          />
          <div className='min-w-0'>
            <p className='m-0'>
              <span className='font-semibold'>{AUDIT_LABEL[r.action] ?? humanStatus(r.action)}</span>{' '}
              <span className='text-muted-foreground'>
                {r.source === 'package' ? 'package' : (refOf(r.ledger_id) ?? `item #${r.ledger_id}`)} · admin #
                {r.admin_id ?? '—'} · {instantText(r.created_at)}
              </span>
            </p>
            {r.reference && <p className='m-0 font-mono text-[10.5px] text-muted-foreground'>ref {r.reference}</p>}
            {r.note && <p className='m-0 mt-0.5 break-words text-foreground/80'>“{r.note}”</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
