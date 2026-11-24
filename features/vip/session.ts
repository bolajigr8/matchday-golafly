'use client'

// features/vip/session.ts
//
// The one VIP package this browser is building, kept in localStorage so it
// survives a refresh, a new tab and the round trip to Stripe:
//   • packageId    — the contract says to keep it (success page fallback)
//   • club/eventId — which match it is for (the flow pages' address)
//   • guestStarted — the package was created as a guest: keep sending the
//                    guest cart token even after a login (contract §9)
//   • stripeSessionId — saved before the redirect to Stripe (contract §2.7)
//
// Prices and lines are NEVER stored here: the package endpoint is the
// source of truth for those.

import { useSyncExternalStore } from 'react'

export interface VipSession {
  packageId: string
  club: string
  eventId: number
  quantity: number
  guestStarted: boolean
  stripeSessionId: string | null
  updatedAt: string
}

const KEY = 'golafly-vip-package'
const listeners = new Set<() => void>()
let cache: VipSession | null | undefined

function read(): VipSession | null {
  if (typeof window === 'undefined') return null
  if (cache !== undefined) return cache
  try {
    const raw = window.localStorage.getItem(KEY)
    const v = raw ? (JSON.parse(raw) as VipSession) : null
    cache = v && typeof v.packageId === 'string' ? v : null
  } catch {
    cache = null
  }
  return cache
}

function write(v: VipSession | null) {
  cache = v
  try {
    if (v) window.localStorage.setItem(KEY, JSON.stringify(v))
    else window.localStorage.removeItem(KEY)
  } catch {
    /* private mode / quota: the in-memory copy still works for this tab */
  }
  listeners.forEach((l) => l())
}

export function getVipSession(): VipSession | null {
  return read()
}

export function setVipSession(v: Omit<VipSession, 'updatedAt'>): void {
  write({ ...v, updatedAt: new Date().toISOString() })
}

export function patchVipSession(patch: Partial<VipSession>): void {
  const cur = read()
  if (!cur) return
  write({ ...cur, ...patch, updatedAt: new Date().toISOString() })
}

export function clearVipSession(): void {
  write(null)
}

/** The session, if it is for this match. */
export function vipSessionFor(club: string, eventId: number): VipSession | null {
  const s = read()
  return s && s.club === club && s.eventId === eventId ? s : null
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined
      cb()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

/** React view of the session. null on the server and before mount. */
export function useVipSession(): VipSession | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

/** False on the server render, true once the browser has read storage. */
export function useVipSessionReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
