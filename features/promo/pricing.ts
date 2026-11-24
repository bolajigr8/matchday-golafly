// features/promo/pricing.ts
import type { MatchPromo, PromoBand } from './types'

/** The banner's "up to" figure: fixed copy, not read from the bands. */
export const PROMO_HEADLINE_PERCENT = 40

export const PROMO_BANDS: { key: PromoBand; label: string }[] = [
  { key: 'below_100', label: 'Below 100' },
  { key: '100_200', label: '100 – 200' },
  { key: '200_500', label: '200 – 500' },
  { key: '500_1000', label: '500 – 1000' },
  { key: '1000_2000', label: '1000 – 2000' },
  { key: 'above_2000', label: '2000 and above' },
]

/** Same bands as the backend: each band includes its lower bound. */
export function promoBandFor(ticketPrice: number): PromoBand {
  if (ticketPrice < 100) return 'below_100'
  if (ticketPrice < 200) return '100_200'
  if (ticketPrice < 500) return '200_500'
  if (ticketPrice < 1000) return '500_1000'
  if (ticketPrice < 2000) return '1000_2000'
  return 'above_2000'
}

/** Percent off ONE ticket at this price, or 0 when the promo does not apply now. */
export function promoPercentFor(
  promo: MatchPromo | null | undefined,
  ticketPrice: number,
): number {
  if (!promo?.applies_discount || !Number.isFinite(ticketPrice) || ticketPrice <= 0) return 0
  const percent = Number(promo.band_percents?.[promoBandFor(ticketPrice)] ?? 0)
  return Number.isFinite(percent) && percent > 0 && percent <= 90 ? percent : 0
}

/** One ticket after the promo, rounded to the cent the way checkout charges it. */
export function promoTicketPrice(ticketPrice: number, percent: number): number {
  if (!Number.isFinite(ticketPrice) || ticketPrice <= 0 || percent <= 0) return ticketPrice
  const minor = Math.round(ticketPrice * 100)
  return (minor - Math.floor((minor * percent) / 100)) / 100
}

/** "Nov 23–30, 2026" from the promo dates, or null when either is missing. */
export function promoDatesLabel(promo: MatchPromo | null | undefined): string | null {
  if (!promo?.starts_on || !promo.ends_on) return null
  const start = new Date(`${promo.starts_on}T00:00:00`)
  const end = new Date(`${promo.ends_on}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const from = `${month(start)} ${start.getDate()}`
  const to = sameMonth ? `${end.getDate()}` : `${month(end)} ${end.getDate()}`
  return `${from}–${to}, ${end.getFullYear()}`
}
