// store/builder-checkout.ts
//
// Drives the sequential real-checkout flow: ticket (mocked) → flight →
// stay → eSIM, one Stripe redirect at a time, each leg only started once
// the previous one is paid. Persisted so a leg that's already been paid
// for is never lost if the browser closes mid-sequence (e.g. between the
// flight redirect and coming back from Stripe).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItemType } from '@/features/cart/context'

export type LegProduct = Extract<
  CartItemType,
  'tickets' | 'flight' | 'hotel' | 'esim'
>
export type LegStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'skipped'

export interface CheckoutLeg {
  product: LegProduct
  status: LegStatus
  /** Stripe session_id (or the mock ticket session id) once processing/paid */
  sessionId?: string
  /** ord_/booking_id/ledger_id — whatever the product's own confirmation id is */
  confirmationId?: string
  error?: string
}

// Fixed order — tickets first (never a real charge today, resolves
// instantly), then flight (usually highest value / most time-sensitive),
// then stay, then eSIM last.
export const LEG_ORDER: LegProduct[] = ['tickets', 'flight', 'hotel', 'esim']

interface BuilderCheckoutStore {
  matchId: string | null
  legs: CheckoutLeg[]
  contactEmail: string
  contactPhone: string

  /** Builds the leg list from whichever product types are actually in the
   *  cart, in LEG_ORDER, discarding any previous run for a different match. */
  initLegs: (matchId: string, presentProducts: LegProduct[]) => void
  setContact: (email: string, phone: string) => void
  setLegStatus: (
    product: LegProduct,
    status: LegStatus,
    extra?: Partial<
      Pick<CheckoutLeg, 'sessionId' | 'confirmationId' | 'error'>
    >,
  ) => void
  /** First leg that isn't yet paid/skipped — null when everything's done. */
  nextPendingLeg: () => CheckoutLeg | null
  allDone: () => boolean
  reset: () => void
}

const defaultState = {
  matchId: null as string | null,
  legs: [] as CheckoutLeg[],
  contactEmail: '',
  contactPhone: '',
}

export const useBuilderCheckoutStore = create<BuilderCheckoutStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      initLegs: (matchId, presentProducts) => {
        const existing = get()
        // Resuming the exact same match's in-progress checkout — keep
        // whatever's already paid rather than starting over.
        if (existing.matchId === matchId && existing.legs.length > 0) return

        const legs: CheckoutLeg[] = LEG_ORDER.filter((p) =>
          presentProducts.includes(p),
        ).map((product) => ({ product, status: 'pending' as LegStatus }))

        set({ matchId, legs, contactEmail: '', contactPhone: '' })
      },

      setContact: (email, phone) =>
        set({ contactEmail: email, contactPhone: phone }),

      setLegStatus: (product, status, extra) =>
        set((s) => ({
          legs: s.legs.map((l) =>
            l.product === product ? { ...l, status, ...extra } : l,
          ),
        })),

      nextPendingLeg: () => {
        return (
          get().legs.find(
            (l) => l.status === 'pending' || l.status === 'failed',
          ) ?? null
        )
      },

      allDone: () => {
        const legs = get().legs
        return (
          legs.length > 0 &&
          legs.every((l) => l.status === 'paid' || l.status === 'skipped')
        )
      },

      reset: () => set(defaultState),
    }),
    { name: 'matchday-builder-checkout' },
  ),
)
