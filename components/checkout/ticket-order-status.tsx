// components/checkout/ticket-order-status.tsx
//
// Visual states for the post-payment poll (Integration Docs 3, statuses
// and copy requirements).
// (doc §00 "What changed" — "one thing to un-build"):
//
//   The previous revision said `failed` meant a refund had been issued,
//   and told us to say so on the failure page. THAT IS NO LONGER TRUE.
//   We no longer refund automatically. `failed` now only means the order
//   could not be prepared BEFORE any payment — nothing was ever charged.
//
//   Anything that goes wrong AFTER payment now surfaces as
//   `needs_reconciliation` or `manual_review`. `needs_reconciliation` is
//   still in-flight and should be polled; `manual_review` is terminal from
//   the frontend's perspective. Neither state should promise a refund or
//   offer a retry.
//
// Also never implies tickets are attached to the order (doc §06:
// "confirmed means the order is secured, not the tickets are ready").

import { Loader2, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react'
import { formatMatchdayMoney } from '@/features/matchday/format'
import type { MatchdayOrder } from '@/features/matchday/types'
import { PriceBreakdownRows } from '@/components/price/price-rows'
import { normalizeDiscount } from '@/features/price-breakdown/helpers'

export function TicketOrderStatusPanel({
  order,
  timedOut,
}: {
  order: MatchdayOrder | undefined
  /** True once ~60s of polling has elapsed while still on `paid` or
   *  `confirming` (doc §06: "If you are still on paid or confirming
   *  after ~60 seconds, stop polling and show a 'we're finalising your
   *  order' message."). */
  timedOut: boolean
}) {
  if (!order) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
        <Loader2 className='size-6 animate-spin text-primary' />
        <p className='text-sm font-semibold text-foreground'>
          Confirming your payment…
        </p>
        <p className='text-xs text-muted-foreground'>
          This only takes a few seconds.
        </p>
      </div>
    )
  }

  if (order.status === 'confirmed') {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center'>
        <CheckCircle2 className='size-8 text-primary' />
        <p className='text-base font-bold text-foreground'>
          Your seats are confirmed
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          We&apos;ll email your tickets before the match.
        </p>
        <p className='font-mono text-[11px] text-muted-foreground'>
          Order #{order.order_id} ·{' '}
          {formatMatchdayMoney(order.amount_paid, order.currency)}
        </p>
        {/* Same breakdown the customer saw at checkout. `total` is BEFORE
            the discount, so the component shows total − discount. Renders
            nothing when the breakdown is null/unreadable. */}
        <PriceBreakdownRows
          className='mt-2 w-full max-w-sm text-left'
          breakdown={order.price_breakdown}
          discount={normalizeDiscount(order.discount)}
          totalLabel='Total paid'
          compact
        />
      </div>
    )
  }

  // Docs 3: `needs_reconciliation` is still in-flight. It means payment
  // succeeded and automation is confirming/recovering the supplier order.
  // Keep the progress state visible while the status hook continues polling.
  if (order.status === 'needs_reconciliation') {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center'>
        <Loader2 className='size-6 animate-spin text-primary' />
        <p className='text-base font-bold text-foreground'>
          Your payment went through
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          We&apos;re confirming your seats — we&apos;ll email you shortly.
        </p>
        <p className='font-mono text-[11px] text-muted-foreground'>
          Order #{order.order_id} ·{' '}
          {formatMatchdayMoney(order.amount_paid, order.currency)}
        </p>
      </div>
    )
  }

  // `manual_review` is terminal from the frontend's perspective. A person
  // owns the case now, so there is deliberately no retry action.
  if (order.status === 'manual_review') {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center'>
        <ShieldCheck className='size-8 text-primary' />
        <p className='text-base font-bold text-foreground'>
          Your payment went through
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          We&apos;re confirming your seats — we&apos;ll email you shortly.
        </p>
        <p className='font-mono text-[11px] text-muted-foreground'>
          Order #{order.order_id} ·{' '}
          {formatMatchdayMoney(order.amount_paid, order.currency)}
        </p>
      </div>
    )
  }

  // Doc §06, revised 4 Sept 2026: `failed` now means the order could not
  // be PREPARED — before any payment. Nothing was ever charged. This is
  // a completely different situation from a paid order that hits a
  // problem (see needs_reconciliation/manual_review above), and must
  // never use refund language.
  if (order.status === 'failed') {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center'>
        <XCircle className='size-8 text-red-500' />
        <p className='text-base font-bold text-foreground'>
          We couldn&apos;t complete this order
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          {order.statusMessage ?? "Nothing was charged — you're welcome to try again."}
        </p>
        <p className='font-mono text-[11px] text-muted-foreground'>
          Nothing was charged.
        </p>
        <p className='font-mono text-[11px] text-muted-foreground'>
          Order #{order.order_id}
        </p>
      </div>
    )
  }

  if (order.status === 'cancelled') {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
        <XCircle className='size-8 text-muted-foreground' />
        <p className='text-base font-bold text-foreground'>
          Checkout was cancelled
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          Your payment session expired or was abandoned. Nothing was
          charged — you&apos;re welcome to start again.
        </p>
      </div>
    )
  }

  if (order.status === 'awaiting_attendees') {
    // Reached once the attendee form has been submitted (see
    // app/builder/checkout-tickets/confirm/client.tsx) — the doc is
    // explicit that status still reads awaiting_attendees right after
    // submission, since finalising with the supplier happens in the
    // background. Keep polling; don't imply anything went wrong.
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
        <Loader2 className='size-6 animate-spin text-primary' />
        <p className='text-sm font-semibold text-foreground'>
          Finalising your order…
        </p>
        <p className='max-w-sm text-xs text-muted-foreground'>
          We&apos;ve received your ticket holder details —
          this usually only takes a few seconds.
        </p>
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
        <Clock className='size-6 text-muted-foreground' />
        <p className='text-sm font-semibold text-foreground'>
          We&apos;re finalising your order
        </p>
        <p className='max-w-sm text-xs text-muted-foreground'>
          This is taking a little longer than usual, but your payment is
          confirmed and the order is completing on our end — we&apos;ll
          email you shortly. You don&apos;t need to keep this tab open.
        </p>
      </div>
    )
  }

  // initiated | awaiting_payment | pending_payment | paid | confirming — still in
  // progress. `awaiting_payment` realistically never reaches this poll
  // (the session_id used to poll only exists once /pay has already run),
  // but is handled accurately rather than assumed away. `confirming` is
  // new (doc §00/§06): the order is actively being placed with the
  // supplier right now, still worth polling, same as `paid`.
  const inProgressCopy: Record<string, string> = {
    initiated: 'Preparing your order…',
    awaiting_payment: 'Preparing your order…',
    pending_payment: 'Waiting for payment confirmation…',
    paid: 'Payment received — placing your order…',
    confirming: 'Payment received — confirming your seats…',
  }
  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
      <Loader2 className='size-6 animate-spin text-primary' />
      <p className='text-sm font-semibold text-foreground'>
        {inProgressCopy[order.status] ?? 'Payment received — placing your order…'}
      </p>
      <p className='text-xs text-muted-foreground'>
        This only takes a few seconds.
      </p>
    </div>
  )
}
