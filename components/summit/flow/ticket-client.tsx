'use client'

import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEarlyBirdEnds, getSummitTickets } from '@/features/summit/api'
import { approxOtherCurrencies, buildSummitCart, formatGbp } from '@/features/summit/pricing'
import { summitLandingHref, summitStepHref } from '@/features/summit/routes'
import { MAX_SUMMIT_ATTENDEES, useSummitBooking, useSummitBookingReady } from '@/features/summit/store'
import type { SummitEvent } from '@/features/summit/types'
import { SummitBadge } from '../badge'
import { SummitCountdown } from '../countdown'
import { WfsButton, WfsChip } from '../ui'
import { SummitCartPanel } from './cart-panel'
import { SummitCard, SummitField, SummitFlowLoading, SummitFlowPage, SummitQuantity, summitBackToLanding } from './parts'

/* Figma "WFS London · 2 · Ticket": choose the ticket and how many, name
   each attendee (the first one fills the live badge preview), then continue
   to the trip or skip straight to payment with the ticket only. */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase() : ''
}

export function SummitTicketClient({ event }: { event: SummitEvent }) {
  const router = useRouter()
  const ready = useSummitBookingReady()
  const { booking, set, setQuantity, setAttendee, skipTrip } = useSummitBooking()
  const tickets = getSummitTickets()
  const cart = buildSummitCart({ ...booking, flightsOn: false, hotelOn: false, esimOn: false, chauffeurOn: false })
  const first = booking.attendees[0]

  const toTrip = () => {
    set({ event: event.key })
    router.push(summitStepHref(event.key, 'trip'))
  }
  const ticketOnly = () => {
    set({ event: event.key })
    skipTrip()
    router.push(summitStepHref(event.key, 'pay'))
  }

  return (
    <SummitFlowPage
      event={event}
      step='ticket'
      back={summitBackToLanding(event)}
      kicker='STEP 1 OF 4'
      title='YOUR TICKET'
      sub={`Official World Football Summit ${event.name.replace('WFS ', '')} ticket. One ticket per attendee, issued in their name.`}
    >
      {/* Event strip */}
      <div className='flex flex-col gap-4 rounded-[18px] bg-wfs-ink px-6 py-[18px] text-white lg:flex-row lg:items-center lg:justify-between lg:gap-6'>
        <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
          <span className='font-display text-[34px] leading-[1.2]'>{event.stripName}</span>
          <span className='text-[14px] leading-[normal] text-wfs-on-ink-muted'>
            {event.when} · {event.where}
          </span>
          <a
            href={summitLandingHref('riyadh')}
            className='rounded-full border border-[#2a2e2a] bg-[#141714] px-3 py-1.5 font-mono text-[10.5px] font-medium leading-[normal] text-[#ffc24b] hover:border-[#ffc24b]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
          >
            RIYADH · NEW DATES SOON · NOTIFY ME
          </a>
        </div>
        <SummitCountdown endsAt={getEarlyBirdEnds()} size='s' />
      </div>

      {!ready ? (
        <SummitFlowLoading />
      ) : (
        <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
          <div className='flex min-w-0 flex-1 flex-col gap-5'>
            <SummitCard title='Choose your ticket'>
              <div role='radiogroup' aria-label='Ticket' className='flex flex-col gap-[18px]'>
                {tickets.map((t) => {
                  const on = booking.ticket === t.key
                  return (
                    <button
                      key={t.key}
                      type='button'
                      role='radio'
                      aria-checked={on}
                      disabled={!t.available}
                      onClick={() => set({ ticket: t.key })}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border px-4 py-5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime sm:gap-[18px] sm:px-[22px]',
                        on ? 'border-[1.5px] border-wfs-strong bg-wfs-selected' : 'border-wfs-line bg-wfs-surface',
                        !t.available && 'cursor-not-allowed opacity-55',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'flex size-[22px] shrink-0 items-center justify-center rounded-full border',
                          on ? 'border-[#121212] bg-wfs-lime' : 'border-[#c9cec6] bg-wfs-surface dark:border-wfs-line',
                        )}
                      >
                        {on && <span className='size-2 rounded-full bg-[#121212]' />}
                      </span>
                      <span className='flex min-w-0 flex-1 flex-col gap-1'>
                        <span className='flex flex-wrap items-center gap-2'>
                          <span className='font-heading text-[18px] font-bold leading-[normal] text-wfs-text'>{t.title}</span>
                          {t.chip && <WfsChip className='text-[10px]'>{t.chip}</WfsChip>}
                        </span>
                        {t.note && <span className='text-[13.5px] leading-[normal] text-wfs-muted'>{t.note}</span>}
                      </span>
                      <span className='flex shrink-0 flex-col items-end gap-0.5'>
                        <span className='font-display text-[38px] leading-[1.2] text-wfs-text'>{formatGbp(t.price)}</span>
                        <span className='text-[12px] leading-[normal] text-wfs-muted max-sm:hidden'>{approxOtherCurrencies(t.price)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className='flex items-center justify-between gap-4 px-0.5 pt-1.5'>
                <span className='text-[15px] font-semibold leading-[normal] text-wfs-text'>How many attendees?</span>
                <SummitQuantity value={booking.quantity} max={MAX_SUMMIT_ATTENDEES} onChange={setQuantity} />
              </div>
            </SummitCard>

            {booking.attendees.map((a, i) => (
              <SummitCard
                key={i}
                title={`Attendee ${i + 1}`}
                sub={
                  i === 0
                    ? 'Their name prints on the badge. You can edit it until 7 days before.'
                    : 'Fill in now or later, we remind you before the summit.'
                }
                aside={i === 0 ? <WfsChip>YOU</WfsChip> : <WfsChip tone='soft'>LATER IS FINE</WfsChip>}
              >
                <div className='grid gap-x-3.5 gap-y-[18px] sm:grid-cols-2'>
                  <SummitField
                    label='Full name'
                    autoComplete={i === 0 ? 'name' : 'off'}
                    placeholder='Full name as on passport'
                    value={a.fullName}
                    onChange={(e) => setAttendee(i, { fullName: e.target.value })}
                  />
                  <SummitField
                    label='Job title'
                    autoComplete={i === 0 ? 'organization-title' : 'off'}
                    placeholder={i === 0 ? 'Your job title' : 'e.g. Head of Partnerships'}
                    value={a.jobTitle}
                    onChange={(e) => setAttendee(i, { jobTitle: e.target.value })}
                  />
                  <SummitField
                    label='Organisation'
                    autoComplete={i === 0 ? 'organization' : 'off'}
                    placeholder={i === 0 ? 'Your company' : 'Club or company'}
                    value={a.organisation}
                    onChange={(e) => setAttendee(i, { organisation: e.target.value })}
                  />
                  <SummitField
                    label='Email'
                    type='email'
                    inputMode='email'
                    autoComplete={i === 0 ? 'email' : 'off'}
                    placeholder={i === 0 ? 'you@company.com' : 'name@company.com'}
                    value={a.email}
                    onChange={(e) => setAttendee(i, { email: e.target.value })}
                  />
                </div>
              </SummitCard>
            ))}
          </div>

          <div className='flex w-full flex-col gap-4 lg:sticky lg:top-[100px] lg:w-[392px] lg:shrink-0'>
            <div className='flex flex-col items-center gap-2.5 pb-2 max-lg:hidden'>
              <span className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.47px] text-wfs-muted'>LIVE BADGE PREVIEW</span>
              <SummitBadge
                scale={0.754}
                line={event.badgeLine}
                foot={event.badgeFoot}
                airport={event.airport}
                name={first?.fullName}
                role={first?.jobTitle}
                org={first?.organisation}
                initials={initialsOf(first?.fullName ?? '')}
              />
            </div>
            <SummitCartPanel
              title='Your summit trip'
              cart={cart}
              note={
                <>
                  <Clock aria-hidden className='size-3.5 shrink-0' strokeWidth={1.8} />
                  Early bird price held for 20 minutes
                </>
              }
            >
              <WfsButton arrow className='w-full' onClick={toTrip}>
                Continue to trip
              </WfsButton>
              <WfsButton variant='ghost' className='w-full' onClick={ticketOnly}>
                Skip trip, ticket only
              </WfsButton>
            </SummitCartPanel>
          </div>
        </div>
      )}
    </SummitFlowPage>
  )
}
