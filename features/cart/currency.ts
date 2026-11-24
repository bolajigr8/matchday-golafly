import type { CartSummary } from './types'

export function normalizeCartCurrency(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

/**
 * The Cart API currently requires every item in one cart to use the same
 * currency. This is a frontend guard only: it does not convert money.
 */
export function cartCurrencyConflict(
  cart: CartSummary | null | undefined,
  productCurrency: string | null | undefined,
): string | null {
  if (!cart || cart.items.length === 0) return null

  const cartCurrency = normalizeCartCurrency(cart.currency)
  const itemCurrency = normalizeCartCurrency(productCurrency)

  if (!cartCurrency || !itemCurrency || cartCurrency === itemCurrency) {
    return null
  }

  return `Your cart is in ${cartCurrency}, but this item is priced in ${itemCurrency}. The cart currently requires all items to use the same currency. Remove the existing ${cartCurrency} item or choose an item priced in ${cartCurrency}.`
}
