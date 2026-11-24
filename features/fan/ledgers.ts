/* Pure mappers: raw FanLedger records → the shapes the dashboard renders.
 *
 * No React in here on purpose. Bucketing an order into upcoming/past, and
 * deciding whether it counts as "ready", are the parts most likely to be
 * wrong, and they are far easier to reason about — and to assert against —
 * when they are not tangled up with rendering.
 */

import { formatMinor } from '@/lib/money'
import { isFinishingBooking } from '@/features/payment/status'
import {
  FREE_ESIM_CUSTOMER_LABEL,
  freeEsimMatchRef,
  isFreeEsim,
} from '@/features/free-esim/rules'
import type { FanLedger, FanLedgerType } from './types'

/* ── Free eSIM with match tickets (Free eSIM contract §5.3, §7) ──────────
   payment_status "complimentary", amount 0, paid_at null. Its currency is the
   provider's cost currency, so the zero amount is NEVER printed: it reads
   "Free", with the match booking reference, and no payment wording. */
export function fanIsFreeEsim(l: FanLedger): boolean {
  return l.ledger_type === 'esim' && isFreeEsim(l, l.summary)
}

/** The match booking a free eSIM came with ("GO48213907LY"), or null. */
export function fanFreeEsimMatchRef(l: FanLedger): string | null {
  return l.ledger_type === 'esim' ? freeEsimMatchRef(null, l.summary) : null
}

/* ── Money ────────────────────────────────────────────────────────────────
   `amount_paid_minor` IS minor units. Verified against production rather than
   assumed: /v1/overview reports its 17 Aug bucket as amount "3914.73" with
   amount_minor 391473, and the ledger row for that same stays booking is
   391473 — so the divisor is 100.

   This matters because travels/features/auth/ledger-utils.ts passes the minor
   value straight into Intl.NumberFormat with no conversion, which renders
   every price there 100× too large. It looks entirely plausible on screen,
   which is exactly why it survived. lib/money.ts already does this correctly
   for the admin; reuse it rather than writing a second formatter that can
   drift. */
export const fanMoney = (l: FanLedger): string =>
  fanIsFreeEsim(l) ? 'Free' : formatMinor(l.pricing.amount_paid_minor, l.pricing.currency)

/* ── Dates ────────────────────────────────────────────────────────────── */

const parsed = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** ISO or 'YYYY-MM-DD' → "22 Aug 2026". Empty string when absent, so callers
 *  can filter it out of a meta list without a null check. */
export function fanDate(value: string | null | undefined): string {
  const d = parsed(value)
  return d
    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
}

/** "in 3 days" / "in 6 hrs" / "today". Null when there is no date to count to
 *  or it has already passed — the caller shows the date instead. */
export function fanCountdown(value: string | null | undefined, now = new Date()): string | null {
  const d = parsed(value)
  if (!d) return null
  const mins = Math.floor((d.getTime() - now.getTime()) / 60_000)
  if (mins < 0) return null
  if (mins < 60) return 'within the hour'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `in ${hours} hr${hours === 1 ? '' : 's'}`
  const days = Math.floor(hours / 24)
  return days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`
}

/* ── Classification ───────────────────────────────────────────────────── */

/** Dead bookings only: cancelled or refunded. A paid booking that failed
 *  (`payment_received_booking_failed`) is NOT one while it is unrefunded: our
 *  team arranges an alternative by hand, so it stays among live orders
 *  (Citizenship, room name and failed hotel API contract, section 4). */
export function isCancelled(l: FanLedger): boolean {
  return l.status === 'cancelled' || l.payment_status === 'refunded'
}

/** Paid, the booking failed, and our team is arranging an alternative. */
export function isTeamHandling(l: FanLedger): boolean {
  return l.status === 'payment_received_booking_failed' && !isCancelled(l)
}

/** The date this order is "about": a flight's departure, a stay's checkout.
 *  eSIMs have none — they are not a trip, so they never age into Past. */
export function tripDate(l: FanLedger): Date | null {
  if (l.ledger_type === 'flight') return parsed(l.summary.departure_date)
  if (l.ledger_type === 'stays') return parsed(l.summary.checkout ?? l.summary.checkin)
  return null
}

export type FanTab = 'upcoming' | 'past' | 'cancelled'

export function fanTab(l: FanLedger, now = new Date()): FanTab {
  if (isCancelled(l)) return 'cancelled'
  const d = tripDate(l)
  return d && d.getTime() < now.getTime() ? 'past' : 'upcoming'
}

export type FanStatusLabel =
  | 'Confirmed'
  | 'Awaiting payment'
  | 'Ready'
  | 'Finishing booking'
  | 'Being set up'
  | 'Not confirmed, our team will contact you'
  | 'Completed'
  | 'Cancelled'

export type FanTone = 'good' | 'warn' | 'danger' | 'info' | 'neutral'

/** One label per order, and the tone that goes with it. The tone is never the
 *  only signal — every pill carries this text too. */
export function fanStatus(l: FanLedger, now = new Date()): { label: FanStatusLabel; tone: FanTone } {
  if (isCancelled(l)) return { label: 'Cancelled', tone: 'danger' }
  /* A free eSIM is never "Awaiting payment": nothing is paid. The customer
     isn't told about a failure (contract §1), so anything not yet confirmed
     reads as being set up. */
  if (fanIsFreeEsim(l)) {
    return l.status === 'confirmed'
      ? { label: 'Confirmed', tone: 'good' }
      : { label: 'Being set up', tone: 'info' }
  }
  // Information, not an error: the customer has paid and is looked after.
  if (isTeamHandling(l)) return { label: 'Not confirmed, our team will contact you', tone: 'info' }
  if (fanTab(l, now) === 'past') return { label: 'Completed', tone: 'neutral' }
  if (l.status === 'confirmed' && l.payment_status === 'paid') {
    return { label: 'Confirmed', tone: 'good' }
  }
  /* An unpaid order must NEVER read as ready — nothing has been bought yet.
     `initiated` and `pending` orders rendering as "Ready" is a real bug the
     travels dashboard shipped, and the fan only finds out at the airport. */
  if (l.payment_status !== 'paid') return { label: 'Awaiting payment', tone: 'warn' }
  /* Paid, but the supplier booking isn't done yet: Golafly support is
     finishing it (booking resolution). Before this, these read "Ready". */
  if (isFinishingBooking(l.status, l.payment_status)) {
    return { label: 'Finishing booking', tone: 'info' }
  }
  return { label: 'Ready', tone: 'info' }
}

/* ── Display ──────────────────────────────────────────────────────────── */

export const FAN_KIND_LABEL: Record<FanLedgerType, string> = {
  flight: 'Flight',
  stays: 'Stay',
  esim: 'eSIM',
}

/** The headline: where you are going, where you are staying, what you bought. */
export function fanTitle(l: FanLedger): string {
  if (l.ledger_type === 'flight') {
    const { origin, destination, airline_name } = l.summary
    if (origin && destination) return `${origin} → ${destination}`
    return airline_name || 'Flight booking'
  }
  if (l.ledger_type === 'esim') return l.summary.package || 'eSIM package'
  return l.summary.hotel_name || 'Hotel stay'
}

/** The facts a fan actually needs at the gate, the desk or the airport.
 *  Falsy entries are dropped so a missing PNR leaves no empty bullet. */
export function fanMeta(l: FanLedger): string[] {
  if (l.ledger_type === 'flight') {
    return [
      l.summary.departure_date ? `Departs ${fanDate(l.summary.departure_date)}` : '',
      l.summary.pnr_reference ? `PNR ${l.summary.pnr_reference}` : '',
      l.summary.airline_name ?? '',
    ].filter(Boolean)
  }
  if (l.ledger_type === 'esim') {
    if (fanIsFreeEsim(l)) {
      const ref = fanFreeEsimMatchRef(l)
      return [
        FREE_ESIM_CUSTOMER_LABEL,
        ref ? `Match booking ${ref}` : '',
        l.summary.iccid ? `ICCID ${l.summary.iccid}` : '',
      ].filter(Boolean)
    }
    return [
      l.summary.iccid ? `ICCID ${l.summary.iccid}` : 'Data plan',
      l.summary.package_id ?? '',
    ].filter(Boolean)
  }
  const nights = countNights(l.summary.checkin, l.summary.checkout)
  return [
    l.summary.checkin
      ? `${fanDate(l.summary.checkin)} – ${fanDate(l.summary.checkout)}${nights ? ` · ${nights} night${nights === 1 ? '' : 's'}` : ''}`
      : '',
    l.summary.confirmation_number ? `Conf ${l.summary.confirmation_number}` : '',
  ].filter(Boolean)
}

function countNights(checkin: string | null, checkout: string | null): number | null {
  const a = parsed(checkin)
  const b = parsed(checkout)
  if (!a || !b) return null
  const nights = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  return nights > 0 ? nights : null
}

/** The document a fan is looking for when they open this order. */
export const FAN_DOC_LABEL: Record<FanLedgerType, string> = {
  flight: 'E-ticket',
  stays: 'Voucher',
  esim: 'Install',
}

/** Reference to quote to support. Falls back to the ledger id, which always
 *  exists — never an empty string. */
export function fanRef(l: FanLedger): string {
  if (l.ledger_type === 'flight') {
    return l.summary.pnr_reference || l.summary.duffel_order_id || String(l.ledger_id)
  }
  if (l.ledger_type === 'esim') return l.summary.airalo_order_id || String(l.ledger_id)
  return l.summary.confirmation_number || l.summary.booking_id || String(l.ledger_id)
}

/* ── Home ─────────────────────────────────────────────────────────────────
   Scenario 3: "relevant travel essentials should be displayed". Relevant means
   the ones still ahead of the fan, one per product — not the whole history.
   Cancelled orders are excluded everywhere here. */

export function upcomingLedgers(ledgers: FanLedger[], now = new Date()): FanLedger[] {
  return ledgers
    .filter((l) => fanTab(l, now) === 'upcoming')
    .sort((a, b) => {
      const da = tripDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const db = tripDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return da - db
    })
}

/** Up to three cards: the soonest live flight, stay and eSIM. */
export function essentials(ledgers: FanLedger[], now = new Date()): FanLedger[] {
  const upcoming = upcomingLedgers(ledgers, now)
  const order: FanLedgerType[] = ['flight', 'stays', 'esim']
  return order
    .map((type) => upcoming.find((l) => l.ledger_type === type))
    .filter((l): l is FanLedger => Boolean(l))
}

/** The soonest upcoming flight, for the Home hero. Null when there is none —
 *  Home shows its empty state rather than an invented card. */
export function nextFlight(ledgers: FanLedger[], now = new Date()): FanLedger | null {
  return (
    upcomingLedgers(ledgers, now).find((l) => l.ledger_type === 'flight' && tripDate(l)) ?? null
  )
}

export function countByTab(ledgers: FanLedger[], now = new Date()): Record<FanTab, number> {
  const counts: Record<FanTab, number> = { upcoming: 0, past: 0, cancelled: 0 }
  for (const l of ledgers) counts[fanTab(l, now)] += 1
  return counts
}
