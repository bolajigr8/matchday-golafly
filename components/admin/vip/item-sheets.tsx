'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AdminButton } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Field, TextArea } from '@/components/admin/form-controls'
import { SheetFacts, SheetSection, SheetShell } from '@/components/admin/sheet-shell'
import { StatusPill } from '@/components/admin/status-pill'
import { BookingSheet } from '@/components/admin/booking-resolution/booking-sheet'
import {
  HistoryList,
  Notice,
  SentenceList,
  humanStatus,
  productLabel,
} from '@/components/admin/booking-resolution/shared'
import { useActionRequired, useLedgerActions } from '@/features/admin/booking-resolution/hooks'
import type { ActionRequiredRow, ResolutionProduct } from '@/features/admin/booking-resolution/types'
import { extractApiMessage } from '@/features/admin/hooks'
import { useRefundVipItem } from '@/features/admin/vip/hooks'
import type { VipAdminItem, VipAdminPackage, VipRefundResult } from '@/features/admin/vip/types'
import { eurText, moneyText } from './shared'

/* The three things CS can open on one package item:
 *   Resolve  → the Booking resolution sheet (attach / enter by hand /
 *              retry / refund) for an item that failed and is with CS.
 *   Refund   → the held-item refund (Admin contract §6): an item still
 *              waiting for the ticket on a package that needs attention.
 *   History  → the item's own action history. */

/* ── Resolve (with CS) ──────────────────────────────────────────────── */

/** The Booking resolution sheet needs the queue row (customer email, claim,
 *  "auto attempt running"). Look the item up in Action required; if it is
 *  not on the first 100 rows, build the row from the package's own facts. */
export function ResolveSheet({
  item,
  pkg,
  onClose,
}: {
  item: VipAdminItem
  pkg: VipAdminPackage
  onClose: () => void
}) {
  const queue = useActionRequired({ product: item.product as ResolutionProduct, per_page: 100 })
  /* "Now" is taken once, when the sheet opens. */
  const [openedAt] = useState(() => Date.now())
  if (queue.isPending) return null

  const found = queue.data?.data.find((r) => r.ledger_id === item.ledger_id)
  const since = item.action_required_at ? new Date(item.action_required_at).getTime() : openedAt
  const row: ActionRequiredRow = found ?? {
    ledger_id: item.ledger_id,
    product: item.product,
    reference: item.reference,
    customer_email: '—',
    amount: item.amount_paid.toFixed(2),
    amount_paid_minor: Math.round(item.amount_paid * 100),
    currency: item.currency,
    status: item.status,
    reason: pkg.attention_reason,
    action_required_at: item.action_required_at ?? new Date(since).toISOString(),
    minutes_since_action_required: Math.max(0, Math.round((openedAt - since) / 60_000)),
    action_alert_sent_at: pkg.attention_alert_sent_at,
    delay_email_sent_at: pkg.delay_email_sent_at,
    claim: null,
    job_running: false,
  }
  return <BookingSheet key={item.ledger_id} row={row} onClose={onClose} />
}

/* ── Held-item refund ───────────────────────────────────────────────── */

export function HeldRefundSheet({ item, onClose }: { item: VipAdminItem; onClose: () => void }) {
  const mutation = useRefundVipItem()
  const [note, setNote] = useState('')
  const [result, setResult] = useState<VipRefundResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState<string | null>(null)
  const [sure, setSure] = useState(false)
  const [done, setDone] = useState<VipRefundResult | null>(null)

  const send = async (confirm: boolean) => {
    setError(null)
    setNoteError(null)
    try {
      const res = await mutation.mutateAsync({
        ledgerId: item.ledger_id,
        href: item.actions.refund.href,
        body: { note: note.trim() || undefined, confirm },
      })
      if (res.data.outcome === 'done') {
        setDone(res.data)
        setResult(null)
        toast.success('Refund sent. The customer is emailed once.')
      } else {
        setResult(res.data)
      }
    } catch (e) {
      const r = (e as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> | null } } })
        .response
      if (r?.status === 403 && confirm) setForbidden(r.data?.message ?? 'You are not allowed to confirm a refund.')
      else if (r?.status === 422) {
        setNoteError(r.data?.errors?.note?.[0] ?? null)
        setError(r.data?.message ?? 'Some fields are missing or invalid.')
      } else setError(extractApiMessage(e))
    }
  }

  const amount = moneyText(item.amount_paid, item.currency)

  return (
    <SheetShell wide title={`Refund held ${productLabel(item.product).toLowerCase()}`} subtitle={item.reference} onClose={onClose}>
      <SheetSection title='Item'>
        <SheetFacts
          facts={[
            ['Reference', <span key='r' className='font-mono'>{item.reference}</span>],
            ['Product', productLabel(item.product)],
            ['Paid', <span key='p' className='font-mono tabular-nums'>{amount}</span>],
            ['EUR', <span key='e' className='font-mono tabular-nums'>{eurText(item.eur.total)}</span>],
            ['Status', <span key='s' className='font-mono text-[11px]'>{done?.ledger.status ?? item.status}</span>],
            ['Customer sees', <StatusPill key='c' label={humanStatus(done?.ledger.customer_status ?? item.customer_status)} />],
          ]}
        />
      </SheetSection>

      <SheetSection title='Refund'>
        {done ? (
          <Notice tone='good' title='Refund sent. The customer is emailed once.'>
            <p className='m-0'>
              Customer now sees <b>{humanStatus(done.ledger.customer_status)}</b> · resolution{' '}
              <b>{done.ledger.resolution ?? '—'}</b> · payment <b>{humanStatus(done.ledger.payment_status)}</b>.
            </p>
          </Notice>
        ) : (
          <div className='flex flex-col gap-3'>
            <Notice tone='warn' title='This moves money'>
              Nothing was ever booked for this item: it was waiting for the match ticket. Refunding returns its own share
              of the payment ({amount}) through Stripe and emails the customer once. Release the package instead if the
              ticket is secured.
            </Notice>
            <Field label='Note' required help='Required to confirm. Saved in the history.' error={noteError ?? undefined}>
              <TextArea
                value={note}
                onChange={(v) => {
                  setNote(v)
                  setResult(null)
                }}
                rows={2}
                error={!!noteError}
              />
            </Field>
            {result && (
              <Notice
                tone={result.outcome === 'report' ? 'info' : 'danger'}
                title={result.outcome === 'report' ? 'Preview: nothing has changed yet' : result.reason ?? 'Refused; nothing was changed.'}
              >
                {result.details.length > 0 && <SentenceList items={result.details} />}
              </Notice>
            )}
            {forbidden && (
              <Notice tone='danger' title='You are not allowed to confirm refunds'>
                {forbidden}
              </Notice>
            )}
            {error && <Notice tone='danger' title={error} />}
            <div className='flex flex-wrap justify-end gap-2'>
              <AdminButton variant='outline' size='sm' disabled={mutation.isPending} onClick={() => send(false)}>
                {mutation.isPending ? 'Working…' : 'Preview'}
              </AdminButton>
              <AdminButton
                variant='destructive'
                size='sm'
                disabled={mutation.isPending || result?.outcome !== 'report' || !note.trim() || !!forbidden}
                title={result?.outcome === 'report' ? undefined : 'Preview first'}
                onClick={() => setSure(true)}
              >
                Refund…
              </AdminButton>
            </div>
          </div>
        )}
      </SheetSection>

      <ItemHistory ledgerId={item.ledger_id} />

      {sure && (
        <ConfirmDialog
          title={`Refund ${item.reference}?`}
          body={
            <>
              This refunds <b className='font-semibold text-foreground'>{amount}</b> to the customer through Stripe and
              emails them. It cannot be undone.
            </>
          }
          confirmLabel='Refund now'
          onCancel={() => setSure(false)}
          onConfirm={() => {
            setSure(false)
            send(true)
          }}
        />
      )}
    </SheetShell>
  )
}

/* ── History ────────────────────────────────────────────────────────── */

function ItemHistory({ ledgerId }: { ledgerId: number }) {
  const history = useLedgerActions(ledgerId)
  return (
    <SheetSection title='History'>
      {history.isPending ? (
        <p className='m-0 text-[11.5px] text-muted-foreground'>Loading…</p>
      ) : history.isError ? (
        <p className='m-0 text-[11.5px] text-destructive'>Couldn’t load the history. {extractApiMessage(history.error)}</p>
      ) : (
        <HistoryList items={history.data?.data ?? []} />
      )}
    </SheetSection>
  )
}

export function HistorySheet({ item, onClose }: { item: VipAdminItem; onClose: () => void }) {
  return (
    <SheetShell title={`${productLabel(item.product)} · ${item.reference}`} subtitle='Action history' onClose={onClose}>
      <ItemHistory ledgerId={item.ledger_id} />
    </SheetShell>
  )
}
