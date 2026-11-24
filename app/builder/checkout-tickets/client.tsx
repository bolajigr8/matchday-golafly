'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react'
import { StepProgress } from '@/components/checkout/step-progress'
import { TicketCustomerSection } from '@/components/checkout/ticket-customer-section'
import {
  useBuilderMatch,
  useBuilderMatchId,
} from '@/features/builder/use-builder-match'
import { builderStepHref } from '@/features/builder/enter'
import { useCart } from '@/features/cart/context'
import { trackBeginCheckout } from '@/lib/analytics'
import {
  usePrepareTicketCheckout,
  usePayTicketCheckout,
  useMatchdayListings,
} from '@/features/matchday/hooks'
import {
  checkoutErrorGuidance,
  MatchdayApiError,
  MatchdayPriceChangedError,
} from '@/features/matchday/client'
import {
  getCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
  clearAllCheckoutIdempotencyKeys,
  ticketAttemptSignature,
} from '@/features/matchday/idempotency'
import { formatMatchdayMoney, minorToMajor } from '@/features/matchday/format'
import { CouponField } from '@/components/checkout/coupon-field'
import { useCoupon } from '@/features/discounts/use-coupon'
import { PriceBreakdownRows } from '@/components/price/price-rows'
import { BlackFridayCheckoutGift } from '@/components/promo/black-friday'
import {
  discountFromMajor,
  scalePriceBreakdown,
} from '@/features/price-breakdown/helpers'
import { isMatchdayLive } from '@/features/matchday/config'
import { promoPercentFor, promoTicketPrice } from '@/features/promo/pricing'
import { useMatchPromo } from '@/features/promo/use-match-promo'
import {
  clearActiveMatchdayCheckout,
  getActiveMatchdayCheckout,
  setActiveMatchdayCheckout,
  type ActiveMatchdayCheckout,
} from '@/features/matchday/checkout-session'
import { useTravelersStore } from '@/store/travelers'
import type { MatchdayCustomer } from '@/features/matchday/types'

/** Strips a Laravel-style dotted field error key (e.g. "customer.email")
 *  down to the field name our form actually uses. */
function toFieldKey(key: string): string {
  return key.replace(/^customer\./, '')
}

/** What POST /checkout gives us that we must hold onto for /pay — doc §00/
 *  §08 rule 01: "checkout_token appears in that one response and nowhere
 *  else. Without it the customer cannot pay." */
interface PreparedOrder {
  orderId: number
  checkoutToken: string
}

export function CheckoutTicketsClient() {
  const match = useBuilderMatch()
  const matchId = useBuilderMatchId()
  const router = useRouter()
  const { items, removeItem } = useCart()

  const ticketItem = items.find(
    (i) => i.type === 'tickets' && i.checkoutPayload?.isReal,
  )

  // Ad platforms: the buyer reached checkout. Once per visit to this page.
  const checkoutTracked = useRef(false)
  useEffect(() => {
    if (checkoutTracked.current || !ticketItem) return
    checkoutTracked.current = true
    trackBeginCheckout({
      value: ticketItem.price * ticketItem.qty,
      currency: String(ticketItem.checkoutPayload?.currency ?? 'EUR'),
      items: [
        {
          id: String(ticketItem.checkoutPayload?.matchId ?? ticketItem.key),
          name: ticketItem.name,
          category: 'tickets',
          price: ticketItem.price,
          quantity: ticketItem.qty,
        },
      ],
    })
  }, [ticketItem])

  const { primaryContact, setPrimaryContact } = useTravelersStore()

  // Seed the customer form from the shared travelers store on first render.
  // This means if the user already filled in their email/name for flights,
  // it pre-fills here — no retyping. Changes here also update the shared
  // store so subsequent checkout steps (flights, hotels, eSIM) stay in sync.
  const [customer, setCustomer] = useState<MatchdayCustomer>(() => {
    // Split fullName into first/last for the FTN customer object
    const nameParts = primaryContact.fullName.trim().split(/\s+/)
    const first = nameParts.slice(0, -1).join(' ') || nameParts[0] || ''
    const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
    return {
      email: primaryContact.email || '',
      first_name: first,
      last_name: last,
      phone: primaryContact.phone || '',
    }
  })

  // Keep the shared travelers store in sync whenever the customer form changes.
  // This ensures email typed here is available in the flights/hotels checkout.
  useEffect(() => {
    const fullName = [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(' ')
    setPrimaryContact({
      fullName,
      email: customer.email,
      phone: customer.phone,
    })
    // Only sync on change — not on every primaryContact update (that would loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.first_name, customer.last_name, customer.email, customer.phone])
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [errorAction, setErrorAction] = useState<
    ReturnType<typeof checkoutErrorGuidance>['action'] | null
  >(null)
  const [stage, setStage] = useState<'idle' | 'pricing' | 'paying'>('idle')

  // Set once POST /checkout succeeds, held for the lifetime of this
  // checkout attempt so a price-changed retry (or a transient network
  // error on /pay) can call payCheckout() again WITHOUT re-preparing —
  // doc: "Do not start a new POST /checkout — that creates a second order."
  const [prepared, setPrepared] = useState<PreparedOrder | null>(null)
  const [activeCheckout, setActiveCheckout] =
    useState<ActiveMatchdayCheckout | null>(null)

  // Set when /pay returns the new price-changed 409 (doc §04, new 4 Sept
  // 2026 revision). Showing both totals and requiring an explicit confirm
  // before calling /pay again is exactly what doc §10's build checklist
  // asks for: "A price-changed screen for the 409: old total, new total,
  // confirm button that calls /pay again."
  const [priceChange, setPriceChange] = useState<{
    previousTotal: number
    newTotal: number
    currency: string
  } | null>(null)

  const { mutateAsync: prepare } = usePrepareTicketCheckout()
  const { mutateAsync: pay } = usePayTicketCheckout()
  const coupon = useCoupon()
  const matchPromo = useMatchPromo()

  const payload = ticketItem?.checkoutPayload as
    | {
        eventId: number
        listingId: number
        quantity: number
        pricePerTicket: number
        currency: string
        categoryName: string
        block: string
        row: string
      }
    | undefined

  const attemptSignature = payload
    ? ticketAttemptSignature(
        payload.eventId,
        payload.listingId,
        payload.quantity,
      )
    : null

  useEffect(() => {
    if (!attemptSignature) return
    const active = getActiveMatchdayCheckout()
    if (!active) {
      // Clean up keys left behind by an older checkout session. This fixes the
      // common case where a customer paid/cancelled, navigated away, and later
      // started another transaction with an old idempotency key still stored.
      clearAllCheckoutIdempotencyKeys()
    }
    setActiveCheckout(
      active?.attemptSignature === attemptSignature ? active : null,
    )
  }, [attemptSignature])

  // Doc §08 rule 09: "Prices move, re-fetch before checkout so the price
  // they see is the price they pay." The cart's cached pricePerTicket
  // (set when the seats page was loaded) can be stale by the time the
  // customer reaches this page. This re-fetch is purely to keep the
  // ESTIMATE display honest — the actual charge is always authoritative
  // from the server (POST /checkout re-prices regardless), so a failed
  // or slow re-fetch here just falls back to the cached figure rather
  // than blocking anything.
  const { data: freshListings } = useMatchdayListings(
    payload
      ? { event_id: payload.eventId, listing_id: payload.listingId }
      : null,
    { enabled: !!payload },
  )
  const freshListing = freshListings?.listings.find(
    (l) => l.listing_id === payload?.listingId,
  )
  const currentPricePerTicket =
    freshListing?.price_details.price_per_ticket ?? payload?.pricePerTicket
  const priceHasMoved =
    !!freshListing &&
    !!payload &&
    freshListing.price_details.price_per_ticket !== payload.pricePerTicket

  const ticketSubtotal =
    payload && currentPricePerTicket !== undefined
      ? Math.round(currentPricePerTicket * payload.quantity * 100) / 100
      : null
  // The match promo is taken at payment, and never together with a coupon.
  const promoPercent =
    coupon.applied || currentPricePerTicket === undefined
      ? 0
      : promoPercentFor(matchPromo, currentPricePerTicket)
  const promoSaving =
    payload && currentPricePerTicket !== undefined && promoPercent > 0
      ? Math.round(
          (currentPricePerTicket -
            promoTicketPrice(currentPricePerTicket, promoPercent)) *
            payload.quantity *
            100,
        ) / 100
      : 0
  const payableSubtotal =
    ticketSubtotal == null
      ? null
      : promoSaving > 0
        ? Math.round((ticketSubtotal - promoSaving) * 100) / 100
        : coupon.payable(ticketSubtotal)
  const estimatedTotal =
    payableSubtotal == null || !payload
      ? null
      : formatMatchdayMoney(payableSubtotal, payload.currency)

  // Full breakdown for this screen (it is a checkout screen): the fresh
  // listing's per-ticket breakdown × quantity. null (no breakdown, or the
  // listing hasn't loaded) keeps today's single "Tickets" line.
  const ticketBreakdown =
    freshListing && payload
      ? scalePriceBreakdown(
          freshListing.price_details.price_breakdown,
          payload.quantity,
        )
      : null
  const couponDiscount =
    ticketBreakdown && coupon.applied && ticketSubtotal != null
      ? discountFromMajor(
          coupon.applied.code,
          Math.round(
            (ticketSubtotal - (payableSubtotal ?? ticketSubtotal)) * 100,
          ) / 100,
          ticketBreakdown.currency,
        )
      : ticketBreakdown && matchPromo && promoSaving > 0
        ? discountFromMajor(
            `${matchPromo.label} · ${promoPercent}% OFF`,
            promoSaving,
            ticketBreakdown.currency,
          )
        : null

  const canSubmit =
    !!payload &&
    customer.email.trim().length > 3 &&
    customer.first_name.trim().length > 0 &&
    customer.last_name.trim().length > 0 &&
    customer.phone.trim().length > 5

  function validateLocally(): boolean {
    const errors: Record<string, string> = {}
    if (!customer.first_name.trim()) errors.first_name = 'Required.'
    if (!customer.last_name.trim()) errors.last_name = 'Required.'
    if (!/^\S+@\S+\.\S+$/.test(customer.email))
      errors.email = 'Enter a valid email.'
    if (!/^\+\d{6,15}$/.test(customer.phone))
      errors.phone = 'Enter a valid phone number.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** Calls payCheckout() with whatever order is currently prepared.
   *  Shared by the main submit flow and the price-changed confirm button —
   *  both ultimately just need to (re)try /pay with the same token. */
  async function attemptPay(order: PreparedOrder) {
    setStage('paying')
    try {
      const paid = await pay({
        orderId: order.orderId,
        checkoutToken: order.checkoutToken,
        couponCode: coupon.applied?.code,
      })
      if (!paid.checkout_url) {
        throw new Error(
          'Payment session could not be created — please try again.',
        )
      }
      // Persist the active payment attempt before leaving the app. If the
      // customer comes back with browser Back or re-enters checkout, we must
      // never call /pay on the same order again while it is already being paid.
      setActiveMatchdayCheckout({
        attemptSignature: attemptSignature!,
        orderId: order.orderId,
        checkoutToken: order.checkoutToken,
        checkoutUrl: paid.checkout_url,
        startedAt: Date.now(),
      })
      setActiveCheckout({
        attemptSignature: attemptSignature!,
        orderId: order.orderId,
        checkoutToken: order.checkoutToken,
        checkoutUrl: paid.checkout_url,
        startedAt: Date.now(),
      })

      // Explicitly mark this as a DIRECT MatchDay checkout. The Stripe
      // return URL is created by the backend, so the payment-success page
      // cannot safely infer the flow from the URL alone. This marker makes
      // the frontend use GET /matchday/orders/by-checkout-session/{sessionId}
      // instead of treating the session as a generic/cart transaction.
      try {
        sessionStorage.setItem(
          'gf-matchday-payment-pending',
          JSON.stringify({
            orderId: order.orderId,
            attemptSignature: attemptSignature!,
            startedAt: Date.now(),
          }),
        )
      } catch {
        // The backend status endpoint remains the source of truth.
      }

      // Doc §08 rule 10: redirect immediately, the hold is time-boxed.
      window.location.href = paid.checkout_url
    } catch (err) {
      setStage('idle')
      if (err instanceof MatchdayPriceChangedError) {
        // Recoverable in place (doc §04/§08 rule 02) — keep `prepared` as
        // is (same order, same token), just ask the customer to confirm
        // the new figure before calling /pay again.
        setPriceChange({
          previousTotal: coupon.payable(
            minorToMajor(err.details.previous_amount_minor),
          ),
          newTotal: coupon.payable(minorToMajor(err.details.new_amount_minor)),
          currency: err.details.currency,
        })
        return
      }
      if (err instanceof MatchdayApiError) {
        const guidance = checkoutErrorGuidance(err, 'pay')
        setErrorAction(guidance.action)
        setGeneralError(guidance.message)
        // A 404 here means the wrong/expired token — doc §08 rule 02 note:
        // "an unexpected 404 usually means you sent the token belonging
        // to a different order." Either way the stored order is no longer
        // usable, so clear it AND its idempotency key — otherwise a retry
        // would replay POST /checkout with the same key and doc says that
        // replays return "the same order and the same token," resurrecting
        // the exact broken pair we just failed with.
        if (guidance.action === 'restart') {
          setPrepared(null)
          if (attemptSignature) clearCheckoutIdempotencyKey(attemptSignature)
        }
        return
      }
      const message = (err as { message?: string }).message
      setGeneralError(message ?? 'Something went wrong. Please try again.')
    }
  }

  async function handleSubmit() {
    if (!payload || !attemptSignature) return
    setGeneralError(null)
    setErrorAction(null)
    setPriceChange(null)
    if (!validateLocally()) return

    // A previous /pay already created a Stripe session for this exact
    // attempt. Never prepare/pay the same order again; doing so produces
    // "This order is already being paid for." Let the customer return to
    // the existing Stripe session or explicitly start a genuinely new attempt.
    if (
      activeCheckout &&
      activeCheckout.attemptSignature === attemptSignature
    ) {
      setGeneralError(
        'A payment session is already open for these tickets. Return to the existing payment session, or start a new checkout if that payment was cancelled.',
      )
      setErrorAction('poll')
      return
    }

    // Already prepared (retrying after a transient /pay failure) — skip
    // straight to /pay rather than calling POST /checkout again. Doc:
    // "Do not start a new POST /checkout — that creates a second order."
    if (prepared) {
      await attemptPay(prepared)
      return
    }

    setStage('pricing')
    try {
      const idempotencyKey = getCheckoutIdempotencyKey(attemptSignature)
      const order = await prepare({
        payload: {
          event_id: payload.eventId,
          listing_id: payload.listingId,
          quantity: payload.quantity,
          note: note.trim() || undefined,
          customer,
        },
        idempotencyKey,
      })
      if (!order.checkout_token) {
        throw new Error('Checkout could not be prepared — please try again.')
      }
      const newlyPrepared: PreparedOrder = {
        orderId: order.order_id,
        checkoutToken: order.checkout_token,
      }
      setPrepared(newlyPrepared)
      // Note: no separate "priced" stage here — attemptPay() below sets
      // 'paying' synchronously as its first statement (before its own
      // first await), so React 18 batches it with any state set here into
      // a single render. An intermediate stage here would never actually
      // be visible to the user; the button label just goes straight from
      // "Checking availability…" to "Redirecting to payment…", which is
      // the true one-tick-apart async sequence.
      await attemptPay(newlyPrepared)
    } catch (err) {
      setStage('idle')
      if (err instanceof MatchdayApiError) {
        const guidance = checkoutErrorGuidance(err, 'prepare')
        setErrorAction(guidance.action)
        setGeneralError(guidance.message)
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(err.fieldErrors)) {
            mapped[toFieldKey(key)] = msgs[0]
          }
          setFieldErrors(mapped)
        }
        return
      }
      const message = (err as { message?: string }).message
      setGeneralError(message ?? 'Something went wrong. Please try again.')
    }
  }

  async function handleConfirmPriceChange() {
    if (!prepared) return
    setPriceChange(null)
    setGeneralError(null)
    setErrorAction(null)
    await attemptPay(prepared)
  }

  if (activeCheckout && activeCheckout.attemptSignature === attemptSignature) {
    return (
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />
        <div className='mx-auto mt-10 max-w-xl rounded-2xl border border-primary/25 bg-primary/5 p-7 text-center'>
          <ShieldCheck className='mx-auto size-10 text-primary' />
          <h1 className='mt-4 text-xl font-bold text-foreground'>
            Payment session already started
          </h1>
          <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
            These tickets already have an active payment session. We will not
            create another payment attempt for the same order.
          </p>
          <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
            <a
              href={activeCheckout.checkoutUrl}
              className='rounded-full bg-primary px-6 py-2.5 font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)]'
            >
              Return to payment
            </a>
            <button
              type='button'
              onClick={() => {
                clearActiveMatchdayCheckout()
                if (attemptSignature)
                  clearCheckoutIdempotencyKey(attemptSignature)
                setActiveCheckout(null)
                setPrepared(null)
                setGeneralError(null)
                setErrorAction(null)
              }}
              className='rounded-full border border-border px-6 py-2.5 font-mono text-[11px] font-bold text-foreground hover:border-primary/40 hover:text-primary'
            >
              Start a new checkout
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!ticketItem || !payload) {
    return (
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />
        <div className='mt-10 rounded-2xl border border-border bg-card p-8 text-center'>
          <p className='text-sm font-semibold text-foreground'>
            No ticket selection found
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Head back and pick your seats to continue.
          </p>
          <Link
            href={builderStepHref('/builder/seats', matchId)}
            className='mt-4 inline-block font-mono text-[11px] text-primary underline underline-offset-2'
          >
            Back to seats
          </Link>
        </div>
      </div>
    )
  }

  const isBusy = stage !== 'idle'

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />

        {/* {isMatchdayLive() && (
          <div className='mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-[11px] text-amber-600'>
            <AlertTriangle className='mt-0.5 size-4 shrink-0' />
            <p>
              <strong>Live MatchDay data is on.</strong> Clicking Pay below will
              call the real MatchDay checkout and pay endpoints and open a real
              Stripe session
            </p>
          </div>
        )} */}

        <motion.div
          className='mt-6 rounded-xl border border-border bg-card px-4 py-4 sm:mt-8 sm:px-5'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <p className='font-mono text-[10px] tracking-[2px] text-primary'>
            Matchday Builder · {match.date}
          </p>
          <p className='text-[15px] font-bold text-foreground'>
            {match.home} vs {match.away}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            {payload.categoryName} · Block {payload.block} · Row {payload.row} ·
            Qty {payload.quantity}
          </p>
        </motion.div>

        <div className='mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]'>
          <div className='space-y-5'>
            <TicketCustomerSection
              customer={customer}
              errors={fieldErrors}
              onChange={(patch) => setCustomer((c) => ({ ...c, ...patch }))}
            />

            <div className='rounded-2xl border border-border bg-card p-5'>
              <h2 className='mb-2 text-[13px] font-bold text-foreground'>
                Order note (optional)
              </h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
                placeholder='Anything we should know about this order.'
                className='w-full resize-none rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
              />
            </div>

            {generalError && (
              <div className='rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500'>
                <p>{generalError}</p>
                {errorAction === 'back-to-listings' && (
                  <Link
                    href={builderStepHref('/builder/seats', matchId)}
                    onClick={() => {
                      if (attemptSignature)
                        clearCheckoutIdempotencyKey(attemptSignature)
                    }}
                    className='mt-2 inline-block font-mono text-[11px] underline underline-offset-2'
                  >
                    Back to seats
                  </Link>
                )}
                {errorAction === 'restart' && (
                  <button
                    type='button'
                    onClick={() => {
                      removeItem(ticketItem.key)
                      if (attemptSignature)
                        clearCheckoutIdempotencyKey(attemptSignature)
                      router.push(builderStepHref('/builder/seats', matchId))
                    }}
                    className='mt-2 font-mono text-[11px] underline underline-offset-2'
                  >
                    Start again
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <motion.div
            className='h-fit space-y-4 rounded-2xl border border-border bg-card p-5'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <h2 className='text-[13px] font-bold text-foreground'>
              Order summary
            </h2>
            {ticketBreakdown ? (
              <PriceBreakdownRows
                breakdown={ticketBreakdown}
                discount={couponDiscount}
                showTotal={false}
                compact
                trailing={<BlackFridayCheckoutGift className='text-[12px]' />}
              />
            ) : (
            <div className='space-y-1.5 border-b border-border pb-3 text-[12px]'>
              <div className='flex justify-between text-muted-foreground'>
                <span>Tickets ({payload.quantity})</span>
                <span>
                  {ticketSubtotal == null
                    ? estimatedTotal
                    : formatMatchdayMoney(ticketSubtotal, payload.currency)}
                </span>
              </div>
              {matchPromo && promoSaving > 0 && (
                <div className='flex justify-between text-primary'>
                  <span>
                    {matchPromo.label} · {promoPercent}% OFF
                  </span>
                  <span>−{formatMatchdayMoney(promoSaving, payload.currency)}</span>
                </div>
              )}
              {coupon.applied && ticketSubtotal != null && (
                <div className='flex justify-between text-primary'>
                  <span>Coupon {coupon.applied.code}</span>
                  <span>
                    −
                    {formatMatchdayMoney(
                      Math.round((ticketSubtotal - (payableSubtotal ?? ticketSubtotal)) * 100) /
                        100,
                      payload.currency,
                    )}
                  </span>
                </div>
              )}
              <BlackFridayCheckoutGift className='text-[12px]' />
            </div>
            )}
            <CouponField
              code={coupon.code}
              onCodeChange={coupon.setCode}
              applied={coupon.applied}
              error={coupon.error}
              isPending={coupon.isPending}
              onApply={coupon.apply}
              onClear={coupon.clear}
              currency={payload.currency}
            />
            <div className='flex items-baseline justify-between'>
              <span className='text-[12px] font-semibold text-foreground'>
                Total
              </span>
              <span className='text-[20px] font-bold text-primary'>
                {estimatedTotal}
              </span>
            </div>
            <p className='flex items-start gap-1.5 font-mono text-[10px] text-muted-foreground'>
              <ShieldCheck className='mt-0.5 size-3 shrink-0' />
              Prices are re-checked before you pay — the final amount may differ
              slightly from the estimate above.
            </p>
            {priceHasMoved && (
              <p className='rounded-lg bg-amber-400/10 px-3 py-2 font-mono text-[10px] text-amber-500'>
                The price for this listing has changed since you selected your
                seats — the total above is already up to date.
              </p>
            )}

            {priceChange ? (
              <div className='space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4'>
                <p className='flex items-center gap-1.5 text-[12px] font-bold text-amber-500'>
                  <TrendingUp className='size-3.5' />
                  The price changed
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  The price for these tickets changed while you were checking
                  out. Nothing has been charged yet — confirm the new total to
                  continue.
                </p>
                <div className='space-y-1 rounded-lg bg-background/60 p-3 text-[12px]'>
                  <div className='flex justify-between text-muted-foreground line-through'>
                    <span>Previous total</span>
                    <span>
                      {formatMatchdayMoney(
                        priceChange.previousTotal,
                        priceChange.currency,
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between font-bold text-foreground'>
                    <span>New total</span>
                    <span>
                      {formatMatchdayMoney(
                        priceChange.newTotal,
                        priceChange.currency,
                      )}
                    </span>
                  </div>
                </div>
                <button
                  type='button'
                  disabled={stage === 'paying'}
                  onClick={handleConfirmPriceChange}
                  className='flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 font-mono text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {stage === 'paying' && (
                    <Loader2 className='size-4 animate-spin' />
                  )}
                  Confirm{' '}
                  {formatMatchdayMoney(
                    priceChange.newTotal,
                    priceChange.currency,
                  )}{' '}
                  and pay
                </button>
              </div>
            ) : (
              <button
                type='button'
                disabled={!canSubmit || isBusy}
                onClick={handleSubmit}
                className='flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-mono text-[12px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)] transition-shadow hover:shadow-[0_0_16px_var(--brand-glow)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none'
              >
                {isBusy && <Loader2 className='size-4 animate-spin' />}
                {stage === 'pricing' && 'Checking availability…'}
                {stage === 'paying' && 'Redirecting to payment…'}
                {stage === 'idle' && `Pay ${estimatedTotal ?? ''}`}
              </button>
            )}

            <button
              type='button'
              onClick={() => {
                removeItem(ticketItem.key)
                if (attemptSignature)
                  clearCheckoutIdempotencyKey(attemptSignature)
                router.push(builderStepHref('/builder/seats', matchId))
              }}
              className='w-full text-center font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground'
            >
              Remove tickets and go back
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
