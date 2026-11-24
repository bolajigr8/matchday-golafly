'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SheetFacts, SheetSection, SheetShell } from '@/components/admin/sheet-shell'
import { StatusPill } from '@/components/admin/status-pill'
import { AdminButton } from '@/components/admin/admin-ui'
import { useLedgerActions } from '@/features/admin/booking-resolution/hooks'
import type {
  ActionRequiredRow,
  ActionResult,
  ResolutionAction,
  ResolutionLedger,
} from '@/features/admin/booking-resolution/types'
import { formatAmountString } from '@/lib/money'
import { cn } from '@/lib/utils'
import { AttachPanel, ManualPanel, RefundPanel, RetryPanel } from './action-panels'
import {
  HistoryList,
  Notice,
  customerStatusWhileWithCs,
  humanStatus,
  isOverdue,
  productLabel,
  shortDateTime,
  waitingText,
} from './shared'

/* One booking waiting on CS (contract §2.3 "Booking detail"): the facts,
 * what the customer is seeing, the action panels, then the history.
 * After any "done" the sheet redraws from data.ledger — no extra call. */

const DONE_TEXT: Record<ResolutionAction, string> = {
  attach: 'Booking attached. The customer gets the normal confirmation email.',
  manual: 'Details saved. The customer gets a confirmation email with them.',
  retry: 'eSIM order queued again. If it fails, the booking comes back to the queue.',
  refund: 'Refund sent. The customer is emailed once.',
}

const isEsim = (p: string) => p === 'esim' || p === 'esim_topup'

export function BookingSheet({ row, onClose }: { row: ActionRequiredRow; onClose: () => void }) {
  const history = useLedgerActions(row.ledger_id)
  const [ledger, setLedger] = useState<ResolutionLedger | null>(null)
  const [done, setDone] = useState<ResolutionAction | null>(null)
  const [action, setAction] = useState<ResolutionAction>('attach')
  /* Someone else holds the claim: warn, and only unlock after an explicit OK. */
  const [overrideClaim, setOverrideClaim] = useState(false)

  const claimed = !!row.claim?.active
  const disabled = row.job_running || (claimed && !overrideClaim)
  const resolved = done !== null || (ledger ? !ledger.with_cs : false)
  const customerStatus = ledger?.customer_status ?? customerStatusWhileWithCs(row.product)

  const onDone = (result: ActionResult, act: ResolutionAction) => {
    setLedger(result.ledger)
    setDone(act)
    toast.success(DONE_TEXT[act])
  }

  const ACTIONS: { key: ResolutionAction; label: string; show: boolean }[] = [
    { key: 'attach', label: 'Attach booking', show: true },
    { key: 'manual', label: 'Enter by hand', show: true },
    { key: 'retry', label: 'Retry', show: isEsim(row.product) },
    { key: 'refund', label: 'Refund', show: true },
  ]

  const panelProps = { row, disabled, onDone, onSwitch: setAction }

  return (
    <SheetShell
      wide
      title={`${productLabel(row.product)} · ${row.reference}`}
      subtitle={row.customer_email}
      onClose={onClose}
    >
      <SheetSection title='Booking'>
        <SheetFacts
          facts={[
            ['Reference', <span key='r' className='font-mono'>{row.reference}</span>],
            ['Product', productLabel(row.product)],
            ['Customer', row.customer_email],
            ['Paid', <span key='a' className='font-mono tabular-nums'>{formatAmountString(row.amount, row.currency)}</span>],
            ['Status', <span key='s' className='font-mono text-[11px]'>{ledger?.status ?? row.status}</span>],
            ['Customer sees', <StatusPill key='c' label={humanStatus(customerStatus)} />],
            ...(ledger?.resolution
              ? ([['Resolution', <StatusPill key='res' label={ledger.resolution} tone={ledger.resolution === 'rebooked' ? 'good' : 'warn'} />]] as [string, React.ReactNode][])
              : []),
            [
              'Waiting',
              <span key='w' className={cn('font-mono tabular-nums', isOverdue(row) && 'font-semibold text-status-danger')}>
                {waitingText(row.minutes_since_action_required)}
                {isOverdue(row) && ' · overdue'}
              </span>,
            ],
            ['Raised', shortDateTime(row.action_required_at)],
            ['CS alerted', row.action_alert_sent_at ? shortDateTime(row.action_alert_sent_at) : <span key='al' className='font-semibold text-status-danger'>Not sent</span>],
            ['Delay email', row.delay_email_sent_at ? shortDateTime(row.delay_email_sent_at) : 'Not sent'],
          ]}
        />
      </SheetSection>

      <SheetSection title='Why it failed (staff only)'>
        <p className='m-0 text-[12px] leading-relaxed'>{row.reason ?? '—'}</p>
        <p className='m-0 mt-1 text-[10.5px] text-muted-foreground'>Never share this text with the customer.</p>
      </SheetSection>

      <SheetSection title='Resolve'>
        {resolved ? (
          <Notice tone='good' title={done ? DONE_TEXT[done] : 'This booking is no longer waiting on CS.'}>
            {ledger && (
              <p className='m-0'>
                Customer now sees <b>{humanStatus(ledger.customer_status)}</b>
                {ledger.resolution && <> · resolution <b>{ledger.resolution}</b></>}
                {ledger.payment_status !== 'paid' && <> · payment <b>{humanStatus(ledger.payment_status)}</b></>}.
              </p>
            )}
          </Notice>
        ) : (
          <div className='flex flex-col gap-3'>
            {row.job_running && (
              <Notice tone='info' title='An automatic booking attempt may still be running'>
                All actions are paused for this booking. It clears itself within 15 minutes.
              </Notice>
            )}
            {claimed && !row.job_running && (
              <Notice tone='warn' title={`Being handled by ${row.claim!.by} since ${shortDateTime(row.claim!.since)}`}>
                {overrideClaim ? (
                  <p className='m-0'>You chose to act anyway. Check with them first if you can.</p>
                ) : (
                  <AdminButton variant='outline' size='sm' className='mt-1.5' onClick={() => setOverrideClaim(true)}>
                    Act anyway
                  </AdminButton>
                )}
              </Notice>
            )}

            {/* Action picker: Attach first (the usual fix), Refund last. */}
            <div role='tablist' aria-label='Resolve action' className='flex flex-wrap gap-1 rounded-lg bg-muted p-1'>
              {ACTIONS.filter((a) => a.show).map((a) => (
                <button
                  key={a.key}
                  type='button'
                  role='tab'
                  aria-selected={action === a.key}
                  onClick={() => setAction(a.key)}
                  className={cn(
                    'flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors',
                    action === a.key
                      ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--edge)]'
                      : 'text-muted-foreground hover:text-foreground',
                    a.key === 'refund' && action === a.key && 'text-destructive',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* key: switching action starts that panel fresh. */}
            {action === 'attach' && <AttachPanel key='attach' {...panelProps} />}
            {action === 'manual' && <ManualPanel key='manual' {...panelProps} />}
            {action === 'retry' && isEsim(row.product) && <RetryPanel key='retry' {...panelProps} />}
            {action === 'refund' && <RefundPanel key='refund' {...panelProps} />}
          </div>
        )}
      </SheetSection>

      <SheetSection title='History'>
        {history.isPending ? (
          <p className='m-0 text-[11.5px] text-muted-foreground'>Loading…</p>
        ) : history.isError ? (
          <p className='m-0 text-[11.5px] text-destructive'>Couldn’t load the history.</p>
        ) : (
          <HistoryList items={history.data?.data ?? []} />
        )}
      </SheetSection>
    </SheetShell>
  )
}
