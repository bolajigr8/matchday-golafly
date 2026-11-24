'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { builderStepHref } from '@/features/builder/enter'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ShieldCheck, BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StepProgress } from '@/components/checkout/step-progress'
import { useFlightOffer, useCreateOrder } from '@/features/flights/hooks'
import {
  buildCheckoutSchema,
  todayISO as flightTodayISO,
  minDobISO,
} from '@/features/flights/schema'
import { useCheckoutStay, useSubmitBookingForm } from '@/features/stays/hooks'
import { normalizeRoomGuests } from '@/features/stays/utils'
import type { StayGuest } from '@/features/stays/types'
import { useCreateEsimOrder } from '@/features/esim/hooks'
import { createTicketOrder } from '@/features/tickets/api'
import { useCart } from '@/features/cart/context'
import {
  useBuilderCheckoutStore,
  type LegProduct,
} from '@/store/builder-checkout'
import { useFlightsStore } from '@/store/flights'
import { useStaysStore } from '@/store/stays'

function money(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2 })
}

const contactSchema = z.object({
  contact_email: z.string().email('Enter a valid email'),
  contact_phone: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Use international format, e.g. +34612345678'),
})

const field =
  'w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className='block font-mono text-[10.5px] font-semibold uppercase tracking-wider text-foreground/70'>
      {children}
    </label>
  )
}
function FieldWrap({
  label,
  error,
  full,
  children,
}: {
  label: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', full && 'sm:col-span-2')}>
      <Label>{label}</Label>
      {children}
      {error && <p className='text-[10px] text-red-500'>{error}</p>}
    </div>
  )
}

export function CheckoutClient() {
  const params = useSearchParams()
  const matchId = params.get('match')
  const expressOfferId = params.get('offerId')
  const { items, subtotal } = useCart()
  const checkoutStore = useBuilderCheckoutStore()
  const flightsStore = useFlightsStore()
  const staysStore = useStaysStore()

  const flightItem = expressOfferId
    ? undefined
    : items.find((i) => i.type === 'flight' && i.checkoutPayload?.offerId)
  const offerId =
    expressOfferId ??
    (flightItem?.checkoutPayload?.offerId as string | undefined) ??
    null
  const { data: offerData } = useFlightOffer(offerId)
  const offer = offerData?.data
  const requiresIdentityDocs =
    offer?.passenger_identity_documents_required ?? false

  const hotelItem = expressOfferId
    ? undefined
    : items.find((i) => i.type === 'hotel' && i.checkoutPayload?.bookHash)
  const esimItem = expressOfferId
    ? undefined
    : items.find((i) => i.type === 'esim' && i.checkoutPayload?.packageId)
  const ticketItem = expressOfferId
    ? undefined
    : items.find((i) => i.type === 'tickets')

  // The rooms the hotel was priced for (saved on the cart line by the hotel
  // step), falling back to the current search.
  const roomGuestCounts: StayGuest[] = hotelItem
    ? normalizeRoomGuests(
        Array.isArray(hotelItem.checkoutPayload?.occupancy)
          ? (hotelItem.checkoutPayload.occupancy as StayGuest[])
          : staysStore.searchParams.guests,
      )
    : []

  const { mutate: placeFlightOrder, isPending: isPlacingFlight } =
    useCreateOrder()
  const { mutate: submitBookingForm, isPending: isSubmittingBookingForm } =
    useSubmitBookingForm()
  const { mutate: checkoutStayMutation, isPending: isPlacingStay } =
    useCheckoutStay()
  const { mutate: placeEsimOrder, isPending: isPlacingEsim } =
    useCreateEsimOrder()

  const isProcessing =
    isPlacingFlight || isSubmittingBookingForm || isPlacingStay || isPlacingEsim

  const presentProducts = useMemo<LegProduct[]>(() => {
    const list: LegProduct[] = []
    if (ticketItem) list.push('tickets')
    if (flightItem) list.push('flight')
    if (hotelItem) list.push('hotel')
    if (esimItem) list.push('esim')
    return list
  }, [ticketItem, flightItem, hotelItem, esimItem])

  useEffect(() => {
    if (matchId) checkoutStore.initLegs(matchId, presentProducts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, presentProducts.join(',')])

  const nextLeg = checkoutStore.nextPendingLeg()

  const passengerCheckoutSchema = useMemo(
    () => buildCheckoutSchema(offer?.passengers ?? [], requiresIdentityDocs),
    [offer, requiresIdentityDocs],
  )
  const fullSchema = offer ? passengerCheckoutSchema : contactSchema

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(fullSchema as any),
    defaultValues: {
      contact_email: '',
      contact_phone: '',
      ...(offer
        ? {
            passengers: offer.passengers.map((p) => ({
              id: p.id,
              title: 'mr',
              given_name: '',
              family_name: '',
              gender: 'm',
              born_on: '',
              email: '',
              phone_number: '',
            })),
          }
        : {}),
      ...(hotelItem
        ? {
            stayGuests: roomGuestCounts.map((room) =>
              Array.from({ length: room.adults }, () => ({
                firstName: '',
                lastName: '',
              })),
            ),
          }
        : {}),
    },
  })

  const passengerFields = useFieldArray({
    control,
    name: 'passengers' as never,
  })
  const passengerErrors = (errors as any).passengers as any[] | undefined
  const stayGuestErrors = (errors as any).stayGuests as any[][] | undefined

  async function processTicketLeg(email: string) {
    if (!ticketItem) return
    const price = ticketItem.price * ticketItem.qty
    const result = await createTicketOrder(
      {
        matchId: (ticketItem.checkoutPayload?.matchId as string) ?? '',
        listingId: (ticketItem.checkoutPayload?.listingId as string) ?? '',
        quantity: ticketItem.qty,
        email,
        full_name: '',
        phone: '',
      },
      price,
    )
    checkoutStore.setLegStatus('tickets', 'paid', {
      sessionId: result.session_id,
      confirmationId: result.ticket_reference,
    })
  }

  function onSubmit(values: any) {
    const email = values.contact_email ?? values.passengers?.[0]?.email
    const phone = values.contact_phone ?? values.passengers?.[0]?.phone_number
    checkoutStore.setContact(email, phone)
    flightsStore.setContact(email, phone)
    staysStore.setContactInfo({ email, phone })

    const leg = checkoutStore.nextPendingLeg()
    if (!leg) {
      window.location.href = builderStepHref('/builder/confirmed', matchId)
      return
    }

    if (leg.product === 'tickets') {
      checkoutStore.setLegStatus('tickets', 'processing')
      processTicketLeg(email).then(() => {
        const next = checkoutStore.nextPendingLeg()
        if (!next)
          window.location.href = builderStepHref('/builder/confirmed', matchId)
        else onSubmit(values)
      })
      return
    }

    if (leg.product === 'flight' && offer && offerId) {
      checkoutStore.setLegStatus('flight', 'processing')
      placeFlightOrder(
        {
          data: {
            type: 'instant',
            selected_offers: [offerId],
            passengers: values.passengers.map((p: any) => ({
              id: p.id,
              title: p.title,
              given_name: p.given_name,
              family_name: p.family_name,
              gender: p.gender,
              born_on: p.born_on,
              email: p.email,
              phone_number: p.phone_number,
              infant_passenger_id: p.infant_passenger_id || undefined,
              identity_documents: p.identity_documents?.length
                ? p.identity_documents
                : undefined,
            })),
          },
        },
        {
          onSuccess: (res) => {
            checkoutStore.setLegStatus('flight', 'processing', {
              sessionId: res.data.session_id,
              confirmationId: String(res.data.ledger_id),
            })
            window.location.href = res.data.checkout_url
          },
          onError: (err) => {
            checkoutStore.setLegStatus('flight', 'failed', {
              error: err.response?.data?.message,
            })
            toast.error(
              err.response?.data?.message ?? 'Could not start flight checkout.',
            )
          },
        },
      )
      return
    }

    if (leg.product === 'hotel' && hotelItem) {
      const allGuestsFilled = (
        values.stayGuests as { firstName: string; lastName: string }[][]
      ).every((room) =>
        room.every((g) => g.firstName.trim() && g.lastName.trim()),
      )
      if (!allGuestsFilled) {
        toast.error('Please enter a name for every guest in every room.')
        return
      }

      checkoutStore.setLegStatus('hotel', 'processing')
      const payload = hotelItem.checkoutPayload!
      submitBookingForm(
        {
          book_hash: payload.bookHash as string,
          match_hash: payload.matchHash as string,
          hotel_id: Number(payload.hotelId),
          language: 'en',
          checkin: payload.checkin as string,
          checkout: payload.checkout as string,
          adults: payload.adults as number,
          children: payload.children as number,
          user: { email, phone },
          rooms: (
            values.stayGuests as { firstName: string; lastName: string }[][]
          ).map((roomGuests) => ({
            guests: roomGuests.map((g) => ({
              first_name: g.firstName,
              last_name: g.lastName,
            })),
          })),
        },
        {
          onSuccess: (formRes) => {
            staysStore.setBookingFormResult(formRes.data)
            checkoutStayMutation(formRes.data.booking_id, {
              onSuccess: (res) => {
                checkoutStore.setLegStatus('hotel', 'processing', {
                  sessionId: res.data.session_id,
                  confirmationId: String(res.data.booking_id),
                })
                window.location.href = res.data.checkout_url
              },
              onError: (err) => {
                checkoutStore.setLegStatus('hotel', 'failed', {
                  error: err.response?.data?.message,
                })
                toast.error(
                  err.response?.data?.message ??
                    'Could not start hotel checkout.',
                )
              },
            })
          },
          onError: (err) => {
            checkoutStore.setLegStatus('hotel', 'failed', {
              error: err.response?.data?.message,
            })
            toast.error(
              err.response?.data?.message ?? 'Could not confirm room details.',
            )
          },
        },
      )
      return
    }

    if (leg.product === 'esim' && esimItem) {
      checkoutStore.setLegStatus('esim', 'processing')
      placeEsimOrder(
        {
          package_id: esimItem.checkoutPayload!.packageId as string,
          quantity: esimItem.qty,
          email,
          phone,
          country: esimItem.checkoutPayload!.country as string,
          type: esimItem.checkoutPayload!.esimType as 'local' | 'global',
          sandbox: process.env.NEXT_PUBLIC_AIRALO_SANDBOX === 'true',
        },
        {
          onSuccess: (res) => {
            checkoutStore.setLegStatus('esim', 'processing', {
              sessionId: res.data.session_id,
              confirmationId: String(res.data.ledger_id),
            })
            window.location.href = res.data.checkout_url
          },
          onError: (err) => {
            checkoutStore.setLegStatus('esim', 'failed', {
              error: err.response?.data?.message,
            })
            toast.error(
              err.response?.data?.message ?? 'Could not start eSIM checkout.',
            )
          },
        },
      )
      return
    }
  }

  const symbol = '€'
  const legLabel: Record<LegProduct, string> = {
    tickets: 'Tickets',
    flight: 'Flight',
    hotel: 'Hotel',
    esim: 'eSIM',
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />

        <motion.div
          className='mb-8 mt-6'
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <p className='mb-1 font-mono text-[10px] tracking-[2px] text-primary'>
            Step 3 of 4
          </p>
          <h1 className='text-[22px] font-bold tracking-tight text-foreground'>
            Checkout
          </h1>
          {checkoutStore.legs.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {checkoutStore.legs.map((l) => (
                <span
                  key={l.product}
                  className={cn(
                    'rounded-full border px-3 py-1 font-mono text-[10px] font-bold',
                    l.status === 'paid' &&
                      'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
                    l.status === 'processing' &&
                      'border-primary/40 bg-primary/10 text-primary',
                    l.status === 'failed' &&
                      'border-red-500/40 bg-red-500/10 text-red-500',
                    l.status === 'pending' &&
                      'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {legLabel[l.product]}{' '}
                  {l.status === 'paid'
                    ? '✓'
                    : l.status === 'processing'
                      ? '…'
                      : l.status === 'failed'
                        ? '✕'
                        : ''}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]'>
            <div className='space-y-8'>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.45 }}
              >
                <h2 className='mb-4 text-[13px] font-bold text-foreground'>
                  Contact Information
                </h2>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <FieldWrap
                    label='Email'
                    error={errors.contact_email?.message as string}
                  >
                    <input
                      type='email'
                      {...register('contact_email')}
                      className={field}
                      placeholder='you@example.com'
                    />
                  </FieldWrap>
                  <FieldWrap
                    label='Phone'
                    error={errors.contact_phone?.message as string}
                  >
                    <input
                      {...register('contact_phone')}
                      className={field}
                      placeholder='+34612345678'
                    />
                  </FieldWrap>
                </div>
              </motion.div>

              {offer && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                >
                  <h2 className='mb-4 text-[13px] font-bold text-foreground'>
                    Passenger Details
                  </h2>
                  <div className='space-y-4'>
                    {passengerFields.fields.map((f, i) => (
                      <div
                        key={f.id}
                        className='rounded-xl border border-border bg-card p-4'
                      >
                        <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
                          Passenger {i + 1} ·{' '}
                          {offer.passengers[i]?.type?.replace(/_/g, ' ') ??
                            'adult'}
                        </p>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                          <FieldWrap label='Title'>
                            <select
                              {...register(`passengers.${i}.title`)}
                              className={field}
                            >
                              <option value='mr'>Mr</option>
                              <option value='mrs'>Mrs</option>
                              <option value='ms'>Ms</option>
                              <option value='miss'>Miss</option>
                              <option value='dr'>Dr</option>
                            </select>
                          </FieldWrap>
                          <FieldWrap label='Gender'>
                            <select
                              {...register(`passengers.${i}.gender`)}
                              className={field}
                            >
                              <option value='m'>Male</option>
                              <option value='f'>Female</option>
                            </select>
                          </FieldWrap>
                          <FieldWrap
                            label='First Name'
                            error={passengerErrors?.[i]?.given_name?.message}
                          >
                            <input
                              {...register(`passengers.${i}.given_name`)}
                              className={field}
                            />
                          </FieldWrap>
                          <FieldWrap
                            label='Last Name'
                            error={passengerErrors?.[i]?.family_name?.message}
                          >
                            <input
                              {...register(`passengers.${i}.family_name`)}
                              className={field}
                            />
                          </FieldWrap>
                          <FieldWrap
                            label='Date of Birth'
                            error={passengerErrors?.[i]?.born_on?.message}
                          >
                            <input
                              type='date'
                              min={minDobISO()}
                              max={flightTodayISO()}
                              {...register(`passengers.${i}.born_on`)}
                              className={field}
                            />
                          </FieldWrap>
                          <FieldWrap
                            label='Email'
                            error={passengerErrors?.[i]?.email?.message}
                          >
                            <input
                              type='email'
                              {...register(`passengers.${i}.email`)}
                              className={field}
                            />
                          </FieldWrap>
                          <FieldWrap
                            label='Phone'
                            error={passengerErrors?.[i]?.phone_number?.message}
                            full
                          >
                            <input
                              {...register(`passengers.${i}.phone_number`)}
                              className={field}
                              placeholder='+34612345678'
                            />
                          </FieldWrap>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {hotelItem && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.23, duration: 0.45 }}
                >
                  <h2 className='mb-4 flex items-center gap-2 text-[13px] font-bold text-foreground'>
                    <BedDouble className='size-4 text-primary' /> Room Guest
                    Details
                  </h2>
                  <div className='space-y-3'>
                    {roomGuestCounts.map((room, ri) => (
                      <div
                        key={ri}
                        className='rounded-xl border border-border bg-card p-4'
                      >
                        <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
                          Room {ri + 1} — {room.adults} Adult
                          {room.adults !== 1 ? 's' : ''}
                          {room.children.length > 0
                            ? ` · ${room.children.length} Child${room.children.length !== 1 ? 'ren' : ''}`
                            : ''}
                        </p>
                        <div className='space-y-3'>
                          {Array.from({ length: room.adults }, (_, gi) => (
                            <div
                              key={gi}
                              className='grid grid-cols-1 gap-3 sm:grid-cols-2'
                            >
                              <FieldWrap
                                label={`Adult ${gi + 1} First Name`}
                                error={
                                  stayGuestErrors?.[ri]?.[gi]?.firstName
                                    ?.message
                                }
                              >
                                <input
                                  {...register(
                                    `stayGuests.${ri}.${gi}.firstName`,
                                  )}
                                  className={field}
                                />
                              </FieldWrap>
                              <FieldWrap
                                label={`Adult ${gi + 1} Last Name`}
                                error={
                                  stayGuestErrors?.[ri]?.[gi]?.lastName?.message
                                }
                              >
                                <input
                                  {...register(
                                    `stayGuests.${ri}.${gi}.lastName`,
                                  )}
                                  className={field}
                                />
                              </FieldWrap>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45 }}
              >
                <div className='flex items-start gap-3 rounded-xl border border-border bg-card p-4'>
                  <ShieldCheck className='mt-0.5 size-5 shrink-0 text-primary' />
                  <div>
                    <p className='text-[13px] font-bold text-foreground'>
                      Secure payment via Stripe
                    </p>
                    <p className='mt-1 text-[11px] leading-relaxed text-muted-foreground'>
                      {checkoutStore.legs.length > 1
                        ? "Your booking has multiple parts — you'll be taken to Stripe to pay for each one in turn, and brought back here between each step."
                        : "You'll enter your card details securely on Stripe's own payment page — nothing is stored here."}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className='flex flex-col gap-3 sm:flex-row sm:items-center'
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
              >
                <Link
                  href={builderStepHref('/builder/extras', matchId)}
                  className='rounded-full border border-primary/35 px-8 py-2.5 text-center text-[13px] font-bold text-primary transition-all hover:bg-primary/10'
                >
                  Back
                </Link>
                <button
                  type='submit'
                  disabled={isProcessing || items.length === 0}
                  className='flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-8 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_24px_var(--brand-glow)] transition-all hover:shadow-[0_0_36px_var(--brand-glow)] disabled:opacity-60'
                >
                  {isProcessing
                    ? 'Redirecting…'
                    : nextLeg
                      ? `Pay for ${legLabel[nextLeg.product]} — Continue`
                      : `Complete Purchase — ${symbol}${money(subtotal)}`}
                </button>
              </motion.div>
            </div>

            <motion.aside
              className='lg:sticky lg:top-8 lg:self-start'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.5 }}
            >
              <div className='rounded-xl border border-border bg-card p-4'>
                <h3 className='mb-4 text-[13px] font-bold text-foreground'>
                  Order Summary
                </h3>
                {items.length === 0 ? (
                  <div className='py-6 text-center'>
                    <p className='text-[12px] text-muted-foreground'>
                      Your cart is empty.
                    </p>
                    <Link
                      href='/matches'
                      className='mt-2 inline-block font-mono text-[11px] text-primary hover:underline'
                    >
                      Browse matches →
                    </Link>
                  </div>
                ) : (
                  <div className='space-y-0 divide-y divide-border'>
                    {items.map((item) => (
                      <div key={item.key} className='py-3'>
                        <div className='flex items-start justify-between gap-2'>
                          <p className='text-[12px] font-medium leading-snug text-foreground'>
                            {item.qty > 1 ? `${item.qty} × ` : ''}
                            {item.name}
                          </p>
                          <p className='shrink-0 text-[12px] font-bold text-primary'>
                            {symbol}
                            {money(item.price * item.qty)}
                          </p>
                        </div>
                        <p className='mt-0.5 text-[10px] leading-snug text-muted-foreground'>
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className='mt-2 flex items-center justify-between border-t border-border pt-3'>
                  <span className='font-mono text-[11px] tracking-wide text-muted-foreground'>
                    Total
                  </span>
                  <span className='text-[22px] font-bold text-foreground'>
                    {symbol}
                    {money(subtotal)}
                  </span>
                </div>
                <div className='mt-3 rounded-lg bg-muted/60 p-3'>
                  <p className='text-[10px] leading-relaxed text-muted-foreground'>
                    Free cancellation until 3 days before match · E-tickets by
                    email · All taxes included
                  </p>
                </div>
              </div>
            </motion.aside>
          </div>
        </form>
      </div>
    </div>
  )
}
