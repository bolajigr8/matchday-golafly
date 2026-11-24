'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { VipChip, VipPanel, VipSubSteps } from '@/components/vip/flow/panel'
import { VipQuantity } from '@/components/vip/flow/quantity'
import { VipError, VipNote } from '@/components/vip/flow/state'
import { vipApi } from '@/features/vip/api'
import type { VipPackage } from '@/features/vip/contract'
import type { VipApiError } from '@/features/vip/errors'
import { formatVipPrice } from '@/features/vip/format'
import { vipKeys } from '@/features/vip/hooks'
import { packageItem, packageTravellers } from '@/features/vip/package'
import { useVipAction } from '@/features/vip/use-package'

/* Extras → "eSIM · Stay connected" (Figma 506:4127 + "VIP · eSIM region" /
   "VIP · eSIM plan"), optional. Figma's states: plans with Add / Skip eSIM;
   Added → "✓ Added" / Remove; Skipped (55% opacity) → Skipped / Undo.
   Live data: the plans are the backend's Spain eSIMs (GET …/esims), so the
   region chip is "Local · Spain" only. The number of eSIMs (up to the
   travellers) is not in Figma: the backend needs it, so it shows when there
   is more than one traveller. Adding again replaces the earlier eSIM; it
   can be removed any time before checkout (contract §2.5). */

type Step = 'results' | 'done' | 'skipped'

export function VipEsimStep({ pkg, onPackage }: { pkg: VipPackage; onPackage: (p: VipPackage) => void }) {
  const travellers = packageTravellers(pkg)
  const current = packageItem(pkg, 'esim')
  const [chosenStep, setStep] = useState<Step>(current ? 'done' : 'results')
  const step: Step = chosenStep === 'done' && !current ? 'results' : chosenStep
  const [qty, setQty] = useState(current?.quantity ?? travellers)
  const { busy, error, run } = useVipAction()

  const plans = useInfiniteQuery({
    queryKey: vipKeys.esims(pkg.id),
    queryFn: ({ pageParam }) => vipApi.getEsims(pkg.id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.last_page ? last.pagination.page + 1 : undefined),
    /* Also needed on "Added" when the cart line has no plan details of
       its own (only packageId + quantity), to name the plan. */
    enabled: step === 'results' || (!!current && !current.package),
    staleTime: 2 * 60_000,
    retry: false,
  })
  const list = plans.data?.pages.flatMap((p) => p.data) ?? []

  const add = async (packageId: string) => {
    const p = await run(`add-${packageId}`, () => vipApi.addEsim(pkg.id, packageId, Math.min(Math.max(qty, 1), travellers)))
    if (p) {
      onPackage(p)
      setStep('done')
    }
  }

  const remove = async () => {
    const p = await run('remove', () => vipApi.removeEsim(pkg.id))
    if (p) {
      onPackage(p)
      setStep('results')
    }
  }

  const planName =
    current?.package?.title ??
    current?.package?.name ??
    list.find((p) => p.package_id === current?.packageId)?.title ??
    'eSIM'

  const link = 'text-[13px] leading-[normal] transition-colors'
  const skipped = step === 'skipped'

  return (
    <VipPanel
      id='vip-esim-title'
      title='eSIM · Stay connected'
      subtitle='Activate before you land · no physical SIM'
      aside={<VipSubSteps steps={['SEARCH', 'RESULTS', 'CONFIRM']} current={step === 'done' ? 2 : 1} />}
    >
      {/* "VIP · eSIM region" chips. VIP eSIMs are Spain only (contract §2.5),
          so Figma's "Global (multi country)" chip is not offered. */}
      <div role='radiogroup' aria-label='eSIM coverage' className='flex flex-wrap items-center justify-between gap-3'>
        <VipChip active onClick={() => undefined}>
          Local · Spain
        </VipChip>
        {step !== 'done' && travellers > 1 && (
          <span className='flex items-center gap-3'>
            <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>ESIMS</span>
            <VipQuantity value={qty} min={1} max={travellers} onChange={setQty} label='Number of eSIMs' />
          </span>
        )}
      </div>

      {/* Added: the chosen plan, "✓ Added" / Remove (Figma "Added" state). */}
      {step === 'done' && current && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-vip-gold/70 bg-vip-gold/7 px-[18px] py-3.5'>
          <span className='text-[14px] font-medium leading-[normal] text-vip-chalk'>
            {planName}
            {(current.quantity ?? 1) > 1 ? ` × ${current.quantity}` : ''}
          </span>
          <span className='flex items-center gap-3.5'>
            <span className={cn(link, 'font-semibold text-vip-gold-text')}>✓ Added</span>
            <button type='button' onClick={() => setStep('results')} className={cn(link, 'text-vip-mist hover:text-vip-chalk')}>
              Change
            </button>
            <button
              type='button'
              onClick={remove}
              disabled={busy === 'remove'}
              className={cn(link, 'text-vip-mist hover:text-vip-chalk disabled:opacity-60')}
            >
              {busy === 'remove' ? 'Removing…' : 'Remove'}
            </button>
          </span>
        </div>
      )}

      {/* Plans (Figma "VIP · eSIM plan" rows): Add / Skip eSIM; Skipped rows
          dim to 55% with Undo. */}
      {step !== 'done' && (
        <>
          {plans.isLoading && <div aria-hidden className='h-[52px] animate-pulse rounded-[14px] bg-vip-line/4' />}
          {plans.error && <VipError>{(plans.error as VipApiError).message}</VipError>}
          {plans.isSuccess && list.length === 0 && <VipNote>No eSIM plans are available right now.</VipNote>}
          <ul className='flex flex-col gap-2.5'>
            {list.map((plan) => (
              <li
                key={plan.package_id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-vip-line/8 bg-vip-tint/2 px-[18px] py-3.5 transition-[opacity,background-color,border-color]',
                  skipped && 'opacity-55',
                )}
              >
                <span className='text-[14px] font-medium leading-[normal] text-vip-chalk'>
                  {plan.title} · {plan.data} · {plan.validity_days} days
                </span>
                <span className='flex items-center gap-3.5'>
                  <span className='text-[14px] font-semibold leading-[normal] text-vip-chalk'>
                    {formatVipPrice(plan.price, plan.currency)}
                  </span>
                  {!skipped && (
                    <button
                      type='button'
                      onClick={() => add(plan.package_id)}
                      disabled={!!busy}
                      className={cn(link, 'font-semibold text-vip-gold-text hover:opacity-80 disabled:opacity-60')}
                    >
                      {busy === `add-${plan.package_id}` ? 'Adding…' : 'Add'}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className='flex flex-wrap items-center gap-3.5'>
            {skipped ? (
              <>
                <span className={cn(link, 'font-semibold text-vip-gold-text')}>Skipped</span>
                <button type='button' onClick={() => setStep('results')} className={cn(link, 'text-vip-mist hover:text-vip-chalk')}>
                  Undo
                </button>
              </>
            ) : (
              <button type='button' onClick={() => setStep('skipped')} className={cn(link, 'text-vip-mist hover:text-vip-chalk')}>
                Skip eSIM
              </button>
            )}
            {plans.hasNextPage && !skipped && (
              <button
                type='button'
                onClick={() => void plans.fetchNextPage()}
                disabled={plans.isFetchingNextPage}
                className={cn(link, 'font-semibold text-vip-gold-text hover:opacity-80')}
              >
                {plans.isFetchingNextPage ? 'Loading…' : 'More plans'}
              </button>
            )}
            {current && !skipped && (
              <button type='button' onClick={() => setStep('done')} className={cn(link, 'text-vip-mist hover:text-vip-chalk')}>
                Keep my eSIM
              </button>
            )}
          </div>
        </>
      )}

      <VipError>{error?.message}</VipError>
    </VipPanel>
  )
}
