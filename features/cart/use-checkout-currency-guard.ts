// features/cart/use-checkout-currency-guard.ts
//
// Mount this on every screen that shows cart totals and lets the buyer
// pay (currently app/builder/pay/client.tsx). Answers the question:
// "the buyer switched currency somewhere else, or a switch failed
// earlier — is what's on screen actually what the cart is priced in?"
//
//   - 'checking'  → re-verifying against the server. Disable Pay.
//   - 'blocked'   → PATCH came back 422. Show blockedItems, each with a
//                   Remove action; disable Pay until resolved.
//   - 'error'     → network/unexpected failure. Disable Pay, offer retry.
//   - 'ok'        → cart currency matches the buyer's selection. Pay is
//                   allowed.
//
// This does NOT run on an interval — only on mount (and on manual
// retry/remove) — because it's specifically the "returning to checkout"
// re-check the doc asks for, not a background poller (that's already
// CartProvider's job for item presence).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrencyStore } from '@/store/currency'
import { useCart } from './context'
import { removeCartItemApi } from './api'
import { syncCartCurrency } from './currency-sync'
import type { BlockedCurrencyItem } from './types'

export interface CheckoutCurrencyGuard {
  status: 'checking' | 'blocked' | 'error' | 'ok'
  blockedItems: BlockedCurrencyItem[]
  message: string | null
  /** True whenever Pay/Continue should be disabled because of this guard. */
  isBlocking: boolean
  retry: () => void
  removeBlockedItem: (itemId: string) => Promise<void>
}

export function useCheckoutCurrencyGuard(): CheckoutCurrencyGuard {
  const currency = useCurrencyStore((s) => s.currency)
  const { applyServerCart } = useCart()

  const [status, setStatus] = useState<CheckoutCurrencyGuard['status']>('checking')
  const [blockedItems, setBlockedItems] = useState<BlockedCurrencyItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  // Guards against a slow first run finishing after a second run has
  // already started (e.g. mount + immediate retry click).
  const runId = useRef(0)

  const run = useCallback(async () => {
    const id = ++runId.current
    setStatus('checking')
    setMessage(null)
    const result = await syncCartCurrency(currency)
    if (id !== runId.current) return // superseded by a newer run

    if (result.status === 'noop') {
      setStatus('ok')
      setBlockedItems([])
      return
    }
    if (result.status === 'ok') {
      applyServerCart(result.cart)
      setStatus('ok')
      setBlockedItems([])
      return
    }
    if (result.status === 'blocked') {
      applyServerCart(result.cart) // cart is untouched, but keep local in sync
      setBlockedItems(result.blockedItems)
      setStatus('blocked')
      return
    }
    setMessage(result.message)
    setStatus('error')
  }, [currency, applyServerCart])

  useEffect(() => {
    void run()
    // Deliberately only on mount + explicit currency change — see the
    // file header for why this isn't a poller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency])

  const removeBlockedItem = useCallback(
    async (itemId: string) => {
      try {
        await removeCartItemApi(itemId)
      } catch {
        setMessage('Could not remove that item. Please try again.')
        setStatus('error')
        return
      }
      await run()
    },
    [run],
  )

  return {
    status,
    blockedItems,
    message,
    isBlocking: status !== 'ok',
    retry: () => void run(),
    removeBlockedItem,
  }
}
