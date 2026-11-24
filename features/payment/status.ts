// features/payment/status.ts

/**
 * Ledger statuses that mean "stop polling — we have a final answer".
 * `payment_received_booking_failed` is terminal from the payment/ledger
 * perspective but means money was received and the booking failed, so the UI
 * must not describe it as an ordinary successful booking.
 */
export const TERMINAL_TRANSACTION_STATUSES = new Set([
  'confirmed',
  'cancelled',
  'failed',
  'payment_received_booking_failed',
  'expired',
])

export function isTerminalTransactionStatus(status?: string | null): boolean {
  return !!status && TERMINAL_TRANSACTION_STATUSES.has(status)
}

export function isSuccessfulTransactionStatus(status?: string | null): boolean {
  return status === 'confirmed'
}

/* ── Booking resolution (backend contract v1.0, 6 Nov 2026) ──────────────
   A paid booking the supplier could not complete is no longer refunded
   automatically: it goes to Golafly support, who rebook it (or, last resort,
   refund it by hand). While support has it, the customer endpoints send one
   of the "still working on it" words below and NO failure details. */

/** `resolution` on every customer-facing booking object. null = as before. */
export type BookingResolution = 'rebooked' | 'refunded' | null

/** confirming (flight, ledger endpoint), needs_reconciliation (hotel, and every
 *  product on the account list), processing (eSIM, and a whole basket). */
export const WITH_SUPPORT_STATUSES = new Set([
  'confirming',
  'needs_reconciliation',
  'processing',
])

/** Paid, not yet confirmed, and the backend says it is still being finished.
 *  Never show "failed" or "refunded" for these. */
export function isFinishingBooking(
  status?: string | null,
  paymentStatus?: string | null,
): boolean {
  return paymentStatus === 'paid' && !!status && WITH_SUPPORT_STATUSES.has(status)
}

/** How long the confirmation pages show "Confirming…" before switching to
 *  the calm "we'll email you" message. A normal booking confirms well before. */
export const FINISHING_MESSAGE_AFTER_MS = 3 * 60_000

/** The customer copy for a booking support is finishing (contract §1.2). */
export const FINISHING_BOOKING_COPY = {
  title: 'We’re finishing your booking',
  message:
    'Your payment is safe. We’re finishing your booking and will email you within 2 hours. Please don’t pay again.',
}

export function isInFlightTransactionStatus(status?: string | null): boolean {
  return !!status && !isTerminalTransactionStatus(status)
}

/* ── A paid booking that failed (Citizenship, room name and failed hotel
   API contract v1.0, section 4) ──────────────────────────────────────── */

export const PAID_BOOKING_FAILED = 'payment_received_booking_failed'

export interface BookingOutcomeRow {
  label: string
  status: string
  /** The backend's own text, shown exactly as sent. null when there is none. */
  message: string | null
  failed: boolean
}

interface OutcomeEntry {
  status?: string
  failure_message?: string
  stays?: unknown
  flight?: unknown
  esim?: unknown
  matchday?: unknown
}

function labelOf(entry: OutcomeEntry): string {
  if (entry.stays) return 'Hotel'
  if (entry.flight) return 'Flight'
  if (entry.esim) return 'eSIM'
  if (entry.matchday) return 'Match tickets'
  return 'Booking'
}

/** Short, neutral status words for one booking on the success page. */
export function outcomeStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case PAID_BOOKING_FAILED:
      return 'Our team is on it'
    case 'awaiting_attendees':
      return 'Needs ticket holder details'
    case 'failed':
      return 'Not completed'
    default:
      return 'Being confirmed'
  }
}

/**
 * One row per booking when the combined status is
 * payment_received_booking_failed: the contract puts no failure_message at
 * the top level of a cart, so every item shows its own status and message.
 * A single (express) purchase gives one row from the top level.
 */
export function bookingOutcomeRows(tx: OutcomeEntry & { items?: OutcomeEntry[] }): BookingOutcomeRow[] {
  const entries = tx.items?.length ? tx.items : [tx]
  return entries.map((e) => {
    const status = e.status ?? ''
    const message = typeof e.failure_message === 'string' && e.failure_message.trim() ? e.failure_message : null
    return { label: labelOf(e), status, message, failed: status === PAID_BOOKING_FAILED }
  })
}
