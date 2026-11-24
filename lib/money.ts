export const EM_DASH = '—'

/** "€100.00", "£85.00", "$20.00". `amount` is in MAJOR units. */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string,
  decimals = 2,
): string {
  if (amount == null || !Number.isFinite(amount)) return EM_DASH
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(decimals)}`
  }
}

/** Euros from the `eur` block: "€100.00". */
export function formatEur(
  amount: number | null | undefined,
  decimals = 2,
): string {
  return formatCurrency(amount, 'EUR', decimals)
}

/** Just the symbol for a code: EUR → "€", GBP → "£", USD → "$". */
export function currencySymbol(currency: string): string {
  try {
    const part = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency')
    return part?.value ?? currency
  } catch {
    return currency
  }
}

/** "paid £85.00", the reference line shown beside a EUR figure. */
export function paidReference(
  amount: number | null | undefined,
  currency: string,
): string {
  return `paid ${formatCurrency(amount, currency)}`
}

/* ── Minor-unit helpers (kept from the previous file) ─────────────────── */

/** `100325` → "1,003.25". No symbol; for places that print their own. */
export function minorToDisplay(minor: number | null | undefined): string {
  if (minor == null || Number.isNaN(minor)) return '0.00'
  return (minor / 100).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** `100325, 'EUR'` → "€1,003.25". Takes MINOR units.
 *  A missing value is now an em-dash rather than "EUR 0.00". */
export function formatMinor(
  minor: number | null | undefined,
  currency: string,
): string {
  if (minor == null || Number.isNaN(minor)) return EM_DASH
  return formatCurrency(minor / 100, currency)
}

/** Already-major decimal strings ("1003.25"), such as the overview summary's
 *  `amount`. Formats without dividing. */
export function formatAmountString(
  amount: string | null | undefined,
  currency: string,
): string {
  if (amount == null || amount === '') return EM_DASH
  const n = Number(amount)
  if (Number.isNaN(n)) return EM_DASH
  return formatCurrency(n, currency)
}
