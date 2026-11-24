'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Panel } from '@/components/admin/admin-ui'
import { SheetFacts } from '@/components/admin/sheet-shell'
import { StatusPill } from '@/components/admin/status-pill'
import { instantText } from '@/components/admin/vip/shared'
import { esimProviderLabel } from '@/features/esim/types'
import {
  freeEsimOrderLabel,
  freeEsimReasonObject,
  freeEsimReasonText,
} from '@/features/free-esim/rules'
import type { FreeEsimOrderBlock } from '@/features/free-esim/types'
import { Routes } from '@/routes'

/* The free eSIM of a match order (Free eSIM contract §6): delivered, sending,
 * failed, not sent or no free eSIM, with the reason. Only the order detail
 * carries the block; when it is absent (backend not deployed yet) the panel
 * is not shown at all. The eSIM links to Orders → eSIMs, the matchday admin's
 * eSIM list (there is no separate eSIM order page here). */

const dash = (v: string | number | null | undefined) =>
  v == null || v === '' ? '—' : String(v)

const when = (iso: string | null | undefined) => (iso ? instantText(iso) : '—')

export function FreeEsimOrderPanel({ block }: { block: FreeEsimOrderBlock }) {
  const { label, tone } = freeEsimOrderLabel(block.status)
  const reasonText = freeEsimReasonText(block)
  const reason = freeEsimReasonObject(block)
  const esim = block.esim

  const facts: [string, ReactNode][] = [
    ['Status', <StatusPill key='st' label={label} tone={tone} />],
  ]
  if (reasonText) facts.push(['Reason', reasonText])
  if (reason?.code) {
    facts.push([
      'Reason code',
      <span key='code' className='font-mono text-[11px]'>
        {reason.code}
      </span>,
    ])
  }
  if (block.status === 'not_sent' || reason?.alert_sent_at !== undefined) {
    facts.push(['Team emailed', reason?.alert_sent_at ? when(reason.alert_sent_at) : 'Not yet'])
  }
  if (esim) {
    facts.push(
      [
        'eSIM',
        <Link
          key='esim'
          href={Routes.adminWithTab(Routes.adminOrders, 'esim')}
          className='font-mono font-semibold underline'
        >
          {esim.reference || `#${esim.ledger_id}`}
        </Link>,
      ],
      ['eSIM status', dash(esim.status)],
      ['Package', dash(esim.package)],
      ['Provider', esim.provider ? esimProviderLabel(esim.provider) : '—'],
      ['ICCID', dash(esim.iccid)],
      ['Confirmed', when(esim.confirmed_at)],
      ['Install email sent', when(esim.customer_email_sent_at)],
    )
    if (esim.failure_message && esim.failure_message !== reasonText) {
      facts.push(['Failure', esim.failure_message])
    }
  }

  return (
    <Panel
      title='Free eSIM'
      subtitle={
        block.status === 'unknown'
          ? 'The status could not be read. Reload later.'
          : 'One free 1 GB / 7 day eSIM per confirmed order'
      }
      className='lg:col-span-2'
    >
      {esim?.requires_reconciliation && (
        <p
          role='alert'
          className='m-0 mb-3 flex items-start gap-2 rounded-md bg-status-warn-bg px-3 py-2 text-[11.5px] text-status-warn'
        >
          <TriangleAlert className='mt-0.5 size-3.5 shrink-0' />
          An eSIM may exist at the provider. Check with the provider before re-ordering.
        </p>
      )}
      <SheetFacts facts={facts} />
    </Panel>
  )
}
