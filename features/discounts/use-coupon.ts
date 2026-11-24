'use client'

import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { validateCoupon } from './api'
import type { AppliedCoupon } from './types'

const STORAGE_KEY = 'matchday:applied-coupon'

function readStored(): AppliedCoupon | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppliedCoupon
    if (!parsed?.code || typeof parsed.value !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeStored(coupon: AppliedCoupon | null) {
  if (typeof window === 'undefined') return
  if (!coupon) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coupon))
}

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const message = (err as AxiosError<{ message?: string }>).response?.data
      ?.message
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}

/** Never take a charge below Stripe's card minimum. */
export function payableTotal(subtotal: number, coupon: AppliedCoupon | null): number {
  if (!coupon) return subtotal
  return Math.max(0.5, Math.round((subtotal - coupon.value) * 100) / 100)
}

/** Coupons apply to tickets, flights and hotels — never eSIM. */
export function cartItemAcceptsCoupon(type: string): boolean {
  return type === 'tickets' || type === 'flight' || type === 'hotel'
}

export function couponDiscountAmount(
  eligibleSubtotal: number,
  coupon: AppliedCoupon | null,
): number {
  if (!coupon || eligibleSubtotal <= 0) return 0
  return Math.max(
    0,
    Math.round((eligibleSubtotal - payableTotal(eligibleSubtotal, coupon)) * 100) / 100,
  )
}

export function useCoupon() {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState<AppliedCoupon | null>(readStored)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (raw: string) => validateCoupon(raw.trim()),
    onSuccess: (res) => {
      const next: AppliedCoupon = {
        code: res.data.code,
        label: res.data.label,
        value: res.data.value,
      }
      setApplied(next)
      writeStored(next)
      setError(null)
      setCode(res.data.code)
    },
    onError: (err: unknown) => {
      setError(errorMessage(err, 'Invalid coupon code.'))
    },
  })

  const apply = useCallback(() => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Enter a coupon code')
      return
    }
    setError(null)
    mutation.mutate(trimmed)
  }, [code, mutation])

  const clear = useCallback(() => {
    setApplied(null)
    writeStored(null)
    setCode('')
    setError(null)
  }, [])

  return {
    code,
    setCode,
    applied,
    error,
    apply,
    clear,
    isPending: mutation.isPending,
    payable: (subtotal: number) => payableTotal(subtotal, applied),
    payload: applied ? { coupon_code: applied.code } : {},
  }
}
