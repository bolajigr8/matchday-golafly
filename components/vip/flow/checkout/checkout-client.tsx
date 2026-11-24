'use client'

import { useState } from 'react'
import { VipButtonLink } from '@/components/vip/flow/button'
import { VipInput } from '@/components/vip/flow/input'
import { VipPanel } from '@/components/vip/flow/panel'
import { VipPhoneInput } from '@/components/vip/flow/phone-input'
import { VipError, VipLoading, VipNotice } from '@/components/vip/flow/state'
import { VipStepper } from '@/components/vip/flow/stepper'
import { VipOrderSummary } from './order-summary'
import { vipApi } from '@/features/vip/api'
import {
  buildVipCheckoutBody,
  travellerFieldsFor,
  travellersFor,
  validateVipCheckout,
  type VipCheckoutForm,
  type VipTraveller,
} from '@/features/vip/checkout-validation'
import { vipEventView, type VipEventView } from '@/features/vip/clubs'
import type { VipPackage } from '@/features/vip/contract'
import { expiredStepOf, isVipSwitchedOff } from '@/features/vip/errors'
import { formatVipMediumDate, vipYmd } from '@/features/vip/format'
import { useVipEvent } from '@/features/vip/hooks'
import { flightOfferOf, offerCabin, packageItem, packageTravellers, stepRequired } from '@/features/vip/package'
import { saveVipReceipt } from '@/features/vip/receipt'
import { vipConfirmedHref, vipFlowHref } from '@/features/vip/routes'
import { patchVipSession, type VipSession } from '@/features/vip/session'
import { useVipAction, useVipPackage } from '@/features/vip/use-package'
import { VipTravellerCard } from './traveller-card'

/* VIP Flow · 4 · Checkout (Figma 506:4207). Step 3 of the builder: contact
   details and one card per traveller, then "Pay" → POST /cart/checkout →
   Stripe's own payment page (no card fields here). Stripe sends the buyer
   back to /payment-success, which hands VIP packages to /vip/confirmed.
   What is typed is kept for this tab only (sessionStorage), never card
   details. */

const formKey = (packageId: string) => `golafly-vip-checkout:${packageId}`

function loadForm(packageId: string): VipCheckoutForm {
  try {
    const raw = sessionStorage.getItem(formKey(packageId))
    if (raw) return JSON.parse(raw) as VipCheckoutForm
  } catch {
    /* start empty */
  }
  return { email: '', phone: '', travellers: [] }
}

export function VipCheckoutClient({ club, eventId }: { club: string; eventId: number }) {
  const { event, loading: eventLoading } = useVipEvent(club, eventId)
  const { pkg, paid, session, loading, error: pkgError, refetch } = useVipPackage(club, eventId)
  const extrasHref = vipFlowHref(club, eventId, 'extras')

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
  if (pkgError && isVipSwitchedOff(pkgError)) {
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
          message={pkgError?.message ?? 'Your VIP package starts with a hospitality ticket for this match.'}
          action={{ href: vipFlowHref(club, eventId, 'seats'), label: 'Choose your seats' }}
        />
      </div>
    )
  }
  if (!pkg.ready_for_checkout) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='Your package isn’t complete yet'
          message={
            pkg.steps.flight.expired
              ? 'Your flight price expired. Please choose your flight again.'
              : pkg.steps.hotel.expired
                ? 'Your hotel price expired. Please choose your hotel again.'
                : stepRequired(pkg, 'flight') && !pkg.steps.flight.done
                  ? stepRequired(pkg, 'hotel')
                    ? 'Add a flight and a hotel, then come back to pay.'
                    : 'Add a flight, then come back to pay.'
                  : stepRequired(pkg, 'hotel') && !pkg.steps.hotel.done
                    ? 'Add a hotel, then come back to pay.'
                    : 'Check your package, then come back to pay.'
          }
          action={{ href: extrasHref, label: 'Back to extras' }}
        />
      </div>
    )
  }

  /* Checkout needs the flight offer's passenger ids. When neither the cart
     line nor this browser has the offer (e.g. the package was built in
     another tab or device), the flight has to be picked again here. */
  if (packageItem(pkg, 'flight') && !flightOfferOf(pkg)) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='Please choose your flight again'
          message='We need your flight’s traveller details on this device before you pay.'
          action={{ href: extrasHref, label: 'Back to extras' }}
        />
      </div>
    )
  }

  return (
    <CheckoutForm
      key={pkg.id}
      club={club}
      eventId={eventId}
      pkg={pkg}
      match={vipEventView(event)}
      session={session}
      onFailed={refetch}
    />
  )
}

/* The form itself: mounted once the package is known, so it starts from
   what was typed before in this tab. */
function CheckoutForm({
  club,
  eventId,
  pkg,
  match,
  session,
  onFailed,
}: {
  club: string
  eventId: number
  pkg: VipPackage
  match: VipEventView
  session: VipSession | null
  onFailed: () => void
}) {
  const { busy, error, run } = useVipAction()
  const [form, setFormState] = useState<VipCheckoutForm>(() => loadForm(pkg.id))
  const [submitted, setSubmitted] = useState(false)
  const extrasHref = vipFlowHref(club, eventId, 'extras')

  const setForm = (next: VipCheckoutForm) => {
    setFormState(next)
    try {
      sessionStorage.setItem(formKey(pkg.id), JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const fields = travellerFieldsFor(pkg)
  const travellers = travellersFor(pkg, form.travellers)
  const currentForm: VipCheckoutForm = { ...form, travellers }
  const errors = submitted ? validateVipCheckout(currentForm, vipYmd(match.date), fields) : {}
  const setTraveller = (i: number, patch: Partial<VipTraveller>) =>
    setForm({ ...currentForm, travellers: travellers.map((t, j) => (j === i ? { ...t, ...patch } : t)) })

  const failedStep = error ? expiredStepOf(error.message) : null

  const pay = async () => {
    setSubmitted(true)
    const first = Object.keys(validateVipCheckout(currentForm, vipYmd(match.date), fields))[0]
    if (first) {
      document.querySelector<HTMLElement>(`[data-field="${first}"] :is(input, select, button)`)?.focus()
      return
    }
    const body = buildVipCheckoutBody(pkg, currentForm)
    const res = await run('pay', () => vipApi.checkout(body))
    if (!res) {
      /* The package may have changed (an expired step reopens it): reload. */
      onFailed()
      return
    }
    /* Save what the success page needs BEFORE leaving (contract §2.7). */
    patchVipSession({ stripeSessionId: res.session_id })
    const offer = flightOfferOf(pkg)
    const ticket = packageItem(pkg, 'matchday')
    const hotel = packageItem(pkg, 'stays')
    const total = res.price_summary?.total ?? pkg.price_summary?.total
    saveVipReceipt({
      sessionId: res.session_id,
      packageId: res.hospitality_package_id ?? pkg.id,
      home: match.home,
      away: match.away,
      date: match.date,
      venue: match.venue,
      city: match.city,
      ticket: ticket?.categoryName ?? 'VIP hospitality',
      travellers: packageTravellers(pkg),
      from: offer?.slices[0]?.origin.iata_code ?? null,
      to: offer?.slices[0]?.destination.iata_code ?? null,
      cabin: offer ? offerCabin(offer) : null,
      hotel: hotel?.hotelName ?? null,
      esim: !!packageItem(pkg, 'esim'),
      leadGuest: `${travellers[0]?.givenName ?? ''} ${travellers[0]?.familyName ?? ''}`.trim(),
      total: total ? { amount: total.amount, currency: res.price_summary?.currency ?? pkg.price_summary?.currency ?? 'EUR' } : null,
    })
    window.location.assign(res.checkout_url)
  }

  /* "This package is already paid": the earlier payment page went
     through. Don't pay again: go to its success page (contract §3). */
  const alreadyPaid = error?.status === 409 && /already paid/i.test(error.message) && session?.stripeSessionId

  return (
    <div className='page-container flex flex-col gap-6 pb-20 pt-8 sm:pt-9 lg:pb-24'>
      <VipStepper club={club} eventId={eventId} current='checkout' />
      <div className='flex flex-col gap-2.5 pt-3'>
        <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[1.68px] text-vip-gold-text'>
          STEP 3 OF 4
        </p>
        <h1 className='font-heading text-[34px] font-bold leading-[normal] text-vip-chalk sm:text-[44px]'>Checkout</h1>
        <p className='text-[16px] leading-[normal] text-vip-mist'>
          Your details once, then one secure payment for the whole package.
        </p>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-5'>
          <VipPanel
            id='vip-contact-title'
            title='Contact information'
            subtitle='Where we send your confirmations. Travellers marked “Same as contact info” use it too.'
          >
            <div className='grid gap-3 sm:grid-cols-2'>
              <div data-field='email'>
                <VipInput
                  label='EMAIL'
                  type='email'
                  placeholder='you@email.com'
                  autoComplete='email'
                  value={form.email}
                  onChange={(e) => setForm({ ...currentForm, email: e.target.value })}
                  error={errors.email}
                />
              </div>
              <div data-field='phone'>
                <VipPhoneInput
                  label='PHONE / WHATSAPP'
                  country='gb'
                  value={form.phone}
                  onChange={(phone) => setForm({ ...currentForm, phone })}
                  error={errors.phone}
                />
              </div>
            </div>
          </VipPanel>

          <VipPanel
            id='vip-travellers-title'
            title={fields === 'ticket' ? 'Ticket holder' : 'Travellers'}
            subtitle={
              fields === 'ticket'
                ? 'The name the match tickets are issued to, exactly as on the passport.'
                : packageItem(pkg, 'stays')
                  ? 'Names exactly as on passports. Traveller 1 holds the match tickets; the hotel is booked in the travellers’ names.'
                  : 'Names exactly as on passports. Traveller 1 holds the match tickets.'
            }
          >
            <div className='flex flex-col gap-4'>
              {travellers.map((t, i) => (
                <VipTravellerCard
                  key={t.passengerId}
                  index={i}
                  traveller={t}
                  errors={errors}
                  fields={fields}
                  onChange={(p) => setTraveller(i, p)}
                />
              ))}
            </div>
          </VipPanel>

          {error && (
            <div className='flex flex-col items-start gap-3'>
              <VipError>{error.message}</VipError>
              {failedStep && failedStep !== 'ticket' && (
                <VipButtonLink href={extrasHref} variant='ghost' size='s'>
                  {failedStep === 'flight' ? 'Choose my flight again' : 'Choose my hotel again'}
                </VipButtonLink>
              )}
              {alreadyPaid && (
                <VipButtonLink href={vipConfirmedHref(session!.stripeSessionId!)} size='s'>
                  View my booking
                </VipButtonLink>
              )}
            </div>
          )}
        </div>

        <div className='w-full lg:sticky lg:top-[100px] lg:w-[400px] lg:shrink-0'>
          {/* Figma "Order summary" (506:4359) with the Pay block. */}
          <VipOrderSummary
            pkg={pkg}
            title={`${match.home} vs ${match.away}`}
            subtitle={`${formatVipMediumDate(match.date)} · ${match.venue} · ${travellers.length} guest${travellers.length === 1 ? '' : 's'}`}
            onPay={pay}
            paying={busy === 'pay'}
            backHref={extrasHref}
          />
        </div>
      </div>
    </div>
  )
}
