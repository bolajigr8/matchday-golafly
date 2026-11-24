// features/payment/api.ts

import axiosInstance from '@/lib/axios'
import type { TransactionApiResponse } from './types'

// GET /api/v1/ledgers/transactions/{stripe_session_id}
// Works for stays, flights, and esim — the response shape tells you
// which product it is (see getTransactionProduct in ./types).
export async function getTransactionBySessionId(
  sessionId: string,
): Promise<TransactionApiResponse> {
  const { data } = await axiosInstance.get<TransactionApiResponse>(
    `/api/v1/ledgers/transactions/${sessionId}`,
  )
  return data
}
