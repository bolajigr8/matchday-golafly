'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import {
  getVipPackage,
  getVipSettings,
  listVipPackages,
  refundVipItem,
  releaseVipPackage,
  updateVipSettings,
} from './api'
import type { VipAdminListFilters, VipAdminSettingsPatch, VipRefundBody, VipReleaseBody } from './types'

/* Query keys kept local to the VIP admin (not in models/query.ts) so this
   feature stays self-contained. */
export const vipAdminKeys = {
  all: ['admin-vip-packages'] as const,
  list: (f: VipAdminListFilters) => ['admin-vip-packages', 'list', f] as const,
  detail: (id: string) => ['admin-vip-packages', 'detail', id] as const,
  settings: ['admin-vip-settings'] as const,
}

/** The VIP on/off switch and mode (contract §1.3). */
export function useVipSettings() {
  return useQuery({
    queryKey: vipAdminKeys.settings,
    queryFn: getVipSettings,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      return status !== 403 && status !== 404 && count < 2
    },
  })
}

/** Saves the switch or the mode; the answer is the saved settings. The
 *  customer-side "is VIP on" check is cached up to 5 minutes. */
export function useUpdateVipSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VipAdminSettingsPatch) => updateVipSettings(body),
    onSuccess: (res) => qc.setQueryData(vipAdminKeys.settings, res),
  })
}

/** The package list. Refreshes every minute while open, like Action required. */
export function useVipPackages(filters: VipAdminListFilters) {
  return useQuery({
    queryKey: vipAdminKeys.list(filters),
    queryFn: () => listVipPackages(filters),
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useVipPackage(id: string | null) {
  return useQuery({
    queryKey: vipAdminKeys.detail(id ?? ''),
    queryFn: () => getVipPackage(id as string),
    enabled: !!id,
    refetchInterval: 60_000,
    retry: (count, err) => (err as { response?: { status?: number } })?.response?.status !== 404 && count < 2,
  })
}

/** Release (contract §5). Every outcome is a 200; the caller reads
 *  data.outcome. After any answer the package is re-read (a refusal can
 *  mean someone else changed it). */
export function useReleaseVipPackage(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VipReleaseBody) => releaseVipPackage(id, body),
    onSettled: () => qc.invalidateQueries({ queryKey: vipAdminKeys.all }),
  })
}

/** Held-item refund (contract §6). Preview and confirm are both calls. */
export function useRefundVipItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { ledgerId: number; href: string; body: VipRefundBody }) =>
      refundVipItem(v.ledgerId, v.href, v.body),
    onSuccess: (_res, v) => {
      if (!v.body.confirm) return
      qc.invalidateQueries({ queryKey: vipAdminKeys.all })
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Ledger_Actions, v.ledgerId] })
    },
  })
}
