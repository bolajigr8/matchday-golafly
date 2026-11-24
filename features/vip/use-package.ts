'use client'

// features/vip/use-package.ts
//
// The package the builder pages (Seats → Extras → Checkout) work on: the
// saved session (./session.ts) says WHICH package, the backend says WHAT is
// in it (GET /hospitality/packages/{id}). Every change goes through
// setPackage(), which stores the package shape the backend just returned,
// so the screen always shows the server's own steps, lines and prices.

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isBuildingView, type VipPackage, type VipPaidPackage } from './contract'
import { isVipSwitchedOff, toVipError, type VipApiError } from './errors'
import { useVipPackageQuery, vipKeys } from './hooks'
import { clearVipSession, useVipSession, useVipSessionReady, type VipSession } from './session'

export interface VipPackageState {
  /** Storage has been read (false during the server render). */
  ready: boolean
  /** The saved session, when it is for this match. */
  session: VipSession | null
  /** A saved session for a DIFFERENT match (one package per basket). */
  otherSession: VipSession | null
  /** The package while it is being built. */
  pkg: VipPackage | null
  /** The package once paid (after-payment view). */
  paid: VipPaidPackage | null
  loading: boolean
  error: VipApiError | null
  setPackage: (p: VipPackage) => void
  refetch: () => void
}

export function useVipPackage(club: string, eventId: number): VipPackageState {
  const ready = useVipSessionReady()
  const session = useVipSession()
  const mine = session && session.club === club && session.eventId === eventId ? session : null
  const q = useVipPackageQuery(mine?.packageId ?? null)
  const qc = useQueryClient()

  const view = q.data ?? null
  const pkg = view && isBuildingView(view) ? view : null
  const paid = view && !isBuildingView(view) ? view : null

  /* The package is gone (removed, or another device cleared the basket),
     or it was removed before payment: forget it. NOT while VIP is
     switched off (also a 404): the package is still in the basket and
     comes back when an admin switches VIP on again. */
  const gone = (q.error?.status === 404 && !isVipSwitchedOff(q.error)) || pkg?.status === 'abandoned'
  useEffect(() => {
    if (gone && mine) clearVipSession()
  }, [gone, mine])

  const setPackage = useCallback(
    (p: VipPackage) => {
      qc.setQueryData(vipKeys.package(p.id), p)
    },
    [qc],
  )

  return {
    ready,
    session: mine,
    otherSession: session && !mine ? session : null,
    pkg: gone ? null : pkg,
    paid,
    loading: !ready || (!!mine && q.isLoading),
    error: gone ? null : (q.error ?? null),
    setPackage,
    refetch: () => void q.refetch(),
  }
}

/** One backend action at a time, with its error kept for the screen. */
export function useVipAction() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<VipApiError | null>(null)

  const run = useCallback(async <T,>(name: string, fn: () => Promise<T>): Promise<T | null> => {
    setBusy(name)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(toVipError(err))
      return null
    } finally {
      setBusy(null)
    }
  }, [])

  return { busy, error, setError, run }
}
