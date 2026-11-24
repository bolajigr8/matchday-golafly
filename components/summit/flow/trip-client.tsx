'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Lock, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSummitTrip } from '@/features/summit/api'
import { buildSummitCart, fareFor, formatGbp } from '@/features/summit/pricing'
import { summitStepHref } from '@/features/summit/routes'
import { useSummitBooking, useSummitBookingReady } from '@/features/summit/store'
import type { SummitEvent } from '@/features/summit/types'
import { SummitRoute } from '../route'
import { WfsButton } from '../ui'
import { SummitCartPanel } from './cart-panel'
import { SummitCard, SummitFlowLoading, SummitFlowPage, SummitPick, SummitSegmented, SummitSwitch } from './parts'

/* Figma "WFS London · 3 · Trip": flights, hotel, eSIM and airport chauffeur.
   Each has its own "Included / Not needed" switch; only what is switched on
   goes in the cart, and the cart total follows every choice. */

const OPTION =
  'w-full text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'

export function SummitTripClient({ event }: { event: SummitEvent }) {
  const router = useRouter()
  const ready = useSummitBookingReady()
  const { booking, set } = useSummitBooking()
  const trip = getSummitTrip()
  const cart = buildSummitCart(booking)
  const q = booking.quantity
  const people = `${q} traveller${q === 1 ? '' : 's'}`
  const esim = trip.esimPlans.find((p) => p.key === booking.esimPlan) ?? trip.esimPlans[0]
  const off = 'pointer-events-none opacity-45'

  return (
    <SummitFlowPage
      event={event}
      step='trip'
      back={{ href: summitStepHref(event.key, 'ticket'), label: 'Back' }}
      kicker='STEP 2 OF 4'
      title='YOUR TRIP'
      sub='Everything is optional. Keep what you need, only that goes in the cart.'
    >
      {!ready ? (
        <SummitFlowLoading />
      ) : (
        <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
          <div className='flex min-w-0 flex-1 flex-col gap-5'>
            {/* ── Flights ── */}
            <SummitCard
              title='Flights to London'
              sub={`Return for ${people}. ${trip.arriveNote}`}
              aside={<SummitSwitch label='Flights' on={booking.flightsOn} onChange={(v) => set({ flightsOn: v })} />}
            >
              <div className={cn('flex flex-col gap-[18px] transition-opacity duration-200', !booking.flightsOn && off)} inert={!booking.flightsOn}>
                <SummitRoute from='ANY' to={event.airport} caption='From any city · direct or 1 stop' />
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <SummitSegmented label='Cabin' options={trip.cabins} value={booking.cabin} onChange={(cabin) => set({ cabin })} />
                  <label className='flex h-[42px] w-full items-center gap-2 rounded-full border border-black/14 bg-wfs-surface px-3.5 focus-within:border-wfs-strong dark:border-white/16 dark:bg-wfs-ink sm:w-[220px]'>
                    <Search aria-hidden className='size-3.5 shrink-0 text-[#6b6b6b] dark:text-[#bdbdbd]' strokeWidth={2} />
                    <span className='font-mono text-[10px] font-medium leading-[normal] tracking-[1.2px] text-[#737373] dark:text-[#999999]'>FROM</span>
                    <input
                      aria-label='Flying from'
                      autoComplete='off'
                      placeholder='Any city or airport'
                      value={booking.flyingFrom}
                      onChange={(e) => set({ flyingFrom: e.target.value })}
                      className='min-w-0 flex-1 bg-transparent text-[12.5px] font-medium leading-[normal] text-wfs-text outline-none placeholder:text-wfs-text'
                    />
                  </label>
                </div>
                <div role='radiogroup' aria-label='Flight' className='flex flex-col gap-2.5'>
                  {trip.flights.map((f) => {
                    const on = booking.flightId === f.id
                    return (
                      <button
                        key={f.id}
                        type='button'
                        role='radio'
                        aria-checked={on}
                        onClick={() => set({ flightId: f.id })}
                        className={cn(
                          OPTION,
                          'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 rounded-[14px] border px-4 py-4 md:flex md:gap-x-[18px] md:px-[18px]',
                          on
                            ? 'border-[1.5px] border-wfs-strong bg-wfs-selected shadow-[0_1px_2px_rgba(18,20,15,0.04),0_14px_36px_-10px_rgba(18,20,15,0.06)]'
                            : 'border-wfs-line bg-wfs-surface hover:border-wfs-strong/40',
                        )}
                      >
                        <span className='col-start-1 row-start-1 flex shrink-0 flex-col gap-0.5 md:w-[150px]'>
                          <span className='text-[14px] font-semibold leading-[normal] text-wfs-text'>{f.airline}</span>
                          <span className='text-[12px] leading-[normal] text-wfs-muted'>{f.detail}</span>
                        </span>
                        <span className='col-span-2 row-start-2 flex min-w-0 flex-1 items-center gap-3 md:gap-4'>
                          <span className='font-heading text-[20px] font-bold leading-[normal] tabular-nums text-wfs-text'>{f.depart}</span>
                          <span className='flex min-w-10 flex-1 flex-col items-center gap-1 md:w-[110px] md:flex-none'>
                            <span className='text-[11.5px] leading-[normal] text-wfs-muted'>{f.duration}</span>
                            <span className='h-px w-full bg-[#c9cec6] dark:bg-wfs-hair' />
                          </span>
                          <span className='whitespace-nowrap font-heading text-[20px] font-bold leading-[normal] tabular-nums text-wfs-text'>{f.arrive}</span>
                        </span>
                        <span className='col-span-2 row-start-3 flex items-baseline gap-2 md:flex-col md:items-end md:gap-0.5'>
                          <span className='text-[16px] font-bold leading-[normal] tabular-nums text-wfs-text'>{formatGbp(fareFor(f.id, booking.cabin))}</span>
                          <span className='text-[11.5px] leading-[normal] text-wfs-muted'>per person · return</span>
                        </span>
                        <SummitPick selected={on} className='col-start-2 row-start-1' />
                      </button>
                    )
                  })}
                </div>
              </div>
            </SummitCard>

            {/* ── Hotel ── */}
            <SummitCard
              title='Hotel by the river'
              sub={`${q} room${q === 1 ? '' : 's'} · ${trip.nights} nights · ${trip.stayDates}. 4★ and 5★ only, all near Craven Cottage.`}
              aside={<SummitSwitch label='Hotel' on={booking.hotelOn} onChange={(v) => set({ hotelOn: v })} />}
            >
              <div
                role='radiogroup'
                aria-label='Hotel'
                inert={!booking.hotelOn}
                className={cn('grid gap-3.5 transition-opacity duration-200 sm:grid-cols-2', !booking.hotelOn && off)}
              >
                {trip.hotels.map((h) => {
                  const on = booking.hotelId === h.id
                  return (
                    <button
                      key={h.id}
                      type='button'
                      role='radio'
                      aria-checked={on}
                      onClick={() => set({ hotelId: h.id })}
                      className={cn(
                        OPTION,
                        'flex flex-col overflow-hidden rounded-2xl border bg-wfs-surface',
                        on
                          ? 'border-[1.5px] border-wfs-strong shadow-[0_1px_2px_rgba(18,20,15,0.04),0_14px_36px_-10px_rgba(18,20,15,0.08)]'
                          : 'border-wfs-line hover:border-wfs-strong/40',
                      )}
                    >
                      <span className='relative block h-[140px] w-full'>
                        <Image src={h.image} alt='' fill sizes='(min-width: 640px) 364px, 100vw' className='object-cover' />
                        <span aria-hidden className='absolute inset-0 bg-linear-to-b from-black/0 to-black/35' />
                        <span className='absolute left-3.5 top-3.5 rounded-full bg-[#0a0a0a]/60 px-3 py-1.5 font-mono text-[11px] font-medium leading-[normal] text-white'>
                          {h.stars}★
                        </span>
                      </span>
                      <span className='flex flex-col gap-1.5 p-4'>
                        <span className='text-[14.5px] font-semibold leading-[normal] text-wfs-text'>{h.name}</span>
                        <span className='text-[12.5px] leading-[normal] text-wfs-muted'>{h.detail}</span>
                        <span className='flex items-center justify-between gap-3 pt-1.5'>
                          <span className='text-[14.5px] font-bold leading-[normal] text-wfs-text'>{formatGbp(h.pricePerNight)} / night</span>
                          <SummitPick selected={on} className='h-8' />
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </SummitCard>

            {/* ── Small extras ── */}
            <div className='grid gap-5 md:grid-cols-2'>
              <SummitCard
                title='UK eSIM'
                sub='Works the moment you land.'
                aside={<SummitSwitch label='UK eSIM' on={booking.esimOn} onChange={(v) => set({ esimOn: v })} />}
              >
                <div className={cn('flex flex-col gap-[18px] transition-opacity duration-200', !booking.esimOn && off)} inert={!booking.esimOn}>
                  <SummitSegmented label='Data plan' options={trip.esimPlans} value={booking.esimPlan} onChange={(esimPlan) => set({ esimPlan })} />
                  <span className='text-[14px] font-semibold leading-[normal] text-wfs-text'>{formatGbp(esim.price)} per person</span>
                </div>
              </SummitCard>
              <SummitCard
                title='Airport chauffeur'
                sub='Heathrow to hotel, both ways.'
                aside={<SummitSwitch label='Airport chauffeur' on={booking.chauffeurOn} onChange={(v) => set({ chauffeurOn: v })} />}
              >
                <div className='flex flex-col gap-[18px]'>
                  <span className='text-[13.5px] leading-[normal] text-wfs-muted'>{trip.chauffeur.detail}</span>
                  <span className='text-[14px] font-semibold leading-[normal] text-wfs-text'>{formatGbp(trip.chauffeur.price)} return</span>
                </div>
              </SummitCard>
            </div>
          </div>

          <div className='w-full lg:sticky lg:top-[100px] lg:w-[392px] lg:shrink-0'>
            <SummitCartPanel
              title='Your summit trip'
              eyebrow={`${event.cartName} · ${q} ATTENDEE${q === 1 ? '' : 'S'}`}
              cart={cart}
              note={
                <>
                  <Lock aria-hidden className='size-3.5 shrink-0' strokeWidth={1.8} />
                  Nothing is charged until you pay
                </>
              }
            >
              <WfsButton arrow className='w-full' onClick={() => router.push(summitStepHref(event.key, 'pay'))}>
                Continue to checkout
              </WfsButton>
            </SummitCartPanel>
          </div>
        </div>
      )}
    </SummitFlowPage>
  )
}
