// features/vip/errors.ts
//
// Every VIP API failure becomes a VipApiError. The contract says the
// backend's `message` is written for the customer and must be shown as is
// (section 8), so the pages only ever print `error.message`.

import { isAxiosError } from 'axios'

export class VipApiError extends Error {
  /** HTTP status; 0 = no answer (network). */
  readonly status: number
  /** 422 validation errors keyed by field, e.g. { quantity: ['…'] }. */
  readonly fieldErrors: Record<string, string[]> | null
  /** 429 only: seconds to wait before one retry. */
  readonly retryAfter: number | null

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> | null = null,
    retryAfter: number | null = null,
  ) {
    super(message)
    this.name = 'VipApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryAfter = retryAfter
  }
}

const FALLBACK = 'Something went wrong. Please try again.'

/** The contract's words for VIP being switched off (409 at checkout). The
 *  same words are used for the empty 404 every VIP route answers while an
 *  admin has VIP switched off (contract §1). */
export const VIP_UNAVAILABLE = 'VIP packages are unavailable right now.'

/** Turns anything thrown by a VIP call into a VipApiError. */
export function toVipError(err: unknown): VipApiError {
  if (err instanceof VipApiError) {
    return err.status === 404 && !err.message ? new VipApiError(VIP_UNAVAILABLE, 404) : err
  }
  if (isAxiosError(err)) {
    const status = err.response?.status ?? 0
    const data = err.response?.data as
      | { message?: unknown; errors?: unknown }
      | undefined
    const raw = typeof data?.message === 'string' ? data.message.trim() : ''
    const fields =
      data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)
        ? (data.errors as Record<string, string[]>)
        : null
    const retryHeader = Number(err.response?.headers?.['retry-after'])
    const retryAfter = status === 429 && Number.isFinite(retryHeader) ? retryHeader : null
    if (status === 0) {
      return new VipApiError('We could not reach Golafly. Check your connection and try again.', 0)
    }
    /* Switched off: every /hospitality route is a 404 with an empty
       message (a missing package says "Package not found."). */
    if (status === 404 && !raw) return new VipApiError(VIP_UNAVAILABLE, 404)
    /* A 422 "Validation failed" carries the useful words in `errors`. */
    if (status === 422 && raw === 'Validation failed' && fields) {
      const first = Object.values(fields).flat().find((m) => typeof m === 'string')
      return new VipApiError(first ?? raw, status, fields)
    }
    return new VipApiError(raw || FALLBACK, status, fields, retryAfter)
  }
  if (err instanceof Error && err.message) return new VipApiError(err.message, 0)
  return new VipApiError(FALLBACK, 0)
}

/** The step a checkout/package error sends the customer back to. */
export function expiredStepOf(message: string): 'flight' | 'hotel' | 'ticket' | null {
  const m = message.toLowerCase()
  if (m.includes('flight price expired') || m.includes('flight has expired') || m.includes('add a flight')) return 'flight'
  if (m.includes('hotel price expired') || m.includes('add a hotel') || m.includes('choose your hotel again')) return 'hotel'
  if (m.includes('add a ticket')) return 'ticket'
  return null
}

/** True while an admin has VIP packages switched off: the empty 404 on
 *  any /hospitality route, or the 409 at checkout. */
export function isVipSwitchedOff(err: unknown): boolean {
  const e = toVipError(err)
  return (e.status === 404 || e.status === 409) && e.message === VIP_UNAVAILABLE
}
