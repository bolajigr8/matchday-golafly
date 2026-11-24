import fanAxios from '@/services/fan-axios'
import type {
  FanApiResponse,
  FanAuthData,
  FanChangePasswordPayload,
  FanForgotPasswordPayload,
  FanLedger,
  FanLedgerListParams,
  FanLoginPayload,
  FanRegisterPayload,
  FanResetPasswordPayload,
  FanResendCodeData,
  FanUser,
  FanVerifyEmailPayload,
} from './types'

/* The fan-facing half of api.golafly.com.
 *
 * Every path here is already in production use by the travels app, so none of
 * it is speculative — see Desktop/travels/features/auth/api.ts. `fanAxios` is
 * based at `.../api`, so `/v1/auth/login` resolves to
 * `https://api.golafly.com/api/v1/auth/login`.
 */

/* ── Auth ─────────────────────────────────────────────────────────────── */

export async function fanRegister(
  payload: FanRegisterPayload,
): Promise<FanApiResponse<FanAuthData>> {
  const { data } = await fanAxios.post<FanApiResponse<FanAuthData>>(
    '/v1/auth/register',
    payload,
  )
  return data
}

export async function fanLogin(
  payload: FanLoginPayload,
): Promise<FanApiResponse<FanAuthData>> {
  const { data } = await fanAxios.post<FanApiResponse<FanAuthData>>(
    '/v1/auth/login',
    payload,
  )
  return data
}

export async function fanForgotPassword(
  payload: FanForgotPasswordPayload,
): Promise<FanApiResponse<{ reason: string; expires_in_minutes: number }>> {
  const { data } = await fanAxios.post<
    FanApiResponse<{ reason: string; expires_in_minutes: number }>
  >('/v1/auth/forgot-password', payload)
  return data
}

export async function fanResetPassword(
  payload: FanResetPasswordPayload,
): Promise<FanApiResponse<{ reason: string }>> {
  const { data } = await fanAxios.post<FanApiResponse<{ reason: string }>>(
    '/v1/auth/reset-password',
    payload,
  )
  return data
}

export async function fanChangePassword(
  payload: FanChangePasswordPayload,
): Promise<FanApiResponse<{ user: FanUser }>> {
  const { data } = await fanAxios.patch<FanApiResponse<{ user: FanUser }>>(
    '/v1/auth/password',
    payload,
  )
  return data
}

/* ── Email verification (MatchDay Email verification collection) ───────
   Both public: they take the email, not the token, so they also work for
   someone who opened the emailed code on another device. */

export async function fanVerifyEmail(
  payload: FanVerifyEmailPayload,
): Promise<FanApiResponse<{ user: FanUser }>> {
  const { data } = await fanAxios.post<FanApiResponse<{ user: FanUser }>>(
    '/v1/auth/email/verify',
    payload,
  )
  return data
}

/** Answers 200 with the same body for any email, known or not. */
export async function fanResendVerification(email: string): Promise<FanApiResponse<FanResendCodeData>> {
  const { data } = await fanAxios.post<FanApiResponse<FanResendCodeData>>(
    '/v1/auth/email/resend',
    { email },
  )
  return data
}

/** Kills the token on the server. Open to unverified accounts. */
export async function fanLogoutRequest(): Promise<void> {
  await fanAxios.post('/v1/auth/logout')
}

/* ── Ledgers ──────────────────────────────────────────────────────────────
   The fan's own orders. Scoped by the bearer token, so there is no user id in
   the path — which also means a missing token returns 401 rather than
   somebody else's bookings. */

export async function fanListLedgers(
  params: FanLedgerListParams = {},
): Promise<FanApiResponse<FanLedger[]>> {
  const { data } = await fanAxios.get<FanApiResponse<FanLedger[]>>('/v1/auth/ledgers', {
    params,
  })
  return data
}

export async function fanGetLedger(id: number): Promise<FanApiResponse<FanLedger>> {
  const { data } = await fanAxios.get<FanApiResponse<FanLedger>>(`/v1/auth/ledgers/${id}`)
  return data
}
