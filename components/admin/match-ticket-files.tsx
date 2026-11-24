'use client'

import { useState } from 'react'
import { Download, FileText, LoaderCircle, RefreshCw, Smartphone, Ticket, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { AdminButton } from '@/components/admin/admin-ui'
import { extractApiMessage, useAdminMatchdayOrderTickets } from '@/features/admin/hooks'
import {
  downloadAdminTicketFile,
  formatFileSize,
  type AdminTicketArtifact,
} from '@/services/matchday-admin'
import { cn } from '@/lib/utils'

/* An order's ticket files for the admin (Ticket dashboards contract §4):
 *   GET /v1/matchday/admin/orders/{id}/tickets            what exists
 *   GET /v1/matchday/admin/orders/{id}/tickets/{checksum} one file (admin token)
 *
 * Tickets, venue instructions and phone links are three separate cases. A
 * file can only be downloaded while `available: true`; phone links open, they
 * are never downloaded. Storage paths are never sent, and there is no
 * "resend email" action (the backend has none). Renders only the body — the
 * caller wraps it in a Panel (order page) or a SheetSection (list sheet). */

const humanFormat = (format: string | null | undefined) =>
  format
    ? format
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^e ticket$/, 'e-ticket')
        .replace(/^./, (c) => c.toUpperCase())
    : 'File'

export function MatchTicketFiles({
  orderId,
  reference,
}: {
  orderId: number | string
  reference?: string | null
}) {
  const query = useAdminMatchdayOrderTickets(orderId)
  const data = query.data?.data

  if (query.isPending) {
    return (
      <div className='flex flex-col gap-2'>
        <div className='h-9 animate-pulse rounded-md bg-muted' />
        <div className='h-9 animate-pulse rounded-md bg-muted' />
      </div>
    )
  }

  if (query.isError || !data) {
    return (
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-md bg-status-danger-bg px-3 py-2.5 text-[11.5px] text-status-danger'>
        <span className='inline-flex items-center gap-1.5'>
          <TriangleAlert className='size-3.5 shrink-0' />
          {extractApiMessage(query.error)}
        </span>
        <AdminButton variant='outline' size='sm' onClick={() => query.refetch()}>
          <RefreshCw className='size-3' />
          Retry
        </AdminButton>
      </div>
    )
  }

  const files = data.artifacts.filter((a) => a.group !== 'instructions')
  const instructions = data.artifacts.filter((a) => a.group === 'instructions')
  const name = reference || data.reference || `order-${orderId}`

  if (data.artifacts.length === 0 && data.links.length === 0) {
    return (
      <p className='m-0 text-[11.5px] text-muted-foreground'>
        No ticket files or phone tickets yet. They appear here once the supplier delivers them.
      </p>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {files.length > 0 && (
        <FileGroup title='Tickets' icon={<Ticket className='size-3' />}>
          {files.map((a, i) => (
            <ArtifactRow
              key={a.checksum}
              orderId={orderId}
              artifact={a}
              label={files.length > 1 ? `${humanFormat(a.format)} ${i + 1}` : humanFormat(a.format)}
              fallbackName={`${name}-ticket-${i + 1}.${a.extension || 'pdf'}`}
            />
          ))}
        </FileGroup>
      )}

      {data.links.length > 0 && (
        <FileGroup title='Phone tickets' icon={<Smartphone className='size-3' />}>
          {data.links.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className='flex items-center justify-between gap-3 border-b border-[var(--edge)] py-2 last:border-b-0'
            >
              <span className='min-w-0'>
                <span className='block text-[12px] font-medium'>Phone ticket {i + 1}</span>
                <span className='block truncate font-mono text-[10.5px] text-muted-foreground' title={url}>
                  {url}
                </span>
              </span>
              <a
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.09em] text-foreground shadow-[0_0_0_1px_var(--edge)] hover:bg-accent'
              >
                <Smartphone className='size-3' />
                Open
              </a>
            </li>
          ))}
        </FileGroup>
      )}

      {instructions.length > 0 && (
        <FileGroup title='Venue instructions' icon={<FileText className='size-3' />}>
          {instructions.map((a, i) => (
            <ArtifactRow
              key={a.checksum}
              orderId={orderId}
              artifact={a}
              label={instructions.length > 1 ? `Instructions ${i + 1}` : 'Instructions'}
              fallbackName={`${name}-instructions-${i + 1}.${a.extension || 'pdf'}`}
            />
          ))}
        </FileGroup>
      )}
    </div>
  )
}

function FileGroup({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <p className='m-0 mb-1 inline-flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
        {icon}
        {title}
      </p>
      <ul className='m-0 flex list-none flex-col p-0'>{children}</ul>
    </div>
  )
}

function ArtifactRow({
  orderId,
  artifact,
  label,
  fallbackName,
}: {
  orderId: number | string
  artifact: AdminTicketArtifact
  label: string
  fallbackName: string
}) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    if (busy) return
    setBusy(true)
    try {
      await downloadAdminTicketFile(orderId, artifact, fallbackName)
    } catch (e) {
      toast.error('Download failed', { description: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className='flex items-center justify-between gap-3 border-b border-[var(--edge)] py-2 last:border-b-0'>
      <span className='min-w-0'>
        <span className='block text-[12px] font-medium'>{label}</span>
        <span className='block font-mono text-[10.5px] uppercase text-muted-foreground'>
          {[artifact.extension, formatFileSize(artifact.size)].filter(Boolean).join(' · ')}
          {!artifact.available && <span className='normal-case'> · not available</span>}
        </span>
      </span>
      <AdminButton
        variant='outline'
        size='sm'
        disabled={!artifact.available || busy}
        title={artifact.available ? undefined : 'This file is no longer stored, so it cannot be downloaded.'}
        onClick={() => void run()}
        className={cn(!artifact.available && 'pointer-events-auto')}
      >
        {busy ? <LoaderCircle className='size-3 animate-spin' /> : <Download className='size-3' />}
        {busy ? 'Downloading' : 'Download'}
      </AdminButton>
    </li>
  )
}
