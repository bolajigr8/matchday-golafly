'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Crown, Loader2 } from 'lucide-react'
import { PriceSummaryRows } from '@/components/price/price-rows'
import { GrandTotalRow } from '@/components/price/total-row'
import { cn } from '@/lib/utils'
import { vipApi } from '@/features/vip/api'
import { isBuildingView } from '@/features/vip/contract'
import { isVipSwitchedOff, toVipError } from '@/features/vip/errors'
import { formatVipPrice } from '@/features/vip/format'
import { useVipPackageQuery } from '@/features/vip/hooks'
import { vipFlowHref } from '@/features/vip/routes'
import { clearVipSession, useVipSession } from '@/features/vip/session'

/* Cart drawer → the VIP package in progress. A package lives in the basket
   on the server and holds it (nothing else can be added, VIP contract §3),
   so the drawer shows what is in it, its live total, "Continue" and
   "Remove package". Removing calls DELETE /hospitality/packages/{id}
   (allowed while the package is being built or a payment page is open;
   refused once paid, contract §2.2). Hidden when there is no package. */

const NAMES: Record<string, string> = { matchday: 'Hospitality ticket', flight: 'Flight', stays: 'Hotel', esim: 'eSIM' }

export function VipCartNotice({ onNavigate }: { onNavigate?: () => void }) {
  const session = useVipSession()
  const qc = useQueryClient()
  const pkgQ = useVipPackageQuery(session?.packageId ?? null)
  const [confirm, setConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(true)
  if (!session) return null

  const pkg = pkgQ.data && isBuildingView(pkgQ.data) ? pkgQ.data : null
  const paid = pkgQ.data && !isBuildingView(pkgQ.data)
  const total = pkg?.price_summary?.total.amount
  const currency = pkg?.price_summary?.currency ?? 'EUR'

  const remove = async () => {
    setRemoving(true)
    setError(null)
    try {
      await vipApi.deletePackage(session.packageId)
    } catch (err) {
      const e = toVipError(err)
      /* 404 = already gone: just forget it here too (not while VIP is
         switched off: the package is still there). */
      if (e.status !== 404 || isVipSwitchedOff(e)) {
        setError(e.message)
        setRemoving(false)
        return
      }
    }
    clearVipSession()
    await qc.invalidateQueries()
    setRemoving(false)
    setConfirm(false)
  }

  const gold = 'text-[#7a5a14] dark:text-[#f0d79b]'
  return (
    <div className='mx-4 mt-4 flex flex-col gap-3 rounded-xl border border-[rgba(212,178,106,0.55)] bg-[rgba(212,178,106,0.1)] px-4 py-3'>
      <div className='flex items-start gap-3'>
        <Crown aria-hidden className={`mt-0.5 size-4 shrink-0 ${gold}`} strokeWidth={2} />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <p className='text-[13px] font-semibold leading-[1.35] text-foreground'>
            {paid ? 'Your VIP package is paid' : 'Your VIP package is in progress'}
          </p>
          {pkg ? (
            <ul className='flex flex-col gap-0.5 text-[12px] leading-[1.4] text-muted-foreground'>
              {pkg.items.map((i) => (
                <li key={i.id}>
                  {NAMES[i.type] ?? i.type}
                  {i.type === 'matchday' && i.quantity ? ` × ${i.quantity}` : ''}
                  {i.type === 'matchday' && i.eventName ? ` · ${i.eventName}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            !paid && (
              <p className='text-[12px] leading-[1.4] text-muted-foreground'>
                It holds your basket: finish or remove it before adding anything else.
              </p>
            )
          )}
        </div>
      </div>

      {/* The price breakdown, exactly like the normal cart drawer's
          "Price details" (same components, the package's live price_summary). */}
      {pkg?.price_summary && total != null && (
        <div className='pl-7'>
          <button
            type='button'
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
            className='flex w-full items-center justify-between py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground'
          >
            <span>
              Price details
              <span className='ml-1.5 normal-case tracking-normal text-muted-foreground/70'>
                · {pkg.items.length} {pkg.items.length === 1 ? 'item' : 'items'}
              </span>
            </span>
            <span className='flex items-center gap-1 normal-case tracking-normal'>
              {detailsOpen ? 'Hide' : 'Show'}
              <ChevronDown className={cn('size-3.5 transition-transform duration-200', detailsOpen && 'rotate-180')} />
            </span>
          </button>
          <AnimatePresence initial={false}>
            {detailsOpen && (
              <motion.div
                key='vip-details'
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className='overflow-hidden'
              >
                <div className='max-h-[34vh] overflow-y-auto pr-1 pt-1'>
                  <PriceSummaryRows summary={pkg.price_summary} showTotal={false} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <GrandTotalRow amount={total} currency={currency} format={formatVipPrice} size='md' />
        </div>
      )}

      {!paid && (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 pl-7'>
          <Link
            href={vipFlowHref(session.club, session.eventId, 'extras')}
            onClick={onNavigate}
            className={`text-[12.5px] font-semibold underline underline-offset-2 ${gold}`}
          >
            Continue my VIP package
          </Link>
          {!confirm ? (
            <button
              type='button'
              onClick={() => setConfirm(true)}
              className='text-[12.5px] text-muted-foreground underline underline-offset-2 hover:text-foreground'
            >
              Remove package
            </button>
          ) : (
            <span className='flex flex-wrap items-center gap-2 text-[12px] text-foreground'>
              Remove everything in it?
              <button
                type='button'
                onClick={remove}
                disabled={removing}
                className='inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[12px] font-semibold text-background disabled:opacity-60'
              >
                {removing && <Loader2 aria-hidden className='size-3 animate-spin' />}
                {removing ? 'Removing…' : 'Yes, remove'}
              </button>
              <button
                type='button'
                onClick={() => setConfirm(false)}
                disabled={removing}
                className='text-[12px] text-muted-foreground underline underline-offset-2'
              >
                Keep it
              </button>
            </span>
          )}
        </div>
      )}
      {error && <p className='pl-7 text-[12px] text-destructive'>{error}</p>}
    </div>
  )
}
