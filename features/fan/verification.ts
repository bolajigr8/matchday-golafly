// features/fan/verification.ts
//
// Account email verification (MatchDay Email verification Postman collection):
// register and login return a token at once, with `user.email_verified`; an
// unverified account is emailed a 6-digit code and must enter it before the
// account pages work. Gated endpoints answer 403 with
// `errors.reason: "email_not_verified"`. Booking (cart, checkout) stays open.

import { Routes } from '@/routes'

export const CODE_LENGTH = 6
/** The backend allows a new code 60 s after the last one. */
export const RESEND_WAIT_SECONDS = 60

/** Only an explicit `false` means unverified: an account from a backend
 *  without verification (no field) keeps working as before. */
export function isUnverified(user: { email_verified?: boolean } | null | undefined): boolean {
  return user?.email_verified === false
}

interface ErrorBody {
  message?: string
  errors?: Record<string, unknown> | null
}

function bodyOf(error: unknown): { status?: number; data?: ErrorBody } {
  const response = (error as { response?: { status?: number; data?: ErrorBody } })?.response
  return { status: response?.status, data: response?.data }
}

/** `errors.reason` from a failure, e.g. "email_code_expired". */
export function errorReason(error: unknown): string | null {
  const reason = bodyOf(error).data?.errors?.reason
  return typeof reason === 'string' ? reason : null
}

/** The 403 the gate sends to an unverified account. */
export function isEmailNotVerified(error: unknown): boolean {
  const { status } = bodyOf(error)
  return status === 403 && errorReason(error) === 'email_not_verified'
}

/** Seconds to wait before asking for another code, when the API says so. */
export function retryAfterSeconds(error: unknown): number | null {
  const n = Number(bodyOf(error).data?.errors?.retry_after_seconds)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** A code-entry failure after which typing again cannot help: ask for a new code. */
export function needsNewCode(reason: string | null): boolean {
  return (
    reason === 'email_code_expired' ||
    reason === 'email_code_missing' ||
    reason === 'email_code_attempts_exceeded'
  )
}

/** The customer message for a failed verify/resend: the API's own text,
 *  except for the bare rate-limit 429 that carries only "Too Many Attempts." */
export function verificationMessage(error: unknown, fallback: string): string {
  const { status, data } = bodyOf(error)
  if (status === 429 && !data?.errors) return 'Too many attempts. Please wait a minute and try again.'
  const first = data?.errors && typeof data.errors === 'object'
    ? Object.values(data.errors).find((v): v is string[] => Array.isArray(v) && typeof v[0] === 'string')?.[0]
    : undefined
  return data?.message ?? first ?? fallback
}

/** Where an unverified account is sent, keeping where it was going. */
export function verifyEmailHref(opts: { email?: string | null; next?: string | null } = {}): string {
  const params = new URLSearchParams()
  if (opts.email) params.set('email', opts.email)
  if (opts.next && opts.next.startsWith('/') && !opts.next.startsWith('//')) params.set('next', opts.next)
  const q = params.toString()
  return q ? `${Routes.verifyEmail}?${q}` : Routes.verifyEmail
}
