import axiosInstance from '@/lib/axios'
import {
  captureCartTokenFromResponse,
  cartRequestHeaders,
  setCartToken,
} from '@/lib/cart-token'

import type {
  BlockedCurrencyItem,
  CartApiEsimPayload,
  CartApiFlightPayload,
  CartApiMatchDayPayload,
  CartApiResponse,
  CartApiStayPayload,
  CartCheckoutPayload,
  CartCheckoutResult,
  CartSummary,
} from './types'

function captureCartToken(
  response: { data?: object | null },
  headers: unknown,
): void {
  const token =
    response?.data &&
    'guest_token' in response.data &&
    typeof (response.data as { guest_token?: unknown }).guest_token === 'string'
      ? (response.data as { guest_token: string }).guest_token
      : undefined

  if (token) {
    setCartToken(token)
  }

  if (headers && typeof headers === 'object') {
    captureCartTokenFromResponse(headers as Record<string, unknown>)
  }
}

/** Browser event carrying a cart the server just returned (an add or a
 *  remove). CartProvider listens so its price breakdown is never left
 *  describing the cart as it was before the change. Coupon PREVIEWS are
 *  deliberately never published: their summary has a discount in it. */
export const CART_UPDATED_EVENT = 'gf-cart-updated'

function publishCart(response: unknown): void {
  if (typeof window === 'undefined') return
  const cart = (response as { data?: unknown } | null)?.data
  if (typeof cart !== 'object' || cart === null) return
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: cart }))
}

export async function addFlightToCartApi(
  payload: CartApiFlightPayload,
): Promise<CartApiResponse<CartSummary>> {
  const { data, headers } = await axiosInstance.post<
    CartApiResponse<CartSummary>
  >('/api/v1/cart/flights', payload, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)

  return data
}

export async function addEsimToCartApi(
  payload: CartApiEsimPayload,
): Promise<CartApiResponse<CartSummary>> {
  const { data, headers } = await axiosInstance.post<
    CartApiResponse<CartSummary>
  >('/api/v1/cart/esim', payload, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)

  return data
}

export async function addStayToCartApi(
  payload: CartApiStayPayload,
): Promise<CartApiResponse<CartSummary>> {
  const { data, headers } = await axiosInstance.post<
    CartApiResponse<CartSummary>
  >('/api/v1/cart/stays', payload, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)

  return data
}

export async function addMatchDayToCartApi(
  payload: CartApiMatchDayPayload,
): Promise<CartApiResponse<CartSummary>> {
  const { data, headers } = await axiosInstance.post<
    CartApiResponse<CartSummary>
  >('/api/v1/cart/matchday', payload, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)

  return data
}

export async function checkoutCartApi(
  payload: CartCheckoutPayload,
): Promise<CartApiResponse<CartCheckoutResult>> {
  const { data, headers } = await axiosInstance.post<
    CartApiResponse<CartCheckoutResult>
  >('/api/v1/cart/checkout', payload, {
    headers: cartRequestHeaders(),
    timeout: 60_000,
  })

  captureCartToken(data, headers)

  return data
}

/**
 * GET /api/v1/cart. Pass `couponCode` to PREVIEW a coupon: the backend runs
 * exactly the calculation checkout uses, so the preview always matches what
 * will be charged. A valid code fills `price_summary.discount` and lowers
 * `price_summary.total`; an invalid / expired / not-applicable one still
 * returns the cart normally, with `discount: null` and a top-level
 * `coupon_error` string. A bad code never makes this call fail.
 */
export async function getCartApi(opts?: {
  couponCode?: string
}): Promise<CartApiResponse<CartSummary>> {
  const couponCode = opts?.couponCode?.trim()
  const { data, headers } = await axiosInstance.get<
    CartApiResponse<CartSummary>
  >('/api/v1/cart', {
    headers: cartRequestHeaders(),
    ...(couponCode ? { params: { coupon_code: couponCode } } : {}),
  })

  captureCartToken(data, headers)

  return data
}

export async function removeCartItemApi(itemId: string): Promise<void> {
  const { data, headers } = await axiosInstance.delete<
    CartApiResponse<CartSummary>
  >(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)
}

export async function clearCartApi(): Promise<void> {
  const { data, headers } = await axiosInstance.delete<
    CartApiResponse<CartSummary>
  >('/api/v1/cart', {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)
  publishCart(data)
}

// ── Explicit-token variants ─────────────────────────────────────────────
// Used only by /payment-success on golafly.com to tidy up a cart that a
// landing page (championsleague.golafly.com …) filled: that guest cart's
// token lives in the landing address's own storage, so the token is handed
// over in a cookie (lib/landing-return.ts) and passed in here directly.
// They deliberately do NOT store the token in this browser's localStorage and
// do not touch the main site's own cart identity.

export async function getCartForTokenApi(
  token: string,
): Promise<CartApiResponse<CartSummary>> {
  const { data } = await axiosInstance.get<CartApiResponse<CartSummary>>(
    '/api/v1/cart',
    { headers: { 'X-Cart-Token': token } },
  )
  return data
}

export async function removeCartItemForTokenApi(
  token: string,
  itemId: string,
): Promise<void> {
  await axiosInstance.delete(
    `/api/v1/cart/items/${encodeURIComponent(itemId)}`,
    { headers: { 'X-Cart-Token': token } },
  )
}

export async function clearCartForTokenApi(token: string): Promise<void> {
  await axiosInstance.delete('/api/v1/cart', {
    headers: { 'X-Cart-Token': token },
  })
}

/** Clears the server cart after a fully successful checkout and forgets the
 * guest cart token so the next purchase starts with a fresh cart identity. */
export async function clearCartAndForgetTokenApi(): Promise<void> {
  await clearCartApi()
  setCartToken(null)
}

// ── Currency switching (Multi-Currency Checkout Contract § "The cart") ──
//
// PATCH /api/v1/cart/currency re-prices every item in the cart to the
// requested currency and returns the updated cart — same shape as GET /cart.
//
// Rules from the doc:
//   - All-or-nothing: if any item cannot be re-priced (expired offer, no
//     exchange rate) the call returns 422 with errors keyed by cart item id
//     and nothing changes. Show which item blocked the switch.
//   - Before the server switch is on, this answers 422 "Choosing a currency
//     is not available yet." Hide the picker or handle that message.
//   - The X-Currency header is already injected by lib/axios.ts's interceptor
//     on every request; the caller sets the store first so the interceptor
//     picks up the new value for this request too.

export interface UpdateCartCurrencyPayload {
  /** One of: EUR, GBP, USD */
  currency: string
}

export async function updateCartCurrencyApi(
  payload: UpdateCartCurrencyPayload,
): Promise<CartApiResponse<CartSummary>> {
  const { data, headers } = await axiosInstance.patch<
    CartApiResponse<CartSummary>
  >('/api/v1/cart/currency', payload, {
    headers: cartRequestHeaders(),
  })

  captureCartToken(data, headers)

  return data
}

/**
 * A currency switch (PATCH /api/v1/cart/currency) is all-or-nothing: a
 * 422 means the cart was left untouched and `errors` is keyed by cart
 * item id, each value one or more reasons that item can't be re-priced.
 * Returns null for anything that isn't that specific 422 shape (network
 * error, 401, a plain validation error with no `errors` map, etc.) so
 * callers can fall back to `cartApiError` for a generic message.
 *
 * `cart` is the last-known cart (pre-switch) so we can attach the item
 * itself, not just its id — the panel needs a name to show the user.
 */
export function parseCartCurrencyError(
  err: unknown,
  cart?: CartSummary | null,
): BlockedCurrencyItem[] | null {
  if (typeof err !== 'object' || err === null || !('response' in err)) {
    return null
  }
  const response = (
    err as { response?: { status?: number; data?: unknown } }
  ).response
  if (response?.status !== 422) return null

  const data = response.data as
    | { errors?: Record<string, string[] | string> }
    | undefined
  const errors = data?.errors
  if (!errors || typeof errors !== 'object') return null

  const items = cart?.items ?? []
  return Object.entries(errors).map(([itemId, reasons]) => ({
    itemId,
    reason: Array.isArray(reasons) ? (reasons[0] ?? 'Could not update this item.') : reasons,
    item: items.find((i) => i.id === itemId),
  }))
}

export function cartApiError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (
      err as {
        response?: {
          status?: number
          data?: {
            message?: unknown
            errors?: {
              code?: unknown
              currency?: unknown
              previous_amount_minor?: unknown
              new_amount_minor?: unknown
            }
          }
        }
      }
    ).response
    const data = response?.data
    const errors = data?.errors
    if (
      response?.status === 409 &&
      errors?.code === 'price_changed' &&
      typeof errors.new_amount_minor === 'number'
    ) {
      const currency =
        typeof errors.currency === 'string' && errors.currency !== ''
          ? errors.currency
          : 'EUR'
      const next = (errors.new_amount_minor / 100).toFixed(2)
      const previous =
        typeof errors.previous_amount_minor === 'number'
          ? (errors.previous_amount_minor / 100).toFixed(2)
          : null
      return previous
        ? `Ticket price changed from ${previous} ${currency} to ${next} ${currency}. Review the new total and pay again.`
        : `Ticket price is now ${next} ${currency}. Review the new total and pay again.`
    }
    if (typeof data?.message === 'string' && data.message !== '') {
      return data.message
    }
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return 'Could not update your cart. Please try again.'
}
