// store/currency.ts
//
// Persisted currency store for the X-Currency header system.
//
// Three duties:
//   1. Store the buyer's chosen currency (EUR / GBP / USD) so every
//      subsequent axios request can inject `X-Currency`.
//   2. Expose a `switching` flag the navbar picker uses to disable
//      itself while a currency switch is in flight (prevents rapid
//      switching while the screen is re-fetching).
//   3. Persist to localStorage so the choice survives a page refresh.
//
// The doc says: "The choice lives on the request, not on the customer's
// profile. Nothing is remembered between calls, so the header belongs
// on every request the same way an auth token does."
// We implement that by injecting from here inside lib/axios.ts's
// interceptor — see that file.
//
// Multi-Currency Checkout Contract § "Absent from checkout onwards":
// the selector is hidden on the payment page / Stripe redirect /
// confirmation. Enforcement is the picker component's responsibility
// (check the route), not this store's.

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SUPPORTED_CURRENCIES = ['EUR', 'GBP', 'USD'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
}

/** Default when the buyer has never chosen. EUR per the doc. */
export const DEFAULT_CURRENCY: SupportedCurrency = 'EUR'

interface CurrencyState {
  /** The currently active currency. EUR when never chosen. */
  currency: SupportedCurrency
  /**
   * True while a currency switch is in flight (i.e. between the moment
   * the buyer clicks a new currency and the moment the re-fetch settles).
   * The navbar picker is disabled while this is true so rapid switching
   * cannot produce stale/interleaved results.
   */
  switching: boolean
  /** Set a new currency. Does NOT trigger any re-fetch — callers do that. */
  setCurrency: (currency: SupportedCurrency) => void
  /** Mark a switch as in-flight (disable the picker). */
  setSwitching: (switching: boolean) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      switching: false,
      setCurrency: (currency) => set({ currency }),
      setSwitching: (switching) => set({ switching }),
    }),
    {
      name: 'matchday:currency',
      // Only persist the chosen currency, not the transient switching flag.
      partialize: (state) => ({ currency: state.currency }),
    },
  ),
)
