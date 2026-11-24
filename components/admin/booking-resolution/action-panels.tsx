'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { CheckboxInput, Field, TextArea, TextInput } from '@/components/admin/form-controls'
import { extractApiMessage } from '@/features/admin/hooks'
import {
  useResolutionAction,
  type ResolutionRequest,
} from '@/features/admin/booking-resolution/hooks'
import type {
  ActionRequiredRow,
  ActionResult,
  FlightSegmentDetails,
  ManualDetails,
  ResolutionAction,
} from '@/features/admin/booking-resolution/types'
import { Notice, OutcomeBlock, SentenceList } from './shared'

/* The four "resolve" panels from contract §2.3. Every one has the same shape:
 *   fill in → Preview (confirm:false) → read the preview → Confirm (confirm:true)
 * Editing a field throws the preview away, so Confirm always applies to
 * exactly what was previewed. Outcomes:
 *   report  → show it + the Confirm button
 *   done    → handed to the sheet (onDone), which shows the result
 *   refused → reason (+ differences), form stays open
 *   failed  → reason, prominently
 * Non-2xx: 422 highlights fields, 403 on a refund confirm = not on the list. */

export interface PanelProps {
  row: ActionRequiredRow
  /** job running, or someone else's claim not acknowledged. */
  disabled: boolean
  onDone: (result: ActionResult, action: ResolutionAction) => void
  onSwitch?: (action: ResolutionAction) => void
}

type ErrorBag = Record<string, string[]>

function useTwoStep(onDone: PanelProps['onDone']) {
  const mutation = useResolutionAction()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [errors, setErrors] = useState<ErrorBag | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState<string | null>(null)

  const clear = () => {
    setResult(null)
    setErrors(null)
    setError(null)
  }

  async function send(req: ResolutionRequest): Promise<ActionResult | null> {
    setError(null)
    setErrors(null)
    try {
      const res = await mutation.mutateAsync(req)
      const r = res.data
      if (r.outcome === 'done') {
        setResult(null)
        onDone(r, req.action)
        return r
      }
      setResult(r)
      return r
    } catch (e) {
      const response = (e as { response?: { status?: number; data?: { message?: string; errors?: ErrorBag | null } } }).response
      if (response?.status === 422) {
        setErrors(response.data?.errors ?? null)
        setError(response.data?.message ?? 'Some fields are missing or invalid.')
      } else if (response?.status === 403 && req.action === 'refund' && req.body.confirm) {
        setForbidden(response.data?.message ?? 'You are not allowed to confirm refunds.')
      } else {
        setError(extractApiMessage(e))
      }
      return null
    }
  }

  return { result, errors, error, forbidden, clear, send, pending: mutation.isPending }
}

const fieldError = (errors: ErrorBag | null, key: string) => errors?.[key]?.[0]

function ErrorLine({ error, errors }: { error: string | null; errors: ErrorBag | null }) {
  if (!error) return null
  const details = errors?.details ?? []
  return (
    <Notice tone='danger' title={error}>
      {details.length > 0 && <SentenceList items={details} mono />}
    </Notice>
  )
}

function Buttons({
  canPreview,
  canConfirm,
  pending,
  onPreview,
  onConfirm,
  confirmLabel,
  destructive,
}: {
  canPreview: boolean
  canConfirm: boolean
  pending: boolean
  onPreview: () => void
  onConfirm: () => void
  confirmLabel: string
  destructive?: boolean
}) {
  return (
    <div className='flex flex-wrap justify-end gap-2'>
      <AdminButton variant='outline' size='sm' disabled={!canPreview || pending} onClick={onPreview}>
        {pending ? 'Working…' : 'Preview'}
      </AdminButton>
      <AdminButton
        variant={destructive ? 'destructive' : 'primary'}
        size='sm'
        disabled={!canConfirm || pending}
        onClick={onConfirm}
        title={canConfirm ? undefined : 'Preview first'}
      >
        {confirmLabel}
      </AdminButton>
    </div>
  )
}

/* ── 1. Attach a rebooked booking ───────────────────────────────────── */

export function AttachPanel({ row, disabled, onDone, onSwitch }: PanelProps) {
  const flow = useTwoStep(onDone)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [accept, setAccept] = useState(false)
  /** Soft differences seen on this reference: show "Attach anyway" (flights). */
  const [softSeen, setSoftSeen] = useState(false)
  const isFlight = row.product === 'flight'

  const body = (confirm: boolean) => ({
    supplier_reference: reference.trim(),
    note: note.trim() || undefined,
    accept_differences: isFlight && accept ? true : undefined,
    confirm,
  })

  const go = async (confirm: boolean) => {
    const res = await flow.send({ action: 'attach', id: row.ledger_id, body: body(confirm) })
    if (res?.outcome === 'refused' && (res.differences?.soft.length ?? 0) > 0) setSoftSeen(true)
  }

  const r = flow.result
  const suggestManual = r?.outcome === 'refused' && /manual details/i.test(r.reason ?? '')

  return (
    <div className='flex flex-col gap-3'>
      <p className='m-0 text-[11.5px] text-muted-foreground'>
        CS rebooked with the same supplier. Enter that supplier&apos;s booking reference: we read the booking back,
        check it belongs to this customer, store it and send the normal confirmation email.
      </p>
      <Field label='Supplier reference' required error={fieldError(flow.errors, 'supplier_reference')}>
        <TextInput
          value={reference}
          onChange={(v) => {
            setReference(v)
            setSoftSeen(false)
            setAccept(false)
            flow.clear()
          }}
          placeholder='e.g. ord_0000EXAMPLE'
          disabled={disabled}
          error={!!fieldError(flow.errors, 'supplier_reference')}
        />
      </Field>
      <Field label='Note' help='Optional. Saved in the history.'>
        <TextArea value={note} onChange={(v) => { setNote(v); flow.clear() }} rows={2} />
      </Field>
      {isFlight && softSeen && (
        <CheckboxInput
          value={accept}
          onChange={(v) => { setAccept(v); flow.clear() }}
          label='Attach anyway: accept the differences (the booking record is rewritten from the supplier’s booking)'
        />
      )}
      {r && <OutcomeBlock result={r} />}
      {suggestManual && onSwitch && (
        <AdminButton variant='outline' size='sm' className='self-start' onClick={() => onSwitch('manual')}>
          Enter details by hand instead
        </AdminButton>
      )}
      <ErrorLine error={flow.error} errors={flow.errors} />
      <Buttons
        canPreview={!disabled && !!reference.trim()}
        canConfirm={!disabled && r?.outcome === 'report'}
        pending={flow.pending}
        onPreview={() => go(false)}
        onConfirm={() => go(true)}
        confirmLabel='Confirm attach'
      />
    </div>
  )
}

/* ── 2. Enter details by hand ───────────────────────────────────────── */

const emptySegment = (): FlightSegmentDetails => ({
  from: '',
  to: '',
  flight_number: '',
  departs_at: '',
  arrives_at: '',
})

type Draft = Record<string, string>

function ManualFields({
  product,
  draft,
  set,
  segments,
  setSegments,
  disabled,
}: {
  product: string
  draft: Draft
  set: (key: string, v: string) => void
  segments: FlightSegmentDetails[]
  setSegments: (s: FlightSegmentDetails[]) => void
  disabled: boolean
}) {
  const text = (key: string, label: string, required = true, placeholder?: string) => (
    <Field key={key} label={label} required={required}>
      <TextInput value={draft[key] ?? ''} onChange={(v) => set(key, v)} placeholder={placeholder} disabled={disabled} />
    </Field>
  )

  if (product === 'flight') {
    return (
      <>
        <div className='grid grid-cols-2 gap-2.5'>
          {text('airline', 'Airline', true, 'New Air')}
          {text('pnr', 'PNR', true, 'XYZ789')}
        </div>
        {segments.map((s, i) => {
          const upd = (k: keyof FlightSegmentDetails, v: string) =>
            setSegments(segments.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
          return (
            <div key={i} className='rounded-md p-2.5 shadow-[0_0_0_1px_var(--edge)]'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                  Segment {i + 1}
                </span>
                {segments.length > 1 && (
                  <button
                    type='button'
                    aria-label={`Remove segment ${i + 1}`}
                    onClick={() => setSegments(segments.filter((_, j) => j !== i))}
                    className='rounded p-1 text-muted-foreground hover:text-destructive'
                  >
                    <Trash2 className='size-3' />
                  </button>
                )}
              </div>
              <div className='grid grid-cols-3 gap-2'>
                <Field label='From' required>
                  <TextInput value={s.from} onChange={(v) => upd('from', v)} placeholder='MAN' uppercase maxLength={3} disabled={disabled} />
                </Field>
                <Field label='To' required>
                  <TextInput value={s.to} onChange={(v) => upd('to', v)} placeholder='IST' uppercase maxLength={3} disabled={disabled} />
                </Field>
                <Field label='Flight no.' required>
                  <TextInput value={s.flight_number} onChange={(v) => upd('flight_number', v)} placeholder='NA100' uppercase disabled={disabled} />
                </Field>
              </div>
              <div className='mt-2 grid grid-cols-2 gap-2'>
                <Field label='Departs' required help='YYYY-MM-DD HH:mm'>
                  <TextInput value={s.departs_at} onChange={(v) => upd('departs_at', v)} placeholder='2027-04-02 08:30' disabled={disabled} />
                </Field>
                <Field label='Arrives' required help='YYYY-MM-DD HH:mm'>
                  <TextInput value={s.arrives_at} onChange={(v) => upd('arrives_at', v)} placeholder='2027-04-02 14:00' disabled={disabled} />
                </Field>
              </div>
            </div>
          )
        })}
        <AdminButton variant='ghost' size='sm' className='self-start' onClick={() => setSegments([...segments, emptySegment()])} disabled={disabled}>
          <Plus className='size-3' />
          Add segment
        </AdminButton>
      </>
    )
  }

  if (product === 'hotel') {
    return (
      <>
        {text('hotel_name', 'Hotel name', true, 'New Hotel')}
        {text('address', 'Address', true, '1 High Street')}
        <div className='grid grid-cols-2 gap-2.5'>
          <Field label='Check in' required>
            <TextInput type='date' value={draft.checkin ?? ''} onChange={(v) => set('checkin', v)} disabled={disabled} />
          </Field>
          <Field label='Check out' required>
            <TextInput type='date' value={draft.checkout ?? ''} onChange={(v) => set('checkout', v)} disabled={disabled} />
          </Field>
        </div>
        {text('confirmation_number', 'Hotel confirmation number', true, 'CONF-1')}
      </>
    )
  }

  if (product === 'esim_topup') {
    return (
      <>
        {text('iccid', 'ICCID', true, '8944000000000000001')}
        {text('package', 'Package', true, '1GB, 7 days')}
      </>
    )
  }

  // eSIM: smdp_address + activation_code, or a QR code string.
  return (
    <>
      {text('iccid', 'ICCID', true, '8944000000000000009')}
      <div className='grid grid-cols-2 gap-2.5'>
        {text('smdp_address', 'SM-DP+ address', false, 'lpa.example.test')}
        {text('activation_code', 'Activation code', false, 'ABC123')}
      </div>
      <Field label='…or QR code' help='Either the SM-DP+ address with the activation code, or the QR code.'>
        <TextInput value={draft.qrcode ?? ''} onChange={(v) => set('qrcode', v)} placeholder='LPA:1$…' disabled={disabled} />
      </Field>
    </>
  )
}

function buildDetails(product: string, d: Draft, segments: FlightSegmentDetails[]): ManualDetails {
  const t = (k: string) => (d[k] ?? '').trim()
  const cost = t('cost_amount') ? { amount: t('cost_amount'), currency: t('cost_currency').toUpperCase() || 'EUR' } : undefined
  if (product === 'flight') {
    return {
      airline: t('airline'),
      pnr: t('pnr').toUpperCase(),
      segments: segments.map((s) => ({
        from: s.from.trim().toUpperCase(),
        to: s.to.trim().toUpperCase(),
        flight_number: s.flight_number.trim().toUpperCase(),
        departs_at: s.departs_at.trim(),
        arrives_at: s.arrives_at.trim(),
      })),
      cost,
    }
  }
  if (product === 'hotel') {
    return {
      hotel_name: t('hotel_name'),
      address: t('address'),
      checkin: t('checkin'),
      checkout: t('checkout'),
      confirmation_number: t('confirmation_number'),
      cost,
    }
  }
  if (product === 'esim_topup') return { iccid: t('iccid'), package: t('package'), cost }
  return {
    iccid: t('iccid'),
    smdp_address: t('smdp_address') || undefined,
    activation_code: t('activation_code') || undefined,
    qrcode: t('qrcode') || undefined,
    cost,
  }
}

export function ManualPanel({ row, disabled, onDone }: PanelProps) {
  const flow = useTwoStep(onDone)
  const [draft, setDraft] = useState<Draft>({})
  const [segments, setSegments] = useState<FlightSegmentDetails[]>([emptySegment()])
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  const set = (k: string, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }))
    flow.clear()
  }

  const go = (confirm: boolean) =>
    flow.send({
      action: 'manual',
      id: row.ledger_id,
      body: {
        details: buildDetails(row.product, draft, segments),
        reference: reference.trim(),
        note: note.trim() || undefined,
        confirm,
      },
    })

  const r = flow.result

  return (
    <div className='flex flex-col gap-3'>
      <p className='m-0 text-[11.5px] text-muted-foreground'>
        For a booking we can&apos;t read back from the supplier (booked elsewhere or by phone). We store these details,
        update the customer&apos;s pages and send a confirmation email with them, so check every field.
      </p>
      <ManualFields
        product={row.product}
        draft={draft}
        set={set}
        segments={segments}
        setSegments={(s) => {
          setSegments(s)
          flow.clear()
        }}
        disabled={disabled}
      />
      <Field label='Supplier reference' required error={fieldError(flow.errors, 'reference')}>
        <TextInput
          value={reference}
          onChange={(v) => { setReference(v); flow.clear() }}
          placeholder='The supplier’s booking reference'
          disabled={disabled}
          error={!!fieldError(flow.errors, 'reference')}
        />
      </Field>
      <div className='grid grid-cols-[1fr_88px] gap-2.5'>
        <Field label='Cost' help='Optional, for our records only.'>
          <TextInput value={draft.cost_amount ?? ''} onChange={(v) => set('cost_amount', v)} placeholder='410.00' disabled={disabled} />
        </Field>
        <Field label='Currency'>
          <TextInput value={draft.cost_currency ?? ''} onChange={(v) => set('cost_currency', v)} placeholder={row.currency} uppercase maxLength={3} disabled={disabled} />
        </Field>
      </div>
      <Field label='Note' required help='Required to confirm. Saved in the history.' error={fieldError(flow.errors, 'note')}>
        <TextArea value={note} onChange={(v) => { setNote(v); flow.clear() }} rows={2} error={!!fieldError(flow.errors, 'note')} />
      </Field>
      {r && <OutcomeBlock result={r} />}
      <ErrorLine error={flow.error} errors={flow.errors} />
      <Buttons
        canPreview={!disabled && !!reference.trim()}
        canConfirm={!disabled && r?.outcome === 'report' && !!note.trim()}
        pending={flow.pending}
        onPreview={() => go(false)}
        onConfirm={() => go(true)}
        confirmLabel='Confirm details'
      />
    </div>
  )
}

/* ── 3. Retry (eSIM orders and top-ups only) ────────────────────────── */

export function RetryPanel({ row, disabled, onDone }: PanelProps) {
  const flow = useTwoStep(onDone)
  const [note, setNote] = useState('')
  const r = flow.result
  const go = (confirm: boolean) =>
    flow.send({ action: 'retry', id: row.ledger_id, body: { note: note.trim() || undefined, confirm } })

  return (
    <div className='flex flex-col gap-3'>
      <p className='m-0 text-[11.5px] text-muted-foreground'>
        Places the eSIM order again. Only for failures where no supplier order can exist. If it fails again, the
        booking comes back to this queue (the customer is not emailed twice).
      </p>
      <Field label='Note' help='Optional. Saved in the history.'>
        <TextArea value={note} onChange={(v) => { setNote(v); flow.clear() }} rows={2} />
      </Field>
      {r && <OutcomeBlock result={r} />}
      <ErrorLine error={flow.error} errors={flow.errors} />
      <Buttons
        canPreview={!disabled}
        canConfirm={!disabled && r?.outcome === 'report'}
        pending={flow.pending}
        onPreview={() => go(false)}
        onConfirm={() => go(true)}
        confirmLabel='Confirm retry'
      />
    </div>
  )
}

/* ── 4. Refund (last resort) ────────────────────────────────────────── */

export function RefundPanel({ row, disabled, onDone }: PanelProps) {
  const flow = useTwoStep(onDone)
  const [note, setNote] = useState('')
  const [noBooking, setNoBooking] = useState(false)
  const [stripeChecked, setStripeChecked] = useState(false)
  /* The acknowledgements only appear once the backend asks for them, and
     then stay (ticking one must not hide it again). */
  const [askNoBooking, setAskNoBooking] = useState(false)
  const [askStripe, setAskStripe] = useState(false)
  const [sure, setSure] = useState(false)

  const r = flow.result

  const go = async (confirm: boolean) => {
    const res = await flow.send({
      action: 'refund',
      id: row.ledger_id,
      body: {
        note: note.trim() || undefined,
        no_booking_confirmed: noBooking || undefined,
        stripe_checked: stripeChecked || undefined,
        confirm,
      },
    })
    if (res?.outcome === 'refused' && /no booking exists/i.test(res.reason ?? '')) setAskNoBooking(true)
    if (res && (res.outcome === 'failed' || /checked Stripe/i.test(res.reason ?? ''))) {
      // After a failed refund Stripe may have created it anyway: always re-ask.
      setAskStripe(true)
      setStripeChecked(false)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <Notice tone='warn' title='Last resort: this moves money'>
        Refunds this booking&apos;s own share of the payment through Stripe ({row.amount} {row.currency}), then emails the
        customer once. Try attaching or entering the booking first.
      </Notice>
      <Field label='Note' required help='Required to confirm. Saved in the history.' error={fieldError(flow.errors, 'note')}>
        <TextArea value={note} onChange={(v) => { setNote(v); flow.clear() }} rows={2} error={!!fieldError(flow.errors, 'note')} />
      </Field>
      {askNoBooking && (
        <CheckboxInput
          value={noBooking}
          onChange={(v) => { setNoBooking(v); flow.clear() }}
          label='I checked the supplier and no booking exists'
        />
      )}
      {askStripe && (
        <CheckboxInput
          value={stripeChecked}
          onChange={(v) => { setStripeChecked(v); flow.clear() }}
          label={`I checked Stripe for an existing refund (metadata ledger_id = ${row.ledger_id})`}
        />
      )}
      {r && <OutcomeBlock result={r} />}
      {flow.forbidden && (
        <Notice tone='danger' title='You are not allowed to confirm refunds'>
          {flow.forbidden}
        </Notice>
      )}
      <ErrorLine error={flow.error} errors={flow.errors} />
      <Buttons
        canPreview={!disabled}
        canConfirm={!disabled && r?.outcome === 'report' && !!note.trim() && !flow.forbidden}
        pending={flow.pending}
        onPreview={() => go(false)}
        onConfirm={() => setSure(true)}
        confirmLabel='Refund…'
        destructive
      />
      {sure && (
        <ConfirmDialog
          title={`Refund ${row.reference}?`}
          body={
            <>
              This refunds <b className='font-semibold text-foreground'>{row.amount} {row.currency}</b> to{' '}
              {row.customer_email} through Stripe and emails them. It cannot be undone.
            </>
          }
          confirmLabel='Refund now'
          onCancel={() => setSure(false)}
          onConfirm={() => {
            setSure(false)
            go(true)
          }}
        />
      )}
    </div>
  )
}
