'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { StepProgress } from '@/components/checkout/step-progress'
import { useCart } from '@/features/cart/context'
import { clearCartAndForgetTokenApi } from '@/features/cart/api'
import { trackPurchase } from '@/lib/analytics'
import { useTransactionStatus } from '@/features/payment/hooks'
import { getTransactionProduct } from '@/features/payment/types'
import {
  isTerminalTransactionStatus,
  isSuccessfulTransactionStatus,
  isFinishingBooking,
  FINISHING_BOOKING_COPY,
  FINISHING_MESSAGE_AFTER_MS,
} from '@/features/payment/status'
import {
  mapTransactionToSyncPayloads,
  useBrevoOrderSync,
} from '@/features/brevo/sync'
import {
  useBuilderCheckoutStore,
  type LegProduct,
} from '@/store/builder-checkout'
import {
  useBuilderMatch,
  useBuilderMatchId,
} from '@/features/builder/use-builder-match'
import { builderStepHref } from '@/features/builder/enter'
import type { BuilderMatch } from '@/features/builder/match'
import {
  PriceBreakdownRows,
  PriceSummaryRows,
} from '@/components/price/price-rows'
import {
  formatPriceAmount,
  normalizeDiscount,
  normalizePriceBreakdown,
  normalizePriceSummary,
  savedOrderTotalPaid,
} from '@/features/price-breakdown/helpers'

function cityOf(match: BuilderMatch) {
  return match.venue.split(',').pop()?.trim() || match.venue
}
function money(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2 })
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
}
const fadeItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function SuccessBadge() {
  return (
    <motion.div
      className='flex justify-center'
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
    >
      <motion.div
        className='flex size-16 items-center justify-center rounded-[40px] border border-primary/80 bg-primary/8 text-3xl sm:size-20 sm:text-[34px]'
        animate={{
          boxShadow: [
            '0 0 20px rgba(183,255,0,0.2), 0 0 10px rgba(183,255,0,0.4), 0 0 0 1px rgba(183,255,0,0.5)',
            '0 0 50px rgba(183,255,0,0.4), 0 0 22px rgba(183,255,0,0.6), 0 0 0 1px rgba(183,255,0,0.6)',
            '0 0 20px rgba(183,255,0,0.2), 0 0 10px rgba(183,255,0,0.4), 0 0 0 1px rgba(183,255,0,0.5)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      >
        ✓
      </motion.div>
    </motion.div>
  )
}

function BookingCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className='overflow-hidden rounded-xl border border-border bg-card'>
      {rows.map(({ label, value }, i) => (
        <div
          key={label}
          className='flex items-center justify-between px-4 py-3'
          style={{
            borderTop:
              i > 0
                ? '1px solid var(--color-border, oklch(0.28 0 0))'
                : undefined,
          }}
        >
          <span className='text-[12px] text-muted-foreground'>{label}</span>
          <span
            className={`text-right text-[12px] font-medium text-foreground ${label === 'Total Paid' ? 'font-bold text-primary' : ''}`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

const legLabel: Record<LegProduct, string> = {
  tickets: 'Tickets',
  flight: 'Flight',
  hotel: 'Hotel',
  esim: 'eSIM',
}

export function ConfirmedClient() {
  const params = useSearchParams()
  const sessionId = params.get('session_id') ?? params.get('sessionId')
  const ticketSession = params.get('ticketSession')
  const matchId = params.get('match')

  const match = useBuilderMatch()
  const builderMatchId = useBuilderMatchId()
  const { items, subtotal, clear, refreshFromServer } = useCart()
  const checkoutStore = useBuilderCheckoutStore()

  const { data: txData, isLoading: isPollingTx } =
    useTransactionStatus(sessionId)
  const tx = txData?.data
  const txProduct = getTransactionProduct(tx)
  const txTerminal = isTerminalTransactionStatus(tx?.status)
  const txSuccess = isSuccessfulTransactionStatus(tx?.status)

  // After a few minutes still "confirming", the booking is most likely with
  // Golafly support (booking resolution): swap the spinner copy for the calm
  // "we'll email you within 2 hours" message. Polling carries on, so a
  // rebooked order still flips to confirmed on this page.
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!sessionId) return
    const timer = window.setTimeout(() => setSlow(true), FINISHING_MESSAGE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [sessionId])
  const finishing = slow && isFinishingBooking(tx?.status, tx?.payment_status)

  // What was actually charged, as the server reports it — not the local
  // cart's subtotal (which was shown in hardcoded euros). A cart purchase
  // (the basket) carries price_summary (total is AFTER the discount); a
  // single flight / eSIM / hotel purchase carries pricing.price_breakdown +
  // pricing.discount (total is BEFORE the discount, so subtract it). Any of
  // them can be null — then this page behaves exactly as it did.
  const basketSummary = normalizePriceSummary(tx?.price_summary)
  const orderBreakdown = basketSummary
    ? null
    : normalizePriceBreakdown(tx?.pricing?.price_breakdown)
  const orderDiscount = normalizeDiscount(tx?.pricing?.discount)
  const chargedTotal = basketSummary
    ? { amount: basketSummary.total.amount, currency: basketSummary.currency }
    : orderBreakdown
      ? {
          amount: savedOrderTotalPaid(orderBreakdown, orderDiscount).amount,
          currency: orderBreakdown.currency,
        }
      : null
  const chargedAmount = chargedTotal?.amount ?? null
  const chargedCurrency = chargedTotal?.currency ?? null

  // Brevo transaction sync for the flight / hotel / eSIM leg paid here.
  useBrevoOrderSync(txTerminal ? mapTransactionToSyncPayloads(tx, sessionId) : null)

  const productMap: Record<string, LegProduct> = {
    flight: 'flight',
    stays: 'hotel',
    esim: 'esim',
  }

  useEffect(() => {
    if (ticketSession) {
      const leg = checkoutStore.legs.find((l) => l.product === 'tickets')
      if (leg && leg.status !== 'paid') {
        checkoutStore.setLegStatus('tickets', 'paid', {
          sessionId: ticketSession,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketSession])

  useEffect(() => {
    if (!sessionId || !txTerminal || !tx) return
    const legProduct = productMap[txProduct]
    if (!legProduct) return

    // A leg is only PAID after the ledger is actually confirmed. Creating a
    // Stripe checkout session is not proof of payment. This prevents a
    // pending_payment response from being shown as a successful booking.
    checkoutStore.setLegStatus(legProduct, txSuccess ? 'paid' : 'failed', {
      sessionId,
      error: txSuccess
        ? undefined
        : (tx.payment_status ?? 'Payment did not complete'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, txTerminal, txSuccess, txProduct])

  const nextLeg = checkoutStore.nextPendingLeg()
  const allDone = checkoutStore.allDone()
  const paymentPending = !!sessionId && (!tx || !txTerminal)
  const paymentConfirmed =
    tx?.status === 'confirmed' && tx.payment_status === 'paid'

  useEffect(() => {
    void refreshFromServer()
  }, [refreshFromServer])

  // Ad platforms: a paid order. Same success rule as the rest of this page
  // (a paid Stripe session, or a ticket confirmation), sent once per order:
  // the ref covers re-renders, the sessionStorage key covers a page refresh,
  // and the order id is also the dedupe key at Google and Meta.
  const purchaseSent = useRef(false)
  useEffect(() => {
    if (purchaseSent.current) return
    const orderId = sessionId ?? ticketSession
    const paid = sessionId ? paymentConfirmed : !!ticketSession
    if (!orderId || !paid || items.length === 0) return
    purchaseSent.current = true
    const key = `gf-purchase-tracked:${orderId}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      /* private mode: the order id still dedupes it at the platform */
    }
    trackPurchase({
      transactionId: orderId,
      value: chargedAmount ?? subtotal,
      // The "Total Paid" line below is shown in euros unless the server
      // told us what was really charged.
      currency: chargedCurrency ?? 'EUR',
      items: items.map((i) => ({
        id: i.key,
        name: i.name,
        category: i.type,
        price: i.price,
        quantity: i.qty,
      })),
    })
  }, [sessionId, ticketSession, paymentConfirmed, items, subtotal, chargedAmount, chargedCurrency])

  // Only clear the server cart after every checkout leg is genuinely done.
  // This is intentionally NOT triggered by a Stripe redirect or a
  // pending_payment state. The backend cart is the source of truth.
  useEffect(() => {
    if (!allDone || paymentPending) return

    let cancelled = false
    void (async () => {
      try {
        await clearCartAndForgetTokenApi()
      } catch {
        // CartProvider will retry its server reconciliation on focus/interval.
      } finally {
        if (!cancelled) {
          clear()
          checkoutStore.reset()
          try {
            sessionStorage.removeItem('gf-cart-checkout-pending')
          } catch {
            // ignore storage errors
          }
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, paymentPending])

  // A unified cart can have several ledger legs under one Stripe session.
  // The safest customer-facing success condition is the status returned by
  // the backend: confirmed + payment_status paid. Everything else remains
  // pending/in progress.
  const unifiedCartSession = (() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = sessionStorage.getItem('gf-cart-checkout-pending')
      if (!raw) return false
      const parsed = JSON.parse(raw) as { sessionId?: string }
      return !!sessionId && parsed.sessionId === sessionId
    } catch {
      return false
    }
  })()

  // Date.now() only ever runs once, inside this lazy initializer — the
  // React-sanctioned place for a one-time non-deterministic value. It's
  // just a display fallback for the rare case where neither a real
  // session id nor a ticket confirmation id exists yet.
  const [fallbackReference] = useState(
    () => `GF-${(sessionId ?? String(Date.now())).slice(-8).toUpperCase()}`,
  )

  const paidDisplay = chargedTotal
    ? formatPriceAmount(chargedTotal.amount, chargedTotal.currency)
    : null

  const rows = useMemo(() => {
    const r: { label: string; value: string }[] = [
      { label: 'Match', value: `${match.home} vs ${match.away}` },
      {
        label: 'Date',
        value: `${match.date}${match.kickoff ? ` · ${match.kickoff}` : ''}`,
      },
    ]
    for (const item of items) {
      r.push({
        label: legLabel[item.type as LegProduct] ?? item.type,
        value: item.name,
      })
    }
    r.push({
      label: 'Total Paid',
      value: paidDisplay ?? `€${money(subtotal)}`,
    })
    return r
  }, [match, items, subtotal, paidDisplay])

  // Paid, but the supplier could not confirm (e.g. the hotel room): our team
  // arranges an alternative. Shown as information with the backend's own
  // message, exactly as sent; no retry (failed hotel contract, section 4).
  if (sessionId && !ticketSession && tx?.status === 'payment_received_booking_failed') {
    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container py-10 sm:py-12'>
          <StepProgress currentStep={4} />
          <div className='mx-auto mt-12 max-w-[560px] rounded-3xl border border-sky-500/30 bg-card p-6 text-center sm:p-10'>
            <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-sky-500'>Payment received</p>
            <h1 className='mt-2 text-2xl font-bold tracking-tight text-foreground'>Our team is on it</h1>
            {tx.failure_message && (
              <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground'>{tx.failure_message}</p>
            )}
            <Link
              href='/support?topic=booking'
              className='mt-6 inline-block rounded-full border border-border px-6 py-2.5 text-[13px] font-bold text-foreground hover:bg-muted/40'
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (sessionId && !ticketSession && (!txTerminal || !paymentConfirmed)) {
    const pendingTitle = finishing
      ? FINISHING_BOOKING_COPY.title
      : tx?.status === 'pending_payment'
      ? 'Payment is still pending'
      : tx?.status === 'paid' || tx?.status === 'confirming'
        ? 'Payment received — finalising your booking'
        : 'Checking your payment status…'
    const pendingMessage = finishing
      ? FINISHING_BOOKING_COPY.message
      : tx?.status === 'pending_payment'
      ? 'Your payment has not been confirmed yet. Please do not pay again. We are checking the booking status automatically.'
      : 'Please do not refresh or start another payment. We will show your booking as confirmed only after the backend confirms it.'

    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container py-10 sm:py-12'>
          <StepProgress currentStep={4} />
          <motion.div
            className='mx-auto mt-12 max-w-[560px] overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.22)]'
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='bg-primary/10 px-6 py-8 text-center sm:px-10'>
              <div className='mx-auto flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10'>
                <Loader2 className='size-8 animate-spin text-primary' />
              </div>
              <p className='mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary'>
                Payment status
              </p>
              <h1 className='mt-2 text-2xl font-bold tracking-tight text-foreground'>
                {pendingTitle}
              </h1>
              <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
                {pendingMessage}
              </p>
            </div>
            <div className='px-6 py-6 sm:px-10'>
              <div className='rounded-2xl border border-border bg-muted/40 p-4 text-center'>
                <p className='text-xs text-muted-foreground'>Current status</p>
                <p className='mt-1 font-mono text-sm font-bold text-foreground'>
                  {tx?.status ?? 'checking…'}
                </p>
                {tx?.payment_status && (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Payment: {tx.payment_status}
                  </p>
                )}
              </div>
              <p className='mt-4 text-center text-[11px] text-muted-foreground'>
                We&apos;ll keep checking automatically. If you see a payment
                marked as pending, do not submit another payment.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const failedLeg = checkoutStore.legs.find((l) => l.status === 'failed')
  if (failedLeg && !allDone) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container py-10 sm:py-12'>
          <StepProgress currentStep={4} />
          <div className='mx-auto mt-10 max-w-[520px] space-y-4 text-center'>
            <p className='text-[18px] font-bold text-foreground'>
              {legLabel[failedLeg.product]} payment didn&apos;t go through
            </p>
            <p className='text-[13px] text-muted-foreground'>
              {failedLeg.error ?? 'Something interrupted this step.'} Anything
              already paid for is safe — only this item needs to be retried.
            </p>
            <Link
              href={builderStepHref(
                '/builder/checkout',
                matchId ?? builderMatchId,
              )}
              className='inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)]'
            >
              Retry {legLabel[failedLeg.product]}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (nextLeg && !allDone) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='page-container py-10 sm:py-12'>
          <StepProgress currentStep={4} />
          <motion.div
            className='mx-auto mt-10 max-w-[520px] space-y-5 text-center'
            variants={container}
            initial='hidden'
            animate='show'
          >
            <motion.div variants={fadeItem} transition={{ duration: 0.4 }}>
              <p className='text-[18px] font-bold text-foreground'>
                Almost there
              </p>
              <p className='mt-1 text-[13px] text-muted-foreground'>
                One more thing to pay for before your booking is complete.
              </p>
            </motion.div>
            <motion.div
              className='flex flex-wrap justify-center gap-2'
              variants={fadeItem}
              transition={{ duration: 0.4 }}
            >
              {checkoutStore.legs.map((l) => (
                <span
                  key={l.product}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${
                    l.status === 'paid'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {legLabel[l.product]} {l.status === 'paid' ? '✓' : ''}
                </span>
              ))}
            </motion.div>
            <motion.div variants={fadeItem} transition={{ duration: 0.4 }}>
              <Link
                href={builderStepHref(
                  '/builder/checkout',
                  matchId ?? builderMatchId,
                )}
                className='inline-block rounded-full bg-primary px-8 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
              >
                Continue — pay for {legLabel[nextLeg.product]}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={4} />
        <motion.div
          className='mx-auto mt-10 max-w-[600px] space-y-6 text-center sm:mt-12'
          variants={container}
          initial='hidden'
          animate='show'
        >
          <SuccessBadge />
          <motion.div
            className='space-y-1.5'
            variants={fadeItem}
            transition={{ duration: 0.42 }}
          >
            <h1 className='text-[26px] font-bold tracking-tight text-foreground'>
              You&apos;re Going to{' '}
              <span className='text-primary'>{cityOf(match)}</span>!
            </h1>
            <p className='text-[13px] text-muted-foreground'>
              {unifiedCartSession ? 'Payment confirmed · Your booking is complete' : 'Booking confirmed · Confirmation sent to your email'}
            </p>
          </motion.div>
          <motion.div
            className='space-y-1'
            variants={fadeItem}
            transition={{ duration: 0.42 }}
          >
            <p className='font-mono text-[10px] tracking-[2px] text-muted-foreground'>
              Booking Reference
            </p>
            <p className='text-[22px] font-bold tracking-widest text-primary'>
              {checkoutStore.legs.find((l) => l.product === 'tickets')
                ?.confirmationId ?? fallbackReference}
            </p>
          </motion.div>
          <motion.div variants={fadeItem} transition={{ duration: 0.42 }}>
            <BookingCard rows={rows} />
          </motion.div>
          {(basketSummary || orderBreakdown) && (
            <motion.div
              className='rounded-xl border border-border bg-card px-4 pt-4 text-left'
              variants={fadeItem}
              transition={{ duration: 0.42 }}
            >
              <h2 className='mb-3 font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground'>
                Price breakdown
              </h2>
              {basketSummary ? (
                <PriceSummaryRows summary={basketSummary} totalLabel='Total paid' />
              ) : (
                <PriceBreakdownRows
                  breakdown={orderBreakdown}
                  discount={orderDiscount}
                  totalLabel='Total paid'
                />
              )}
            </motion.div>
          )}
          <motion.div
            className='flex flex-col items-center justify-center gap-3 sm:flex-row'
            variants={fadeItem}
            transition={{ duration: 0.42 }}
          >
            <button
              onClick={() => window.print()}
              className='block w-full rounded-full bg-primary px-6 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)] sm:w-auto'
            >
              Download E-Tickets
            </button>
            <Link
              href='/'
              className='block w-full rounded-full border border-primary/35 px-6 py-2.5 text-center text-[13px] font-bold text-primary transition-all hover:bg-primary/10 sm:w-auto'
            >
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
