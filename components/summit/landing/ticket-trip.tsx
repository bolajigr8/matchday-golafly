'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bed, Check, Plus, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSummitTickets, getSummitTrip } from '@/features/summit/api'
import { approxOtherCurrencies, formatGbp } from '@/features/summit/pricing'
import { getSummitFx } from '@/features/summit/api'
import { summitStepHref } from '@/features/summit/routes'
import { useSummitBooking, useSummitBookingReady } from '@/features/summit/store'
import { SummitRoute } from '../route'
import { WfsButtonLink, WfsChip, WfsEyebrow, WfsTick } from '../ui'

/* Figma "Ticket and trip": the early-bird ticket card (tilts and lifts on
   hover) beside "Add your trip": flights, then the trip builder whose two
   add-ons (hotel, eSIM) update the live per-person total. */

const CHECKS = [
  'Both summit days at Fulham Pier, Craven Cottage',
  'Official WFS ticket, issued in your name',
  'Switch to any WFS event within a year if plans change',
]

function TicketCard() {
  const [early, full] = getSummitTickets()
  return (
    <div className='group/ticket w-full lg:w-[520px] lg:shrink-0'>
      <div className='flex flex-col overflow-hidden rounded-[28px] bg-wfs-ink text-white shadow-[0_1px_2px_rgba(18,20,15,0.04),0_14px_36px_-10px_rgba(18,20,15,0.18)] transition-transform duration-300 ease-out group-hover/ticket:-translate-y-2 group-hover/ticket:-rotate-[1.6deg] group-hover/ticket:scale-[1.02] motion-reduce:transform-none'>
        <div className='flex flex-col gap-5 p-6 sm:p-9'>
          <div className='flex items-center justify-between gap-3'>
            <span className='font-mono text-[12px] font-medium leading-[normal] tracking-[1.92px]'>GENERAL ENTRY</span>
            <WfsChip>EARLY BIRD</WfsChip>
          </div>
          <div className='flex flex-wrap items-end gap-3.5'>
            <span className='font-display text-[96px] leading-[0.85] sm:text-[120px]'>{formatGbp(early.price)}</span>
            <span className='flex flex-col gap-1 pb-3.5'>
              <span className='text-[18px] font-semibold leading-[normal] text-wfs-on-ink-muted line-through'>{formatGbp(full.price)}</span>
              <span className='text-[13px] leading-[normal] text-wfs-on-ink-muted'>{approxOtherCurrencies(early.price)}</span>
            </span>
          </div>
          <span className='w-fit rounded-full border border-[#2a2e2a] bg-[#141714] px-3 py-1.5 text-[13px] font-medium leading-[normal] text-wfs-lime'>
            You save £200 until 10 December 2026
          </span>
        </div>
        {/* Perforation: two notches in the page colour and a dashed tear line */}
        <div aria-hidden className='relative h-6'>
          <span className='absolute -left-3 top-0 size-6 rounded-full bg-wfs-surface' />
          <span className='absolute -right-3 top-0 size-6 rounded-full bg-wfs-surface' />
          <span className='absolute inset-x-10 top-1/2 border-t border-dashed border-white/70' />
        </div>
        <div className='flex flex-col gap-3.5 px-6 pb-6 pt-6 sm:px-9 sm:pb-9'>
          {CHECKS.map((c) => (
            <span key={c} className='flex items-start gap-2.5 text-[15px] leading-[21px]'>
              <WfsTick className='mt-px' />
              {c}
            </span>
          ))}
          <WfsButtonLink href={summitStepHref('london', 'ticket')} arrow className='mt-[21px] w-fit'>
            Get your ticket
          </WfsButtonLink>
        </div>
      </div>
    </div>
  )
}

function AddOnRow({
  icon,
  title,
  sub,
  price,
  on,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  price: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type='button'
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'flex min-h-20 w-full items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime sm:gap-[18px] sm:px-6',
        on ? 'border-[1.5px] border-wfs-strong bg-wfs-selected' : 'border-wfs-line bg-wfs-surface hover:border-wfs-strong/40',
      )}
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-[14px] transition-colors duration-200',
          on ? 'bg-wfs-lime text-wfs-on-lime' : 'bg-wfs-soft text-wfs-text',
        )}
      >
        {icon}
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-[3px]'>
        <span className='font-heading text-[17px] font-bold leading-[normal] text-wfs-text'>{title}</span>
        <span className='text-[13.5px] leading-[normal] text-wfs-muted'>{sub}</span>
      </span>
      <span className='shrink-0 text-[14px] font-semibold leading-[normal] text-wfs-text max-[419px]:hidden'>{price}</span>
      <span
        className={cn(
          'flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-full border text-[13px] font-semibold leading-[normal] transition-colors duration-200',
          on ? 'border-wfs-strong bg-wfs-active px-3.5 text-wfs-on-active' : 'w-[38px] border-wfs-line bg-wfs-surface text-wfs-text',
        )}
      >
        {on ? (
          <>
            <Check aria-hidden className='size-3.5' strokeWidth={2.6} />
            Added
          </>
        ) : (
          <Plus aria-hidden className='size-4' strokeWidth={2.4} />
        )}
      </span>
    </button>
  )
}

function TripBuilder() {
  const router = useRouter()
  useSummitBookingReady()
  const setBooking = useSummitBooking((s) => s.set)
  const trip = getSummitTrip()
  const ticket = getSummitTickets()[0]
  const hotel = trip.hotels[0]
  const esim = trip.esimPlans.find((p) => p.key === '10gb') ?? trip.esimPlans[0]
  const [hotelOn, setHotelOn] = useState(false)
  const [esimOn, setEsimOn] = useState(false)

  const total = ticket.price + (hotelOn ? hotel.pricePerNight * trip.nights : 0) + (esimOn ? esim.price : 0)
  const chips = ['Ticket', ...(hotelOn ? [`Hotel · ${trip.nights} nights`] : []), ...(esimOn ? ['UK eSIM'] : [])]
  const usd = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(total * getSummitFx().USD))

  /* Carry the choices into the booking, then start at the ticket step. */
  const go = () => {
    setBooking({ hotelOn, esimOn, hotelId: hotel.id, esimPlan: esim.key })
    router.push(summitStepHref('london', 'ticket'))
  }

  return (
    <div className='flex flex-col gap-3.5'>
      <AddOnRow
        icon={<Bed className='size-[22px]' strokeWidth={1.65} />}
        title='Hotel by the river'
        sub='4★ and 5★ stays in Fulham and Chelsea'
        price={`from ${formatGbp(hotel.pricePerNight)}/night`}
        on={hotelOn}
        onToggle={() => setHotelOn((v) => !v)}
      />
      <AddOnRow
        icon={<Signal className='size-[22px]' strokeWidth={1.65} />}
        title='UK eSIM'
        sub='Data from the moment you land'
        price={formatGbp(esim.price)}
        on={esimOn}
        onToggle={() => setEsimOn((v) => !v)}
      />
      <div className='flex flex-wrap items-center gap-4 rounded-[20px] bg-wfs-ink py-[18px] pl-6 pr-5 text-white'>
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <span aria-live='polite' className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.47px] text-wfs-lime'>
            YOUR TRIP · {chips.length} {chips.length === 1 ? 'ITEM' : 'ITEMS'}
          </span>
          <span className='flex flex-wrap gap-1.5'>
            {chips.map((c) => (
              <span key={c} className='rounded-full border border-[#2a2e2a] bg-[#141714] px-3 py-1.5 text-[12px] font-medium leading-[normal]'>
                {c}
              </span>
            ))}
          </span>
        </div>
        <div className='flex flex-col items-end'>
          <span className='font-display text-[34px] leading-[1.2] tabular-nums'>{formatGbp(total)}</span>
          <span className='text-[11.5px] leading-[normal] text-wfs-on-ink-muted'>≈ ${usd} · per person</span>
        </div>
        <button
          type='button'
          onClick={go}
          aria-label='Continue with this trip'
          className='flex size-11 shrink-0 items-center justify-center rounded-full bg-wfs-lime text-wfs-on-lime transition-colors duration-200 hover:bg-[#cbff4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
        >
          <ArrowRight aria-hidden className='size-[18px]' strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}

export function SummitTicketTrip() {
  return (
    <section id='tickets' className='scroll-mt-28 bg-wfs-surface'>
      <div className='page-container flex flex-col gap-10 py-16 lg:gap-14 lg:py-[120px]'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='flex flex-col gap-4'>
            <WfsEyebrow>01 · YOUR TICKET</WfsEyebrow>
            <h2 className='font-display text-[56px] leading-[0.88] text-wfs-text sm:text-[76px] lg:text-[96px] lg:leading-[84.5px]'>
              ONE TICKET.
              <br />
              EVERYTHING AROUND IT.
            </h2>
          </div>
          <p className='max-w-[400px] text-[16px] leading-[1.55] text-wfs-muted sm:text-[17px] sm:leading-[26.3px]'>
            Book the official WFS ticket on Golafly, then add the trip in two clicks. One booking, one payment, one person to call.
          </p>
        </div>

        <div className='flex flex-col gap-6 lg:flex-row lg:items-stretch'>
          <TicketCard />
          <div id='trip' className='flex min-w-0 flex-1 scroll-mt-28 flex-col gap-3.5'>
            <div className='flex items-center justify-between'>
              <span className='font-mono text-[11.5px] font-medium leading-[normal] tracking-[1.84px] text-wfs-muted'>ADD YOUR TRIP</span>
              <span className='text-[13px] leading-[normal] text-wfs-muted'>All optional</span>
            </div>
            <div className='flex flex-1 flex-col justify-center gap-4 rounded-[22px] border border-wfs-line bg-wfs-surface px-5 py-6 shadow-[var(--wfs-card-shadow)] sm:px-7'>
              <div className='flex items-center justify-between gap-3'>
                <span className='font-heading text-[19px] font-bold leading-[normal] text-wfs-text'>Flights from your city</span>
                <span className='text-[14px] font-semibold leading-[normal] text-wfs-lime-ink'>Live fares</span>
              </div>
              <SummitRoute from='ANY' to='LHR' caption='From any city · direct or 1 stop' />
            </div>
            <TripBuilder />
          </div>
        </div>
      </div>
    </section>
  )
}
