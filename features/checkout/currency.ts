// features/checkout/currency.ts
//
// All combined-checkout amounts are EUR-normalized server-side (see
// docs/checkout-api-contract.md, "Currency" section) — this is display
// formatting only, not conversion.

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
