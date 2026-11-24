// features/free-esim/rules.ts — who sees the "free eSIM" message, and how a
// free eSIM reads to customers and admins (contract §4–§8). No React here.

import { countryCodeFromName } from '@/lib/match-destinations'
import type {
  FreeEsimOrderBlock,
  FreeEsimOrderReason,
  FreeEsimRowFields,
  PublicFreeEsimSettings,
} from './types'

/** "Matches played in Europe, the UK included" (contract §1, scope europe).
 *  ISO 3166-1 alpha-2, the same 50-country list Golafly Travel uses for its
 *  free eSIM with flights. Not included: TR, RU, BY, GE, AM, AZ. Only used to
 *  decide where we ADVERTISE; the backend makes the real decision. */
export const FREE_ESIM_EUROPE = new Set([
  // EU 27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA and EFTA
  'IS', 'LI', 'NO', 'CH',
  // UK and dependencies
  'GB', 'GG', 'JE', 'IM', 'GI',
  // Microstates
  'AD', 'MC', 'SM', 'VA',
  // Balkans and East
  'AL', 'BA', 'ME', 'MK', 'RS', 'XK', 'MD', 'UA',
  // Nordic territories
  'FO', 'AX',
])

/** A venue country name from the match data ("Spain", "England") → in Europe? */
export function isEuropeanVenue(countryName: string | null | undefined): boolean {
  const code = countryCodeFromName(countryName)
  return !!code && FREE_ESIM_EUROPE.has(code.toUpperCase())
}

/** Contract §4: show the message only while the offer is live; with scope
 *  "europe" only on matches played in Europe. Never on VIP package pages
 *  (callers on VIP pages simply don't render it; `vip` covers mixed carts). */
export function showsFreeEsimNote(
  settings: PublicFreeEsimSettings | null | undefined,
  { venueCountry, vip = false }: { venueCountry: string | null | undefined; vip?: boolean },
): boolean {
  if (vip || !settings?.is_available) return false
  if (settings.scope === 'all') return true
  if (settings.scope === 'europe') return isEuropeanVenue(venueCountry)
  return false
}

export const FREE_ESIM_NOTE_TITLE = 'Free 1 GB eSIM with your match tickets'
export const FREE_ESIM_NOTE_BODY =
  'We email it to you once your ticket order is confirmed. Valid for 7 days.'

/* ── A free eSIM row (contract §5, §7) ───────────────────────────── */

/** True for a free eSIM. payment_status "complimentary" is the backend's
 *  mark too (the eSIM confirmation response has only that). */
export function isFreeEsim(
  row: (FreeEsimRowFields & { payment_status?: string | null }) | null | undefined,
  summary?: FreeEsimRowFields | null,
): boolean {
  return (
    row?.is_free_with_ticket === true ||
    summary?.is_free_with_ticket === true ||
    row?.payment_status === 'complimentary'
  )
}

/** The match order reference the free eSIM came with ("GO48213907LY"). */
export function freeEsimMatchRef(
  row: FreeEsimRowFields | null | undefined,
  summary?: FreeEsimRowFields | null,
): string | null {
  return row?.free_with_matchday_reference ?? summary?.free_with_matchday_reference ?? null
}

export function freeEsimMatchOrderId(
  row: FreeEsimRowFields | null | undefined,
  summary?: FreeEsimRowFields | null,
): number | null {
  return row?.free_with_matchday_order_id ?? summary?.free_with_matchday_order_id ?? null
}

/** Customer wording (contract §7). */
export const FREE_ESIM_CUSTOMER_LABEL = 'Free with your match tickets'
/** Admin wording (contract §7). */
export const FREE_ESIM_ADMIN_LABEL = 'Free eSIM (with match ticket)'

/** Admin row facts for an overview ledger (fields inside `summary`) or an
 *  eSIM admin order (top level). Flight and hotel rows never qualify. */
export function adminFreeEsim(row: {
  ledger_type?: string
  payment_status?: string | null
  is_free_with_ticket?: boolean
  free_with_matchday_order_id?: number | null
  free_with_matchday_reference?: string | null
  summary?: unknown
}): { free: boolean; matchRef: string | null; matchOrderId: number | null } {
  if (row.ledger_type && row.ledger_type !== 'esim') {
    return { free: false, matchRef: null, matchOrderId: null }
  }
  const summary = (row.summary ?? null) as FreeEsimRowFields | null
  const free = isFreeEsim(row, summary)
  return {
    free,
    matchRef: free ? freeEsimMatchRef(row, summary) : null,
    matchOrderId: free ? freeEsimMatchOrderId(row, summary) : null,
  }
}

/* ── Admin match order: free_esim block (contract §6) ────────────── */

export type FreeEsimTone = 'good' | 'info' | 'warn' | 'danger' | 'neutral'

/** Suggested labels from the contract. */
export function freeEsimOrderLabel(status: string | null | undefined): {
  label: string
  tone: FreeEsimTone
} {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', tone: 'good' }
    case 'in_progress':
      return { label: 'Sending', tone: 'info' }
    case 'failed':
      return { label: 'Failed', tone: 'danger' }
    case 'not_sent':
      return { label: 'Not sent', tone: 'warn' }
    case 'not_eligible':
      return { label: 'No free eSIM', tone: 'neutral' }
    default:
      return { label: 'Status unavailable', tone: 'neutral' }
  }
}

/** "Show reason.text as given, capitalising its first letter." */
export function capitalise(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/** The reason as one line: the failure string (failed) or reason.text. */
export function freeEsimReasonText(block: FreeEsimOrderBlock | null | undefined): string | null {
  const reason = block?.reason
  if (!reason) return null
  if (typeof reason === 'string') return capitalise(reason)
  return reason.text ? capitalise(reason.text) : null
}

export function freeEsimReasonObject(
  block: FreeEsimOrderBlock | null | undefined,
): FreeEsimOrderReason | null {
  const reason = block?.reason
  return reason && typeof reason === 'object' ? reason : null
}

/** Contract §8: admin controls copy. */
export const FREE_ESIM_ADMIN_COPY = {
  switchLabel: 'Free eSIM with match tickets',
  scopeLabel: 'Which matches',
  scopeEurope: 'Europe, UK included',
  scopeAll: 'All countries',
  noProvider: 'No eSIM provider is switched on, so no free eSIMs will be sent',
  vipNote: 'VIP package orders do not get a free eSIM yet',
} as const
