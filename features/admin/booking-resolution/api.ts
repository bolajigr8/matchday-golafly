/* Booking resolution admin API — THE ONE PLACE TO SWAP when the backend is live.
 *
 * USE_MOCK = true → everything is answered by ./mock.ts in the browser (the
 * screen shows a "Sample data" banner). Set it to false and the same calls go
 * to the real endpoints below; nothing else needs to change.
 *
 * Paths: the contract says /api/v1/admin/...; golaflyAxios is based at
 * {API}/api, so the paths here start at /v1. Same admin token as the rest of
 * the admin. */

import golaflyAxios from '@/services/golafly-axios'
import * as mock from './mock'
import type {
  ActionRequiredFilters,
  ActionRequiredResponse,
  ActionResult,
  AttachBody,
  ManualBody,
  RefundBody,
  ResolutionEnvelope,
  ResolutionHistoryItem,
  RetryBody,
} from './types'

export const USE_MOCK = false

export const ACTION_REQUIRED_ENDPOINT = '/v1/admin/bookings/action-required'

type Result = Promise<ResolutionEnvelope<ActionResult>>

export async function listActionRequired(
  filters: ActionRequiredFilters,
): Promise<ActionRequiredResponse> {
  if (USE_MOCK) return mock.mockListActionRequired(filters)
  const params: Record<string, string | number> = {}
  if (filters.product) params.product = filters.product
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page
  const { data } = await golaflyAxios.get<ActionRequiredResponse>(ACTION_REQUIRED_ENDPOINT, { params })
  return data
}

export async function getLedgerActions(
  id: number,
): Promise<ResolutionEnvelope<ResolutionHistoryItem[]>> {
  if (USE_MOCK) return mock.mockLedgerActions(id)
  const { data } = await golaflyAxios.get<ResolutionEnvelope<ResolutionHistoryItem[]>>(
    `/v1/admin/ledgers/${id}/actions`,
  )
  return data
}

async function post<B>(id: number, action: string, body: B): Result {
  const { data } = await golaflyAxios.post<ResolutionEnvelope<ActionResult>>(
    `/v1/admin/ledgers/${id}/${action}`,
    body,
  )
  return data
}

export const attachBooking = (id: number, body: AttachBody): Result =>
  USE_MOCK ? mock.mockAttach(id, body) : post(id, 'attach-booking', body)

export const manualBooking = (id: number, body: ManualBody): Result =>
  USE_MOCK ? mock.mockManual(id, body) : post(id, 'manual-booking', body)

export const retryOrder = (id: number, body: RetryBody): Result =>
  USE_MOCK ? mock.mockRetry(id, body) : post(id, 'retry', body)

export const refundLedger = (id: number, body: RefundBody): Result =>
  USE_MOCK ? mock.mockRefund(id, body) : post(id, 'refund', body)
