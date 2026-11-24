// 'use client'

// import Link from 'next/link'
// import { useEffect, useRef, useState } from 'react'
// import { useSearchParams } from 'next/navigation'
// import { useQuery } from '@tanstack/react-query'
// import { motion } from 'framer-motion'
// import {
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   Home,
//   RefreshCcw,
//   Loader2,
//   Clock3,
// } from 'lucide-react'
// import type { ReactNode } from 'react'

// import { getTransactionBySessionId } from '@/features/payment/api'
// import type { TransactionApiResponse } from '@/features/payment/types'
// import {
//   isTerminalTransactionStatus,
//   isSuccessfulTransactionStatus,
// } from '@/features/payment/status'
// import {
//   getOrderByCheckoutSession,
//   type MatchdayOrder,
// } from '@/features/matchday/client'
// import { useSubmitTicketAttendees } from '@/features/matchday/hooks'
// import {
//   buildEmptyAttendees,
//   parseAttendeeServerError,
//   validateAttendees,
//   type AttendeeAnswers,
// } from '@/features/matchday/attendees'
// import { TicketAttendeesForm } from '@/components/checkout/ticket-attendees-form'
// import { clearActiveMatchdayCheckout } from '@/features/matchday/checkout-session'
// import {
//   clearCartAndForgetTokenApi,
//   getCartApi,
//   removeCartItemApi,
// } from '@/features/cart/api'
// import { useCart } from '@/features/cart/context'

// interface PaymentResultProps {
//   type: 'success' | 'cancelled' | 'error'
//   title: string
//   message: string
//   actionText?: string
//   actionHref?: string
//   children?: ReactNode
// }

// const CONFIG = {
//   success: {
//     icon: CheckCircle2,
//     iconClass: 'text-success',
//     bgClass: 'bg-success/10',
//     borderClass: 'border-success/20',
//   },
//   cancelled: {
//     icon: XCircle,
//     iconClass: 'text-muted-foreground',
//     bgClass: 'bg-muted/30',
//     borderClass: 'border-border',
//   },
//   error: {
//     icon: AlertCircle,
//     iconClass: 'text-destructive',
//     bgClass: 'bg-destructive/10',
//     borderClass: 'border-destructive/20',
//   },
// } as const

// /** Reusable payment result shell requested for the payment-success page. */
// function PaymentResult({
//   type,
//   title,
//   message,
//   actionText = 'Back to Home',
//   actionHref = '/',
//   children,
// }: PaymentResultProps) {
//   const cfg = CONFIG[type]
//   const Icon = cfg.icon

//   return (
//     <div className='flex min-h-[70vh] items-center justify-center px-4 py-16'>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className={`w-full max-w-lg rounded-2xl border ${cfg.borderClass} ${cfg.bgClass} p-8 text-center shadow-xl sm:p-10`}
//       >
//         <div className='mb-6 flex justify-center'>
//           <motion.div
//             initial={{ scale: 0.6, rotate: -8 }}
//             animate={{ scale: 1, rotate: 0 }}
//             transition={{
//               type: 'spring',
//               damping: 12,
//               stiffness: 200,
//               delay: 0.15,
//             }}
//           >
//             <Icon className={`size-16 ${cfg.iconClass}`} />
//           </motion.div>
//         </div>

//         <h1 className='font-heading text-2xl font-bold text-foreground sm:text-3xl'>
//           {title}
//         </h1>
//         <p className='mt-2 text-[13px] leading-relaxed text-muted-foreground'>
//           {message}
//         </p>

//         {children}

//         <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
//           <Link
//             href={actionHref}
//             className='flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[13px] font-bold text-primary-foreground shadow-[0_0_14px_var(--brand-glow)] transition-all hover:shadow-[0_0_24px_var(--brand-glow-strong)] sm:w-auto'
//           >
//             {type === 'cancelled' ? (
//               <RefreshCcw className='size-4' />
//             ) : (
//               <Home className='size-4' />
//             )}
//             {actionText}
//           </Link>

//           {type !== 'success' && (
//             <Link
//               href='/support?topic=payment'
//               className='flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-[13px] font-medium text-foreground hover:bg-muted/40 sm:w-auto'
//             >
//               Contact Support
//             </Link>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   )
// }

// type CartMarker = {
//   sessionId?: string
//   startedAt?: number
// }

// // Unified cart checkout returns MatchDay order details inside the cart status
// // response. This is intentionally local because the generic ledger type does
// // not own the cart checkout payload shape.
// type CartMatchdayStatus = MatchdayOrder
// type CartStatusData = TransactionApiResponse['data'] & {
//   items?: Array<{ matchday?: CartMatchdayStatus }>
//   matchday_orders?: CartMatchdayStatus[]
// }

// function readMarker<T>(key: string): T | null {
//   if (typeof window === 'undefined') return null
//   try {
//     const raw = sessionStorage.getItem(key)
//     return raw ? (JSON.parse(raw) as T) : null
//   } catch {
//     return null
//   }
// }

// export default function PaymentSuccessClient() {
//   const searchParams = useSearchParams()
//   const sessionId =
//     searchParams.get('session_id') ?? searchParams.get('sessionId')
//   const explicitCart = searchParams.get('checkout') === 'cart'
//   const { clear: clearLocalCart } = useCart()
//   const tracked = useRef(false)
//   const [startedAt] = useState(() => Date.now())
//   const [timedOut, setTimedOut] = useState(false)
//   const [attendees, setAttendees] = useState<AttendeeAnswers[] | null>(null)
//   const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>(
//     {},
//   )
//   const [attendeesSubmitted, setAttendeesSubmitted] = useState(false)

//   const cartMarker = readMarker<CartMarker>('gf-cart-checkout-pending')
//   const markerSaysCart = explicitCart || cartMarker?.sessionId === sessionId

//   // IMPORTANT: do not guess the checkout type from the page the customer came
//   // from, nor depend on a sessionStorage marker. The backend response is the
//   // source of truth. We query both status sources and select whichever one
//   // actually returns the checkout session/order.
//   const matchdayQuery = useQuery<MatchdayOrder, Error>({
//     queryKey: ['payment-success-matchday', sessionId],
//     queryFn: () => getOrderByCheckoutSession(sessionId!),
//     enabled: Boolean(sessionId),
//     retry: false,
//     refetchInterval: (query) => {
//       const status = query.state.data?.status
//       if (
//         ['confirmed', 'manual_review', 'cancelled', 'failed'].includes(
//           status ?? '',
//         )
//       ) {
//         return false
//       }
//       if (Date.now() - startedAt >= 3 * 60_000) return false
//       return 2_000
//     },
//   })

//   // For cart checkout we still read the generic/cart status. This endpoint
//   // is appropriate for the unified cart flow, but NOT for direct MatchDay.
//   const cartQuery = useQuery<TransactionApiResponse, Error>({
//     queryKey: ['payment-success-cart', sessionId],
//     queryFn: () => getTransactionBySessionId(sessionId!),
//     enabled: Boolean(sessionId),
//     retry: false,
//     refetchInterval: (query) => {
//       const status = query.state.data?.data?.status
//       if (isTerminalTransactionStatus(status)) return false
//       if (Date.now() - startedAt >= 3 * 60_000) return false
//       return 5_000
//     },
//   })

//   const matchdayOrder = matchdayQuery.data
//   const cartTx = cartQuery.data?.data as CartStatusData | undefined

//   // A cart checkout can contain MatchDay data nested under either
//   // `items[].matchday` or `matchday_orders[]`. Your actual response contains
//   // both, so support both documented/returned shapes.
//   const cartMatchday =
//     cartTx?.matchday_orders?.[0] ??
//     cartTx?.items?.find((item) => item.matchday)?.matchday

//   // The backend decides which flow this is. `checkout_type: "cart"` and a
//   // returned cart MatchDay order take precedence over any browser marker.
//   const isCartCheckout =
//     cartTx?.checkout_type === 'cart' || Boolean(cartMatchday)
//   const isDirectMatchday = Boolean(matchdayOrder) && !isCartCheckout
//   const isKnownCart = markerSaysCart || isCartCheckout

//   const matchdayPaymentPaid = matchdayOrder?.payment_status === 'paid'
//   const matchdayConfirmed =
//     isDirectMatchday &&
//     matchdayOrder?.status === 'confirmed' &&
//     matchdayPaymentPaid
//   const matchdayPaidWaiting =
//     isDirectMatchday &&
//     matchdayPaymentPaid &&
//     !matchdayConfirmed &&
//     !['failed', 'cancelled'].includes(matchdayOrder?.status ?? '')

//   const cartPaymentPaid = isCartCheckout && cartTx?.payment_status === 'paid'
//   const cartMatchdayPaymentPaid = cartMatchday?.payment_status === 'paid'
//   const cartConfirmed =
//     isCartCheckout &&
//     isSuccessfulTransactionStatus(cartTx?.status) &&
//     cartPaymentPaid

//   useEffect(() => {
//     const timer = window.setTimeout(() => setTimedOut(true), 3 * 60_000)
//     return () => window.clearTimeout(timer)
//   }, [])

//   // Use the order from the checkout source that actually returned data.
//   // For the response in the report this is cartMatchday, not the direct
//   // MatchDay endpoint.
//   const attendeeOrder = isCartCheckout ? cartMatchday : matchdayOrder
//   const attendeeFields = attendeeOrder?.attendees_required ?? []
//   const needsAttendees =
//     attendeeOrder?.status === 'awaiting_attendees' && attendeeFields.length > 0

//   // Keep the editable draft in state, but also create a synchronous fallback.
//   // This removes the render/effect race where the page could render the
//   // "payment successful / waiting" screen for a frame (or indefinitely if
//   // the query object changed) even though attendees_required was already in
//   // the API response.
//   const attendeeDraft = needsAttendees
//     ? (attendees ?? buildEmptyAttendees(attendeeFields, attendeeOrder.quantity))
//     : null

//   useEffect(() => {
//     if (!needsAttendees || !attendeeOrder) return
//     setAttendees(
//       (current) =>
//         current ?? buildEmptyAttendees(attendeeFields, attendeeOrder.quantity),
//     )
//   }, [
//     needsAttendees,
//     attendeeOrder?.order_id,
//     attendeeOrder?.quantity,
//     attendeeFields,
//   ])

//   const { mutateAsync: submitAttendees, isPending: isSubmittingAttendees } =
//     useSubmitTicketAttendees(sessionId)

//   async function handleAttendeesSubmit() {
//     if (!sessionId || !attendeeOrder || !attendeeDraft) return

//     const errors = validateAttendees(
//       attendeeOrder.attendees_required,
//       attendeeDraft,
//       attendeeOrder.quantity,
//     )

//     if (Object.keys(errors).length) {
//       setAttendeeErrors(errors)
//       return
//     }

//     setAttendeeErrors({})

//     try {
//       await submitAttendees({
//         orderId: attendeeOrder.order_id,
//         payload: {
//           checkout_session_id: sessionId,
//           attendees: attendeeDraft,
//         },
//       })
//       setAttendeesSubmitted(true)
//       if (isKnownCart) {
//         await cartQuery.refetch()
//       }
//     } catch (error) {
//       const value = error as { status?: number; message?: string }

//       if (value.status === 409) {
//         setAttendeesSubmitted(true)
//         return
//       }

//       const parsed = parseAttendeeServerError(value.message ?? '')
//       setAttendeeErrors({
//         ...parsed.fieldErrors,
//         ...(parsed.generalMessage ? { _general: parsed.generalMessage } : {}),
//       })
//     }
//   }

//   // Clear only after the relevant booking is genuinely finished. In
//   // particular, payment_status=paid + awaiting_attendees must NOT clear the
//   // cart because the attendee submission still has to happen.
//   useEffect(() => {
//     if (!sessionId) return

//     const directFinished =
//       !isKnownCart &&
//       (matchdayOrder?.status === 'confirmed' ||
//         matchdayOrder?.status === 'manual_review' ||
//         matchdayOrder?.status === 'cancelled' ||
//         matchdayOrder?.status === 'failed')

//     const cartFinished = isKnownCart && cartConfirmed

//     if (!directFinished && !cartFinished) return

//     let active = true

//     void (async () => {
//       try {
//         if (isKnownCart) {
//           await clearCartAndForgetTokenApi()
//         } else if (matchdayOrder) {
//           const cart = await getCartApi()
//           const matchItem = cart.data.items.find(
//             (item) =>
//               item.type === 'matchday' &&
//               String(item.eventId) === String(matchdayOrder.event.event_id) &&
//               String(item.listingId) ===
//                 String(matchdayOrder.ticket.listing_id),
//           )

//           if (matchItem) {
//             await removeCartItemApi(matchItem.id)
//           }
//         }

//         if (active) clearLocalCart()
//       } catch {
//         // Do not falsely claim that the server cart was cleared. The normal
//         // CartProvider server reconciliation will retry on focus/interval.
//       } finally {
//         clearActiveMatchdayCheckout()
//         try {
//           sessionStorage.removeItem('gf-matchday-payment-pending')
//           if (isKnownCart) sessionStorage.removeItem('gf-cart-checkout-pending')
//         } catch {
//           // ignore storage errors
//         }
//       }
//     })()

//     return () => {
//       active = false
//     }
//   }, [sessionId, isKnownCart, cartConfirmed, paidBookingFailed, matchdayOrder, clearLocalCart])

//   useEffect(() => {
//     const successful =
//       matchdayConfirmed || cartConfirmed || (cartPaymentPaid && !cartTx?.status)

//     if (!successful || tracked.current) return
//     tracked.current = true

//     const raw = sessionStorage.getItem('golafly_payment_data')
//     if (!raw) return

//     fetch('/api/hubspot/payment', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: raw,
//     })
//       .catch(() => undefined)
//       .finally(() => sessionStorage.removeItem('golafly_payment_data'))
//   }, [matchdayConfirmed, cartConfirmed, cartPaymentPaid, cartTx?.status])

//   if (!sessionId) {
//     return (
//       <PaymentResult
//         type='error'
//         title='Payment session not found'
//         message='We could not find the payment session needed to verify your booking. Please return to checkout or contact support if you were charged.'
//       />
//     )
//   }

//   // Payment is captured, but the MatchDay order is deliberately not
//   // complete until the dynamically requested attendee details are submitted.
//   // Render the form in the same visible success card so it cannot be hidden
//   // below a second min-height success panel.
//   if (
//     (matchdayPaidWaiting || cartMatchdayPaymentPaid) &&
//     needsAttendees &&
//     attendeeDraft
//   ) {
//     return (
//       <PaymentResult
//         type='success'
//         title='Payment successful'
//         message='Your payment has been received. Complete the ticket holder details below so we can issue your tickets.'
//       >
//         <div className='mt-6 rounded-2xl border border-border bg-background/60 p-5 text-left sm:p-6'>
//           <TicketAttendeesForm
//             fields={attendeeFields}
//             attendees={attendeeDraft}
//             errors={attendeeErrors}
//             onChange={(index, fieldName, value) =>
//               setAttendees((current) => {
//                 const source = current ?? attendeeDraft
//                 return source.map((item, itemIndex) =>
//                   itemIndex === index ? { ...item, [fieldName]: value } : item,
//                 )
//               })
//             }
//           />
//           {attendeeErrors._general && (
//             <p className='mt-3 text-center text-sm text-destructive'>
//               {attendeeErrors._general}
//             </p>
//           )}
//           <button
//             type='button'
//             disabled={isSubmittingAttendees}
//             onClick={handleAttendeesSubmit}
//             className='mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[12px] font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50'
//           >
//             {isSubmittingAttendees && (
//               <Loader2 className='size-4 animate-spin' />
//             )}
//             Submit ticket holder details
//           </button>
//         </div>
//       </PaymentResult>
//     )
//   }

//   // If payment is already captured but the supplier has not supplied the
//   // attendee schema yet, explicitly say so. This is different from an unpaid
//   // pending state and the customer must never be told to pay again.
//   if (
//     (matchdayPaidWaiting || cartMatchdayPaymentPaid) &&
//     attendeeOrder?.status === 'awaiting_attendees'
//   ) {
//     return (
//       <PaymentResult
//         type='success'
//         title='Payment successful'
//         message='Your payment has been received. We are waiting for the ticket holder fields required by the ticket supplier.'
//       >
//         <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
//           <Loader2 className='size-4 animate-spin text-primary' />
//           Waiting for the attendee form…
//         </div>
//       </PaymentResult>
//     )
//   }

//   if (
//     matchdayOrder?.status === 'failed' ||
//     matchdayOrder?.status === 'cancelled' ||
//     cartTx?.status === 'failed' ||
//     cartTx?.status === 'cancelled' ||
//     cartTx?.status === 'expired'
//   ) {
//     return (
//       <PaymentResult
//         type={
//           matchdayOrder?.status === 'cancelled' ||
//           cartTx?.status === 'cancelled'
//             ? 'cancelled'
//             : 'error'
//         }
//         title='Payment not completed'
//         message={
//           matchdayOrder?.statusMessage ??
//           cartQuery.data?.message ??
//           'The payment or booking could not be completed.'
//         }
//         actionText='Try Again'
//         actionHref='/'
//       />
//     )
//   }

//   if (
//     matchdayConfirmed ||
//     cartConfirmed ||
//     (matchdayOrder?.status === 'manual_review' && matchdayPaymentPaid)
//   ) {
//     return (
//       <PaymentResult
//         type='success'
//         title='Payment successful'
//         message={
//           matchdayOrder?.status === 'manual_review'
//             ? 'Your payment went through. We are completing your booking and will email you when it is ready.'
//             : 'Thank you. Your payment has been received and your booking is being completed. Confirmation details will be sent to your email.'
//         }
//       />
//     )
//   }

//   if (matchdayPaidWaiting || cartPaymentPaid || cartMatchdayPaymentPaid) {
//     return (
//       <PaymentResult
//         type='success'
//         title='Payment successful'
//         message='Your payment has been received. We are finalizing your booking. Please do not pay again.'
//       >
//         <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
//           {timedOut ? (
//             <Clock3 className='size-4 text-primary' />
//           ) : (
//             <Loader2 className='size-4 animate-spin text-primary' />
//           )}
//           {timedOut
//             ? 'This is taking longer than usual. We will continue finalizing your booking.'
//             : 'Confirming your booking…'}
//         </div>
//       </PaymentResult>
//     )
//   }

//   const loading =
//     matchdayQuery.isLoading ||
//     cartQuery.isLoading ||
//     (!matchdayQuery.data && !cartTx)

//   return (
//     <PaymentResult
//       type={loading ? 'success' : 'cancelled'}
//       title={loading ? 'Confirming your payment…' : 'Payment status'}
//       message={
//         loading
//           ? 'We are checking the payment status with the correct booking system. Please do not pay again.'
//           : 'We have not received a final payment confirmation yet. Please check again in a moment.'
//       }
//     >
//       <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
//         <Loader2 className='size-4 animate-spin text-primary' />
//         Checking payment status…
//       </div>
//       <button
//         type='button'
//         onClick={() => {
//           void matchdayQuery.refetch()
//           void cartQuery.refetch()
//         }}
//         className='mt-4 rounded-full border border-border px-5 py-2.5 font-mono text-[11px] font-bold text-foreground hover:border-primary/40 hover:text-primary'
//       >
//         Check again
//       </button>
//     </PaymentResult>
//   )
// }

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home,
  RefreshCcw,
  Loader2,
  Clock3,
  Info,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { getTransactionBySessionId } from '@/features/payment/api'
import type { TransactionApiResponse } from '@/features/payment/types'
import {
  isTerminalTransactionStatus,
  isSuccessfulTransactionStatus,
  isFinishingBooking,
  FINISHING_BOOKING_COPY,
  FINISHING_MESSAGE_AFTER_MS,
  PAID_BOOKING_FAILED,
  bookingOutcomeRows,
  outcomeStatusLabel,
} from '@/features/payment/status'
import {
  getOrderByCheckoutSession,
  // MatchdayOrder is now properly re-exported from client.ts (fixes TS2459)
  type MatchdayOrder,
} from '@/features/matchday/client'
import { useSubmitTicketAttendees } from '@/features/matchday/hooks'
import {
  buildEmptyAttendees,
  parseAttendeeServerError,
  validateAttendees,
  type AttendeeAnswers,
} from '@/features/matchday/attendees'
import { TicketAttendeesForm } from '@/components/checkout/ticket-attendees-form'
import { clearActiveMatchdayCheckout } from '@/features/matchday/checkout-session'
import {
  clearCartAndForgetTokenApi,
  clearCartForTokenApi,
  getCartApi,
  getCartForTokenApi,
  removeCartItemApi,
  removeCartItemForTokenApi,
} from '@/features/cart/api'
import { trackPurchase } from '@/lib/analytics'
import {
  clearLandingReturn,
  clearLandingSiteNote,
  readLandingReturn,
  type LandingReturn,
} from '@/lib/landing-return'
import { useCart } from '@/features/cart/context'
import { vipConfirmedHref } from '@/features/vip/routes'
import { getVipSession } from '@/features/vip/session'
import { useTravelersStore } from '@/store/travelers'
import {
  mapMatchdayOrderToSyncPayload,
  mapTransactionToSyncPayloads,
  useBrevoOrderSync,
} from '@/features/brevo/sync'

/* ── Ticket holder details: submit helpers ─────────────────────────── */

/** After this long the button explains the wait instead of a bare spinner. */
const SUBMIT_SLOW_AFTER_MS = 6_000

/** Bring the first field with a problem into view (and focus it), so a tap
 *  on Submit is never silent when the error is off-screen on a phone.
 *  Keys are `${attendeeIndex}.${field_name}` (validateAttendees). */
function scrollToFirstAttendeeError(errors: Record<string, string>) {
  const keys = Object.keys(errors).filter((key) => /^\d+\./.test(key))
  if (!keys.length || typeof window === 'undefined') return
  // Wait for React to paint the error messages first.
  window.requestAnimationFrame(() => {
    const nodes = keys
      .map((key) =>
        document.querySelector<HTMLElement>(`[data-attendee-key="${CSS.escape(key)}"]`),
      )
      .filter((node): node is HTMLElement => !!node)
    // The one highest on the page, not the first key in object order.
    const first = nodes.sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    )[0]
    if (!first) return
    first.scrollIntoView({ behavior: 'smooth', block: 'center' })
    first.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true })
  })
}

/** Every problem is also announced as a toast (one at a time, replacing the
 *  previous one), so a tap is never silent even when the field with the
 *  problem is off-screen on a phone. The red "Required." under each field
 *  stays, so the customer still sees which field to fix. */
function announceAttendeeErrors(errors: Record<string, string>) {
  const fieldCount = Object.keys(errors).filter((key) => /^\d+\./.test(key)).length
  const opts = { id: 'attendee-submit', duration: 8000 }
  if (fieldCount > 0) {
    toast.error(
      fieldCount === 1 ? '1 field needs your attention' : `${fieldCount} fields need your attention`,
      { ...opts, description: 'We have taken you to the first one. It is marked in red.' },
    )
  } else if (errors._count) {
    toast.error('Please fill in a section for every ticket, then try again.', opts)
  } else if (errors._general) {
    toast.error(errors._general, opts)
  }
}

/** A message the customer can act on. The server's own 4xx text is kept (it
 *  is the supplier's rule); a dropped connection, a time-out or a server
 *  error gets plain words instead of "Network Error" / "timeout of …". */
function attendeeSubmitErrorMessage(
  status: number | null | undefined,
  serverMessage: string | null,
): string {
  if (!status) {
    return "We couldn't reach our server. Check your connection and tap Submit again. Your answers are kept."
  }
  if (status >= 500) {
    return 'Something went wrong on our side. Please tap Submit again in a moment. Your answers are kept.'
  }
  return serverMessage || 'We could not save these details. Please check them and try again.'
}

interface PaymentResultProps {
  type: 'success' | 'cancelled' | 'error'
  title: string
  message: string
  actionText?: string
  actionHref?: string
  children?: ReactNode
  /** For a form inside the card (ticket holder details): less padding on
   *  phones and a wider card, so the inputs get most of a small screen. */
  form?: boolean
}

const CONFIG = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/20',
  },
  cancelled: {
    icon: XCircle,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
    borderClass: 'border-border',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
  },
} as const

function PaymentResult({
  type,
  title,
  message,
  actionText = 'Back to Home',
  actionHref = '/',
  children,
  form = false,
}: PaymentResultProps) {
  const cfg = CONFIG[type]
  const Icon = cfg.icon

  return (
    <div
      className={
        form
          ? 'flex min-h-[70vh] items-center justify-center px-3 py-8 sm:px-4 sm:py-16'
          : 'flex min-h-[70vh] items-center justify-center px-4 py-16'
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full min-w-0 rounded-2xl border ${cfg.borderClass} ${cfg.bgClass} text-center shadow-xl ${
          form ? 'max-w-xl p-4 sm:p-10' : 'max-w-lg p-8 sm:p-10'
        }`}
      >
        <div className='mb-6 flex justify-center'>
          <motion.div
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 200,
              delay: 0.15,
            }}
          >
            <Icon className={`size-16 ${cfg.iconClass}`} />
          </motion.div>
        </div>

        <h1 className='font-heading text-2xl font-bold text-foreground sm:text-3xl'>
          {title}
        </h1>
        <p className='mt-2 text-[13px] leading-relaxed text-muted-foreground'>
          {message}
        </p>

        {children}

        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href={actionHref}
            className='flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[13px] font-bold text-primary-foreground shadow-[0_0_14px_var(--brand-glow)] transition-all hover:shadow-[0_0_24px_var(--brand-glow-strong)] sm:w-auto'
          >
            {type === 'cancelled' ? (
              <RefreshCcw className='size-4' />
            ) : (
              <Home className='size-4' />
            )}
            {actionText}
          </Link>

          {type !== 'success' && (
            <Link
              href='/support?topic=payment'
              className='flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-[13px] font-medium text-foreground hover:bg-muted/40 sm:w-auto'
            >
              Contact Support
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}

type CartMarker = {
  sessionId?: string
  startedAt?: number
}

/** Storage is read once; nothing to subscribe to. */
const noopSubscribe = () => () => {}

type CartMatchdayStatus = MatchdayOrder

// Fix TS2339: added checkout_type so cartTx?.checkout_type is valid
type CartStatusData = Omit<TransactionApiResponse['data'], 'items'> & {
  checkout_type?: string
  /** Only on a VIP package's basket (VIP packages API contract §6). */
  hospitality_package_id?: string
  items?: Array<TransactionApiResponse['data'] & { matchday?: CartMatchdayStatus }>
  matchday_orders?: CartMatchdayStatus[]
}

function readMarker<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/** Brevo transaction sync for this page — kept outside the page component
 *  so it stays an isolated, side-effect-only hook. */
function useBrevoPaymentSync({
  matchdayOrder,
  cartTx,
  sessionId,
}: {
  matchdayOrder: MatchdayOrder | undefined
  cartTx: CartStatusData | undefined
  sessionId: string | null
}) {
  const buyer = useTravelersStore((s) => s.primaryContact)
  useBrevoOrderSync(
    mapMatchdayOrderToSyncPayload(matchdayOrder, buyer, {
      /* A cart checkout can carry a flight / eSIM too: the email journey
         then skips offering what was already bought. */
      hasFlight: !!cartTx?.flight,
      hasEsim: !!cartTx?.esim,
      fallbackBuyer: cartTx?.customer?.email
        ? { email: cartTx.customer.email, fullName: cartTx.customer.full_name, phone: cartTx.customer.phone }
        : null,
    }),
  )
  useBrevoOrderSync(
    cartTx && isTerminalTransactionStatus(cartTx.status)
      ? mapTransactionToSyncPayloads(cartTx, sessionId)
      : null,
  )
}

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams()
  const sessionId =
    searchParams.get('session_id') ?? searchParams.get('sessionId')
  const explicitCart = searchParams.get('checkout') === 'cart'
  // VIP packages have their own confirmation page (/vip/confirmed): this
  // page only hands them over. Known at once when this browser started the
  // payment (saved session id), otherwise from the basket below. Sent back
  // here with ?vip_attendees=1 to fill in ticket attendees: stay.
  const router = useRouter()
  const stayForVipAttendees = searchParams.get('vip_attendees') === '1'
  const vipMarker = useSyncExternalStore(
    noopSubscribe,
    () => !stayForVipAttendees && !!sessionId && getVipSession()?.stripeSessionId === sessionId,
    () => false,
  )
  const { clear: clearLocalCart } = useCart()
  const tracked = useRef(false)
  // Polling window start. Reset when the attendee details are submitted, so
  // the page keeps checking until the tickets are issued however long the
  // customer took to fill the form (the window used to end 3 minutes after
  // the page opened, leaving the form on screen after a successful submit).
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [timedOut, setTimedOut] = useState(false)
  const [attendees, setAttendees] = useState<AttendeeAnswers[] | null>(null)
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>(
    {},
  )
  const [attendeesSubmitted, setAttendeesSubmitted] = useState(false)
  // Local submit lock — prevents double-fire even if isPending races
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  // Synchronous twin of the lock: a second tap in the same frame (before
  // React re-renders the disabled button) is refused here.
  const submitLockRef = useRef(false)
  // The request is taking a while: reassure instead of leaving a bare spinner.
  const [submitSlow, setSubmitSlow] = useState(false)

  // Set by a landing page (championsleague.golafly.com …) when the booking
  // started there: which landing page, and its guest cart token. Read once,
  // before anything below can delete it. Empty for normal golafly.com buyers.
  const [landing] = useState<LandingReturn>(() =>
    typeof window === 'undefined'
      ? { site: null, consent: null, cartToken: null }
      : readLandingReturn(),
  )

  const cartMarker = readMarker<CartMarker>('gf-cart-checkout-pending')
  const markerSaysCart = explicitCart || cartMarker?.sessionId === sessionId

  const matchdayQuery = useQuery<MatchdayOrder, Error>({
    queryKey: ['payment-success-matchday', sessionId],
    queryFn: () => getOrderByCheckoutSession(sessionId!),
    enabled: Boolean(sessionId) && !vipMarker,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (
        ['confirmed', 'manual_review', 'cancelled', 'failed'].includes(
          status ?? '',
        )
      ) {
        return false
      }
      if (Date.now() - startedAt >= 3 * 60_000) return false
      return 2_000
    },
  })

  const cartQuery = useQuery<TransactionApiResponse, Error>({
    queryKey: ['payment-success-cart', sessionId],
    queryFn: () => getTransactionBySessionId(sessionId!),
    enabled: Boolean(sessionId) && !vipMarker,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      if (isTerminalTransactionStatus(status)) return false
      if (Date.now() - startedAt >= 3 * 60_000) return false
      return 5_000
    },
  })

  const matchdayOrder = matchdayQuery.data
  const cartTx = cartQuery.data?.data as CartStatusData | undefined
  const isVipPackage =
    !stayForVipAttendees && (vipMarker || Boolean(cartTx?.hospitality_package_id))
  useEffect(() => {
    if (isVipPackage && sessionId) router.replace(vipConfirmedHref(sessionId))
  }, [isVipPackage, sessionId, router])

  const cartMatchday =
    cartTx?.matchday_orders?.[0] ??
    cartTx?.items?.find((item) => item.matchday)?.matchday

  const isCartCheckout =
    cartTx?.checkout_type === 'cart' || Boolean(cartMatchday)
  const isDirectMatchday = Boolean(matchdayOrder) && !isCartCheckout
  const isKnownCart = markerSaysCart || isCartCheckout

  const matchdayPaymentPaid = matchdayOrder?.payment_status === 'paid'
  const matchdayConfirmed =
    isDirectMatchday &&
    matchdayOrder?.status === 'confirmed' &&
    matchdayPaymentPaid
  const matchdayPaidWaiting =
    isDirectMatchday &&
    matchdayPaymentPaid &&
    !matchdayConfirmed &&
    !['failed', 'cancelled'].includes(matchdayOrder?.status ?? '')

  const cartPaymentPaid = isCartCheckout && cartTx?.payment_status === 'paid'
  const cartMatchdayPaymentPaid = cartMatchday?.payment_status === 'paid'
  const cartConfirmed =
    isCartCheckout &&
    isSuccessfulTransactionStatus(cartTx?.status) &&
    cartPaymentPaid
  // Paid, but a booking (e.g. the hotel) could not be confirmed: final for
  // this page. Our team arranges an alternative; nothing is retried here.
  const paidBookingFailed = cartTx?.status === PAID_BOOKING_FAILED

  // Brevo transaction sync (fire-and-forget, once per order + status).
  // Buyer contact comes from the shared travelers store the ticket checkout
  // fills in; ledger legs carry their own customer block.
  useBrevoPaymentSync({
    matchdayOrder: isCartCheckout ? cartMatchday : matchdayOrder,
    cartTx: isCartCheckout ? cartTx : undefined,
    sessionId,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), FINISHING_MESSAGE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const attendeeOrder = isCartCheckout ? cartMatchday : matchdayOrder
  const attendeeFields = attendeeOrder?.attendees_required ?? []
  const needsAttendees =
    attendeeOrder?.status === 'awaiting_attendees' && attendeeFields.length > 0

  const attendeeDraft = needsAttendees
    ? (attendees ?? buildEmptyAttendees(attendeeFields, attendeeOrder.quantity))
    : null

  useEffect(() => {
    if (!needsAttendees || !attendeeOrder) return
    setAttendees(
      (current) =>
        current ?? buildEmptyAttendees(attendeeFields, attendeeOrder.quantity),
    )
  }, [
    needsAttendees,
    attendeeOrder?.order_id,
    attendeeOrder?.quantity,
    attendeeFields,
  ])

  const { mutateAsync: submitAttendees, isPending: isSubmittingAttendees } =
    useSubmitTicketAttendees(sessionId)

  // Combined disabled flag: react-query's isPending OR our local lock.
  // The local lock covers the window between the button click and the
  // moment react-query flips isPending to true, preventing a double-fire.
  const submitDisabled = isSubmittingAttendees || isSubmittingLocal

  async function handleAttendeesSubmit() {
    if (!sessionId || !attendeeOrder || !attendeeDraft) return
    if (submitDisabled || submitLockRef.current) return

    // Lock and show the spinner on the very first tap, before anything else.
    submitLockRef.current = true
    setIsSubmittingLocal(true)
    setSubmitSlow(false)

    const errors = validateAttendees(
      attendeeOrder.attendees_required,
      attendeeDraft,
      attendeeOrder.quantity,
    )

    if (Object.keys(errors).length) {
      setAttendeeErrors(errors)
      submitLockRef.current = false
      setIsSubmittingLocal(false)
      scrollToFirstAttendeeError(errors)
      announceAttendeeErrors(errors)
      return
    }

    setAttendeeErrors({})
    const slowTimer = window.setTimeout(() => setSubmitSlow(true), SUBMIT_SLOW_AFTER_MS)

    try {
      await submitAttendees({
        orderId: attendeeOrder.order_id,
        payload: {
          checkout_session_id: sessionId,
          attendees: attendeeDraft,
        },
      })
      onAttendeesAccepted()
    } catch (error) {
      const value = error as { status?: number | null; message?: string }

      // Already received (a second tap, or a retry after a slow reply): the
      // details are in, so for the customer this is a success.
      if (value.status === 409) {
        onAttendeesAccepted()
        return
      }

      const parsed = parseAttendeeServerError(value.message ?? '')
      const general = attendeeSubmitErrorMessage(value.status, parsed.generalMessage)
      const next = {
        ...parsed.fieldErrors,
        ...(general && !Object.keys(parsed.fieldErrors).length ? { _general: general } : {}),
      }
      setAttendeeErrors(next)
      if (Object.keys(parsed.fieldErrors).length) {
        scrollToFirstAttendeeError(parsed.fieldErrors)
      }
      announceAttendeeErrors(next)
    } finally {
      window.clearTimeout(slowTimer)
      setSubmitSlow(false)
      submitLockRef.current = false
      setIsSubmittingLocal(false)
    }
  }

  /** The details were accepted: show "Details received" at once (never the
   *  form again) and keep checking the order until the tickets are issued. */
  function onAttendeesAccepted() {
    setAttendeesSubmitted(true)
    setStartedAt(Date.now())
    // The form was long; bring the "Details received" heading into view.
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (isDirectMatchday) void matchdayQuery.refetch()
    if (isKnownCart) void cartQuery.refetch()
  }

  // Clear only after the relevant booking is genuinely finished.
  useEffect(() => {
    if (!sessionId) return
    // A VIP package's basket is never cleared from here (the backend
    // refuses it; contract §6). /vip/confirmed handles the guest token.
    if (cartTx?.hospitality_package_id) return

    const directFinished =
      !isKnownCart &&
      (matchdayOrder?.status === 'confirmed' ||
        matchdayOrder?.status === 'manual_review' ||
        matchdayOrder?.status === 'cancelled' ||
        matchdayOrder?.status === 'failed')

    const cartFinished = isKnownCart && (cartConfirmed || paidBookingFailed)

    if (!directFinished && !cartFinished) return

    let active = true

    void (async () => {
      try {
        if (isKnownCart) {
          await clearCartAndForgetTokenApi()
        } else if (matchdayOrder) {
          const cart = await getCartApi()
          const matchItem = cart.data.items.find(
            (item) =>
              item.type === 'matchday' &&
              String(item.eventId) === String(matchdayOrder.event.event_id) &&
              String(item.listingId) ===
                String(matchdayOrder.ticket.listing_id),
          )

          if (matchItem) {
            await removeCartItemApi(matchItem.id)
          }
        }

        if (active) clearLocalCart()
      } catch {
        // CartProvider reconciliation will retry on focus/interval.
      } finally {
        clearActiveMatchdayCheckout()
        try {
          sessionStorage.removeItem('gf-matchday-payment-pending')
          if (isKnownCart) sessionStorage.removeItem('gf-cart-checkout-pending')
        } catch {
          // ignore storage errors
        }
      }
    })()

    return () => {
      active = false
    }
  }, [sessionId, isKnownCart, cartConfirmed, matchdayOrder, clearLocalCart, cartTx?.hospitality_package_id])

  // Landing-page buyers only: the booking began on a landing address, so
  // golafly.com is where Stripe brought them back and the sale is reported
  // here (lib/analytics.ts adds the landing name). Nothing happens for buyers
  // who started on golafly.com. Once per payment session.
  const purchaseReported = useRef(false)
  useEffect(() => {
    if (!sessionId || purchaseReported.current) return
    if (!landing.site) return

    const order = isCartCheckout ? cartMatchday : matchdayOrder
    const paid = isCartCheckout
      ? cartPaymentPaid || cartMatchdayPaymentPaid
      : matchdayPaymentPaid
    if (!paid || !order) return

    const seenKey = `gf-purchase-reported:${sessionId}`
    purchaseReported.current = true
    try {
      if (localStorage.getItem(seenKey)) return
    } catch {
      // storage unavailable: the order id still de-duplicates at Google/Meta
    }

    try {
      const quantity = Math.max(1, Number(order.quantity) || 1)
      // A whole-cart payment (tickets + extras) reports the full amount paid;
      // a tickets-only payment reports the ticket order's amount.
      const cartMinor = cartTx?.pricing?.amount_paid_minor
      const value =
        isCartCheckout && cartTx?.checkout_type === 'cart' && cartMinor
          ? cartMinor / 100
          : Number(order.amount_paid) || 0
      const currency = String(
        (isCartCheckout && cartTx?.pricing?.currency) || order.currency || 'EUR',
      ).toUpperCase()
      const name =
        order.event.home_team && order.event.away_team
          ? `${order.event.home_team} vs ${order.event.away_team}`
          : (order.event.event_name ?? 'Match tickets')

      trackPurchase({
        transactionId: sessionId,
        value,
        currency,
        items: [
          {
            id: String(order.event.event_id),
            name,
            category: order.ticket.category_name || 'tickets',
            price: Number(order.amount_paid) / quantity || undefined,
            quantity,
          },
        ],
      })
      try {
        localStorage.setItem(seenKey, '1')
      } catch {
        // ignore
      }
      clearLandingSiteNote()
    } catch {
      // reporting must never affect the payment page
    }
  }, [
    sessionId,
    landing,
    isCartCheckout,
    cartMatchday,
    matchdayOrder,
    cartTx,
    cartPaymentPaid,
    cartMatchdayPaymentPaid,
    matchdayPaymentPaid,
  ])

  // Landing-page buyers only: the guest cart they filled lives under a token
  // that only the landing address can see, so the cleanup above cannot reach
  // it. Empty that cart here using the token the landing page left in a
  // cookie, the same way (whole cart for a cart checkout, just the paid
  // tickets otherwise), once the booking is finished. The landing page's own
  // cart then refreshes from the server by itself.
  const landingCartTidied = useRef(false)
  useEffect(() => {
    const token = landing.cartToken
    if (!token || !sessionId || landingCartTidied.current) return

    const directFinished =
      !isKnownCart &&
      (matchdayOrder?.status === 'confirmed' ||
        matchdayOrder?.status === 'manual_review' ||
        matchdayOrder?.status === 'cancelled' ||
        matchdayOrder?.status === 'failed')
    const cartFinished = isKnownCart && (cartConfirmed || paidBookingFailed)
    if (!directFinished && !cartFinished) return

    landingCartTidied.current = true
    void (async () => {
      try {
        if (isKnownCart) {
          await clearCartForTokenApi(token)
        } else if (matchdayOrder) {
          const cart = await getCartForTokenApi(token)
          const matchItem = cart.data.items.find(
            (item) =>
              item.type === 'matchday' &&
              String(item.eventId) === String(matchdayOrder.event.event_id) &&
              String(item.listingId) ===
                String(matchdayOrder.ticket.listing_id),
          )
          if (matchItem) await removeCartItemForTokenApi(token, matchItem.id)
        }
        clearLandingReturn()
      } catch {
        // Leave the cookie so a refresh can retry. Nothing here may block the page.
        landingCartTidied.current = false
      }
    })()
  }, [landing, sessionId, isKnownCart, cartConfirmed, paidBookingFailed, matchdayOrder])

  useEffect(() => {
    const successful =
      matchdayConfirmed || cartConfirmed || (cartPaymentPaid && !cartTx?.status)

    if (!successful || tracked.current) return
    tracked.current = true

    const raw = sessionStorage.getItem('golafly_payment_data')
    if (!raw) return

    fetch('/api/hubspot/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
      .catch(() => undefined)
      .finally(() => sessionStorage.removeItem('golafly_payment_data'))
  }, [matchdayConfirmed, cartConfirmed, cartPaymentPaid, cartTx?.status])

  if (isVipPackage) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-muted-foreground'>
        Opening your VIP booking…
      </div>
    )
  }

  if (!sessionId) {
    return (
      <PaymentResult
        type='error'
        title='Payment session not found'
        message='We could not find the payment session needed to verify your booking. Please return to checkout or contact support if you were charged.'
      />
    )
  }

  // The details were accepted but the order still reads "awaiting attendees"
  // until the backend moves it on: say so, never show the form again.
  if (
    attendeesSubmitted &&
    (matchdayPaidWaiting || cartMatchdayPaymentPaid) &&
    attendeeOrder?.status === 'awaiting_attendees'
  ) {
    return (
      <PaymentResult
        type='success'
        title='Details received'
        message='Thank you, your ticket holder details have been received. We are now issuing your tickets and will email them to you.'
      >
        <div
          data-testid='attendees-received'
          className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'
        >
          <Loader2 className='size-4 animate-spin text-primary' />
          Issuing your tickets…
        </div>
      </PaymentResult>
    )
  }

  if (
    (matchdayPaidWaiting || cartMatchdayPaymentPaid) &&
    needsAttendees &&
    attendeeDraft
  ) {
    return (
      <PaymentResult
        type='success'
        title='Payment successful'
        message='Your payment has been received. Complete the ticket holder details below so we can issue your tickets.'
        form
      >
        {/* No extra frame on phones: every nested border and padding took
            width from the inputs (104 px wide on a 320 px screen). */}
        <div className='mt-6 text-left sm:rounded-2xl sm:border sm:border-border sm:bg-background/60 sm:p-6'>
          <TicketAttendeesForm
            fields={attendeeFields}
            attendees={attendeeDraft}
            errors={attendeeErrors}
            onChange={(index, fieldName, value) =>
              setAttendees((current) => {
                const source = current ?? attendeeDraft
                return source.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, [fieldName]: value } : item,
                )
              })
            }
          />
          <button
            type='button'
            disabled={submitDisabled}
            aria-busy={submitDisabled}
            onClick={handleAttendeesSubmit}
            className='mt-5 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[12px] font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-70'
          >
            {submitDisabled && <Loader2 className='size-4 animate-spin' />}
            {submitDisabled ? 'Sending your details…' : 'Submit ticket holder details'}
          </button>
          <p
            aria-live='polite'
            className='mt-2 min-h-5 text-center text-[12px] text-muted-foreground'
          >
            {submitDisabled
              ? submitSlow
                ? 'Still sending, this can take up to 30 seconds. Please keep this page open.'
                : 'Please wait and keep this page open.'
              : ''}
          </p>
        </div>
      </PaymentResult>
    )
  }

  if (
    (matchdayPaidWaiting || cartMatchdayPaymentPaid) &&
    attendeeOrder?.status === 'awaiting_attendees'
  ) {
    return (
      <PaymentResult
        type='success'
        title='Payment successful'
        message='Your payment has been received. We are waiting for the ticket holder fields required by the ticket supplier.'
      >
        <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
          <Loader2 className='size-4 animate-spin text-primary' />
          Waiting for the attendee form…
        </div>
      </PaymentResult>
    )
  }

  if (paidBookingFailed && cartTx) {
    const rows = bookingOutcomeRows(cartTx)
    return (
      <PaymentResult
        type='success'
        title='Payment received'
        message='Here is where each part of your booking stands.'
        actionText='Back to Home'
      >
        {/* Information, not an error: the customer has paid and our team is
            on it. Each message is the backend's own, shown as sent. */}
        <ul className='mt-6 space-y-2 text-left'>
          {rows.map((row, i) => (
            <li
              key={`${row.label}-${i}`}
              className={
                row.failed
                  ? 'rounded-xl border border-sky-500/30 bg-sky-500/10 p-4'
                  : 'rounded-xl border border-border bg-background/60 p-4'
              }
            >
              <div className='flex items-center justify-between gap-3'>
                <span className='text-[13px] font-bold text-foreground'>{row.label}</span>
                <span className='font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  {outcomeStatusLabel(row.status)}
                </span>
              </div>
              {row.message && (
                <p className='mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-foreground/80'>
                  <Info className='mt-0.5 size-3.5 shrink-0 text-sky-500' />
                  {row.message}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className='mt-4 text-[11px] text-muted-foreground'>
          Questions?{' '}
          <Link href='/support?topic=booking' className='font-semibold text-foreground underline underline-offset-2'>
            Contact support
          </Link>
        </p>
      </PaymentResult>
    )
  }

  if (
    matchdayOrder?.status === 'failed' ||
    matchdayOrder?.status === 'cancelled' ||
    cartTx?.status === 'failed' ||
    cartTx?.status === 'cancelled' ||
    cartTx?.status === 'expired'
  ) {
    return (
      <PaymentResult
        type={
          matchdayOrder?.status === 'cancelled' ||
          cartTx?.status === 'cancelled'
            ? 'cancelled'
            : 'error'
        }
        title='Payment not completed'
        message={
          matchdayOrder?.statusMessage ??
          cartQuery.data?.message ??
          'The payment or booking could not be completed.'
        }
        actionText='Try Again'
        actionHref='/'
      />
    )
  }

  if (
    matchdayConfirmed ||
    cartConfirmed ||
    (matchdayOrder?.status === 'manual_review' && matchdayPaymentPaid)
  ) {
    return (
      <PaymentResult
        type='success'
        title='Payment successful'
        message={
          matchdayOrder?.status === 'manual_review'
            ? 'Your payment went through. We are completing your booking and will email you when it is ready.'
            : 'Thank you. Your payment has been received and your booking is being completed. Confirmation details will be sent to your email.'
        }
      />
    )
  }

  if (matchdayPaidWaiting || cartPaymentPaid || cartMatchdayPaymentPaid) {
    // Still "being finished" after the wait: the booking is most likely with
    // Golafly support (booking resolution contract) — say so calmly.
    const finishing =
      timedOut && isFinishingBooking(cartTx?.status, cartTx?.payment_status)
    return (
      <PaymentResult
        type='success'
        title={finishing ? FINISHING_BOOKING_COPY.title : 'Payment successful'}
        message={
          finishing
            ? FINISHING_BOOKING_COPY.message
            : 'Your payment has been received. We are finalizing your booking. Please do not pay again.'
        }
      >
        <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
          {timedOut ? (
            <Clock3 className='size-4 text-primary' />
          ) : (
            <Loader2 className='size-4 animate-spin text-primary' />
          )}
          {timedOut
            ? 'This is taking longer than usual. We will continue finalizing your booking.'
            : 'Confirming your booking…'}
        </div>
      </PaymentResult>
    )
  }

  const loading =
    matchdayQuery.isLoading ||
    cartQuery.isLoading ||
    (!matchdayQuery.data && !cartTx)

  return (
    <PaymentResult
      type={loading ? 'success' : 'cancelled'}
      title={loading ? 'Confirming your payment…' : 'Payment status'}
      message={
        loading
          ? 'We are checking the payment status with the correct booking system. Please do not pay again.'
          : 'We have not received a final payment confirmation yet. Please check again in a moment.'
      }
    >
      <div className='mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
        <Loader2 className='size-4 animate-spin text-primary' />
        Checking payment status…
      </div>
      <button
        type='button'
        onClick={() => {
          void matchdayQuery.refetch()
          void cartQuery.refetch()
        }}
        className='mt-4 rounded-full border border-border px-5 py-2.5 font-mono text-[11px] font-bold text-foreground hover:border-primary/40 hover:text-primary'
      >
        Check again
      </button>
    </PaymentResult>
  )
}
