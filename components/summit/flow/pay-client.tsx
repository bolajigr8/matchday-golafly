'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Routes } from '@/routes'
import { placeSummitOrder } from '@/features/summit/api'
import { buildSummitCart, formatGbp } from '@/features/summit/pricing'
import { summitStepHref } from '@/features/summit/routes'
import { useSummitBooking, useSummitBookingReady } from '@/features/summit/store'
import type { BookingAs, PaymentMethod, SummitEvent } from '@/features/summit/types'
import { WfsButton } from '../ui'
import { SummitCartPanel } from './cart-panel'
import { SummitCard, SummitField, SummitFlowLoading, SummitFlowPage, SummitSegmented } from './parts'

/* Figma "WFS London · 4 · Pay": who is booking, passport names for the
   flights, how to pay, and the order summary.

   UI ONLY: no payment is taken. The card fields are a picture of the form:
   what is typed into them is never read, saved or sent anywhere. The real
   payment step will be wired when the backend exists. */

const BOOKING_AS: { key: BookingAs; label: string }[] = [
  { key: 'individual', label: 'Individual' },
  { key: 'company', label: 'Company' },
]

const METHODS: { key: PaymentMethod; label: string; note: string }[] = [
  { key: 'card', label: 'Card', note: 'Visa · Mastercard · Amex' },
  { key: 'bank', label: 'Bank transfer', note: 'GBP, EUR or USD' },
  { key: 'instalments', label: 'Instalments', note: '3 payments · 0% fee' },
]

export function SummitPayClient({ event }: { event: SummitEvent }) {
  const router = useRouter()
  const ready = useSummitBookingReady()
  const { booking, set, setBilling, setTraveller } = useSummitBooking()
  const [paying, setPaying] = useState(false)
  const cart = buildSummitCart(booking)
  const q = booking.quantity
  const company = booking.billing.bookingAs === 'company'

  const pay = async () => {
    if (!booking.agreed || paying) return
    setPaying(true)
    const { reference } = await placeSummitOrder()
    set({ reference, paidTotal: cart.total })
    router.push(summitStepHref(event.key, 'confirmed'))
  }

  return (
    <SummitFlowPage
      event={event}
      step='pay'
      back={{ href: summitStepHref(event.key, 'trip'), label: 'Back' }}
      kicker='STEP 3 OF 4'
      title='PAY ONCE'
      sub='One payment for tickets and trip. Invoice and receipts go to the email you choose.'
    >
      {!ready ? (
        <SummitFlowLoading />
      ) : (
        <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
          <div className='flex min-w-0 flex-1 flex-col gap-5'>
            <SummitCard
              title='Booking as'
              aside={
                <SummitSegmented
                  label='Booking as'
                  options={BOOKING_AS}
                  value={booking.billing.bookingAs}
                  onChange={(bookingAs) => setBilling({ bookingAs })}
                />
              }
            >
              <div className='grid gap-x-3.5 gap-y-[18px] sm:grid-cols-2'>
                {company && (
                  <>
                    <SummitField
                      label='Company or club'
                      autoComplete='organization'
                      placeholder='Your company'
                      value={booking.billing.company}
                      onChange={(e) => setBilling({ company: e.target.value })}
                    />
                    <SummitField
                      label='Tax ID (TIN) or VAT number'
                      autoComplete='off'
                      placeholder='e.g. 12345678-0001'
                      value={booking.billing.taxId}
                      onChange={(e) => setBilling({ taxId: e.target.value })}
                    />
                  </>
                )}
                <SummitField
                  label='Invoice email'
                  type='email'
                  inputMode='email'
                  autoComplete='email'
                  placeholder={company ? 'your finance email' : 'you@email.com'}
                  value={booking.billing.invoiceEmail}
                  onChange={(e) => setBilling({ invoiceEmail: e.target.value })}
                />
                <SummitField
                  label='Billing address'
                  autoComplete='street-address'
                  placeholder='Street, city, postcode, country'
                  value={booking.billing.address}
                  onChange={(e) => setBilling({ address: e.target.value })}
                />
              </div>
            </SummitCard>

            {/* Passport details are only needed when flights are in the trip. */}
            {booking.flightsOn && (
              <SummitCard title='Travel details' sub='Only for flights. Names must match passports.'>
                <div className='grid gap-x-3.5 gap-y-[18px] sm:grid-cols-2'>
                  {booking.travellers.map((t, i) => (
                    <div key={i} className='contents'>
                      <SummitField
                        label={`Traveller ${i + 1} · passport name`}
                        autoComplete='off'
                        placeholder='Full name as on passport'
                        value={t.passportName}
                        onChange={(e) => setTraveller(i, { passportName: e.target.value })}
                      />
                      <SummitField
                        label='Passport number'
                        autoComplete='off'
                        placeholder='Passport number'
                        value={t.passportNumber}
                        onChange={(e) => setTraveller(i, { passportNumber: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </SummitCard>
            )}

            <SummitCard title='Payment'>
              <div role='radiogroup' aria-label='Payment method' className='grid gap-3 sm:grid-cols-3'>
                {METHODS.map((m) => {
                  const on = booking.payment === m.key
                  return (
                    <button
                      key={m.key}
                      type='button'
                      role='radio'
                      aria-checked={on}
                      onClick={() => set({ payment: m.key })}
                      className={cn(
                        'flex flex-col gap-1 rounded-[14px] border px-4 py-3.5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime',
                        on ? 'border-[1.5px] border-wfs-strong bg-wfs-selected' : 'border-wfs-line bg-wfs-surface hover:border-wfs-strong/40',
                      )}
                    >
                      <span className='flex items-center gap-1.5 text-[14px] font-semibold leading-[normal] text-wfs-text'>
                        <span
                          aria-hidden
                          className={cn('size-[9px] rounded-full border-[1.5px] border-wfs-text', on && 'bg-wfs-text')}
                        />
                        {m.label}
                      </span>
                      <span className='text-[12px] leading-[normal] text-wfs-muted'>{m.note}</span>
                    </button>
                  )
                })}
              </div>
              {booking.payment === 'card' && (
                /* Display only: uncontrolled, no names, never read (see top). */
                <div className='grid gap-x-3.5 gap-y-[18px] sm:grid-cols-2'>
                  <SummitField label='Card number' inputMode='numeric' autoComplete='off' placeholder='1234 5678 9012 3456' />
                  <SummitField label='Name on card' autoComplete='off' placeholder='Name as shown on card' />
                  <SummitField label='Expiry' inputMode='numeric' autoComplete='off' placeholder='MM / YY' />
                  <SummitField label='CVC' inputMode='numeric' autoComplete='off' placeholder='•••' />
                </div>
              )}
              {booking.payment === 'bank' && (
                <p className='text-[13.5px] leading-[19.6px] text-wfs-muted'>
                  We email the bank details and your invoice straight after you confirm. Tickets are issued when the transfer arrives.
                </p>
              )}
              {booking.payment === 'instalments' && (
                <p className='text-[13.5px] leading-[19.6px] text-wfs-muted'>
                  3 payments of {formatGbp(cart.total / 3)}: today, then one a month. No fee.
                </p>
              )}
            </SummitCard>
          </div>

          <div className='flex w-full flex-col gap-4 lg:sticky lg:top-[100px] lg:w-[392px] lg:shrink-0'>
            <SummitCartPanel
              title='Order summary'
              eyebrow={`${event.cartName} · ${q} ATTENDEE${q === 1 ? '' : 'S'}`}
              cart={cart}
              note={
                <>
                  <Lock aria-hidden className='size-3.5 shrink-0' strokeWidth={1.8} />
                  256 bit encrypted · secured by Golafly
                </>
              }
            >
              <label className='flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[17.5px] text-wfs-muted'>
                <input type='checkbox' checked={booking.agreed} onChange={(e) => set({ agreed: e.target.checked })} className='peer sr-only' />
                <span
                  aria-hidden
                  className={cn(
                    'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wfs-lime',
                    booking.agreed ? 'border-[#121212] bg-[#121212] text-wfs-lime' : 'border-wfs-line bg-wfs-surface text-transparent',
                  )}
                >
                  <Check className='size-3' strokeWidth={3} />
                </span>
                <span>
                  I agree to the{' '}
                  <Link href={Routes.legalTerms} className='underline underline-offset-2 hover:text-wfs-text'>
                    Golafly terms
                  </Link>{' '}
                  and the WFS ticket terms.
                </span>
              </label>
              <WfsButton arrow={!paying} className='w-full' disabled={!booking.agreed || paying} onClick={pay}>
                {paying ? 'Confirming…' : `Pay ${formatGbp(cart.total)}`}
              </WfsButton>
            </SummitCartPanel>
            <div className='flex flex-col gap-1.5 rounded-[18px] border border-wfs-line bg-wfs-soft p-5'>
              <span className='font-heading text-[16px] font-bold leading-[normal] text-wfs-text'>Plans change?</span>
              <span className='text-[13.5px] leading-[19.6px] text-wfs-muted'>
                Your WFS ticket can move to any WFS event within a year of buying it.
              </span>
            </div>
          </div>
        </div>
      )}
    </SummitFlowPage>
  )
}
