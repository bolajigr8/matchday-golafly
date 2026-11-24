/**
 * Renders a free-cancellation deadline the way ETG's certification review
 * requires: in the HOTEL's own clock, always with a time, never a bare
 * date. Truncating to a date is what caused the original bug — two
 * penalty tiers on the same calendar day read as contradicting each
 * other without the time attached.
 *
 * Prefer the pre-formatted `display` value the API now returns
 * (`free_cancellation_before_display`) — it's already correct and can't
 * be misread. This function is the fallback for the rare case you only
 * have the raw ISO instant and a timezone (e.g. a cancellation_policy
 * tier boundary that has no matching `_display` field).
 */
export function formatHotelDeadline(
  isoInstant: string | null,
  hotelTimezone: string,
): string | null {
  if (!isoInstant) return null
  try {
    return new Date(isoInstant).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: hotelTimezone || 'UTC',
    })
  } catch {
    // Invalid/unrecognised timeZone string — fall back to UTC rather
    // than silently rendering in the viewer's local clock.
    return new Date(isoInstant).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    })
  }
}

/**
 * Best-of-both accessor for a room/rate's free-cancellation deadline:
 * uses the API's pre-formatted display string when present, otherwise
 * formats the raw instant in the hotel's own timezone. Returns null when
 * there is no free-cancellation window at all (a normal, non-error
 * state for non-refundable rates).
 */
export function isStayRateRefundable(
  rate:
    | {
        is_refundable?: boolean | null
      }
    | null
    | undefined,
): boolean {
  // Deliberately strict: ETG may omit the field or return null. Neither
  // should ever cause the UI to promise cancellation/refundability.
  return rate?.is_refundable === true
}

export function getFreeCancellationLabel(rate: {
  is_refundable?: boolean | null
  free_cancellation_before?: string | null
  free_cancellation_before_display?: string | null
  hotel_timezone?: string
}): string | null {
  if (!isStayRateRefundable(rate)) return null
  if (!rate.free_cancellation_before) return null
  if (rate.free_cancellation_before_display) {
    return rate.free_cancellation_before_display
  }
  return formatHotelDeadline(
    rate.free_cancellation_before,
    rate.hotel_timezone ?? 'UTC',
  )
}

/**
 * Labels a cancellation_policy tier boundary. A tier with both start_at
 * and end_at null applies "any time" (i.e. it's the non-refundable
 * catch-all) — label it as such rather than as a date.
 */
export function formatPolicyBoundary(
  isoInstant: string | null,
  hotelTimezone: string | undefined,
): string {
  if (!isoInstant) return 'any time'
  return formatHotelDeadline(isoInstant, hotelTimezone ?? 'UTC') ?? 'any time'
}

function formatInTimeZone(
  isoInstant: string,
  timeZone: string | undefined,
): string {
  return new Date(isoInstant).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
    timeZone, // undefined = viewer's local timezone
  })
}

/**
 * Builds the two-timezone cancellation sentence, e.g.:
 * "Free cancellation before 4:00 PM Sep 14, 2026 (hotel time) -
 *  that's 9:00 PM Sep 14, 2026 your time"
 *
 * Always computed from the raw ISO instant — deliberately does NOT use
 * `free_cancellation_before_display` from the API, since that's the
 * verbatim string we're trying to move away from.
 */
export function formatCancellationDeadline(
  isoInstant: string | null,
  hotelTimezone: string | undefined,
): { hotel: string; local: string; sameTime: boolean } | null {
  if (!isoInstant) return null

  let hotel: string
  try {
    hotel = formatInTimeZone(isoInstant, hotelTimezone || 'UTC')
  } catch {
    // Invalid/unrecognised timeZone string — fall back to UTC.
    hotel = formatInTimeZone(isoInstant, 'UTC')
  }
  const local = formatInTimeZone(isoInstant, undefined)

  return { hotel, local, sameTime: hotel === local }
}
