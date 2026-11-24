// lib/site-runtime.ts
//
// Browser-side view of "which site am I on?", set before anything else runs by
// the inline script in app/layout.tsx (lib/sites.ts → siteBootScript).
//
//   window.__GF_SITE = { key: 'championsleague' | null, consent: 'banner' | 'open' }
//
// key is null on golafly.com, and consent is then ALWAYS 'banner'.
//
// These are plain functions, not hooks: they return null/false on the server.
// Do not branch on them during render in a component that is also server
// rendered (that would be a hydration mismatch); use them in effects, event
// handlers and tracking calls. For the one place that must decide before
// paint, see useLandingHost() below.

import { useSyncExternalStore } from 'react'

declare global {
  interface Window {
    __GF_SITE?: {
      key: string | null
      consent: 'banner' | 'open'
      /** Set on golafly.com payment pages only, for a buyer who came from a
       *  landing page that ran in 'open' mode (see lib/landing-return.ts). */
      carry?: 'open'
    }
  }
}

export function currentSiteKey(): string | null {
  if (typeof window === 'undefined') return null
  return window.__GF_SITE?.key ?? null
}

/** True only on a landing hostname built with NEXT_PUBLIC_LANDING_CONSENT=open. */
export function isConsentOpen(): boolean {
  if (typeof window === 'undefined') return false
  const s = window.__GF_SITE
  return Boolean(s?.key) && s?.consent === 'open'
}

/** True on golafly.com's payment pages for a buyer whose booking began on a
 *  landing page in 'open' mode: the same policy follows them back for the
 *  payment page. Always false in the default 'banner' build, and false on
 *  every other page of golafly.com. */
export function isConsentCarried(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__GF_SITE?.carry !== 'open') return false
  return window.location.pathname.startsWith('/payment-')
}

/** The landing site key ("championsleague" ...) or null on the main site. Safe
 *  in render: null on the server's first pass, then the real value. */
export function useSiteKey(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => currentSiteKey(),
    () => null,
  )
}

/** Like isConsentOpen(), but safe to use in render (false on the server's first
 *  pass, then the real value): for hiding "Cookie settings" when there is no
 *  cookie banner to open. */
export function useConsentOpen(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => isConsentOpen(),
    () => false,
  )
}

/** true on a landing hostname, false on the main site and on the server's
 *  first pass. Safe to use in render: React uses the server snapshot (false)
 *  for hydration, then re-renders with the real value. */
export function useLandingHost(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => currentSiteKey() !== null,
    () => false,
  )
}
