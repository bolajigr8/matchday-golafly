// features/vip/receipt.ts
//
// What the customer chose, saved just before the redirect to Stripe, so the
// Confirmed page can print the pass (match, route, cabin, lead guest).
// After payment the backend's package view has no lines or prices
// (contract §6), so these are the customer's own choices, kept in this
// browser only. Keyed by the Stripe session id; the page works without it
// (it then shows only what the backend sends).

import { useSyncExternalStore } from 'react'

export interface VipReceipt {
  sessionId: string
  packageId: string
  home: string
  away: string
  /** Local kick-off in Spain, as the backend sent it. */
  date: string
  venue: string
  city: string
  ticket: string
  travellers: number
  from: string | null
  to: string | null
  cabin: string | null
  hotel: string | null
  esim: boolean
  leadGuest: string
  total: { amount: number; currency: string } | null
}

const KEY = 'golafly-vip-receipt'

export function saveVipReceipt(r: VipReceipt): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* storage unavailable: the page falls back to the backend's words */
  }
}

export function readVipReceipt(sessionId: string): VipReceipt | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    const r = raw ? (JSON.parse(raw) as VipReceipt) : null
    return r && r.sessionId === sessionId ? r : null
  } catch {
    return null
  }
}

/* Hydration-safe read: null on the server and during hydration, then the
   saved receipt. Cached by the raw string so the snapshot stays stable. */
let cache: { raw: string | null; value: VipReceipt | null } = { raw: null, value: null }
const noop = () => () => {}

export function useVipReceipt(sessionId: string | null): VipReceipt | null {
  return useSyncExternalStore(
    noop,
    () => {
      if (!sessionId) return null
      let raw: string | null = null
      try {
        raw = window.localStorage.getItem(KEY)
      } catch {
        return null
      }
      if (raw !== cache.raw) cache = { raw, value: raw ? readVipReceipt(sessionId) : null }
      return cache.value && cache.value.sessionId === sessionId ? cache.value : null
    },
    () => null,
  )
}
