// features/stays/date-validation.ts

export interface DateValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a check-in/check-out pair for stays search. Used by every
 * entry point (search bar, trip-details modal, and any future search
 * form) so date rules never drift out of sync between them.
 *
 * Rules:
 *  - both dates required
 *  - both must parse to real dates
 *  - check-in cannot be before today
 *  - check-out must be strictly after check-in
 */
export function validateStayDates(
  checkinRaw: string,
  checkoutRaw: string,
): DateValidationResult {
  if (!checkinRaw)
    return { valid: false, error: 'Please select a check-in date.' }
  if (!checkoutRaw)
    return { valid: false, error: 'Please select a check-out date.' }

  const checkinDate = new Date(checkinRaw)
  const checkoutDate = new Date(checkoutRaw)

  if (Number.isNaN(checkinDate.getTime())) {
    return { valid: false, error: 'Check-in date is invalid.' }
  }
  if (Number.isNaN(checkoutDate.getTime())) {
    return { valid: false, error: 'Check-out date is invalid.' }
  }

  // Compare by day, not by exact timestamp, so "today" at any time of
  // day is still valid — only genuinely past calendar days are rejected.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  if (checkinDate.getTime() < startOfToday.getTime()) {
    return { valid: false, error: 'Check-in date cannot be in the past.' }
  }
  if (checkoutDate.getTime() <= checkinDate.getTime()) {
    return { valid: false, error: 'Check-out must be after check-in.' }
  }

  return { valid: true }
}

/** Today, formatted as YYYY-MM-DD, for use as an input's `min`. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
