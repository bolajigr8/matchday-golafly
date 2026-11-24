'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { StepProgress } from '@/components/checkout/step-progress'
import { TicketAttendeesForm } from '@/components/checkout/ticket-attendees-form'
import { TicketOrderStatusPanel } from '@/components/checkout/ticket-order-status'
import { useBuilderMatchId } from '@/features/builder/use-builder-match'
import { builderStepHref } from '@/features/builder/enter'
import { useCart } from '@/features/cart/context'
import {
  MATCHDAY_POLL_MAX_DURATION_MS,
  useSubmitTicketAttendees,
  useTicketOrderStatus,
} from '@/features/matchday/hooks'
import { useTravelersStore } from '@/store/travelers'
import {
  mapMatchdayOrderToSyncPayload,
  useBrevoOrderSync,
} from '@/features/brevo/sync'
import {
  buildEmptyAttendees,
  validateAttendees,
  parseAttendeeServerError,
  type AttendeeAnswers,
} from '@/features/matchday/attendees'
import { clearCheckoutIdempotencyKey } from '@/features/matchday/idempotency'
import { clearActiveMatchdayCheckout } from '@/features/matchday/checkout-session'
import { getCartApi, removeCartItemApi, clearCartAndForgetTokenApi } from '@/features/cart/api'

export function CheckoutTicketsConfirmClient() {
  const searchParams = useSearchParams()
  const matchId = useBuilderMatchId()
  const { items, removeType, clear } = useCart()
  const sessionId = searchParams.get('session_id')
  const isCartCheckout = searchParams.get('checkout') === 'cart'

  const [attendees, setAttendees] = useState<AttendeeAnswers[] | null>(null)
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>({})
  const [attendeesSubmitted, setAttendeesSubmitted] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [timedOut, setTimedOut] = useState(false)
  // Ref not state — we only need to prevent double-firing, not trigger a render.
  const hasClearedCartRef = useRef(false)

  // Pause polling once the attendee form is open so a refetch doesn't
  // clobber in-progress answers — resumed explicitly on submit via
  // useSubmitTicketAttendees' onSuccess (see features/matchday/hooks.ts).
  const pausedForAttendees = attendees !== null && !attendeesSubmitted

  const { data: order } = useTicketOrderStatus(sessionId, {
    pausedForAttendees,
  })

  // Brevo transaction sync — fire-and-forget, once per order + status.
  const buyer = useTravelersStore((s) => s.primaryContact)
  useBrevoOrderSync(mapMatchdayOrderToSyncPayload(order, buyer))

  const { mutateAsync: submitAttendees, isPending: isSubmittingAttendees } =
    useSubmitTicketAttendees(sessionId)

  // Seed the attendee form the first time the order asks for it. Adjusting
  // state during render (rather than in a useEffect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // — this is exactly that case: local state derived from a query result,
  // guarded so it only runs once per order_id.
  const [seededForOrderId, setSeededForOrderId] = useState<number | null>(null)
  if (
    order?.status === 'awaiting_attendees' &&
    order.attendees_required.length > 0 &&
    order.order_id !== seededForOrderId
  ) {
    setSeededForOrderId(order.order_id)
    setAttendees(buildEmptyAttendees(order.attendees_required, order.quantity))
  }

  // ~60s poll ceiling (doc §04/§10) — only meaningful while still polling;
  // needs_reconciliation/manual_review show their fixed message straight
  // away (doc §06: "Stop polling. Same message.") so there's nothing for
  // a timeout to add there.
  useEffect(() => {
    const stopStates = [
      'confirmed',
      'failed',
      'cancelled',
      'needs_reconciliation',
      'manual_review',
    ]
    if (!order || stopStates.includes(order.status)) return
    const remaining = MATCHDAY_POLL_MAX_DURATION_MS - (Date.now() - startedAt)
    const t = setTimeout(() => setTimedOut(true), Math.max(0, remaining))
    return () => clearTimeout(t)
  }, [order, startedAt])

  // Once the order reaches a genuinely terminal state, clean up both
  // browser checkout state and the matching server-cart item. A pending
  // payment must never clear the cart or the idempotency key.
  useEffect(() => {
    if (!order || hasClearedCartRef.current) return

    const terminalStates = [
      'confirmed',
      'failed',
      'cancelled',
      'needs_reconciliation',
      'manual_review',
    ]
    if (!terminalStates.includes(order.status)) return

    const ticketItem = items.find((i) => i.type === 'tickets')
    const payload = ticketItem?.checkoutPayload as
      | { eventId: number; listingId: number; quantity: number; serverId?: string }
      | undefined

    if (payload) {
      clearCheckoutIdempotencyKey(
        `${payload.eventId}:${payload.listingId}:${payload.quantity}`,
      )
    }
    clearActiveMatchdayCheckout()

    hasClearedCartRef.current = true

    void (async () => {
      try {
        if (isCartCheckout) {
          // A unified cart checkout represents the whole cart, so only clear
          // it after the payment/order reaches a terminal state. The server
          // remains the source of truth; local clear alone is insufficient.
          await clearCartAndForgetTokenApi()
          clear()
          return
        }

        if (payload?.serverId) {
          await removeCartItemApi(payload.serverId)
        } else {
          // Buy-now ticket checkout may have a matching server-cart item
          // from an earlier cart session. Find and remove only that ticket.
          const serverCart = await getCartApi()
          const match = serverCart.data.items.find(
            (item) =>
              item.type === 'matchday' &&
              String(item.eventId) === String(payload?.eventId) &&
              String(item.listingId) === String(payload?.listingId),
          )
          if (match) await removeCartItemApi(match.id)
        }
      } catch {
        // The browser copy is still cleared below. CartProvider's periodic
        // server reconciliation will remove stale live items on the next
        // refresh if the DELETE failed temporarily.
      } finally {
        if (isCartCheckout) clear()
        else removeType('tickets')
      }
    })()
    // hasClearedCartRef is stable — intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status])

  const remainingCartItems = items.filter((i) => i.type !== 'tickets')
  const hasOtherItems = remainingCartItems.length > 0

  async function handleAttendeesSubmit() {
    if (!order || !attendees || !sessionId) return
    const errors = validateAttendees(
      order.attendees_required,
      attendees,
      order.quantity,
    )
    if (Object.keys(errors).length > 0) {
      setAttendeeErrors(errors)
      return
    }
    setAttendeeErrors({})
    try {
      await submitAttendees({
        orderId: order.order_id,
        // Doc §00/§04, new 4 Sept 2026 — required. The same session_id
        // Stripe put on the redirect, which is also what we polled with.
        payload: { checkout_session_id: sessionId, attendees },
      })
      setAttendeesSubmitted(true)
    } catch (err) {
      const asAny = err as { status?: number | null; message?: string }
      // Doc §04 common failures: 409 "This order is not awaiting attendee
      // details" means it already moved on (confirmed, or a previous
      // submit already landed) — treat as success, not an error.
      if (asAny.status === 409) {
        setAttendeesSubmitted(true)
        return
      }
      const message = asAny.message ?? ''
      const { fieldErrors, generalMessage } = parseAttendeeServerError(message)
      setAttendeeErrors(fieldErrors)
      if (generalMessage) {
        setAttendeeErrors((prev) => ({ ...prev, _general: generalMessage }))
      }
    }
  }

  if (!sessionId) {
    return (
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />
        <div className='mt-10 rounded-2xl border border-border bg-card p-8 text-center'>
          <p className='text-sm font-semibold text-foreground'>
            No payment session found
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            If you just paid, use the link Stripe emailed you, or start a
            fresh checkout.
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

  const showAttendeeForm =
    order?.status === 'awaiting_attendees' && attendees !== null && !attendeesSubmitted

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={3} />

        <div className='mx-auto mt-8 max-w-xl space-y-5'>
          {!showAttendeeForm && (
            <>
              {order?.payment_status === 'paid' &&
                order.status === 'awaiting_attendees' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center'
                  >
                    <div className='mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary'>
                      ✓
                    </div>
                    <p className='text-base font-bold text-foreground'>
                      Payment successful
                    </p>
                    <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
                      Your payment has been received. We&apos;re preparing the
                      ticket-holder details required for this event. Please
                      don&apos;t pay again.
                    </p>
                  </motion.div>
                )}
              <TicketOrderStatusPanel order={order} timedOut={timedOut} />
            </>
          )}

          {showAttendeeForm && order && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className='space-y-4'
            >
              <div className='rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center'>
                <p className='text-sm font-semibold text-foreground'>
                  Payment received — order #{order.order_id}
                </p>
                <p className='text-xs text-muted-foreground'>
                  One last step before your tickets can be issued.
                </p>
              </div>

              <TicketAttendeesForm
                fields={order.attendees_required}
                attendees={attendees ?? []}
                errors={attendeeErrors}
                onChange={(idx, fieldName, value) =>
                  setAttendees((prev) =>
                    prev
                      ? prev.map((a, i) =>
                          i === idx ? { ...a, [fieldName]: value } : a,
                        )
                      : prev,
                  )
                }
              />

              {(attendeeErrors._general || attendeeErrors._count) && (
                <p className='text-center text-sm text-red-500'>
                  {attendeeErrors._general ?? attendeeErrors._count}
                </p>
              )}

              <button
                type='button'
                disabled={isSubmittingAttendees}
                onClick={handleAttendeesSubmit}
                className='flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-mono text-[12px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)] disabled:cursor-not-allowed disabled:opacity-40'
              >
                {isSubmittingAttendees && (
                  <Loader2 className='size-4 animate-spin' />
                )}
                Submit ticket holder details
              </button>
            </motion.div>
          )}

          {(order?.status === 'confirmed' ||
            order?.status === 'needs_reconciliation' ||
            order?.status === 'manual_review') && (
            <div className='flex flex-col items-center gap-2'>
              {hasOtherItems && !isCartCheckout ? (
                <Link
                  href={builderStepHref('/builder/pay', matchId)}
                  className='rounded-full bg-primary px-5 py-2.5 font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]'
                >
                  Continue to pay for the rest of your trip
                </Link>
              ) : (
                <Link
                  href='/dashboard/tickets'
                  className='rounded-full bg-primary px-5 py-2.5 font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]'
                >
                  {order.status === 'confirmed' ? 'View my tickets' : 'Done'}
                </Link>
              )}
            </div>
          )}

          {order?.status === 'failed' && (
            <div className='flex justify-center'>
              <Link
                href={builderStepHref('/builder/seats', matchId)}
                className='font-mono text-[11px] text-primary underline underline-offset-2'
              >
                Back to seats
              </Link>
            </div>
          )}

          {order?.status === 'cancelled' && (
            <div className='flex justify-center'>
              <Link
                href={builderStepHref('/builder/checkout-tickets', matchId)}
                className='rounded-full bg-primary px-5 py-2.5 font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]'
              >
                Start again
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
