/**
 * Parse a date-only ISO string ("2026-09-20") as a LOCAL calendar date.
 *
 * `new Date('2026-09-20')` is specified to parse as UTC midnight, so anywhere
 * west of Greenwich it formats as the day before — a departure on the 20th
 * rendered as "19 Sep" for every user in the Americas. Splitting the parts and
 * using the multi-argument Date constructor keeps it on the calendar day the
 * string actually names, which is the only thing a date-only value means.
 *
 * Returns null for anything unparseable so callers can fall back to the raw
 * string rather than printing "Invalid Date".
 */
export function isValidISODate(iso?: string | null): boolean {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

export function parseIsoDate(iso?: string | null): Date | null {
  if (!isValidISODate(iso)) return null
  const [y, m, d] = iso!.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Format a date-only ISO string in the viewer's locale, or null. */
export function formatIsoDate(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string | null {
  const date = parseIsoDate(iso)
  return date ? date.toLocaleDateString(undefined, options) : null
}
