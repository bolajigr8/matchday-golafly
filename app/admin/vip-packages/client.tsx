'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useAdminNav } from '@/components/admin/admin-nav-context'
import { AdminButton } from '@/components/admin/admin-ui'
import type { Column } from '@/components/admin/data-table'
import { Field, SelectInput, TextInput } from '@/components/admin/form-controls'
import { QueryTable } from '@/components/admin/query-table'
import { Notice } from '@/components/admin/booking-resolution/shared'
import { VipSettingsPanel } from '@/components/admin/vip/settings-panel'
import { VipStatusPill, clubLabel, instantText, matchDateText, vipStatusLabel } from '@/components/admin/vip/shared'
import { VIP_ADMIN_ENDPOINT, VIP_ADMIN_MOCK } from '@/features/admin/vip/api'
import { useVipPackages } from '@/features/admin/vip/hooks'
import {
  VIP_ADMIN_CLUBS,
  VIP_ADMIN_STATUSES,
  type VipAdminListFilters,
  type VipAdminPackageRow,
  type VipAdminStatus,
} from '@/features/admin/vip/types'
import { cn } from '@/lib/utils'
import { Routes } from '@/routes'

/* VIP packages (Admin API contract §3): newest first, needs_attention
 * highlighted. Opening a row goes to the package page (Release, items,
 * held refunds, audit). */

const PER_PAGE = 25

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...VIP_ADMIN_STATUSES.map((s) => ({ value: s, label: vipStatusLabel(s) })),
]
const CLUB_OPTIONS = [{ value: 'all', label: 'All clubs' }, ...VIP_ADMIN_CLUBS.map((c) => ({ value: c, label: clubLabel(c) }))]

const COLUMNS: Column<VipAdminPackageRow>[] = [
  {
    key: 'package',
    label: 'Package',
    nowrap: true,
    render: (r) => (
      <span className='block'>
        <span className='block font-mono text-[11px]'>{r.id.slice(-8)}</span>
        <span className='block text-[10.5px] text-muted-foreground'>{clubLabel(r.club)}</span>
      </span>
    ),
  },
  { key: 'status', label: 'Status', nowrap: true, render: (r) => <VipStatusPill status={r.status} /> },
  {
    key: 'mode',
    label: 'Mode',
    nowrap: true,
    render: (r) => (
      <span className='font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground'>{r.mode ?? 'package'}</span>
    ),
  },
  {
    key: 'match',
    label: 'Match',
    width: '240px',
    truncate: true,
    render: (r) => (
      <span className='block min-w-0' title={r.event_name}>
        <span className='block truncate font-medium'>{r.event_name}</span>
        <span className='block text-[10.5px] text-muted-foreground'>{matchDateText(r.event_date)}</span>
      </span>
    ),
  },
  { key: 'qty', label: 'Travellers', numeric: true, render: (r) => r.quantity },
  {
    key: 'attention',
    label: 'Attention',
    width: '260px',
    render: (r) =>
      r.attention_reason ? (
        <span className='block'>
          <span className={cn('block text-[11.5px]', r.status === 'needs_attention' && 'font-medium text-status-danger')}>
            {r.attention_reason}
          </span>
          <span className='block text-[10.5px] text-muted-foreground'>
            {r.status === 'needs_attention' ? instantText(r.attention_at) : `Earlier · ${instantText(r.attention_at)}`}
          </span>
        </span>
      ) : (
        <span className='text-[11px] text-muted-foreground'>—</span>
      ),
  },
  {
    key: 'held',
    label: 'Held / with CS',
    nowrap: true,
    render: (r) => (
      <span className='font-mono text-[11.5px] tabular-nums'>
        {r.held_items} <span className='text-muted-foreground'>/</span>{' '}
        <span className={cn(r.items_with_cs > 0 && 'font-semibold text-status-danger')}>{r.items_with_cs}</span>
      </span>
    ),
  },
  { key: 'paid', label: 'Paid', numeric: true, nowrap: true, render: (r) => instantText(r.paid_at) },
]

export default function VipPackagesClient() {
  const { openNav } = useAdminNav()
  const router = useRouter()
  const [status, setStatus] = useState<VipAdminStatus | 'all'>('all')
  const [club, setClub] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const filters: VipAdminListFilters = {
    status: status === 'all' ? '' : status,
    club: club === 'all' ? undefined : club,
    from_date: from || undefined,
    to_date: to || undefined,
    page,
    per_page: PER_PAGE,
  }
  const query = useVipPackages(filters)
  const meta = query.data?.meta
  const rows = query.data?.data ?? []
  const attention = rows.filter((r) => r.status === 'needs_attention').length
  const filtered = status !== 'all' || club !== 'all' || !!from || !!to
  const badRange = !!from && !!to && to < from

  const resetPage =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setPage(1)
    }

  return (
    <>
      <AdminPageHeader
        crumbs={['Dashboard', 'VIP packages']}
        title='VIP packages'
        stats={
          meta
            ? [
                { label: `${meta.total} package${meta.total === 1 ? '' : 's'}` },
                ...(attention > 0
                  ? [
                      {
                        label: `${attention} need${attention === 1 ? 's' : ''} attention${meta.last_page > 1 ? ' on this page' : ''}`,
                        tone: 'var(--status-danger)',
                      },
                    ]
                  : []),
              ]
            : undefined
        }
        onOpenNav={openNav}
      />

      <div className='flex flex-1 flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]'>
        {VIP_ADMIN_MOCK && (
          <Notice tone='warn' title='Sample data'>
            VIP packages run in test mode (NEXT_PUBLIC_VIP_API_MODE=mock), so this screen uses the contract’s example
            package. Nothing you do here reaches a customer, a supplier or Stripe.
          </Notice>
        )}

        <VipSettingsPanel />

        <p className='m-0 max-w-[80ch] text-[12px] leading-relaxed text-muted-foreground'>
          A VIP package is one match ticket plus a flight, a hotel and an optional eSIM (in flexible mode only the
          ticket is required), paid in one payment. After
          payment the flight, hotel and eSIM wait until the ticket is secured. Nothing is refunded automatically: when
          something goes wrong the package needs attention and CS finishes it. Newest first; refreshes every minute.
        </p>

        <div className='flex flex-wrap items-end gap-2.5'>
          <Field label='Status' className='w-[170px]'>
            <SelectInput
              value={status}
              onChange={(v) => resetPage(setStatus)(v as VipAdminStatus | 'all')}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label='Club' className='w-[170px]'>
            <SelectInput value={club} onChange={resetPage(setClub)} options={CLUB_OPTIONS} />
          </Field>
          <Field label='Created from' className='w-[150px]'>
            <TextInput type='date' value={from} onChange={resetPage(setFrom)} />
          </Field>
          <Field label='Created to' className='w-[150px]' error={badRange ? 'Before the start date' : undefined}>
            <TextInput type='date' value={to} onChange={resetPage(setTo)} error={badRange} />
          </Field>
          {filtered && (
            <AdminButton
              variant='ghost'
              size='sm'
              className='mb-0.5'
              onClick={() => {
                setStatus('all')
                setClub('all')
                setFrom('')
                setTo('')
                setPage(1)
              }}
            >
              Clear filters
            </AdminButton>
          )}
          <AdminButton
            variant={status === 'needs_attention' ? 'primary' : 'outline'}
            size='sm'
            className='mb-0.5 ml-auto'
            onClick={() => resetPage(setStatus)(status === 'needs_attention' ? 'all' : 'needs_attention')}
          >
            Needs attention only
          </AdminButton>
        </div>

        <QueryTable
          query={query}
          select={(d) => d.data}
          columns={COLUMNS}
          rowKey={(r) => r.id}
          endpoint={VIP_ADMIN_ENDPOINT}
          onView={(r) => router.push(Routes.adminVipPackage(r.id))}
          pageSize={0}
          emptyTitle={filtered ? 'Nothing matches these filters' : 'No VIP packages yet'}
          emptyBody={
            filtered
              ? 'Try another status, club or date range, or clear the filters.'
              : 'Packages appear here as soon as a customer starts building one.'
          }
        />

        {meta && meta.last_page > 1 && (
          <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
            <span>
              Page {meta.current_page} of {meta.last_page} · {meta.total} packages
            </span>
            <div className='flex gap-2'>
              <AdminButton variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </AdminButton>
              <AdminButton
                variant='outline'
                size='sm'
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </AdminButton>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
