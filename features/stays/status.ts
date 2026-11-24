// features/stays/status.ts

/**
 * Statuses that mean "stop polling — we have a final answer." Anything
 * else (a pending/processing status while the backend finalizes with
 * the OTA) keeps polling.
 */
export const TERMINAL_BOOKING_STATUSES = new Set([
  'confirmed',
  'cancelled',
  'payment_received_booking_failed',
  'failed',
])

export function isTerminalBookingStatus(status?: string | null): boolean {
  return !!status && TERMINAL_BOOKING_STATUSES.has(status)
}
