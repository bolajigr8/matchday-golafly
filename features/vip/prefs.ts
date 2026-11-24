// features/vip/prefs.ts
//
// The landing page's trip choices (Figma hero booking bar + cabin section):
// where the customer flies from, the cabin they prefer and how many guests.
// Nothing here is priced or sent to the backend on its own: the steps
// pre-fill from it (flight search origin + cabin, ticket quantity), and the
// customer can still change everything there. Kept per tab (sessionStorage).

import { useSyncExternalStore } from 'react'

export type VipCabinPref = 'first' | 'business'

export interface VipPrefs {
  /** 3-letter airport/city code chosen in the hero ("FLYING FROM"). */
  origin: string
  /** null until the customer picks one (the flight search then asks for
   *  either cabin). The toggles show First Class while it is null. */
  cabin: VipCabinPref | null
  guests: number
}

const KEY = 'golafly-vip-prefs'
const DEFAULTS: VipPrefs = { origin: '', cabin: null, guests: 2 }
export const VIP_MAX_GUESTS = 9

const listeners = new Set<() => void>()
let cache: { raw: string | null; value: VipPrefs } = { raw: null, value: DEFAULTS }

function read(): VipPrefs {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
  } catch {
    /* storage blocked: defaults */
  }
  if (raw === cache.raw) return cache.value
  let value = DEFAULTS
  try {
    const p = raw ? (JSON.parse(raw) as Partial<VipPrefs>) : {}
    value = {
      origin: typeof p.origin === 'string' && /^[A-Za-z]{3}$/.test(p.origin) ? p.origin.toUpperCase() : '',
      cabin: p.cabin === 'business' || p.cabin === 'first' ? p.cabin : null,
      guests: Number.isInteger(p.guests) ? Math.min(Math.max(p.guests as number, 1), VIP_MAX_GUESTS) : DEFAULTS.guests,
    }
  } catch {
    /* bad JSON: defaults */
  }
  cache = { raw, value }
  return value
}

export function getVipPrefs(): VipPrefs {
  return typeof window === 'undefined' ? DEFAULTS : read()
}

export function setVipPrefs(patch: Partial<VipPrefs>): void {
  const next = { ...getVipPrefs(), ...patch }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Hydration-safe: the server and the first client render see the defaults. */
export function useVipPrefs(): VipPrefs {
  return useSyncExternalStore(subscribe, getVipPrefs, () => DEFAULTS)
}
