'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AdminButton, Panel } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { CheckboxInput, Field, TextArea, TextInput } from '@/components/admin/form-controls'
import { Notice } from '@/components/admin/booking-resolution/shared'
import { extractApiMessage } from '@/features/admin/hooks'
import { useReleaseVipPackage } from '@/features/admin/vip/hooks'
import type { VipAdminPackage, VipReleaseResult } from '@/features/admin/vip/types'
import { vipStatusLabel } from './shared'

/* Release (Admin API contract §5): hands every held item to its normal
 * booking process exactly once.
 *   Normal   → the ticket order is secured in the system. Every admin.
 *   Override → CS bought the ticket by hand ("ticket bought by hand").
 *              needs_attention only, and only admins on the refund list
 *              (REFUNDS_ADMIN_IDS). The frontend can't see that list, so
 *              after a 403 the option is switched off for this browser. */

const NOTE_MAX = 1000
const REF_MAX = 64
const NO_OVERRIDE_KEY = 'golafly-admin-vip-no-override'

function readNoOverride(): boolean {
  try {
    return sessionStorage.getItem(NO_OVERRIDE_KEY) === '1'
  } catch {
    return false
  }
}

export function ReleasePanel({ pkg }: { pkg: VipAdminPackage }) {
  const release = useReleaseVipPackage(pkg.id)
  const [note, setNote] = useState('')
  const [override, setOverride] = useState(false)
  const [ftnRef, setFtnRef] = useState('')
  const [sure, setSure] = useState(false)
  const [result, setResult] = useState<VipReleaseResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noOverride, setNoOverride] = useState(readNoOverride)

  const needsAttention = pkg.status === 'needs_attention'
  const releasable = needsAttention || pkg.status === 'paid'
  const overrideOffered = needsAttention && !noOverride
  const useOverride = override && overrideOffered
  const orderSecured =
    !!pkg.order?.ftn_order_id && ['awaiting_attendees', 'confirmed'].includes(pkg.order.status)

  const noteError = errors?.note?.[0] ?? (note.length > NOTE_MAX ? `At most ${NOTE_MAX} characters.` : null)
  const refError =
    errors?.ftn_order_reference?.[0] ?? (ftnRef.length > REF_MAX ? `At most ${REF_MAX} characters.` : null)
  const canSend = !!note.trim() && !noteError && !(useOverride && refError) && !release.isPending

  const send = async () => {
    setError(null)
    setErrors(null)
    try {
      const res = await release.mutateAsync({
        note: note.trim(),
        ...(useOverride
          ? { ticket_confirmed_by_cs: true, ...(ftnRef.trim() ? { ftn_order_reference: ftnRef.trim() } : {}) }
          : {}),
      })
      setResult(res.data)
      if (res.data.outcome === 'done') {
        toast.success(`Released ${res.data.released} item${res.data.released === 1 ? '' : 's'}.`)
        setNote('')
        setFtnRef('')
        setOverride(false)
      }
    } catch (e) {
      const r = (e as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> | null } } })
        .response
      if (r?.status === 403 && useOverride) {
        setOverride(false)
        setNoOverride(true)
        try {
          sessionStorage.setItem(NO_OVERRIDE_KEY, '1')
        } catch {
          /* ignore */
        }
        setError(r.data?.message ?? 'You are not allowed to confirm a ticket by hand.')
      } else if (r?.status === 422) {
        setErrors(r.data?.errors ?? null)
        setError(r.data?.message ?? 'Some fields are missing or invalid.')
      } else {
        setError(extractApiMessage(e))
      }
    }
  }

  if (releasable && pkg.held_items === 0) {
    return (
      <Panel title='Release held items'>
        <div className='flex flex-col gap-2'>
          {result && <ResultNotice result={result} />}
          <p className='m-0 text-[11.5px] text-muted-foreground'>
            Nothing is held right now. Any failed item is resolved from its row below.
          </p>
        </div>
      </Panel>
    )
  }

  if (!releasable) {
    return (
      <Panel title='Release held items'>
        {result && <ResultNotice result={result} />}
        <p className='m-0 text-[11.5px] text-muted-foreground'>
          Release is only for a package that is paid or needs attention. This one is{' '}
          <b>{vipStatusLabel(pkg.status)}</b>.
        </p>
      </Panel>
    )
  }

  return (
    <Panel
      title='Release held items'
      subtitle={`${pkg.held_items} held · hands each one to its normal booking process exactly once`}
    >
      <div className='flex flex-col gap-3'>
        {result && <ResultNotice result={result} />}

        {!orderSecured && !useOverride && (
          <Notice tone='info' title='The ticket order does not read as secured'>
            A normal release will be refused until the ticket order has its supplier order id and is awaiting attendees
            or confirmed
            {pkg.order ? ` (it is ${vipStatusLabel(pkg.order.status)})` : ' (there is no ticket order)'}.
            {needsAttention && ' If you bought the ticket by hand, use the option below.'}
          </Notice>
        )}

        <Field
          label='Note'
          required
          help='Say what you did. Saved on the package audit trail.'
          error={noteError ?? undefined}
        >
          <TextArea
            value={note}
            onChange={(v) => {
              setNote(v)
              setErrors(null)
            }}
            rows={2}
            error={!!noteError}
            placeholder='Ticket arrived late; checked with the supplier'
          />
        </Field>

        {overrideOffered ? (
          <CheckboxInput value={override} onChange={setOverride} label='The ticket was bought by hand (CS override)' />
        ) : (
          needsAttention &&
          noOverride && (
            <p className='m-0 text-[10.5px] text-muted-foreground'>
              “Ticket bought by hand” is only for admins on the refund list.
            </p>
          )
        )}

        {useOverride && (
          <>
            <Notice tone='warn' title='Only if CS bought the ticket outside the system'>
              The package is stamped as confirmed by you, then released. The ticket order is not changed, so it may still
              read failed. Only admins on the refund list can do this.
            </Notice>
            <Field
              label='Supplier order reference'
              help={`Optional, up to ${REF_MAX} characters. Internal only.`}
              error={refError ?? undefined}
            >
              <TextInput value={ftnRef} onChange={setFtnRef} placeholder='FTN-998877' error={!!refError} />
            </Field>
          </>
        )}

        {error && <Notice tone='danger' title={error} />}

        <div className='flex justify-end'>
          <AdminButton size='sm' disabled={!canSend} onClick={() => setSure(true)}>
            {release.isPending ? 'Releasing…' : useOverride ? 'Release (ticket bought by hand)…' : 'Release…'}
          </AdminButton>
        </div>
      </div>

      {sure && (
        <ConfirmDialog
          destructive={false}
          title={useOverride ? 'Release with the CS override?' : 'Release the held items?'}
          body={
            <>
              {pkg.held_items} held item{pkg.held_items === 1 ? '' : 's'} will be booked with the supplier. This cannot be
              undone.
              {useOverride && ' You confirm the match ticket was bought by hand.'}
            </>
          }
          confirmLabel='Release now'
          onCancel={() => setSure(false)}
          onConfirm={() => {
            setSure(false)
            send()
          }}
        />
      )}
    </Panel>
  )
}

function ResultNotice({ result }: { result: VipReleaseResult }) {
  if (result.outcome === 'refused') {
    return (
      <Notice tone='danger' title='Refused; nothing was changed.'>
        {result.reason}
      </Notice>
    )
  }
  return (
    <Notice
      tone='good'
      title={`Done: ${result.released} item${result.released === 1 ? '' : 's'} released. Package is now ${vipStatusLabel(result.package_status)}.`}
    >
      {result.reason}
      {result.package_status === 'needs_attention' && !result.reason && (
        <>A failed item is still with CS, so the package stays “needs attention”. Resolve it below.</>
      )}
    </Notice>
  )
}
