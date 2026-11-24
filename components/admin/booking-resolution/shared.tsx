'use client'

import { BedDouble, CircleAlert, CircleCheck, Plane, Signal, Smartphone, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ActionRequiredRow,
  ActionResult,
  ResolutionHistoryItem,
} from '@/features/admin/booking-resolution/types'

/* Small pieces shared by the booking-resolution queue, sheet and panels. */

export const PRODUCT_LABEL: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  esim: 'eSIM',
  esim_topup: 'eSIM top-up',
  ticket: 'Match ticket',
}

export const productLabel = (p: string) => PRODUCT_LABEL[p] ?? p

export function ProductIcon({ product, className }: { product: string; className?: string }) {
  const Icon =
    product === 'flight'
      ? Plane
      : product === 'hotel'
        ? BedDouble
        : product === 'esim_topup'
          ? Signal
          : product === 'ticket'
            ? Ticket
            : Smartphone
  return <Icon className={cn('size-3.5', className)} />
}

/** CS is reminded every 30 minutes; past 2 hours a row is overdue. */
export const OVERDUE_MINUTES = 120

export const isOverdue = (row: ActionRequiredRow) =>
  row.minutes_since_action_required >= OVERDUE_MINUTES

/** 187 → "3h 07m", 34 → "34m". */
export function waitingText(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ${String(m % 60).padStart(2, '0')}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

/** What the customer's account list is showing while CS has it (§1.1). The
 *  list row carries no customer_status, so derive it; every action response
 *  then gives the real one in data.ledger. */
export const customerStatusWhileWithCs = (product: string) =>
  product === 'esim' || product === 'esim_topup' ? 'processing' : 'needs_reconciliation'

export const humanStatus = (s: string | null | undefined) => (s ? s.replace(/_/g, ' ') : '—')

export const shortDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

/* ── Notices ─────────────────────────────────────────────────────────── */

type NoticeTone = 'info' | 'warn' | 'danger' | 'good'

const NOTICE_TONE: Record<NoticeTone, string> = {
  info: 'bg-status-info-bg text-status-info',
  warn: 'bg-status-warn-bg text-status-warn',
  danger: 'bg-status-danger-bg text-status-danger',
  good: 'bg-status-good-bg text-status-good',
}

export function Notice({
  tone,
  title,
  children,
  className,
}: {
  tone: NoticeTone
  title?: string
  children?: React.ReactNode
  className?: string
}) {
  const Icon = tone === 'good' ? CircleCheck : CircleAlert
  return (
    <div className={cn('flex items-start gap-2 rounded-md px-3 py-2.5 text-[11.5px] leading-relaxed', NOTICE_TONE[tone], className)}>
      <Icon className='mt-0.5 size-3.5 shrink-0' />
      <div className='min-w-0'>
        {title && <p className='m-0 font-semibold'>{title}</p>}
        {children && <div className={cn('text-foreground/85', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}

/** A list of plain sentences from the API, shown as written. */
export function SentenceList({ items, mono }: { items: string[]; mono?: boolean }) {
  if (!items.length) return null
  return (
    <ul className={cn('m-0 mt-1 list-disc space-y-0.5 pl-4', mono && 'font-mono text-[11px]')}>
      {items.map((t) => (
        <li key={t} className='break-words'>
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Renders an action's outcome: the preview, a refusal (with differences) or
 *  a provider failure. "done" is handled by the sheet (it closes the panel). */
export function OutcomeBlock({ result }: { result: ActionResult }) {
  const hard = result.differences?.hard ?? []
  const soft = result.differences?.soft ?? []

  if (result.outcome === 'report') {
    return (
      <Notice tone='info' title='Preview: nothing has changed yet'>
        {result.supplier_id && (
          <p className='m-0'>
            Supplier booking found: <span className='font-mono'>{result.supplier_id}</span>
            {result.cost && (
              <>
                {' '}· cost <span className='font-mono'>{result.cost.amount} {result.cost.currency}</span>
              </>
            )}
          </p>
        )}
        {hard.length === 0 && soft.length === 0 && result.differences && (
          <p className='m-0'>Names match and there are no differences.</p>
        )}
        {soft.length > 0 && (
          <>
            <p className='m-0 mt-1 font-semibold'>Accepted differences (the booking record will be rewritten):</p>
            <SentenceList items={soft} mono />
          </>
        )}
        <SentenceList items={result.details ?? []} />
        <p className='m-0 mt-1.5'>Check it, then press Confirm.</p>
      </Notice>
    )
  }

  if (result.outcome === 'refused') {
    return (
      <Notice tone='warn' title='Refused: nothing was changed'>
        {result.reason && <p className='m-0'>{result.reason}</p>}
        {hard.length > 0 && (
          <>
            <p className='m-0 mt-1.5 font-semibold'>Hard differences (no override):</p>
            <SentenceList items={hard} mono />
          </>
        )}
        {soft.length > 0 && (
          <>
            <p className='m-0 mt-1.5 font-semibold'>Soft differences:</p>
            <SentenceList items={soft} mono />
          </>
        )}
      </Notice>
    )
  }

  if (result.outcome === 'failed') {
    return (
      <Notice tone='danger' title='The action ran but did not succeed'>
        {result.reason && <p className='m-0 font-medium'>{result.reason}</p>}
        <p className='m-0 mt-1'>The booking is back with CS.</p>
      </Notice>
    )
  }

  return null
}

/* ── History ─────────────────────────────────────────────────────────── */

const ACTION_LABEL: Record<string, string> = {
  rebooked: 'Rebooked (attached)',
  manual_booking: 'Entered by hand',
  retry: 'Retried',
  refund: 'Refunded',
  refund_failed: 'Refund failed',
  attach_refused: 'Attach refused',
  action_refused: 'Action refused',
}

const ACTION_TONE: Record<string, string> = {
  rebooked: 'bg-status-good',
  manual_booking: 'bg-status-good',
  retry: 'bg-status-info',
  refund: 'bg-status-warn',
  refund_failed: 'bg-status-danger',
  attach_refused: 'bg-muted-foreground',
  action_refused: 'bg-muted-foreground',
}

export function HistoryList({ items }: { items: ResolutionHistoryItem[] }) {
  if (!items.length) {
    return <p className='m-0 text-[11.5px] text-muted-foreground'>No actions yet.</p>
  }
  return (
    <ol className='m-0 flex list-none flex-col gap-2.5 p-0'>
      {items.map((h) => (
        <li key={h.id} className='flex gap-2.5 text-[11.5px]'>
          <span className={cn('mt-[5px] size-[7px] shrink-0 rounded-full', ACTION_TONE[h.action] ?? 'bg-muted-foreground')} />
          <div className='min-w-0'>
            <p className='m-0'>
              <span className='font-semibold'>{ACTION_LABEL[h.action] ?? humanStatus(h.action)}</span>{' '}
              <span className='text-muted-foreground'>by {h.operator} · {shortDateTime(h.created_at)}</span>
            </p>
            {(h.reference || h.stripe_refund_id || h.amount_minor != null) && (
              <p className='m-0 font-mono text-[10.5px] text-muted-foreground'>
                {[
                  h.reference && `ref ${h.reference}`,
                  h.stripe_refund_id && `stripe ${h.stripe_refund_id}`,
                  h.amount_minor != null && `${(h.amount_minor / 100).toFixed(2)} ${h.currency ?? ''}`.trim(),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {h.note && <p className='m-0 mt-0.5 break-words text-foreground/80'>“{h.note}”</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
