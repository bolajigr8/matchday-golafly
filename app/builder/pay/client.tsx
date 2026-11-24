'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, ShieldCheck, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StepProgress } from '@/components/checkout/step-progress'
import { ContactSection } from '@/components/checkout/contact-section'
import { PassengerSection } from '@/components/checkout/passenger-section'
import { StayGuestsSection } from '@/components/checkout/stay-guests-section'
import { EsimSection } from '@/components/checkout/esim-section'
import {
  summaryCoversItems,
  useCart,
  type CartItemType,
} from '@/features/cart/context'
import {
  addMatchDayToCartApi,
  checkoutCartApi,
  getCartApi,
  removeCartItemApi,
  cartApiError,
} from '@/features/cart/api'
import type { CartCheckoutPayload } from '@/features/cart/types'
import { useFlightOffer } from '@/features/flights/hooks'
import {
  duffelGuestCount,
  emptyDuffelGuests,
  emptyStayRooms,
  stayCheckoutLine,
  stayCheckoutPayload,
  validateStayGuests,
  type DuffelGuestDraft,
  type StayRoomDraft,
} from '@/features/checkout/stay-guests'
import { useTravelersStore } from '@/store/travelers'
import { validateCheckoutForm } from '@/features/checkout/validate-form'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { useCurrencyStore } from '@/store/currency'
import { useCheckoutCurrencyGuard } from '@/features/cart/use-checkout-currency-guard'
import {
  useBuilderMatchId,
  useResolvedMatch,
} from '@/features/builder/use-builder-match'
import { FreeEsimNote } from '@/components/free-esim/free-esim-note'
import { builderStepHref } from '@/features/builder/enter'
import type { EsimCheckoutInput } from '@/features/checkout/types'
import { CouponField } from '@/components/checkout/coupon-field'
import { useCartCoupon } from '@/features/discounts/use-cart-coupon'
import {
  PriceSummaryRows,
  PriceTotal,
} from '@/components/price/price-rows'
import { GrandTotalRow } from '@/components/price/total-row'
import { BlackFridayCheckoutGift } from '@/components/promo/black-friday'
import {
  normalizePriceSummary,
  serverIdOf,
  summaryHasItemType,
} from '@/features/price-breakdown/helpers'
import type { PriceSummary } from '@/features/price-breakdown/types'
import { useSummaryWithMatchPromo } from '@/features/promo/use-promo-summary'

/** Home-page catalog items (stadium tours, ticket tiers, standalone match
 *  listings, VIP packages) and non-real ("preview") ticket picks have no
 *  live backend at all — see Handoff v2 doc §4. There used to be a mock
 *  checkout backend (app/api/checkout/*) that would "pay" for these with
 *  a fake success. That mock backend has been removed: these items are
 *  now simply not payable from this page. If the cart contains ONLY
 *  these, the page shows an explanatory state instead of a Pay button
 *  rather than pretending to take payment. */
const PREVIEW_ONLY_TYPES: CartItemType[] = ['tour', 'tier', 'match', 'vip']

function splitFullName(fullName: string): {
  first_name: string
  last_name: string
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first_name: 'Guest', last_name: 'Guest' }
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] }
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts[parts.length - 1],
  }
}

export function PayClient() {
  const matchId = useBuilderMatchId()
  const { items, subtotal, cartCurrency, serverSubtotal, priceSummary } =
    useCart()
  // Trust the server's own subtotal once we have it — it already reflects
  // flight services (bags/seats) once the backend stores them against the
  // cart item, and it's the number checkout will actually charge. Falls
  // back to the locally-summed subtotal only before the first successful
  // cart fetch resolves (e.g. the brief window right after page load).
  const displayTotal = serverSubtotal ?? subtotal // `cartCurrency` is the server's authoritative currency for this cart
  // (CartSummary.currency); falls back to the buyer's selection only for
  // the brief window before the guard's first fetch resolves.
  const selectedCurrency = useCurrencyStore((s) => s.currency)
  const currency = cartCurrency ?? selectedCurrency
  const fmt = (n: number) => formatMatchdayMoney(n, currency)
  const currencyGuard = useCheckoutCurrencyGuard()
  // Coupons are previewed by the SERVER (GET /cart?coupon_code=…), using
  // the exact calculation checkout uses. Re-validated whenever the cart's
  // items or currency change, and only once the currency guard is happy.
  const coupon = useCartCoupon({
    enabled: currencyGuard.status === 'ok',
    refreshKey: `${items
      .map((i) => serverIdOf(i) ?? i.key)
      .sort()
      .join(',')}|${cartCurrency ?? ''}`,
  })
  const travelers = useTravelersStore()

  const realTicketItem = items.find(
    (i) => i.type === 'tickets' && i.checkoutPayload?.isReal,
  )
  // Free eSIM message: the venue country of the match the ticket is for.
  const ticketMatchId = realTicketItem?.checkoutPayload?.matchId
  const ticketMatch = useResolvedMatch(
    realTicketItem
      ? typeof ticketMatchId === 'string'
        ? ticketMatchId
        : matchId
      : null,
  )
  // A "tickets" item without a real listing behind it — a demo/preview
  // pick, same non-payable treatment as the other preview types below.
  const previewTicketItem = items.find(
    (i) => i.type === 'tickets' && !i.checkoutPayload?.isReal,
  )

  const flightItem = items.find(
    (i) => i.type === 'flight' && i.checkoutPayload?.offerId,
  )
  // A hotel from the builder's hotel step (ETG: book hash, Duffel: quote).
  const hotelItem = items.find(
    (i) =>
      i.type === 'hotel' &&
      Boolean(i.checkoutPayload?.bookHash || i.checkoutPayload?.quoteId),
  )
  const esimItem = items.find(
    (i) => i.type === 'esim' && i.checkoutPayload?.packageId,
  )
  // The breakdown to show: the coupon preview when a coupon is applied,
  // else the cart's own. Used only when it really covers the cart — a real
  // ticket that is not on the server cart yet (added at pay time as a
  // fallback) would be missing from its lines, so fall back to the
  // existing display instead of showing a total that leaves it out.
  // (`priceSummary` from the context is already checked; the coupon preview
  // comes straight from the API, so it gets the same check here.)
  const summaryCandidate =
    coupon.preview && summaryCoversItems(coupon.preview, items)
      ? coupon.preview
      : priceSummary
  const summaryBase: PriceSummary | null =
    summaryCandidate &&
    (!realTicketItem || summaryHasItemType(summaryCandidate, 'matchday'))
      ? summaryCandidate
      : null
  const summary = useSummaryWithMatchPromo(summaryBase)
  // What the customer is told they will pay.
  const payableTotal = summary
    ? summary.total.amount
    : Math.max(0, Math.round(displayTotal * 100) / 100)
  const previewItems = useMemo(
    () => items.filter((i) => PREVIEW_ONLY_TYPES.includes(i.type)),
    [items],
  )

  const hasFlight = !!flightItem
  const hasHotel = !!hotelItem
  const hasEsim = !!esimItem
  const hasLiveCartProducts = !!(
    realTicketItem ||
    flightItem ||
    hotelItem ||
    esimItem
  )
  const hasAnyItem =
    !!realTicketItem ||
    !!previewTicketItem ||
    !!flightItem ||
    !!hotelItem ||
    !!esimItem ||
    previewItems.length > 0

  const [esimCheckout, setEsimCheckout] = useState<EsimCheckoutInput>(() => ({
    packageId:
      (esimItem?.checkoutPayload?.packageId as string | undefined) ?? '',
    type:
      (esimItem?.checkoutPayload?.esimType as 'local' | 'global' | undefined) ??
      'local',
    country: (esimItem?.checkoutPayload?.country as string | undefined) ?? '',
    quantity: esimItem?.qty ?? 1,
    deviceConfirmed: false,
    activationConfirmed: false,
    autoActivate: Boolean(esimItem?.checkoutPayload?.autoActivate),
  }))

  const offerId =
    (flightItem?.checkoutPayload?.offerId as string | undefined) ?? null
  const { data: offerData } = useFlightOffer(offerId)
  useEffect(() => {
    if (!esimItem) return
    setEsimCheckout((current) => ({
      ...current,
      packageId:
        (esimItem.checkoutPayload?.packageId as string | undefined) ??
        current.packageId,
      type:
        (esimItem.checkoutPayload?.esimType as
          | 'local'
          | 'global'
          | undefined) ?? current.type,
      country:
        (esimItem.checkoutPayload?.country as string | undefined) ??
        current.country,
      quantity: esimItem.qty,
      autoActivate: Boolean(esimItem.checkoutPayload?.autoActivate),
    }))
  }, [esimItem])
  const offer = offerData?.data
  const requireIdentityDocs =
    offer?.passenger_identity_documents_required ?? false

  const passengerIds = useMemo(() => {
    if (!flightItem) return []
    if (offer?.passengers?.length) return offer.passengers.map((p) => p.id)
    const count = flightItem.qty || 1
    return Array.from({ length: count }, (_, i) => `pax_${i}`)
  }, [flightItem, offer])

  useEffect(() => {
    if (passengerIds.length > 0) travelers.ensurePassengers(passengerIds)
    if (offer?.passengers?.length)
      offer.passengers.forEach((p) =>
        travelers.updatePassenger(p.id, { offerType: p.type ?? undefined }),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengerIds.join(',')])

  // Hotel guest names: one per guest, room by room (ETG) or a flat list
  // (Duffel), shaped by what was searched for.
  const stayLine = useMemo(
    () => stayCheckoutLine(hotelItem?.checkoutPayload),
    [hotelItem?.checkoutPayload],
  )
  const stayShape = stayLine
    ? `${stayLine.provider}|${JSON.stringify(stayLine.occupancy)}`
    : ''
  const [stayRooms, setStayRooms] = useState<StayRoomDraft[]>([])
  const [duffelGuests, setDuffelGuests] = useState<DuffelGuestDraft[]>([])
  const [stayErrors, setStayErrors] = useState<Record<string, string>>({})
  const [stayShapeSeen, setStayShapeSeen] = useState('')
  if (stayLine && stayShape !== stayShapeSeen) {
    setStayShapeSeen(stayShape)
    setStayRooms(emptyStayRooms(stayLine.occupancy))
    setDuffelGuests(emptyDuffelGuests(duffelGuestCount(stayLine.occupancy)))
    setStayErrors({})
  }

  const [formErrors, setFormErrors] = useState<
    ReturnType<typeof validateCheckoutForm>['errors'] | null
  >(null)
  const [isUnifiedPaying, setIsUnifiedPaying] = useState(false)
  // Set when the checkout response's total differs from the one the
  // customer was shown: we pause BEFORE Stripe so they never pay a number
  // they have not seen.
  const [changedCheckout, setChangedCheckout] = useState<{
    url: string
    summary: PriceSummary
  } | null>(null)

  async function payUnifiedCart() {
    const { valid, errors } = validateCheckoutForm({
      contact: travelers.primaryContact,
      passengers: travelers.passengers,
      offerPassengers: offer?.passengers.map((p) => ({
        id: p.id,
        type: p.type,
      })),
      hotelGuests: travelers.hotelGuests,
      requireIdentityDocs,
      hasFlight,
      // Hotel guests are checked below (StayGuestsSection rules).
      hasHotel: false,
      hasEsim,
      esim: hasEsim ? esimCheckout : undefined,
    })
    setFormErrors(errors)
    const hotelErrors = stayLine
      ? validateStayGuests(stayLine, stayRooms, duffelGuests)
      : {}
    setStayErrors(hotelErrors)
    if (!valid || Object.keys(hotelErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    setIsUnifiedPaying(true)
    try {
      let serverItems = (await getCartApi()).data?.items ?? []

      if (
        realTicketItem &&
        !serverItems.some((item) => item.type === 'matchday')
      ) {
        const ticketPayload = realTicketItem.checkoutPayload ?? {}
        const eventId = String(ticketPayload.eventId ?? '')
        const listingId = String(ticketPayload.listingId ?? '')
        if (!eventId || !listingId) {
          toast.error('Ticket details are missing. Add the tickets again.')
          return
        }

        const response = await addMatchDayToCartApi({
          event_id: eventId,
          listing_id: listingId,
          quantity: Number(ticketPayload.quantity ?? realTicketItem.qty ?? 1),
          event_name: realTicketItem.name,
          category_name:
            typeof ticketPayload.categoryName === 'string'
              ? ticketPayload.categoryName
              : undefined,
          block:
            typeof ticketPayload.block === 'string'
              ? ticketPayload.block
              : undefined,
          row:
            typeof ticketPayload.row === 'string'
              ? ticketPayload.row
              : undefined,
          image: realTicketItem.image,
          match_id:
            typeof ticketPayload.matchId === 'string'
              ? ticketPayload.matchId
              : (matchId ?? undefined),
        })
        serverItems = response.data?.items ?? []
      }

      if (serverItems.length === 0) {
        toast.error(
          'Your cart is empty on the server. Add items again and retry.',
        )
        return
      }

      if (
        realTicketItem &&
        !serverItems.some((item) => item.type === 'matchday')
      ) {
        toast.error('Could not add tickets to your cart. Please try again.')
        return
      }

      const wanted = new Set<string>()
      if (realTicketItem) wanted.add('matchday')
      if (flightItem) wanted.add('flight')
      if (hotelItem) wanted.add('stays')
      if (esimItem) wanted.add('esim')

      for (const item of serverItems) {
        if (!wanted.has(item.type)) {
          await removeCartItemApi(item.id)
        }
      }
      serverItems = serverItems.filter((item) => wanted.has(item.type))

      if (serverItems.length === 0) {
        toast.error(
          'Your cart is empty on the server. Add items again and retry.',
        )
        return
      }

      const names = splitFullName(travelers.primaryContact.fullName)
      const payload: CartCheckoutPayload = {
        email: travelers.primaryContact.email,
        phone: travelers.primaryContact.phone,
        ...coupon.payload,
      }

      const flights = serverItems.filter((item) => item.type === 'flight')
      if (flights.length > 0) {
        payload.flights = flights.map((item) => ({
          cart_item_id: item.id,
          passengers: travelers.passengers.map((passenger) => ({
            ...passenger,
            email: passenger.email || travelers.primaryContact.email,
            phone_number:
              passenger.phone_number || travelers.primaryContact.phone,
            ...(requireIdentityDocs &&
            passenger.passportNumber &&
            passenger.passportCountry
              ? {
                  identity_documents: [
                    {
                      type: 'passport' as const,
                      unique_identifier: passenger.passportNumber,
                      issuing_country_code:
                        passenger.passportCountry.toUpperCase(),
                      ...(passenger.passportExpiry
                        ? { expires_on: passenger.passportExpiry }
                        : {}),
                    },
                  ],
                }
              : {}),
          })),
        }))
      }

      const stays = serverItems.filter((item) => item.type === 'stays')
      if (stays.length > 0 && stayLine) {
        payload.stays = stays.map((item) =>
          stayCheckoutPayload(item.id, stayLine, stayRooms, duffelGuests),
        )
      }

      const tickets = serverItems.filter((item) => item.type === 'matchday')
      if (tickets.length > 0) {
        payload.matchday = tickets.map((item) => ({
          cart_item_id: item.id,
          customer: {
            first_name: names.first_name,
            last_name: names.last_name,
            email: travelers.primaryContact.email,
            phone: travelers.primaryContact.phone,
          },
        }))
      }

      // Fix: this block used to be entirely missing, so an eSIM in the
      // cart was added server-side, shown and confirmed in the UI, and
      // included in the displayed total — but never sent to
      // POST /cart/checkout, so it silently never got purchased. Field
      // names here are a best guess pending the (currently undocumented)
      // /api/v1/cart/* contract — confirm with backend once you have it.
      const esims = serverItems.filter((item) => item.type === 'esim')
      if (esims.length > 0) {
        payload.esim = esims.map((item) => ({
          cart_item_id: item.id,
          email: travelers.primaryContact.email,
          device_confirmed: esimCheckout.deviceConfirmed,
          activation_confirmed: esimCheckout.activationConfirmed,
          auto_activate: esimCheckout.autoActivate,
        }))
      }

      const result = await checkoutCartApi(payload)
      const url = result.data?.checkout_url
      if (!result.success || !url) {
        toast.error(result.message || 'Unable to start checkout.')
        return
      }

      // Mark this Stripe session as a unified-cart checkout. The confirmation
      // page uses this marker to know that a confirmed payment may clear the
      // entire server cart rather than just one local item.
      try {
        sessionStorage.setItem(
          'gf-cart-checkout-pending',
          JSON.stringify({
            sessionId: result.data.session_id,
            startedAt: Date.now(),
          }),
        )
      } catch {
        // If sessionStorage is unavailable, the server cart is still cleared
        // by the confirmation page after a fully successful checkout.
      }

      // The response carries the summary built AFTER the coupon was applied;
      // its total is exactly what Stripe charges. Stop only when that charge
      // is higher than the figure on screen (a seat went, a price moved up).
      // A null or unreadable summary changes nothing: go to Stripe as before.
      const charged = normalizePriceSummary(result.data?.price_summary)
      if (
        charged &&
        summary &&
        charged.total.amount_minor > summary.total.amount_minor
      ) {
        setChangedCheckout({ url, summary: charged })
        return
      }

      window.location.href = url
    } catch (err) {
      toast.error(cartApiError(err))
    } finally {
      setIsUnifiedPaying(false)
    }
  }

  function handlePay() {
    if (!hasLiveCartProducts) return
    if (currencyGuard.isBlocking || coupon.isPending) return
    void payUnifiedCart()
  }

  const isBusy = isUnifiedPaying

  if (!hasAnyItem) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container flex flex-col items-center justify-center gap-4 py-24 text-center'>
          <p className='font-heading text-lg font-bold text-foreground'>
            Your cart is empty
          </p>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Add tickets, a flight, a hotel or an eSIM to check out.
          </p>
          <Link
            href='/cart'
            className='rounded-full bg-primary px-6 py-2.5 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground'
          >
            Back to cart
          </Link>
        </div>
      </div>
    )
  }

  // Cart has items, but none of them are payable online yet — every item
  // is a preview ticket pick or a home-page catalog item (VIP, tour
  // tiers, standalone match cards) with no live backend behind it. This
  // used to route through a mock checkout that always "succeeded" —
  // removed, since it was giving a false payment confirmation for
  // products that don't actually exist server-side.
  if (!hasLiveCartProducts) {
    const previewNames = [
      ...(previewTicketItem ? [previewTicketItem] : []),
      ...previewItems,
    ]
    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container py-10 sm:py-12'>
          <StepProgress currentStep={3} />
          <div className='mx-auto mt-10 max-w-lg rounded-2xl border border-border bg-card p-6 text-center'>
            <div className='mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary'>
              <Info className='size-6' />
            </div>
            <h1 className='font-heading text-lg font-bold text-foreground'>
              Not available for online checkout yet
            </h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              {previewNames.length > 0 ? previewNames[0].name : 'These items'}
              {previewNames.length > 1
                ? ` and ${previewNames.length - 1} other item${previewNames.length > 2 ? 's' : ''}`
                : ''}{' '}
              in your cart {previewNames.length > 1 ? 'are' : 'is'} a preview —
              there&apos;s no live booking behind{' '}
              {previewNames.length > 1 ? 'them' : 'it'} yet, so we can&apos;t
              take payment for {previewNames.length > 1 ? 'them' : 'it'} here.
            </p>
            <ul className='mt-4 space-y-1 text-left text-sm text-muted-foreground'>
              {previewNames.map((item) => (
                <li
                  key={item.key}
                  className='flex items-center justify-between'
                >
                  <span>{item.name}</span>
                  <span>{fmt(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <div className='mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center'>
              <Link
                href='/matches'
                className='rounded-full bg-primary px-6 py-2.5 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground'
              >
                Browse real fixtures
              </Link>
              <Link
                href='/cart'
                className='rounded-full border border-border px-6 py-2.5 font-heading text-xs font-bold uppercase tracking-wide text-foreground'
              >
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Fill in every item below, then pay once for everything in your cart.
          </p>
          <FreeEsimNote
            enabled={!!realTicketItem}
            venueCountry={ticketMatch.venueCountry}
            className='mt-4 max-w-2xl'
          />
        </motion.div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]'>
          <div className='space-y-6'>
            <ContactSection
              contact={travelers.primaryContact}
              errors={formErrors?.contact ?? {}}
              onChange={travelers.setPrimaryContact}
            />

            {hasFlight && (
              <PassengerSection
                passengers={travelers.passengers}
                errors={formErrors?.passengers ?? {}}
                requireIdentityDocs={requireIdentityDocs}
                onUpdate={travelers.updatePassenger}
                onSameAsPrimaryChange={travelers.setPassengerSameAsPrimary}
              />
            )}

            {hasHotel && stayLine && (
              <StayGuestsSection
                line={stayLine}
                rooms={stayRooms}
                duffelGuests={duffelGuests}
                errors={stayErrors}
                onRoomsChange={setStayRooms}
                onDuffelGuestsChange={setDuffelGuests}
                changeHref={builderStepHref('/builder/extras', matchId)}
              />
            )}

            {hasEsim && (
              <EsimSection
                item={esimItem!}
                value={esimCheckout}
                errors={formErrors?.esim ?? {}}
                onChange={(patch) =>
                  setEsimCheckout((current) => ({ ...current, ...patch }))
                }
              />
            )}

            {previewItems.length > 0 && (
              <div className='rounded-2xl border border-border bg-card p-5'>
                <h3 className='mb-1 text-sm font-bold text-foreground'>
                  Preview items in this cart
                </h3>
                <p className='mb-3 text-xs text-muted-foreground'>
                  These aren&apos;t part of this payment — there&apos;s no live
                  booking behind them yet.
                </p>
                <ul className='space-y-1.5'>
                  {previewItems.map((item) => (
                    <li
                      key={item.key}
                      className='flex items-center justify-between text-sm text-muted-foreground'
                    >
                      <span>
                        {item.name}
                        {item.qty > 1 ? ` × ${item.qty}` : ''}
                      </span>
                      <span className='font-medium text-foreground'>
                        {fmt(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* {realTicketItem && (
              <div className='rounded-2xl border border-border bg-card p-5'>
                <h3 className='mb-3 text-sm font-bold text-foreground'>
                  Tickets
                </h3>
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <span>
                    {realTicketItem.name}
                    {realTicketItem.qty > 1 ? ` × ${realTicketItem.qty}` : ''}
                  </span>
                  <span className='font-medium text-foreground'>
                    {fmt(realTicketItem.price * realTicketItem.qty)}
                  </span>
                </div>
                {realTicketItem.detail ? (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {realTicketItem.detail}
                  </p>
                ) : null}
              </div>
            )} */}

            {(realTicketItem || esimItem) && !hasFlight && !hasHotel && (
              <p className='text-xs text-muted-foreground'>
                These items use the contact information above — nothing else to
                fill in.
              </p>
            )}
          </div>

          <aside className='lg:sticky lg:top-24'>
            <div className='rounded-2xl border border-border bg-card p-5'>
              <h2 className='mb-4 font-heading text-sm font-bold uppercase tracking-wide text-foreground'>
                Order Summary
              </h2>

              {/* Currency re-sync guard — the header alone doesn't
                  retroactively re-price a cart already priced in another
                  currency, so this re-checks (and re-PATCHes if needed)
                  every time this screen is entered. */}
              {currencyGuard.status === 'checking' && (
                <div className='mb-4 flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground'>
                  <Loader2 className='size-3.5 animate-spin' /> Checking your
                  cart&apos;s prices…
                </div>
              )}
              {currencyGuard.status === 'error' && (
                <div className='mb-4 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive'>
                  <p>
                    {currencyGuard.message ?? 'Could not verify your cart.'}
                  </p>
                  <button
                    type='button'
                    onClick={currencyGuard.retry}
                    className='font-semibold underline underline-offset-2'
                  >
                    Try again
                  </button>
                </div>
              )}
              {currencyGuard.status === 'blocked' && (
                <div className='mb-4 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive'>
                  <p className='font-semibold'>
                    Some items in your cart couldn&apos;t be updated to{' '}
                    {selectedCurrency}. Remove them to switch currency, or pay
                    in the current currency below.
                  </p>
                  <ul className='space-y-1.5'>
                    {currencyGuard.blockedItems.map((b) => (
                      <li
                        key={b.itemId}
                        className='flex items-center justify-between gap-2'
                      >
                        <span className='truncate'>
                          {b.item && 'eventName' in b.item
                            ? (b.item.eventName ?? 'Ticket')
                            : (b.item?.type ?? 'Item')}
                        </span>
                        <button
                          type='button'
                          onClick={() =>
                            void currencyGuard.removeBlockedItem(b.itemId)
                          }
                          className='shrink-0 font-semibold underline underline-offset-2'
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary ? (
                // Lines → ONE Golafly booking fee → discount (the total is
                // rendered below, after the coupon field).
                <PriceSummaryRows
                  summary={summary}
                  showTotal={false}
                  trailing={realTicketItem ? <BlackFridayCheckoutGift /> : null}
                />
              ) : (
                <dl className='space-y-2.5 border-b border-border pb-4 text-sm'>
                  {items
                    .filter((item) => !PREVIEW_ONLY_TYPES.includes(item.type))
                    .map((item) => (
                      <div
                        key={item.key}
                        className='flex items-center justify-between'
                      >
                        <dt className='capitalize text-muted-foreground'>
                          {item.type}
                          {item.qty > 1 ? ` × ${item.qty}` : ''}
                        </dt>
                        <dd className='font-medium text-foreground'>
                          {fmt(item.price * item.qty)}
                        </dd>
                      </div>
                    ))}
                  {realTicketItem ? <BlackFridayCheckoutGift /> : null}
                </dl>
              )}
              {/* Always offered: an eSIM-only cart gets the server's own
                  coupon_error ("coupons never apply to eSIMs"). */}
              <div className='border-b border-border py-4'>
                <CouponField
                  code={coupon.code}
                  onCodeChange={coupon.setCode}
                  applied={coupon.applied}
                  error={coupon.error}
                  isPending={coupon.isPending}
                  onApply={coupon.apply}
                  onClear={coupon.clear}
                  currency={summary?.currency ?? currency}
                />
              </div>
              {summary ? (
                <PriceTotal
                  amount={summary.total.amount}
                  currency={summary.currency}
                  showPromo
                />
              ) : (
                <GrandTotalRow
                  amount={payableTotal}
                  currency={currency}
                  format={formatMatchdayMoney}
                />
              )}
              {changedCheckout && (
                <div className='mb-4 space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4'>
                  <p className='text-[12px] font-bold text-amber-500'>
                    Your total changed
                  </p>
                  <p className='text-[11px] text-muted-foreground'>
                    Prices moved while we prepared your payment. Nothing has
                    been charged. This is the amount you will pay:
                  </p>
                  <PriceSummaryRows summary={changedCheckout.summary} />
                  <a
                    href={changedCheckout.url}
                    className='flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground'
                  >
                    Continue to payment
                  </a>
                  <button
                    type='button'
                    onClick={() => setChangedCheckout(null)}
                    className='w-full text-center font-mono text-[11px] text-muted-foreground underline underline-offset-2'
                  >
                    Review my order
                  </button>
                </div>
              )}
              <button
                type='button'
                onClick={handlePay}
                disabled={
                  isBusy ||
                  currencyGuard.isBlocking ||
                  coupon.isPending ||
                  !!changedCheckout
                }
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:-translate-y-0.5',
                  (isBusy ||
                    currencyGuard.isBlocking ||
                    coupon.isPending ||
                    !!changedCheckout) &&
                    'pointer-events-none opacity-50',
                )}
              >
                {isBusy ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin' /> Processing…
                  </>
                ) : currencyGuard.status === 'checking' ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin' /> Checking
                    prices…
                  </>
                ) : currencyGuard.status === 'blocked' ? (
                  'Resolve cart above to continue'
                ) : (
                  `Pay ${summary ? formatMatchdayMoney(summary.total.amount, summary.currency) : fmt(payableTotal)}`
                )}
              </button>
              <p className='mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-muted-foreground'>
                <ShieldCheck className='size-3' /> One secure payment covers
                every item above
              </p>
              <Link
                href={builderStepHref('/builder/extras', matchId)}
                className='mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground'
              >
                <ArrowLeft className='size-3.5' /> Back
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
