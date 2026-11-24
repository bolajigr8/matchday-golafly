import Cookies from 'js-cookie'

/* Fan session storage.
 *
 * Deliberately separate from features/admin/session.ts. They are different
 * audiences, different guards on the backend, and different cookies — a fan
 * must never inherit an admin token, and an admin signing out must not sign a
 * fan out of the same browser.
 */

/* NO COLON IN THESE NAMES, deliberately — the same trap the admin session
 * documents, and one the travels app is still standing in.
 *
 * js-cookie percent-encodes any character encodeURIComponent escapes, and `:`
 * is one of them, so `golafly:token` is written to the jar as
 * `golafly%3Atoken`. js-cookie also encodes on read, so the client never
 * notices. proxy.ts reads through Next's cookie API, which looks for the
 * literal name, finds nothing, and bounces every authenticated request back to
 * /login. The result is a sign-in that appears to do nothing at all.
 *
 * travels/store/auth.ts uses `golafly:token`. Copying that name here would
 * have reproduced the bug in a codebase that had already solved it. */
export const FAN_TOKEN_COOKIE = 'golafly_fan_token'
export const FAN_USER_COOKIE = 'golafly_fan_user'

export interface FanSessionUser {
  id: string
  name: string
  email: string
  role?: string
  /** The player record behind a "player" account, when the login response
   *  carries one. The player dashboard reads the profile from it. */
  player_id?: number | string | null
  /** False while the account's email is unverified. Absent on sessions from
   *  before verification existed: treated as verified (the API still gates). */
  email_verified?: boolean
}

const isSecure =
  typeof window !== 'undefined'
    ? window.location.protocol === 'https:'
    : process.env.NODE_ENV === 'production'

/* sameSite LAX, not the admin's `strict`.
 *
 * A fan arrives here from a payment-confirmation email as often as from the
 * site itself, and `strict` withholds the cookie on cross-site top-level
 * navigation — so that link would land on a dashboard that looks signed out.
 * `lax` sends it on top-level GETs while still withholding it on cross-site
 * POSTs, which is the case CSRF actually cares about. The admin has no such
 * inbound links, so it stays strict. */
const BASE_OPTS = {
  path: '/',
  secure: isSecure,
  sameSite: 'lax',
} as const

/* The backend returns `expires_in` in seconds. Track it rather than hardcoding
 * a week: a cookie that outlives its token leaves the fan past the route guard
 * and then 401ing on every request — signed in by the shell, signed out by the
 * API, with nothing on screen explaining the difference. Falls back to 7 days
 * only when the field is missing. */
const DEFAULT_DAYS = 7
const daysFrom = (expiresInSeconds?: number) => {
  if (!expiresInSeconds || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return DEFAULT_DAYS
  }
  return expiresInSeconds / 86_400
}

export function getFanToken(): string | null {
  return Cookies.get(FAN_TOKEN_COOKIE) ?? null
}

export function setFanSession(
  token: string,
  user: FanSessionUser,
  expiresInSeconds?: number,
) {
  const days = daysFrom(expiresInSeconds)
  const opts = { ...BASE_OPTS, expires: days }
  Cookies.set(FAN_TOKEN_COOKIE, token, opts)
  /* `_exp` remembers when both cookies end, so the user cookie can be
     rewritten later (updateFanUser) without outliving or undercutting the token. */
  Cookies.set(FAN_USER_COOKIE, JSON.stringify({ ...user, _exp: Date.now() + days * 86_400_000 }), opts)
}

export function getFanUser(): FanSessionUser | null {
  const raw = Cookies.get(FAN_USER_COOKIE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as FanSessionUser
  } catch {
    /* A corrupt cookie is the same as no cookie. */
    return null
  }
}

export function clearFanSession() {
  Cookies.remove(FAN_TOKEN_COOKIE, { path: '/' })
  Cookies.remove(FAN_USER_COOKIE, { path: '/' })
}

/** First initial for the avatar. "Adaeze Okonkwo" → "A". */
export function fanInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0].toUpperCase() : 'G'
}

/** "Adaeze Okonkwo" → "Adaeze". Used for the greeting. */
export function firstName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed.split(/\s+/)[0] : 'there'
}

/** Rewrite the stored user (e.g. after the email is verified), keeping the
 *  token and the cookie's remaining lifetime as they are. */
export function updateFanUser(patch: Partial<FanSessionUser>): FanSessionUser | null {
  const user = getFanUser()
  const token = getFanToken()
  if (!user || !token) return null
  const next = { ...user, ...patch }
  const exp = Number((user as { _exp?: number })._exp)
  const expires = Number.isFinite(exp) && exp > Date.now() ? new Date(exp) : DEFAULT_DAYS
  Cookies.set(FAN_USER_COOKIE, JSON.stringify(next), { ...BASE_OPTS, expires })
  return next
}
