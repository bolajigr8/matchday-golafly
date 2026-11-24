'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTACT } from '@/store/data'
import { getSummitTrip } from '@/features/summit/api'
import { formatGbp } from '@/features/summit/pricing'
import { summitLandingHref, summitStepHref } from '@/features/summit/routes'
import { useSummitBooking, useSummitBookingReady } from '@/features/summit/store'
import type { SummitEvent } from '@/features/summit/types'
import { SummitBadge } from '../badge'
import { WfsButton, WfsButtonLink, wfsButtonClass } from '../ui'
import { SummitFlowLoading, SummitFlowPage } from './parts'

/* Figma "WFS London · 5 · Confirmed": the celebration block with the
   attendees' badges, the trip plan, the booking summary and the concierge.
   MOCK: the booking shown is the one kept in this browser tab. */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase() : ''
}

export function SummitConfirmedClient({ event }: { event: SummitEvent }) {
  const ready = useSummitBookingReady()
  const booking = useSummitBooking((s) => s.booking)
  const trip = getSummitTrip()

  if (!ready) {
    return (
      <SummitFlowPage event={event} step='confirmed' back={{ label: 'Booking' }}>
        <SummitFlowLoading />
      </SummitFlowPage>
    )
  }

  /* Opened without a finished booking (new tab, or the tab was closed). */
  if (!booking.reference) {
    return (
      <SummitFlowPage event={event} step='ticket' back={{ href: summitLandingHref(event.key), label: `${event.name} 2027` }}>
        <div className='flex flex-col items-start gap-4 rounded-[20px] border border-dashed border-wfs-line bg-wfs-soft p-6 sm:p-8'>
          <h1 className='font-display text-[40px] leading-[1.1] text-wfs-text'>NO BOOKING TO SHOW HERE</h1>
          <p className='max-w-[560px] text-[15px] leading-[1.55] text-wfs-muted'>
            This page shows your booking straight after payment. Start with your ticket and you&apos;ll land back here once it&apos;s paid.
          </p>
          <WfsButtonLink href={summitStepHref(event.key, 'ticket')} arrow>
            Get your ticket
          </WfsButtonLink>
        </div>
      </SummitFlowPage>
    )
  }

  const q = booking.quantity
  const flight = trip.flights.find((f) => f.id === booking.flightId) ?? trip.flights[0]
  const hotel = trip.hotels.find((h) => h.id === booking.hotelId) ?? trip.hotels[0]
  const email = booking.billing.invoiceEmail || booking.attendees[0]?.email || 'you@company.com'
  const [a1, a2] = booking.attendees
  const cityTitle = event.city.charAt(0) + event.city.slice(1).toLowerCase()

  const plan = [
    {
      when: 'TODAY',
      title: 'Booking confirmed',
      text: `Tickets issued in ${q === 1 ? 'your name' : q === 2 ? 'both names' : 'every name'}. Invoice sent to your ${booking.billing.bookingAs === 'company' ? 'finance ' : ''}email.`,
    },
    ...(booking.flightsOn
      ? [
          {
            when: 'WITHIN 48 HOURS',
            title: 'Send passport details',
            text: 'Upload your passport photo page in the Golafly app so we can issue your flight tickets.',
            next: true,
          },
          {
            when: '9 MARCH',
            title: `Fly to ${cityTitle}`,
            text: `${flight.airline} · ${flight.depart}.${booking.esimOn ? ' eSIM switches on when you land.' : ''}`,
          },
        ]
      : []),
    {
      when: '10 & 11 MARCH',
      title: `World Football Summit ${cityTitle}`,
      text: `${event.where}. Your concierge is on WhatsApp the whole time.`,
    },
  ]

  const summary: [string, string][] = [
    ['Booking', booking.reference],
    ['Tickets', `${q} × General Entry`],
    ...(booking.flightsOn ? ([['Flights', flight.cartDetail]] as [string, string][]) : []),
    ...(booking.hotelOn ? ([['Hotel', `${hotel.short} · ${trip.nights} nights`]] as [string, string][]) : []),
    ['Paid', formatGbp(booking.paidTotal ?? 0)],
  ]

  return (
    <SummitFlowPage event={event} step='confirmed' back={{ label: `Booking ${booking.reference}` }}>
      {/* Celebration */}
      <div className='relative flex flex-col overflow-hidden rounded-[32px] bg-wfs-ink text-white lg:h-[520px] lg:flex-row lg:items-center lg:justify-between'>
        <Image src='/figma/summit/hero-crowd.gif' alt='' fill unoptimized sizes='100vw' className='object-cover opacity-35' />
        <span
          aria-hidden
          className='absolute right-[-104px] top-[-120px] size-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(184,255,10,0.22),rgba(184,255,10,0))]'
        />
        <div className='relative flex max-w-[576px] flex-col gap-[18px] p-6 sm:p-10 lg:pl-14'>
          <p className='font-mono text-[11.5px] font-medium leading-[normal] tracking-[1.84px] text-wfs-lime'>STEP 4 OF 4 · PAYMENT RECEIVED</p>
          <h1 className='font-display text-[64px] leading-[0.86] sm:text-[96px] sm:leading-[82.6px]'>
            YOU&apos;RE IN.
            <br />
            SEE YOU IN {event.city}.
          </h1>
          <p className='max-w-[460px] text-[16px] leading-[24.8px] text-wfs-on-ink-body'>
            Tickets, invoice and your trip plan are on their way to <span className='break-words'>{email}</span>.
          </p>
          {/* Not built yet: both need the real booking (wallet pass, invoice PDF). */}
          <div className='flex flex-wrap gap-3'>
            <WfsButton title='Available once bookings are live'>Add to Wallet</WfsButton>
            <WfsButton variant='ghostDark' title='Available once bookings are live'>
              Download invoice
            </WfsButton>
          </div>
        </div>
        <div className='relative flex h-[420px] shrink-0 justify-center gap-2 overflow-hidden px-4 lg:h-full lg:w-[600px] lg:gap-0 lg:overflow-visible lg:px-0'>
          <SummitBadge
            scale={0.655}
            line={event.badgeLine}
            foot={event.badgeFoot}
            airport={event.airport}
            name={a1?.fullName}
            role={a1?.jobTitle}
            org={a1?.organisation}
            initials={initialsOf(a1?.fullName ?? '')}
            className='lg:absolute lg:left-5 lg:top-[-30px]'
          />
          {q > 1 && (
            <SummitBadge
              mirror
              scale={0.655}
              line={event.badgeLine}
              foot={event.badgeFoot}
              airport={event.airport}
              name={a2?.fullName || 'YOUR COLLEAGUE'}
              role={a2?.jobTitle || 'Their job title'}
              org={a2?.organisation || a1?.organisation}
              initials={initialsOf(a2?.fullName ?? '') || '+1'}
              className='max-sm:hidden lg:absolute lg:left-[300px] lg:top-[-60px]'
            />
          )}
        </div>
      </div>

      <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
        <section className='flex min-w-0 flex-1 flex-col gap-[18px] rounded-[22px] border border-wfs-line bg-wfs-surface p-6 shadow-[var(--wfs-card-shadow)] sm:p-7'>
          <h2 className='font-heading text-[22px] font-bold leading-[normal] text-wfs-text'>Your trip plan</h2>
          <ol className='flex flex-col'>
            {plan.map((p, i) => (
              <li key={p.title} className='flex gap-[18px]'>
                <span className='flex w-6 shrink-0 flex-col items-center'>
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10.5px] font-medium leading-none',
                      i === 0 && 'border-wfs-lime bg-wfs-lime text-[#121212]',
                      i === 1 && plan.length > 2 && 'border-wfs-active bg-wfs-active text-wfs-on-active',
                      i > 0 && !(i === 1 && plan.length > 2) && 'border-wfs-line bg-wfs-surface text-wfs-text',
                    )}
                  >
                    {i === 0 ? <Check aria-hidden className='size-3' strokeWidth={2.8} /> : i + 1}
                  </span>
                  {i < plan.length - 1 && <span aria-hidden className='w-0.5 flex-1 bg-wfs-hair' />}
                </span>
                <span className='flex min-w-0 flex-col gap-1 pb-[22px] pt-0.5'>
                  <span
                    className={cn(
                      'font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.26px]',
                      'next' in p && p.next ? 'text-wfs-lime-ink' : 'text-wfs-step',
                    )}
                  >
                    {p.when}
                  </span>
                  <span className='text-[15.5px] font-semibold leading-[normal] text-wfs-text'>{p.title}</span>
                  <span className='text-[13.5px] leading-[19.6px] text-wfs-muted'>{p.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className='flex w-full flex-col gap-4 lg:w-[392px] lg:shrink-0'>
          <section className='flex flex-col gap-3 rounded-[22px] border border-wfs-line bg-wfs-surface p-6 shadow-[var(--wfs-card-shadow)]'>
            <h2 className='pb-0.5 font-heading text-[20px] font-bold leading-[normal] text-wfs-text'>Booking summary</h2>
            <dl className='flex flex-col gap-3'>
              {summary.map(([k, v]) => (
                <div key={k} className='flex items-start justify-between gap-4 text-[13.5px] leading-[normal]'>
                  <dt className='text-wfs-muted'>{k}</dt>
                  <dd className='text-right font-semibold text-wfs-text'>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className='flex flex-col gap-2.5 rounded-[22px] border border-[#050606] bg-wfs-ink p-6 text-white shadow-[var(--wfs-card-shadow)] dark:border-wfs-strong'>
            <p className='flex items-center gap-2 font-mono text-[11px] font-medium uppercase leading-[normal] tracking-[1.76px] text-wfs-lime'>
              <span aria-hidden className='size-1.5 rounded-full bg-wfs-lime' />
              Your concierge
            </p>
            <h2 className='font-heading text-[18px] font-bold leading-[1.28]'>One person, from your door to the stadium</h2>
            <p className='text-[13.5px] leading-[19.6px] text-wfs-on-ink-muted'>Flights, hotel or the summit itself. Message any time.</p>
            <a href={CONTACT.whatsapp} target='_blank' rel='noopener noreferrer' className={wfsButtonClass('lime', 'mt-1 w-full')}>
              Chat on WhatsApp
            </a>
          </section>
        </div>
      </div>

      <WfsButtonLink variant='ghost' href={summitLandingHref(event.key)} className='w-fit'>
        Back to {event.name}
      </WfsButtonLink>
    </SummitFlowPage>
  )
}
