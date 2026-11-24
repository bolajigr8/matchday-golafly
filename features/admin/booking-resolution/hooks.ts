'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import {
  attachBooking,
  getLedgerActions,
  listActionRequired,
  manualBooking,
  refundLedger,
  retryOrder,
} from './api'
import type {
  ActionRequiredFilters,
  AttachBody,
  ManualBody,
  RefundBody,
  ResolutionAction,
  RetryBody,
} from './types'

/** The CS queue. Refreshes every minute so "waiting" times and claims stay
 *  current while the screen is open. */
export function useActionRequired(filters: ActionRequiredFilters) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Action_Required, filters],
    queryFn: () => listActionRequired(filters),
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })
}

/** A ledger's action history, newest first (includes refusals). */
export function useLedgerActions(ledgerId: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Ledger_Actions, ledgerId],
    queryFn: () => getLedgerActions(ledgerId as number),
    enabled: ledgerId != null,
  })
}

export type ResolutionRequest =
  | { action: 'attach'; id: number; body: AttachBody }
  | { action: 'manual'; id: number; body: ManualBody }
  | { action: 'retry'; id: number; body: RetryBody }
  | { action: 'refund'; id: number; body: RefundBody }

function run(req: ResolutionRequest) {
  switch (req.action) {
    case 'attach':
      return attachBooking(req.id, req.body)
    case 'manual':
      return manualBooking(req.id, req.body)
    case 'retry':
      return retryOrder(req.id, req.body)
    case 'refund':
      return refundLedger(req.id, req.body)
  }
}

/** One mutation for all four actions. Outcomes (report/done/refused/failed)
 *  are all successes at HTTP level — the caller reads data.outcome. Only
 *  401/403/404/422 land in onError. After a confirm, the queue and history
 *  are refreshed whatever the outcome (refusals are logged too). */
export function useResolutionAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (_res, req) => {
      const confirmed = req.body.confirm
      if (!confirmed) return
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Action_Required] })
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Ledger_Actions, req.id] })
    },
  })
}

export type { ResolutionAction }
