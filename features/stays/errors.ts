import type { AxiosError } from 'axios'
import type { StayErrorSlug } from './types'

interface ParsedStayError {
  /** Stable slug to branch on, e.g. 'occupancy_mismatch'. Undefined for
   * plain Laravel validation failures (no slug) or unrecognised errors. */
  slug: StayErrorSlug | string | undefined
  /** Human-readable message — safe to show directly when it's the kind
   * of error meant for customers (see callers for which ones are). */
  message: string
  /** Field-keyed validation errors, present only for Laravel 422s that
   * don't carry an `error` slug (e.g. a malformed /prebook request). */
  fieldErrors?: Record<string, string[]>
  httpStatus?: number
}

/** Shape of the Stays API's failure response bodies — both the
 * `{error: slug}` envelope and the slug-less Laravel validation 422 are
 * optional/partial here since either set of fields may be absent. */
interface StayErrorBody {
  success?: false
  message?: string
  data?: null
  error?: string
  errors?: Record<string, string[]>
}

/**
 * Parses any Stays API failure into a consistent shape, regardless of
 * whether it's the standard `{ success, message, data, error }` envelope
 * or a slug-less Laravel validation 422 (`{ success, message, errors }`).
 */
export function parseStayError(err: unknown): ParsedStayError {
  const axiosErr = err as AxiosError<StayErrorBody>
  const body = axiosErr?.response?.data
  const httpStatus = axiosErr?.response?.status

  if (body && typeof body === 'object') {
    if (typeof body.error === 'string') {
      return {
        slug: body.error,
        message: body.message ?? 'Something went wrong.',
        httpStatus,
      }
    }
    if (body.errors && typeof body.errors === 'object') {
      return {
        slug: undefined,
        message: body.message ?? 'Please check the form and try again.',
        fieldErrors: body.errors,
        httpStatus,
      }
    }
    if (typeof body.message === 'string') {
      return { slug: undefined, message: body.message, httpStatus }
    }
  }

  return {
    slug: undefined,
    message: axiosErr?.message ?? 'Something went wrong. Please try again.',
    httpStatus,
  }
}

export function isOccupancyMismatch(err: unknown): boolean {
  return parseStayError(err).slug === 'occupancy_mismatch'
}

export function isPrebookRequired(err: unknown): boolean {
  return parseStayError(err).slug === 'prebook_required'
}

export function isInvalidRateHash(err: unknown): boolean {
  return parseStayError(err).slug === 'invalid_rate_hash'
}
