// features/cart/currency-sync.ts
//
// Single implementation of the cart-currency-switch rules given by the
// backend dev, shared by:
//   - the navbar picker (components/navbar.tsx) — switching currency
//     with items already in the cart
//   - every checkout screen (app/builder/pay/client.tsx and friends) —
//     re-checking on entry, since the header alone does not retroactively
//     re-price a cart that's already been priced in another currency
//
// Rules encoded here:
//   1. Only call PATCH /cart/currency if the cart actually has items.
//   2. All-or-nothing: a 422 means the cart was left untouched. Surface
//      exactly which item(s) blocked it (by id, resolved to a name by
//      the caller/UI) rather than a generic error.
//   3. On success, the response IS the new cart (same shape as GET
//      /cart) — merge it straight back into cart state, don't re-fetch.

import {
  getCartApi,
  parseCartCurrencyError,
  updateCartCurrencyApi,
} from './api'
import type { BlockedCurrencyItem, CartSummary } from './types'

export type CurrencySyncResult =
  | { status: 'noop' } // nothing in the cart to re-price
  | { status: 'ok'; cart: CartSummary }
  | { status: 'blocked'; blockedItems: BlockedCurrencyItem[]; cart: CartSummary }
  | { status: 'error'; message: string }

/**
 * Re-price the server cart into `currency`. Always fetches a fresh cart
 * first (per the doc: "re-fetch the cart when returning to it") so the
 * blocked-item names and the "is there anything to do" check are never
 * working off a stale local copy.
 */
export async function syncCartCurrency(
  currency: string,
): Promise<CurrencySyncResult> {
  let currentCart: CartSummary
  try {
    const current = await getCartApi()
    currentCart = current.data
  } catch {
    return { status: 'error', message: 'Could not read your cart. Please try again.' }
  }

  if (!currentCart.items || currentCart.items.length === 0) {
    return { status: 'noop' }
  }

  if (currentCart.currency === currency) {
    // Already matches — nothing to PATCH, but hand back the fresh cart
    // so callers (checkout screens) still get up-to-date items/prices.
    return { status: 'ok', cart: currentCart }
  }

  try {
    const response = await updateCartCurrencyApi({ currency })
    return { status: 'ok', cart: response.data }
  } catch (err) {
    const blockedItems = parseCartCurrencyError(err, currentCart)
    if (blockedItems) {
      // 422 — cart untouched, still in its previous currency.
      return { status: 'blocked', blockedItems, cart: currentCart }
    }
    return {
      status: 'error',
      message:
        err instanceof Error ? err.message : 'Could not update cart prices.',
    }
  }
}
