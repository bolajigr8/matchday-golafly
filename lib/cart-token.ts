import Cookies from 'js-cookie'

const CART_TOKEN_KEY = 'matchday:cart-token'

export function getCartToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(CART_TOKEN_KEY)
}

export function setCartToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!token) {
    localStorage.removeItem(CART_TOKEN_KEY)
    return
  }

  localStorage.setItem(CART_TOKEN_KEY, token)
}

/**
 * Guest carts send X-Cart-Token. Logged-in users are identified by JWT,
 * so the guest token is omitted.
 */
export function cartRequestHeaders(): Record<string, string> {
  const userToken = Cookies.get('matchday:token')

  if (userToken) {
    return {}
  }

  const cartToken = getCartToken()

  if (!cartToken) {
    return {}
  }

  return {
    'X-Cart-Token': cartToken,
  }
}

export function captureCartTokenFromResponse(
  headers: Record<string, unknown> | undefined,
): void {
  if (!headers) {
    return
  }

  const token =
    (headers['x-cart-token'] as string | undefined) ??
    (headers['X-Cart-Token'] as string | undefined)

  if (token) {
    setCartToken(token)
  }
}
