'use client'

// The match builder's hotel box (/builder/extras): one section with the
// travels Stays steps (Search · Results · Hotel · Done). The supplier is
// chosen in Admin → Settings → Providers (GET /stays/providers, contract v1.1
// section 5); the env value is only the fallback when that request fails.
// Shown only when NEXT_PUBLIC_STAYS_LIVE=true.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BedDouble, Check, Loader2, Trash2 } from 'lucide-react'
import { MiniStepProgress } from '@/components/checkout/mini-step-progress'
import { HotelImage } from '@/components/stays/hotel-image'
import { useCart } from '@/features/cart/context'
import { useStaysProvider, type ActiveStaysProvider } from '@/features/stays/provider'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { STAYS_LIVE, type StaysProvider } from '@/lib/stays-config'
import { EtgHotelStep } from './etg-hotel-step'
import { DuffelHotelStep } from './duffel-hotel-step'
import { HOTEL_STEPS, HOTEL_STEP_NUMBER, type HotelDefaults, type HotelStep } from './shared'

export type { HotelDefaults } from './shared'

export function BuilderHotelStep({
  matchId,
  defaults,
  resolving,
}: {
  matchId: string | null
  defaults: HotelDefaults | null
  resolving: boolean
}) {
  if (!STAYS_LIVE) return null
  return <HotelBox matchId={matchId} defaults={defaults} resolving={resolving} />
}

function HotelBox({
  matchId,
  defaults,
  resolving,
}: {
  matchId: string | null
  defaults: HotelDefaults | null
  resolving: boolean
}) {
  const { data: liveProvider, isLoading: providerLoading } = useStaysProvider()
  const { items, removeTypeAndServer } = useCart()
  const hotelItem = items.find((i) => i.type === 'hotel')
  const [chosenStep, setStep] = useState<HotelStep>('search')
  const [removing, setRemoving] = useState(false)
  // Set once the guest moves through the steps themselves.
  const [touched, setTouched] = useState(false)
  // Contract 5.4 (3): a booking already in progress keeps its provider. Once
  // the guest leaves Search, the supplier they searched with stays until they
  // reserve (Done) or start a new search; only new searches use a new switch.
  const [bookingProvider, setBookingProvider] = useState<StaysProvider | null>(null)

  // A hotel already in the cart (e.g. after a reload) opens on "Done" until
  // the guest starts changing it; with no hotel there is nothing to show as done.
  const step: HotelStep =
    !touched && hotelItem && chosenStep === 'search'
      ? 'done'
      : !hotelItem && chosenStep === 'done'
        ? 'search'
        : chosenStep

  const inBooking = step === 'results' || step === 'hotel'
  const provider: ActiveStaysProvider | undefined =
    inBooking && bookingProvider ? bookingProvider : liveProvider

  function go(next: HotelStep) {
    setTouched(true)
    setStep(next)
    if (next === 'results' || next === 'hotel') {
      if (!bookingProvider && provider && provider !== 'none') setBookingProvider(provider)
    } else {
      setBookingProvider(null)
    }
  }

  async function removeHotel() {
    setRemoving(true)
    try {
      await removeTypeAndServer('hotel')
    } finally {
      setRemoving(false)
      go('search')
    }
  }

  const payload = hotelItem?.checkoutPayload ?? {}

  return (
    <section>
      <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='flex items-center gap-2 text-[15px] font-bold text-foreground'>
          Hotel
          <span className='rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground'>
            Optional
          </span>
        </h2>
        <MiniStepProgress steps={HOTEL_STEPS} currentStep={HOTEL_STEP_NUMBER[step]} />
      </div>

      {step === 'done' && hotelItem ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col gap-4 rounded-2xl border border-brand-text/25 bg-primary/5 p-4 sm:flex-row sm:items-center'
        >
          <div className='relative h-20 w-full shrink-0 overflow-hidden rounded-xl sm:w-28'>
            <HotelImage hotelImageUrl={hotelItem.image} cdnSize='240x240' alt={hotelItem.name} fill sizes='112px' className='object-cover' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='flex items-center gap-1.5 text-[13px] font-bold text-foreground'>
              <Check className='size-4 shrink-0 text-brand-text' /> {hotelItem.name}
            </p>
            {typeof payload.roomName === 'string' && (
              // The full room name, qualifiers included (contract section 3).
              <p className='mt-0.5 break-words text-[12px] text-foreground/80'>{payload.roomName}</p>
            )}
            <p className='mt-0.5 text-[11px] text-muted-foreground'>
              {hotelItem.detail.split(' · ')[0]} · {formatMatchdayMoney(hotelItem.price, String(payload.currency ?? 'EUR'))}
            </p>
          </div>
          <div className='flex shrink-0 gap-2'>
            <button
              type='button'
              onClick={() => go('search')}
              className='rounded-full border border-brand-text/35 px-4 py-1.5 font-mono text-[11px] font-bold text-brand-text hover:bg-primary/10'
            >
              Change hotel
            </button>
            <button
              type='button'
              onClick={() => void removeHotel()}
              disabled={removing}
              aria-label='Remove the hotel'
              className='grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive disabled:opacity-50'
            >
              {removing ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
            </button>
          </div>
        </motion.div>
      ) : providerLoading ? (
        <div className='flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-[12px] text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' /> Loading hotels…
        </div>
      ) : provider === 'none' || !provider ? (
        // Contract 5.2: no provider switched on → no hotel search.
        <div className='flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-[12px] text-muted-foreground'>
          <BedDouble className='size-4 shrink-0' /> Hotel booking is not available right now.
        </div>
      ) : (
        <>
          {step === 'search' && (
            <p className='mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
              <BedDouble className='size-3.5 shrink-0 text-brand-text' />
              {defaults?.city
                ? `Stay near the stadium in ${defaults.city}. Dates are pre-filled from your match: change them, then tap Search.`
                : 'Search for a place to stay near the stadium.'}
              {hotelItem ? ' Your current hotel stays in the cart until you reserve another.' : ''}
            </p>
          )}
          {provider === 'duffel' ? (
            <DuffelHotelStep matchId={matchId} defaults={defaults} resolving={resolving} step={step} setStep={go} />
          ) : (
            <EtgHotelStep matchId={matchId} defaults={defaults} resolving={resolving} step={step} setStep={go} />
          )}
        </>
      )}
    </section>
  )
}
