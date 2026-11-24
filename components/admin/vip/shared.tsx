'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import { StatusPill, type StatusTone } from '@/components/admin/status-pill'
import { Routes } from '@/routes'

/* Small pieces shared by the VIP package admin screens. */

const STATUS_TONE: Record<string, StatusTone> = {
  needs_attention: 'danger',
  paid: 'info',
  ticket_secured: 'info',
  completed: 'good',
  closed: 'neutral',
  checkout_started: 'neutral',
  building: 'neutral',
  abandoned: 'neutral',
}

export const vipStatusLabel = (s: string) => s.replace(/_/g, ' ')

export function VipStatusPill({ status }: { status: string }) {
  return <StatusPill label={vipStatusLabel(status)} tone={STATUS_TONE[status] ?? 'neutral'} />
}

const CLUB_LABEL: Record<string, string> = {
  barcelona: 'FC Barcelona',
  real_madrid: 'Real Madrid',
  atletico_madrid: 'Atlético Madrid',
}
export const clubLabel = (slug: string) => CLUB_LABEL[slug] ?? slug.replace(/_/g, ' ')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Kick-off is local Spain time with no offset: show it exactly as given
 *  ("06 Mar 2027 · 21:00"), never through the browser's time zone. */
export function matchDateText(local: string | null | undefined): string {
  const m = local?.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (!m) return local || '—'
  const [, y, mo, d, h, mi] = m
  return `${d} ${MONTHS[Number(mo) - 1] ?? mo} ${y}${h ? ` · ${h}:${mi}` : ''}`
}

/** A real instant (with offset): day, month, time in the viewer's zone. */
export const instantText = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

/** EUR figure; null stays a dash (no stored rate), never 0. */
export const eurText = (n: number | null | undefined) =>
  n == null ? '—' : `€${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Charge-currency figure (major units). */
export const moneyText = (n: number | null | undefined, currency: string | null | undefined) =>
  n == null ? '—' : `${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ''}`.trim()

/** A link to a package from any other admin row carrying
 *  hospitality_package_id (contract §7). */
export function VipPackageLink({ id, className }: { id: string; className?: string }) {
  return (
    <Link
      href={Routes.adminVipPackage(id)}
      className={
        className ??
        'inline-flex items-center gap-1 rounded-full bg-status-warn-bg px-2 py-0.5 text-[10.5px] font-medium text-status-warn hover:underline'
      }
      title={`VIP package ${id}`}
    >
      <Crown className='size-3' />
      VIP package
    </Link>
  )
}
