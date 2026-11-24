'use client'

import { useState } from 'react'
import { Clock3, Hand, Loader2, Siren } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton } from '@/components/admin/admin-ui'
import type { Column } from '@/components/admin/data-table'
import { QueryTable } from '@/components/admin/query-table'
import { Field, SelectInput, TextInput } from '@/components/admin/form-controls'
import { BookingSheet } from '@/components/admin/booking-resolution/booking-sheet'
import {
  Notice,
  ProductIcon,
  isOverdue,
  productLabel,
  waitingText,
} from '@/components/admin/booking-resolution/shared'
import { useActionRequired } from '@/features/admin/booking-resolution/hooks'
import { ACTION_REQUIRED_ENDPOINT, USE_MOCK } from '@/features/admin/booking-resolution/api'
import type {
  ActionRequiredFilters,
  ActionRequiredRow,
  ResolutionProduct,
} from '@/features/admin/booking-resolution/types'
import { formatAmountString } from '@/lib/money'
import { cn } from '@/lib/utils'

/* Booking resolution: the CS queue (contract v1.0 §2.3).
 *
 * Paid flight / hotel / eSIM bookings the supplier could not complete are no
 * longer refunded automatically; they land here, oldest first. CS opens one
 * and attaches a rebooking, enters it by hand, retries (eSIM) or, as a last
 * resort, refunds. Match tickets join when the follow-up contract lands. */

const PER_PAGE = 25

const PRODUCT_OPTIONS: { value: ResolutionProduct | 'all'; label: string }[] = [
  { value: 'all', label: 'All products' },
  { value: 'flight', label: 'Flights' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'esim', label: 'eSIMs' },
  { value: 'esim_topup', label: 'eSIM top-ups' },
]

const COLUMNS: Column<ActionRequiredRow>[] = [
  {
    key: 'booking',
    label: 'Booking',
    render: (r) => (
      <span className={cn('flex min-w-0 items-center gap-2.5', r.job_running && 'opacity-50')}>
        <span className='flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground shadow-[0_0_0_1px_var(--edge)]'>
          <ProductIcon product={r.product} />
        </span>
        <span className='min-w-0'>
          <span className='flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] font-semibold leading-tight'>
            {/* Red marker: CS was never alerted about this one. */}
            {!r.action_alert_sent_at && (
              <span title='CS alert not sent' className='size-[7px] shrink-0 rounded-full bg-status-danger' />
            )}
            {r.reference}
          </span>
          <span className='mt-px block truncate text-[11px] text-muted-foreground'>{productLabel(r.product)}</span>
        </span>
      </span>
    ),
  },
  {
    key: 'customer',
    label: 'Customer',
    width: '200px',
    truncate: true,
    render: (r) => <span title={r.customer_email}>{r.customer_email}</span>,
  },
  {
    key: 'amount',
    label: 'Paid',
    numeric: true,
    render: (r) => formatAmountString(r.amount, r.currency),
  },
  {
    key: 'reason',
    label: 'Reason (staff only)',
    width: '280px',
    truncate: true,
    render: (r) => <span title={r.reason ?? ''}>{r.reason ?? '—'}</span>,
  },
  {
    key: 'waiting',
    label: 'Waiting',
    numeric: true,
    render: (r) => (
      <span className={cn('inline-flex items-center gap-1', isOverdue(r) && 'font-semibold text-status-danger')}>
        {isOverdue(r) && <Siren className='size-3' />}
        {waitingText(r.minutes_since_action_required)}
      </span>
    ),
  },
  {
    key: 'handling',
    label: 'Handling',
    nowrap: true,
    render: (r) =>
      r.job_running ? (
        <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground'>
          <Loader2 className='size-3 animate-spin' />
          Auto attempt running
        </span>
      ) : r.claim?.active ? (
        <span className='inline-flex items-center gap-1 rounded-full bg-status-info-bg px-2 py-0.5 text-[10.5px] font-medium text-status-info'>
          <Hand className='size-3' />
          {r.claim.by}
        </span>
      ) : (
        <span className='text-[11px] text-muted-foreground'>—</span>
      ),
  },
]

export default function ActionRequiredClient() {
  const { openNav } = useAdminNav()
  const [product, setProduct] = useState<ResolutionProduct | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<ActionRequiredRow | null>(null)

  const filters: ActionRequiredFilters = {
    product: product === 'all' ? '' : product,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: PER_PAGE,
  }
  const query = useActionRequired(filters)
  const meta = query.data?.meta
  const rows = query.data?.data ?? []
  const overdue = rows.filter(isOverdue).length
  const filtered = product !== 'all' || !!from || !!to

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'Action required']}
        title='Action required'
        stats={
          meta
            ? [
                { label: `${meta.total} waiting on CS` },
                ...(overdue > 0
                  ? [{ label: `${overdue} overdue (over 2h)${meta.last_page > 1 ? ' on this page' : ''}`, tone: 'var(--status-danger)' }]
                  : []),
              ]
            : undefined
        }
        onOpenNav={openNav}
      />

      <div className='flex flex-1 flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]'>
        {USE_MOCK && (
          <Notice tone='warn' title='Sample data'>
            The booking-resolution API isn’t connected yet, so this screen runs on built-in examples. Nothing you do
            here reaches a customer, a supplier or Stripe. (Switch: USE_MOCK in features/admin/booking-resolution/api.ts.)
          </Notice>
        )}

        <p className='m-0 max-w-[80ch] text-[12px] leading-relaxed text-muted-foreground'>
          Paid bookings the supplier couldn’t complete. The customer has been told we’ll update them within 2 hours.
          Open one to attach a rebooking, enter it by hand, retry an eSIM, or refund as a last resort. Oldest first;
          refreshes every minute.
        </p>

        <div className='flex flex-wrap items-end gap-2.5'>
          <Field label='Product' className='w-[170px]'>
            <SelectInput
              value={product}
              onChange={(v) => resetPage(setProduct)(v as ResolutionProduct | 'all')}
              options={PRODUCT_OPTIONS}
            />
          </Field>
          <Field label='Raised from' className='w-[150px]'>
            <TextInput type='date' value={from} onChange={resetPage(setFrom)} />
          </Field>
          <Field label='Raised to' className='w-[150px]'>
            <TextInput type='date' value={to} onChange={resetPage(setTo)} />
          </Field>
          {filtered && (
            <AdminButton
              variant='ghost'
              size='sm'
              className='mb-0.5'
              onClick={() => {
                setProduct('all')
                setFrom('')
                setTo('')
                setPage(1)
              }}
            >
              Clear filters
            </AdminButton>
          )}
          <span className='mb-1.5 ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground'>
            <Clock3 className='size-3' />
            Overdue after 2 hours · CS reminded every 30 minutes
          </span>
        </div>

        <QueryTable
          query={query}
          select={(d) => d.data}
          columns={COLUMNS}
          rowKey={(r) => String(r.ledger_id)}
          endpoint={ACTION_REQUIRED_ENDPOINT}
          selectedKey={viewing ? String(viewing.ledger_id) : null}
          onView={setViewing}
          pageSize={0}
          emptyTitle={filtered ? 'Nothing matches these filters' : 'Nothing waiting on CS'}
          emptyBody={
            filtered
              ? 'Try another product or date range, or clear the filters.'
              : 'Every paid booking has gone through. New problem bookings appear here automatically.'
          }
        />

        {meta && meta.last_page > 1 && (
          <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
            <span>
              Page {meta.current_page} of {meta.last_page} · {meta.total} bookings
            </span>
            <div className='flex gap-2'>
              <AdminButton variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </AdminButton>
              <AdminButton variant='outline' size='sm' disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      {viewing && <BookingSheet key={viewing.ledger_id} row={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
