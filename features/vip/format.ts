// features/vip/format.ts
//
// Dates and money for the VIP pages.
//
// Match dates: the backend sends the LOCAL kick-off time in Spain without
// an offset ("2027-03-06T21:00:00") and says to show it as given. So these
// helpers read the digits as they are (formatted in UTC, which never
// shifts them): the visitor's own time zone never changes a kick-off time.
// Only the countdown and the calendar file need the real instant
// (kickoffInstant), worked out from the venue's zone.

import { formatCurrency } from '@/lib/money'

export const VIP_MATCH_ZONE = 'Europe/Madrid'

function asUtc(local: string): Date {
  /* Keep only YYYY-MM-DDTHH:mm(:ss); ignore any offset that might appear. */
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?/.exec(local)
  if (!m) return new Date(NaN)
  return new Date(`${m[1]}T${m[2] ?? '00:00'}:${m[3] ?? '00'}Z`)
}

function fmt(local: string, opts: Intl.DateTimeFormatOptions): string {
  const d = asUtc(local)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(d)
}

/** "21:00" */
export function formatVipTime(local: string): string {
  return fmt(local, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "SAT 6 MAR" */
export function formatVipDay(local: string): string {
  return fmt(local, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '').toUpperCase()
}

/** "SAT 6 MAR · 21:00" */
export function formatVipKickoff(local: string): string {
  return `${formatVipDay(local)} · ${formatVipTime(local)}`
}

/** "Saturday 6 March 2027" */
export function formatVipLongDate(local: string): string {
  return fmt(local, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '')
}

/** "Sat 6 Mar 2027" */
export function formatVipMediumDate(local: string): string {
  return fmt(local, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '')
}

/** "Sat 6 Mar" */
export function formatVipShortDate(local: string): string {
  return fmt(local, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
}

/** "YYYY-MM-DD" of a local date-time. */
export function vipYmd(local: string): string {
  return local.slice(0, 10)
}

/** YYYY-MM-DD shifted by whole days. */
export function vipAddDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Today's date (YYYY-MM-DD) in the club's own timezone. */
export function vipTodayYmd(zone = VIP_MATCH_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  )
}

/** Whole days from one YYYY-MM-DD to another. */
export function vipDaysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}

/** The check-in window for a hotel without a flight (flexible mode,
 *  contract 2.4): from the later of today and two days before the match,
 *  up to the match day, all in the club's timezone. null once it's past. */
export function vipHotelCheckInWindow(matchDay: string): { min: string; max: string } | null {
  const today = vipTodayYmd()
  const earliest = vipAddDays(matchDay, -2)
  const min = today > earliest ? today : earliest
  return min <= matchDay ? { min, max: matchDay } : null
}

function zoneOffsetMs(zone: string, at: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(at))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asIfUtc - at
}

/** The real moment of a local kick-off (for the countdown and calendar). */
export function kickoffInstant(local: string, zone = VIP_MATCH_ZONE): Date {
  const guess = asUtc(local).getTime()
  if (Number.isNaN(guess)) return new Date(NaN)
  let at = guess - zoneOffsetMs(zone, guess)
  at = guess - zoneOffsetMs(zone, at)
  return new Date(at)
}

/** "€480" or "€3,961.50": whole numbers without cents. */
export function formatVipPrice(amount: number, currency: string): string {
  return formatCurrency(amount, currency, Number.isInteger(amount) ? 0 : 2)
}

/** Flight times come in the airport's own local time: "08:00". */
export function formatVipClock(localDateTime: string): string {
  const m = /T(\d{2}:\d{2})/.exec(localDateTime)
  return m ? m[1] : ''
}

/** "PT2H10M" → "2h 10m" */
export function formatVipDuration(iso: string | undefined | null): string {
  if (!iso) return ''
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso)
  if (!m) return ''
  const h = Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)
  const min = Number(m[3] ?? 0)
  return [h ? `${h}h` : '', min ? `${min}m` : ''].filter(Boolean).join(' ') || '0m'
}
