// features/stays/fees.tsx
//
// Handles the "fees_payable_at_property" / "total_payable_at_property"
// data that comes back on rooms and prebook rates. This money is
// collected by the hotel on arrival — it is NEVER added to total_price
// and must never be summed into the booking total anywhere in the UI.

export interface PropertyFee {
  name: string
  amount: number
  currency: string
}

export interface PropertyFeeTotal {
  amount: number
  currency: string
}

export interface HasPropertyFees {
  fees_payable_at_property?: PropertyFee[] | null
  total_payable_at_property?: PropertyFeeTotal | null
}

/**
 * Returns the amount payable directly at the property, or null when
 * there is none. Prefers the API's own pre-summed
 * `total_payable_at_property`; falls back to summing
 * `fees_payable_at_property` when that isn't present.
 */
export function getPropertyFeeTotal(
  entity?: HasPropertyFees | null,
): PropertyFeeTotal | null {
  if (!entity) return null

  if (
    entity.total_payable_at_property &&
    entity.total_payable_at_property.amount > 0
  ) {
    return entity.total_payable_at_property
  }

  const fees = entity.fees_payable_at_property
  if (fees && fees.length > 0) {
    const currency = fees[0].currency
    const amount = fees.reduce((sum, f) => sum + (f.amount || 0), 0)
    if (amount > 0) return { amount, currency }
  }

  return null
}

/**
 * Human-readable caption for a property-fee total, for display next to
 * (never folded into) a room/rate total.
 *
 * Deliberately does NOT use a "+" prefix — "+ €10.00 due at hotel" reads
 * as "add this to the total above," which is the opposite of what's
 * true: this amount is never included in or added to total_price
 * anywhere. Every call site should use this instead of hand-rolling the
 * string, so the wording — and the "not included" framing — stays
 * consistent everywhere it's shown.
 */
export function formatPropertyFeeCaption(
  fee: PropertyFeeTotal | null,
  currencySymbol: (code: string) => string,
): string | null {
  if (!fee) return null
  return `${currencySymbol(fee.currency)}${fee.amount.toFixed(2)} payable at the property (not included above)`
}
