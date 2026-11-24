// features/payment/hooks.ts

import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getTransactionBySessionId } from './api'
import { isTerminalTransactionStatus } from './status'
import type { TransactionApiResponse } from './types'

interface ApiErr {
  message?: string
}

const POLL_INTERVAL_MS = 5_000
export const MAX_POLL_DURATION_MS = 3 * 60_000

/**
 * Poll the legacy/generic ledger endpoint used by flights, stays and eSIM.
 * This endpoint is product-shaped and currently returns one transaction for
 * a Stripe session, so this hook deliberately does not claim that a multi-
 * ledger cart is fully confirmed by a single response. The cart success page
 * uses the stored ledger count to decide whether it is safe to show success.
 */
export function useTransactionStatus(sessionId: string | null) {
  return useQuery<TransactionApiResponse, AxiosError<ApiErr>>({
    queryKey: ['payment-transaction', sessionId],
    queryFn: () => getTransactionBySessionId(sessionId!),
    enabled: !!sessionId,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      if (isTerminalTransactionStatus(status)) return false
      return POLL_INTERVAL_MS
    },
  })
}
