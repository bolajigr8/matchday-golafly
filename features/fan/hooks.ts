'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { QueryKeys } from '@/models/query'
import { Routes } from '@/routes'
import { homeForRole } from '@/features/scout/roles'
import { fanApiMessage } from '@/services/fan-axios'
import { useFanAuth } from '@/store/fan-auth'
import {
  fanChangePassword,
  fanForgotPassword,
  fanGetLedger,
  fanListLedgers,
  fanLogin,
  fanLogoutRequest,
  fanRegister,
  fanResendVerification,
  fanResetPassword,
  fanVerifyEmail,
} from './api'
import { isUnverified, verifyEmailHref } from './verification'
import { getFanToken } from './session'
import type {
  FanAuthData,
  FanChangePasswordPayload,
  FanForgotPasswordPayload,
  FanLoginPayload,
  FanRegisterPayload,
  FanResetPasswordPayload,
  FanVerifyEmailPayload,
} from './types'

/** Reads the session cookies into the store once, after mount. Every fan
 *  surface calls this; see store/fan-auth.ts for why it cannot happen at
 *  module load. */
export function useHydratedFan() {
  const hydrate = useFanAuth((s) => s.hydrate)
  const hasHydrated = useFanAuth((s) => s.hasHydrated)
  const user = useFanAuth((s) => s.user)

  useEffect(() => {
    if (!hasHydrated) hydrate()
  }, [hasHydrated, hydrate])

  return { user, hasHydrated }
}

/* ── Auth ─────────────────────────────────────────────────────────────────
   Register and login share everything after the request, so they share one
   success handler. Scenario 1 lives in `landAfterAuth`: a fan who signs in
   ends up on the dashboard, not back on the marketing page. */

function useAuthSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signIn = useFanAuth((s) => s.signIn)

  return (data: FanAuthData, greeting: string) => {
    const { user, token, expires_in } = data
    signIn(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        player_id: user.player_id ?? user.player?.id ?? null,
        ...(typeof user.email_verified === 'boolean' ? { email_verified: user.email_verified } : {}),
      },
      token,
      expires_in,
    )

    /* `next` carries where they were headed before the guard bounced them —
       set by proxy.ts. Only same-origin paths are honoured: an attacker who
       can put `?next=https://evil.example` in a link would otherwise get a
       redirect straight after a successful login, which is the most
       convincing possible moment to be handed a fake page. */
    const next = searchParams.get('next')
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null

    /* Unverified: the API has just emailed a 6-digit code (on register, and
       on login unless one went out in the last minute). The account pages
       refuse an unverified token, so the code comes first. */
    if (isUnverified(user)) {
      toast.success(greeting, { description: `Enter the code we emailed to ${user.email}.` })
      router.replace(verifyEmailHref({ email: user.email, next: safeNext }))
      return
    }
    toast.success(greeting, { description: user.email })

    /* WHICH dashboard is the role's call, not the route's. One /login and one
       /register serve every non-admin role, so a scout signing in here must
       land on /scout rather than on the fan dashboard they have no reason to
       see. `homeForRole` is the single place that mapping lives — proxy.ts
       reads the same module, so the guard and the client can never disagree
       about where somebody belongs. Anything unrecognised, including a
       missing role, still lands on the fan dashboard. */
    router.replace(safeNext ?? homeForRole(user.role))
  }
}

export function useFanLogin() {
  const onSuccess = useAuthSuccess()
  return useMutation({
    mutationFn: (payload: FanLoginPayload) => fanLogin(payload),
    onSuccess: (response) => onSuccess(response.data, 'Signed in'),
    onError: (error: unknown) =>
      toast.error('Could not sign in', { description: fanApiMessage(error) }),
  })
}

export function useFanRegister() {
  const onSuccess = useAuthSuccess()
  return useMutation({
    mutationFn: (payload: FanRegisterPayload) => fanRegister(payload),
    onSuccess: (response) => onSuccess(response.data, 'Welcome to Golafly'),
    onError: (error: unknown) =>
      toast.error('Could not create your account', { description: fanApiMessage(error) }),
  })
}

export function useFanLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const signOut = useFanAuth((s) => s.signOut)

  return () => {
    /* Kill the token on the server too (fire and forget: signing out on this
       device must not wait on, or fail with, the network). Sent before the
       local session is cleared, while the token is still attached. */
    void fanLogoutRequest().catch(() => {})
    signOut()
    /* Clear the cache too — the next fan to sign in on this device must not
       see the previous one's bookings flash up from a warm query. */
    queryClient.clear()
    router.replace(Routes.login)
  }
}

export function useFanForgotPassword() {
  return useMutation({
    mutationFn: (payload: FanForgotPasswordPayload) => fanForgotPassword(payload),
    onError: (error: unknown) =>
      toast.error('Could not send the code', { description: fanApiMessage(error) }),
  })
}

export function useFanResetPassword() {
  const router = useRouter()
  const sessionUser = useFanAuth((s) => s.user)
  const setEmailVerified = useFanAuth((s) => s.setEmailVerified)
  return useMutation({
    mutationFn: (payload: FanResetPasswordPayload) => fanResetPassword(payload),
    onSuccess: (_res, payload) => {
      /* A correct reset code also verifies the email. */
      if (sessionUser && sessionUser.email.toLowerCase() === payload.email.trim().toLowerCase()) {
        setEmailVerified(true)
      }
      toast.success('Password updated', { description: 'Sign in with your new password.' })
      router.replace(Routes.login)
    },
    onError: (error: unknown) =>
      toast.error('Could not reset your password', { description: fanApiMessage(error) }),
  })
}

/* ── Email verification ─────────────────────────────────────────────── */

export function useFanVerifyEmail() {
  return useMutation({
    mutationFn: (payload: FanVerifyEmailPayload) => fanVerifyEmail(payload),
  })
}

export function useFanResendVerification() {
  return useMutation({
    mutationFn: (email: string) => fanResendVerification(email),
  })
}

export function useFanChangePassword() {
  return useMutation({
    mutationFn: (payload: FanChangePasswordPayload) => fanChangePassword(payload),
    onSuccess: () => toast.success('Password updated'),
    onError: (error: unknown) =>
      toast.error('Could not update your password', { description: fanApiMessage(error) }),
  })
}

/* ── Ledgers ──────────────────────────────────────────────────────────────
   The fan's own orders. Gated on the token so a signed-out render never fires
   a request that is guaranteed to 401 — which would also trip the response
   interceptor and clear a session that was never there. */

export function useFanLedgers() {
  return useQuery({
    queryKey: [QueryKeys.Fan_Ledgers],
    queryFn: () => fanListLedgers(),
    enabled: typeof window !== 'undefined' && !!getFanToken(),
    /* A fan checking a booking wants it current, but not at the cost of a
       refetch storm on every tab focus while they read a QR code. */
    staleTime: 60 * 1000,
  })
}

/** One order. GET /v1/auth/ledgers/{id} — same record shape as a list row,
 *  scoped to the caller, so another fan's id 404s. */
export function useFanLedger(id: number) {
  return useQuery({
    queryKey: [QueryKeys.Fan_Ledger, id],
    queryFn: () => fanGetLedger(id),
    enabled: typeof window !== 'undefined' && !!getFanToken() && Number.isFinite(id),
    staleTime: 60 * 1000,
    retry: false,
  })
}
