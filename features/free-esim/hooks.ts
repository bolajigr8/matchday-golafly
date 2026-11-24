'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminFreeEsimSettings,
  getPublicFreeEsimSettings,
  updateAdminFreeEsimSettings,
} from './api'
import type { UpdateFreeEsimSettings } from './types'

/* Query keys kept local so this feature stays self-contained. */
export const freeEsimKeys = {
  public: ['free-esim', 'public'] as const,
  admin: ['free-esim', 'admin'] as const,
}

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

/** Contract §4. Any failure (e.g. 404/405 before the backend is deployed)
 *  simply means "don't advertise": the message is hidden, nothing is shown
 *  to the customer. */
export function usePublicFreeEsim({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: freeEsimKeys.public,
    queryFn: getPublicFreeEsimSettings,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (count, err) => {
      const status = statusOf(err)
      return status !== 404 && status !== 405 && count < 1
    },
  })
}

export function useAdminFreeEsim() {
  return useQuery({
    queryKey: freeEsimKeys.admin,
    queryFn: getAdminFreeEsimSettings,
    retry: (count, err) => {
      const status = statusOf(err)
      return status !== 401 && status !== 403 && status !== 404 && status !== 405 && count < 2
    },
  })
}

/** Saves; the answer is the saved settings (contract §3). */
export function useUpdateAdminFreeEsim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateFreeEsimSettings) => updateAdminFreeEsimSettings(body),
    onSuccess: (res) => {
      qc.setQueryData(freeEsimKeys.admin, res)
      qc.invalidateQueries({ queryKey: freeEsimKeys.public })
    },
  })
}
