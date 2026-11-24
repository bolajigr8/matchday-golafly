'use client'

import { create } from 'zustand'
import {
  clearFanSession,
  getFanToken,
  getFanUser,
  setFanSession,
  updateFanUser,
  type FanSessionUser,
} from '@/features/fan/session'

/* The signed-in fan, for anything that needs their name without waiting on a
 * request — the sidebar, the greeting, the mobile sheet.
 *
 * The initial state is deliberately EMPTY rather than read from cookies here.
 * This initialiser also runs on the server, where js-cookie sees nothing, so
 * reading cookies at module load renders "there" on the server and the real
 * name on the client — a hydration mismatch in the one component that appears
 * on every single dashboard page. `hydrate()` fills it in after mount, when
 * both sides already agree on what they rendered.
 *
 * The travels app documents the same trap; this is the same fix.
 */
interface FanAuthState {
  user: FanSessionUser | null
  isAuthenticated: boolean
  /** True once the cookie-backed session has been read on the client. */
  hasHydrated: boolean
  /** Read the session cookies into state. Client-only; call once after mount. */
  hydrate: () => void
  /** Persist a real backend session and reflect it in state. */
  signIn: (user: FanSessionUser, token: string, expiresIn?: number) => void
  signOut: () => void
  /** Record the account's verification state (verify page, 403 gate). */
  setEmailVerified: (verified: boolean) => void
}

export const useFanAuth = create<FanAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,

  hydrate: () =>
    set({
      user: getFanUser(),
      isAuthenticated: !!getFanToken(),
      hasHydrated: true,
    }),

  signIn: (user, token, expiresIn) => {
    setFanSession(token, user, expiresIn)
    set({ user, isAuthenticated: true, hasHydrated: true })
  },

  signOut: () => {
    clearFanSession()
    set({ user: null, isAuthenticated: false, hasHydrated: true })
  },

  setEmailVerified: (verified) => {
    const user = updateFanUser({ email_verified: verified })
    if (user) set({ user })
  },
}))
