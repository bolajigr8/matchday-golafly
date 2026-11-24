import Cookies from 'js-cookie'

/* Admin session storage.
 *
 * Deliberately a PLAIN cookie, not the AES-encrypted one the Golafly frontend
 * used. That project encrypted the token with crypto-js using
 * NEXT_PUBLIC_ENCRYPT_KEY, which has a hardcoded fallback and ships inside the
 * client bundle — so it was obfuscation, not encryption, at the cost of a
 * dependency and a decrypt failure mode. matchday's own lib/axios.ts already
 * stores `matchday:token` as a plain cookie; this matches that.
 *
 * The cookie is readable by proxy.ts, which is what lets the route guard run
 * server-side instead of flashing the dashboard before redirecting.
 */

/* NO COLON IN THESE NAMES, deliberately.
 *
 * js-cookie percent-encodes any character encodeURIComponent escapes, and `:`
 * is one of them — so `golafly:admin-token` is actually written to the jar as
 * `golafly%3Aadmin-token`. js-cookie encodes on read too, so the client never
 * notices. But proxy.ts reads through Next's cookie API, which looks for the
 * literal name, finds nothing, and redirects every authenticated request back
 * to /admin/login. The result is a sign-in that appears to do nothing.
 *
 * The Golafly frontend hit this and papered over it with a
 * LEGACY_TOKEN_COOKIE_KEY = "quick-rooms%3Atoken" fallback. Using a name that
 * survives a round trip is the actual fix. */
export const ADMIN_TOKEN_COOKIE = 'golafly_admin_token'
export const ADMIN_USER_COOKIE = 'golafly_admin_user'

/* Colon-named cookies written before the fix. Removed on sign-out and on
   sign-in so nobody is left with a stale pair the proxy cannot see. */
const LEGACY_COOKIES = ['golafly:admin-token', 'golafly:admin-user']

export interface AdminSessionUser {
  id: number
  name: string
  email: string
  role: string
}

const isSecure =
  typeof window !== 'undefined'
    ? window.location.protocol === 'https:'
    : process.env.NODE_ENV === 'production'

/* 24h, matching the backend's expires_in. sameSite strict because the admin is
   never embedded or linked into from a third party. */
const COOKIE_OPTS = {
  path: '/',
  expires: 1,
  secure: isSecure,
  sameSite: 'strict',
} as const

export function getAdminToken(): string | null {
  return Cookies.get(ADMIN_TOKEN_COOKIE) ?? null
}

export function setAdminSession(token: string, user: AdminSessionUser) {
  for (const name of LEGACY_COOKIES) Cookies.remove(name, { path: '/' })
  Cookies.set(ADMIN_TOKEN_COOKIE, token, COOKIE_OPTS)
  Cookies.set(ADMIN_USER_COOKIE, JSON.stringify(user), COOKIE_OPTS)
}

export function setAdminToken(token: string) {
  Cookies.set(ADMIN_TOKEN_COOKIE, token, COOKIE_OPTS)
}

export function getAdminUser(): AdminSessionUser | null {
  const raw = Cookies.get(ADMIN_USER_COOKIE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminSessionUser
  } catch {
    /* Corrupt cookie is the same as no cookie — /me will refill it. */
    return null
  }
}

export function clearAdminSession() {
  Cookies.remove(ADMIN_TOKEN_COOKIE, { path: '/' })
  Cookies.remove(ADMIN_USER_COOKIE, { path: '/' })
  for (const name of LEGACY_COOKIES) Cookies.remove(name, { path: '/' })
}

/* Initials for the sidebar avatar. "Nathan Adebayo" → "NA", "Nathan" → "NA". */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
