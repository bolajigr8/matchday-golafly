const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AED: 'د.إ',
}

/**
 * Defaults to the euro symbol when no currency code is available yet
 * (e.g. before an offer has loaded) — this app's real bookings are
 * priced in EUR, so that's the correct default rather than blank or $.
 */
export function currencySymbol(code?: string | null): string {
  if (!code) return '€'
  return CURRENCY_SYMBOLS[code] ?? `${code} `
}
