'use client'

// features/discounts/use-cart-coupon.ts
//
// Coupon handling for the CART checkout (app/builder/pay).
//
// The backend now owns the maths: GET /cart?coupon_code=… runs exactly the
// calculation checkout uses, so the previewed discount always matches what
// will be charged. This hook therefore never computes a discount itself.
//
//   valid code      → price_summary.discount is filled, total is lowered
//   anything else   → cart returned normally, discount: null and a
//                     top-level `coupon_error` string (never a failed call)
//
// The preview is re-requested whenever `refreshKey` changes (cart items or
// currency changed) so an applied coupon can never go stale; if the code
// stops applying (e.g. the cart became eSIM-only) it is dropped and the
// server's message is shown.
//
// The direct single-ticket checkout still uses use-coupon.ts.

import { useCallback, useEffect, useRef, useState } from 'react'
import { getCartApi } from '@/features/cart/api'
import { normalizePriceSummary } from '@/features/price-breakdown/helpers'
import type { PriceSummary } from '@/features/price-breakdown/types'

const STORAGE_KEY = 'matchday:cart-coupon'
const GENERIC_ERROR = 'This coupon can’t be applied to your cart.'

function readStored(): string {
  if (typeof window === 'undefined') return ''
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeStored(code: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (code) sessionStorage.setItem(STORAGE_KEY, code)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode — the code just won't survive a reload */
  }
}

function requestError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const message = (err as { response?: { data?: { message?: unknown } } })
      .response?.data?.message
    if (typeof message === 'string' && message) return message
  }
  return 'Could not check this coupon. Please try again.'
}

export function useCartCoupon({
  enabled,
  refreshKey,
}: {
  /** Don't call the API until the cart has been verified (currency guard). */
  enabled: boolean
  /** Changes whenever the cart's contents or currency change. */
  refreshKey: string
}) {
  const [code, setCode] = useState('')
  const [appliedCode, setAppliedCode] = useState<string>(readStored)
  const [preview, setPreview] = useState<PriceSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  // Only the newest request may write state (apply + refresh can overlap).
  const runId = useRef(0)

  const drop = useCallback((message: string | null) => {
    setAppliedCode('')
    setPreview(null)
    writeStored(null)
    setError(message)
  }, [])

  const apply = useCallback(async () => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Enter a coupon code')
      return
    }
    const id = ++runId.current
    setError(null)
    setIsPending(true)
    try {
      const res = await getCartApi({ couponCode: trimmed })
      if (id !== runId.current) return
      const summary = normalizePriceSummary(res.data?.price_summary)
      if (summary?.discount) {
        setAppliedCode(trimmed)
        setPreview(summary)
        writeStored(trimmed)
        setCode(trimmed)
      } else {
        setError(res.data?.coupon_error || GENERIC_ERROR)
      }
    } catch (err) {
      if (id !== runId.current) return
      setError(requestError(err))
    } finally {
      if (id === runId.current) setIsPending(false)
    }
  }, [code])

  const clear = useCallback(() => {
    runId.current++
    setCode('')
    setIsPending(false)
    drop(null)
  }, [drop])

  // (Re)validate an applied coupon on mount and whenever the cart changes.
  useEffect(() => {
    if (!enabled || !appliedCode) return
    const id = ++runId.current
    // Block Pay while a remembered coupon is being re-verified, so a click
    // in that window can't silently drop a discount the customer expects.
    setIsPending(true)
    void (async () => {
      try {
        const res = await getCartApi({ couponCode: appliedCode })
        if (id !== runId.current) return
        const summary = normalizePriceSummary(res.data?.price_summary)
        if (summary?.discount) {
          setPreview(summary)
          setCode(appliedCode)
        } else {
          drop(res.data?.coupon_error || GENERIC_ERROR)
        }
      } catch {
        // Network blip: keep the coupon, but don't show a stale discount
        // as if it were verified.
        if (id === runId.current) setPreview(null)
      } finally {
        if (id === runId.current) setIsPending(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshKey])

  return {
    code,
    setCode,
    error,
    isPending,
    apply: () => void apply(),
    clear,
    /** The coupon, for <CouponField>, once the server confirmed a discount. */
    applied: preview?.discount
      ? {
          code: appliedCode,
          label: `Coupon ${appliedCode}`,
          value: preview.discount.amount,
        }
      : null,
    /** Summary WITH the discount applied, straight from the server. */
    preview,
    /** Sent to POST /cart/checkout only while the server confirms it. */
    payload: preview?.discount && appliedCode ? { coupon_code: appliedCode } : {},
  }
}
