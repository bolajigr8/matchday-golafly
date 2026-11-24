// features/matchday/format.ts
//
// Doc §01: "Money — decimal numbers in major units (e.g. 152.50), never
// cents" and "Currency — per-listing, usually EUR or GBP. Never assume,
// read it and display it." So every formatter here takes the currency
// explicitly rather than defaulting it, and never divides/multiplies by
// 100 — EXCEPT minorToMajor() below, which exists for the one documented
// exception to that rule.

export function formatMatchdayMoney(
  amount: number,
  currencyCode: string,
): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Unrecognised/placeholder currency code — fall back to a plain
    // "<code> <amount>" rather than letting Intl throw.
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

/** The one place on this whole API where money is NOT already in major
 *  units: the `previous_amount_minor` / `new_amount_minor` fields on the
 *  /pay price-changed 409 (doc §04/§08 rule 03 — "32200 there means
 *  €322.00, divide by 100"). Do not use this anywhere else — every other
 *  amount from this API (price_per_ticket, amount_paid, min_price, etc.)
 *  is already a major-unit decimal and would be corrupted by dividing it
 *  again. */
export function minorToMajor(amountMinor: number): number {
  return amountMinor / 100
}

/** GET /events date filters use dd-mm-yyyy — the one non-ISO date shape
 *  in this API (doc §03). Everything else (event.date, order dates,
 *  attendee date_of_birth) is ISO-8601 / YYYY-MM-DD and needs no helper.
 *
 *  Only pass a `Date` built directly in local time (e.g. `new Date()` for
 *  "today"). Do NOT pass `new Date(isoDateOnlyString)` — a date-only
 *  string like "2026-09-14" parses as UTC midnight per the ECMAScript
 *  spec, and reading it back with the local getters below then shifts it
 *  to the previous day for anyone west of UTC. If you already have a
 *  YYYY-MM-DD string (e.g. from components/ui/date-picker.tsx), use
 *  isoDateStringToEventFilterDate() instead — it never constructs a Date
 *  at all. */
export function toEventFilterDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

/** Same conversion as toEventFilterDate(), but takes the YYYY-MM-DD
 *  string directly (as produced by components/ui/date-picker.tsx) and
 *  rearranges it with plain string splitting — no Date object, so no
 *  timezone parsing ambiguity. This is the one to use for anything
 *  sourced from a date picker's value. */
export function isoDateStringToEventFilterDate(isoDateOnly: string): string {
  const [y, m, d] = isoDateOnly.split('-')
  return `${d}-${m}-${y}`
}

/* ── Kick-off time TBA ──────────────────────────────────────────────
   ASSUMPTION (not confirmed by the API docs, and there is no example in
   the live data): the supplier marks an unknown kick-off by sending the
   time as exactly 00:00, or by sending a date with no time at all. Real
   midnight kick-offs do not happen in the competitions we sell.

   The digits are read straight from the string — never through
   `new Date()` — because the API dates carry no timezone, and converting
   would make the check depend on the visitor's (or server's) timezone.
   This is the ONE place that rule lives; every surface calls it. */
export function isTimeTba(iso: string | null | undefined): boolean {
  if (!iso) return true
  const t = iso.match(/^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/)
  if (!t) return true
  return t[1] === '00' && t[2] === '00'
}

/** A Date for an API event date. A date-only "2026-11-22" is built in
 *  local time (the spec parses it as UTC midnight, which shows the
 *  previous day west of UTC); anything with a time is parsed as before. */
export function parseEventDate(iso: string | null | undefined): Date {
  // The API can send a fixture with no date yet. Return an Invalid Date
  // instead of throwing, so one such fixture cannot take the whole page down.
  if (!iso) return new Date(NaN)
  const d = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (d) return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]))
  return new Date(iso)
}

/** Milliseconds for an event date, or NaN when there is no usable date.
 *  Never pass an event date to `new Date()` directly: `new Date(null)` is
 *  1 January 1970, which sorts and filters as a real (past) date. */
export function eventTime(iso: string | null | undefined): number {
  return parseEventDate(iso).getTime()
}

/** True when the event has a real, parseable date. */
export function hasEventDate(iso: string | null | undefined): boolean {
  return !Number.isNaN(eventTime(iso))
}

/** Sort comparator: soonest first, fixtures without a date last. */
export function compareEventDates(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const ta = eventTime(a)
  const tb = eventTime(b)
  const na = Number.isNaN(ta)
  const nb = Number.isNaN(tb)
  if (na || nb) return na === nb ? 0 : na ? 1 : -1
  return ta - tb
}

/** "16:30", or "TBA" when the kick-off time is not known yet. */
export function formatKickoffTime(iso: string | null | undefined): string {
  if (!iso || isTimeTba(iso)) return 'TBA'
  const date = parseEventDate(iso)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Formats an event's ISO date/time for display, e.g. "14 Sep 2026, 16:30",
 *  or "14 Sep 2026, TBA" when the kick-off time is not known. */
export function formatEventDateTime(iso: string | null): string {
  if (!iso) return 'Date TBC'
  const date = parseEventDate(iso)
  if (Number.isNaN(date.getTime())) return 'Date TBC'
  if (isTimeTba(iso)) {
    const day = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
    return `${day}, TBA`
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Availability is quantity − held_quantity, never quantity alone
 *  (doc §03/§08 rule 02: "Showing quantity alone overstates what can be
 *  bought."). */
export function listingAvailability(
  quantity: number,
  heldQuantity: number,
): number {
  return Math.max(0, quantity - heldQuantity)
}

/** "Emirates Stadium | London, United Kingdom" — the venue line used on
 *  every fixture card. */
export function venueLineOf(event: {
  venue: {
    venue_name: string
    venue_city_name: string
    venue_country_name: string
  }
}): string {
  const place = [event.venue.venue_city_name, event.venue.venue_country_name]
    .filter(Boolean)
    .join(', ')
  return place ? `${event.venue.venue_name} | ${place}` : event.venue.venue_name
}
