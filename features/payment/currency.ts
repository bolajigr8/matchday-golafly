// features/payment/currency.ts

const SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  AED: 'AED',
  SAR: 'SAR',
  AUD: 'A$',
  CAD: 'C$',
}

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code
}

/** The backend now sends pricing.amount_paid_minor already converted
 * to major units — do not divide by 100 here again (that caused the
 * double-conversion). This just formats it. */
export function formatMinorAmount(
  amountMinor: number,
  currency: string,
): string {
  return `${currencySymbol(currency)}${amountMinor.toFixed(2)}`
}
