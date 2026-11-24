/* VIP packages admin API. Same live/mock switch as the customer side
 * (NEXT_PUBLIC_VIP_API_MODE, features/vip/mode.ts): "mock" answers in the
 * browser from ./mock.ts, anything else calls the backend.
 *
 * Paths: the contract says /api/v1/admin/...; golaflyAxios is based at
 * {API}/api, so the paths here start at /v1. Same admin token as the rest of
 * the admin. These endpoints are NOT behind the customer VIP flag, so CS can
 * work packages while VIP is switched off for customers. */

import golaflyAxios from '@/services/golafly-axios'
import { isVipMock } from '@/features/vip/mode'
import type {
  VipAdminListFilters,
  VipAdminListResponse,
  VipAdminPackage,
  VipAdminSettings,
  VipAdminSettingsPatch,
  VipEnvelope,
  VipRefundBody,
  VipRefundResult,
  VipReleaseBody,
  VipReleaseResult,
} from './types'

export const VIP_ADMIN_ENDPOINT = '/v1/admin/hospitality/packages'
export const VIP_ADMIN_SETTINGS_ENDPOINT = '/v1/admin/hospitality/settings'
export const VIP_ADMIN_MOCK = isVipMock

const mock = () => import('./mock')

/** The on/off switch and the mode (contract §1.3). Full admins only (403
 *  for others). Works while VIP is off for customers. */
export async function getVipSettings(): Promise<VipEnvelope<VipAdminSettings>> {
  if (isVipMock) return (await mock()).mockGetSettings()
  const { data } = await golaflyAxios.get<VipEnvelope<VipAdminSettings>>(VIP_ADMIN_SETTINGS_ENDPOINT)
  return data
}

export async function updateVipSettings(body: VipAdminSettingsPatch): Promise<VipEnvelope<VipAdminSettings>> {
  if (isVipMock) return (await mock()).mockUpdateSettings(body)
  const { data } = await golaflyAxios.patch<VipEnvelope<VipAdminSettings>>(VIP_ADMIN_SETTINGS_ENDPOINT, body)
  return data
}

export async function listVipPackages(filters: VipAdminListFilters): Promise<VipAdminListResponse> {
  if (isVipMock) return (await mock()).mockListPackages(filters)
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.club) params.club = filters.club
  if (filters.from_date) params.from_date = filters.from_date
  if (filters.to_date) params.to_date = filters.to_date
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page
  const { data } = await golaflyAxios.get<VipAdminListResponse>(VIP_ADMIN_ENDPOINT, { params })
  return data
}

export async function getVipPackage(id: string): Promise<VipEnvelope<VipAdminPackage>> {
  if (isVipMock) return (await mock()).mockGetPackage(id)
  const { data } = await golaflyAxios.get<VipEnvelope<VipAdminPackage>>(
    `${VIP_ADMIN_ENDPOINT}/${encodeURIComponent(id)}`,
  )
  return data
}

export async function releaseVipPackage(id: string, body: VipReleaseBody): Promise<VipEnvelope<VipReleaseResult>> {
  if (isVipMock) return (await mock()).mockRelease(id, body)
  const { data } = await golaflyAxios.post<VipEnvelope<VipReleaseResult>>(
    `${VIP_ADMIN_ENDPOINT}/${encodeURIComponent(id)}/release`,
    body,
  )
  return data
}

/** The backend hands each item's endpoints as "/api/v1/…"; golaflyAxios
 *  already adds "/api". */
const toAxiosPath = (href: string) => href.replace(/^\/api(?=\/)/, '')

/** Refund a held item (contract §6) through the item's actions.refund.href. */
export async function refundVipItem(
  ledgerId: number,
  href: string,
  body: VipRefundBody,
): Promise<VipEnvelope<VipRefundResult>> {
  if (isVipMock) return (await mock()).mockRefundItem(ledgerId, body)
  const { data } = await golaflyAxios.post<VipEnvelope<VipRefundResult>>(toAxiosPath(href), body)
  return data
}
