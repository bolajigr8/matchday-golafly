'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { VipButton, VipButtonLink } from '@/components/vip/flow/button'
import { VipError, VipLoading, VipNote, VipNotice } from '@/components/vip/flow/state'
import { VipStepper } from '@/components/vip/flow/stepper'
import { vipApi } from '@/features/vip/api'
import { vipEventView } from '@/features/vip/clubs'
import { isVipSwitchedOff, toVipError } from '@/features/vip/errors'
import { formatVipDay } from '@/features/vip/format'
import { useVipEvent } from '@/features/vip/hooks'
import { vipConfirmedHref, vipFlowHref } from '@/features/vip/routes'
import { clearVipSession } from '@/features/vip/session'
import { packageMode, stepRequired } from '@/features/vip/package'
import { useVipAction, useVipPackage } from '@/features/vip/use-package'
import { VipEsimStep } from './esim-step'
import { VipFlightStep } from './flight-step'
import { VipHotelStep } from './hotel-step'
import { VipPackagePanel } from './package-panel'

/* VIP Flow · 3 · Extras (Figma 506:3828). Step 2 of the builder: flight,
   hotel and eSIM on the left, the package ("Your cart") on the right.
   "Continue to checkout" opens only when the backend says the package is
   ready (ready_for_checkout). What "ready" needs depends on the package's
   mode (contract §1): package = ticket + flight + hotel; flexible = the
   ticket alone, as long as nothing present has expired. */
export function VipExtrasClient({ club, eventId }: { club: string; eventId: number }) {
  const router = useRouter()
  const { event, loading: eventLoading } = useVipEvent(club, eventId)
  const { pkg, paid, session, loading, error, setPackage } = useVipPackage(club, eventId)
  const { busy, error: removeError, run } = useVipAction()
  const [confirmRemove, setConfirmRemove] = useState(false)

  const seatsHref = vipFlowHref(club, eventId, 'seats')
  const checkoutHref = vipFlowHref(club, eventId, 'checkout')

  if (loading || eventLoading) {
    return (
      <div className='page-container py-10'>
        <VipLoading className='h-[900px]' />
      </div>
    )
  }
  if (paid && session?.stripeSessionId) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='This package is already paid'
          message='See its booking progress on your confirmation page.'
          action={{ href: vipConfirmedHref(session.stripeSessionId), label: 'View my booking' }}
        />
      </div>
    )
  }
  if (error && isVipSwitchedOff(error)) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='VIP packages are unavailable right now'
          message='Please try again later. Nothing has been charged.'
          action={{ href: '/vip', label: 'Back to VIP matches' }}
        />
      </div>
    )
  }
  if (!pkg || !event) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='Choose your seats first'
          message={error?.message ?? 'Your VIP package starts with a hospitality ticket for this match.'}
          action={{ href: seatsHref, label: 'Choose your seats' }}
        />
      </div>
    )
  }

  const match = vipEventView(event)
  const steps = pkg.steps
  const flexible = packageMode(pkg) === 'flexible'
  const hint = steps.flight.expired
    ? 'Your flight price expired. Please choose your flight again.'
    : steps.hotel.expired
      ? 'Your hotel price expired. Please choose your hotel again.'
      : stepRequired(pkg, 'flight') && !steps.flight.done
        ? 'Add a flight to continue.'
        : stepRequired(pkg, 'hotel') && !steps.hotel.done
          ? 'Add a hotel to continue.'
          : undefined

  const remove = async () => {
    const done = await run('remove', async () => {
      try {
        await vipApi.deletePackage(pkg.id)
      } catch (err) {
        const e = toVipError(err)
        if (e.status !== 404 || isVipSwitchedOff(e)) throw e
      }
      return true
    })
    if (done) {
      clearVipSession()
      router.push(seatsHref)
    }
  }

  const nav = (
    <div className='flex flex-wrap items-center gap-3'>
      <VipButtonLink href={seatsHref} variant='ghost'>
        Back to seats
      </VipButtonLink>
      {pkg.ready_for_checkout ? (
        <VipButtonLink href={checkoutHref} arrow>
          Continue to checkout
        </VipButtonLink>
      ) : (
        <VipButton arrow disabled>
          Continue to checkout
        </VipButton>
      )}
    </div>
  )

  return (
    <div className='page-container flex flex-col gap-6 pb-20 pt-8 sm:pt-9 lg:pb-24'>
      <VipStepper club={club} eventId={eventId} current='extras' />
      <div className='flex flex-col gap-2.5 pt-3'>
        <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[1.68px] text-vip-gold-text'>
          STEP 2 OF 4
        </p>
        <h1 className='font-heading text-[34px] font-bold leading-[normal] text-vip-chalk sm:text-[44px]'>
          Build your VIP trip
        </h1>
        <p className='text-[16px] leading-[normal] text-vip-mist'>
          {flexible
            ? 'Your match ticket is all you need. Add a flight, a 4 or 5 star hotel or an eSIM if you want them. Everything goes into one package and one payment.'
            : 'Add your flight and 4 or 5 star hotel, and an eSIM if you want one. Everything goes into one package and one payment.'}
        </p>
      </div>
      {nav}

      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-5'>
          <VipFlightStep pkg={pkg} match={match} onPackage={setPackage} />
          <VipHotelStep key={pkg.items.find((i) => i.type === 'flight')?.offerId ?? 'no-flight'} pkg={pkg} match={match} onPackage={setPackage} />
          <VipEsimStep pkg={pkg} onPackage={setPackage} />
        </div>
        <div className='flex w-full flex-col gap-3 lg:sticky lg:top-[100px] lg:w-[376px] lg:shrink-0'>
          <VipPackagePanel
            pkg={pkg}
            title={`${match.home} vs ${match.away} · ${formatVipDay(match.date)}`.toUpperCase()}
            next={{ href: checkoutHref, label: 'Go to checkout', disabled: !pkg.ready_for_checkout, hint }}
            onRemove={() => setConfirmRemove(true)}
            removing={busy === 'remove'}
          />
          {confirmRemove && (
            <VipNote className='flex flex-col items-start gap-3'>
              <span>Remove this package and everything in it from your basket?</span>
              <span className='flex flex-wrap gap-2'>
                <VipButton size='s' onClick={remove} disabled={busy === 'remove'}>
                  {busy === 'remove' ? 'Removing…' : 'Remove package'}
                </VipButton>
                <VipButton size='s' variant='ghost' onClick={() => setConfirmRemove(false)}>
                  Keep it
                </VipButton>
              </span>
            </VipNote>
          )}
          <VipError>{removeError?.message}</VipError>
        </div>
      </div>
      {nav}
    </div>
  )
}
