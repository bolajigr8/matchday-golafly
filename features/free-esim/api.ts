// features/free-esim/api.ts — the only place that talks to the free eSIM
// endpoints (contract §3 and §4).

import axiosInstance from '@/lib/axios'
import golaflyAxios from '@/services/golafly-axios'
import type {
  AdminFreeEsimSettings,
  FreeEsimEnvelope,
  PublicFreeEsimSettings,
  UpdateFreeEsimSettings,
} from './types'

export const ADMIN_FREE_ESIM_ENDPOINT = '/v1/admin/free-esim/settings'
export const PUBLIC_FREE_ESIM_ENDPOINT = '/api/v1/free-esim/settings'

/** Public: is the offer live, and for which matches. No token. */
export async function getPublicFreeEsimSettings(): Promise<PublicFreeEsimSettings> {
  const { data } = await axiosInstance.get<FreeEsimEnvelope<PublicFreeEsimSettings>>(
    PUBLIC_FREE_ESIM_ENDPOINT,
  )
  return data.data
}

export async function getAdminFreeEsimSettings(): Promise<
  FreeEsimEnvelope<AdminFreeEsimSettings>
> {
  const { data } = await golaflyAxios.get<FreeEsimEnvelope<AdminFreeEsimSettings>>(
    ADMIN_FREE_ESIM_ENDPOINT,
  )
  return data
}

/** Always sends both fields (contract §3). Answers with the saved settings. */
export async function updateAdminFreeEsimSettings(
  body: UpdateFreeEsimSettings,
): Promise<FreeEsimEnvelope<AdminFreeEsimSettings>> {
  const { data } = await golaflyAxios.patch<FreeEsimEnvelope<AdminFreeEsimSettings>>(
    ADMIN_FREE_ESIM_ENDPOINT,
    { is_enabled: body.is_enabled, scope: body.scope },
  )
  return data
}
