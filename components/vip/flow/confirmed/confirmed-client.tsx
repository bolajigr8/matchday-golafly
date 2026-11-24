'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { setCartToken } from '@/lib/cart-token'
import { VipButton, VipButtonLink } from '@/components/vip/flow/button'
import { VipError, VipLoading, VipNote, VipNotice } from '@/components/vip/flow/state'
import { VipStepper } from '@/components/vip/flow/stepper'
import { showVipToast } from '@/components/vip/vip-toast'
import { vipApi } from '@/features/vip/api'
import { isBuildingView, type VipLedgerTransaction, type VipPaidPackage } from '@/features/vip/contract'
import { toVipError, type VipApiError } from '@/features/vip/errors'
import { formatVipMediumDate, formatVipShortDate, formatVipTime, kickoffInstant } from '@/features/vip/format'
import { useVipReceipt } from '@/features/vip/receipt'
import { clearVipSession, getVipSession } from '@/features/vip/session'
import { isFinalPackageStatus, ITEM_NAMES, itemWord, PACKAGE_WORDS, TICKET_WORDS } from '@/features/vip/status'
import { VipBookingDetails, type VipDetailLine } from './booking-details'
import { downloadVipCalendar, VipPass } from './vip-pass'

/* VIP Flow · 5 · Confirmed (Figma 506:4397). Reached from /payment-success
   with Stripe's session id. Two calls, in this order (contract §6):
     1. GET /ledgers/transactions/{sessionId} — settles the payment and
        names the package (hospitality_package_id);
     2. GET /hospitality/packages/{id}?session_id=… — the package words.
   Both are polled every 20 seconds until the package is completed or
   refunded. Only the backend's words are shown (§7): no invented
   "delayed" or "failed" state. Figma layout: heading, the gold pass,
   three "what next" cards, View my booking (the Booking details overlay,
   which carries the live statuses) and Back to VIP matches. */

const POLL_MS = 20_000

/* Figma's three cards, worded to what the backend does (contract §1, §6). */
const NEXT = [
  { when: 'NOW', title: 'Payment confirmed', body: 'Your payment email is on its way, with your booking reference.' },
  {
    when: 'FIRST',
    title: 'Match tickets secured',
    body: 'We secure your match tickets before anything else. If anything needs our attention, we email you within 2 hours.',
  },
]

/* The third card names only what this package holds (a flexible package
   may have no flight, no hotel, or only the ticket). */
const THEN_NAMES: Record<string, string> = { flight: 'Flight', hotel: 'hotel', esim: 'eSIM' }

function thenCard(types: string[]): (typeof NEXT)[number] | null {
  const names = ['flight', 'hotel', 'esim'].filter((t) => types.includes(t)).map((t) => THEN_NAMES[t])
  if (!names.length) return null
  const title = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return {
    when: 'THEN',
    title: title.charAt(0).toUpperCase() + title.slice(1),
    body:
      names.length === 1
        ? 'Booked once your tickets are secured, and confirmed by email.'
        : 'Booked once your tickets are secured, each confirmed by email.',
  }
}

/** "VIP-3N7M2ZK4" from the package's ULID. */
function shortRef(id: string) {
  return `VIP-${id.slice(-8).toUpperCase()}`
}

export function VipConfirmedClient({ sessionId }: { sessionId: string | null }) {
  const receipt = useVipReceipt(sessionId)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const qc = useQueryClient()

  const tx = useQuery<VipLedgerTransaction, VipApiError>({
    queryKey: ['vip', 'tx', sessionId],
    queryFn: () => vipApi.getTransaction(sessionId!),
    enabled: !!sessionId,
    retry: (n, err) => n < 2 && err.status !== 404,
    /* Polled with the package; both stop once it is settled. */
    refetchInterval: (): number | false =>
      qc
        .getQueriesData<VipPaidPackage>({ queryKey: ['vip', 'paid'] })
        .some(([key, data]) => key[3] === sessionId && isFinalPackageStatus(data?.status))
        ? false
        : POLL_MS,
  })

  /* The id comes from the ledger; the saved session or receipt is only a
     fallback (contract §6). */
  const saved = typeof window !== 'undefined' ? getVipSession() : null
  const packageId: string | null =
    tx.data?.hospitality_package_id ??
    (saved?.stripeSessionId === sessionId ? saved?.packageId : undefined) ??
    receipt?.packageId ??
    null

  const view = useQuery<VipPaidPackage, VipApiError>({
    queryKey: ['vip', 'paid', packageId, sessionId],
    queryFn: async () => {
      const read = async () => {
        const v = await vipApi.getPackage(packageId!, sessionId)
        if (isBuildingView(v)) throw new Error('not-paid-yet')
        return v
      }
      try {
        return await read()
      } catch (err) {
        /* Straight after Stripe the package can still read as unpaid (404
           or the building view): settle the ledger once more, then retry. */
        const e = toVipError(err)
        if (e.status !== 404 && e.message !== 'not-paid-yet') throw e
        await vipApi.getTransaction(sessionId!)
        try {
          return await read()
        } catch (err2) {
          throw toVipError(err2)
        }
      }
    },
    enabled: !!packageId && !!sessionId && tx.isFetched,
    retry: (n, err) => n < 3 && err.message === 'not-paid-yet',
    retryDelay: 4_000,
    refetchInterval: (q) => (isFinalPackageStatus(q.state.data?.status) ? false : POLL_MS),
  })

  const pkg = view.data ?? null
  const final = isFinalPackageStatus(pkg?.status)

  /* Paid: this browser is done building it. A guest's cart now holds a
     paid package, so the next purchase starts a fresh cart. */
  useEffect(() => {
    if (!pkg) return
    const s = getVipSession()
    if (s && s.packageId === pkg.id) {
      if (s.guestStarted) setCartToken(null)
      clearVipSession()
    }
  }, [pkg])

  if (!sessionId) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='No booking to show'
          message='This page opens after payment, from the link Stripe sends you back with.'
          action={{ href: '/vip', label: 'See VIP matches' }}
        />
      </div>
    )
  }
  if ((tx.isLoading || (view.isLoading && !!packageId)) && !pkg) {
    return (
      <div className='page-container py-10'>
        <VipLoading className='mx-auto h-[700px] max-w-[520px] rounded-[28px]' />
      </div>
    )
  }
  if (!pkg) {
    const err = view.error ?? (tx.error ? toVipError(tx.error) : null)
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='We couldn’t find this booking'
          message={
            err?.status === 404 || !err
              ? 'If you have just paid, wait a moment and refresh this page. Your confirmation email has your booking details.'
              : err.message
          }
          action={{ href: '/vip', label: 'Back to VIP matches' }}
        />
      </div>
    )
  }

  const words = PACKAGE_WORDS[pkg.status]
  const ticketWords = pkg.ticket ? TICKET_WORDS[pkg.ticket.status] : null
  const attendees = (tx.data?.matchday_orders ?? []).filter((o) => o.attendees_required?.length > 0)
  const needsAttendees = pkg.ticket?.status === 'action_required' || attendees.length > 0
  const reference = shortRef(pkg.id)
  const hasFlight = pkg.items.some((i) => i.type === 'flight')
  const then = thenCard(pkg.items.map((i) => i.type))
  const nextCards = then ? [...NEXT, then] : NEXT
  const [home, away] = receipt ? [receipt.home, receipt.away] : pkg.event_name.split(/\s+vs\.?\s+/i)

  /* Booking details lines: the backend's status words; the details are what
     the customer chose, saved at checkout (when this browser has them). */
  const detailOf = (type: string) =>
    type === 'flight'
      ? receipt && receipt.from && receipt.to
        ? `${receipt.from} – ${receipt.to}${receipt.cabin ? ` · ${receipt.cabin}` : ''}`
        : null
      : type === 'hotel'
        ? (receipt?.hotel ?? null)
        : type === 'esim'
          ? 'Spain data plan'
          : null
  const detailLines: VipDetailLine[] = [
    ...(ticketWords
      ? [{ name: 'Match tickets', detail: receipt?.ticket ?? null, status: ticketWords }]
      : []),
    ...pkg.items.map((item) => ({
      name: ITEM_NAMES[item.type],
      detail: detailOf(item.type),
      status: itemWord(item),
      note: item.status_message,
    })),
  ]

  return (
    <div className='page-container flex flex-col items-center gap-6 pb-20 pt-8 sm:pt-9 lg:pb-24'>
      <VipStepper current='confirmed' />

      <div className='flex flex-col items-center gap-3 pt-6 text-center'>
        <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[1.68px] text-vip-gold-text'>
          STEP 4 OF 4 · {words.title.toUpperCase()}
        </p>
        <h1 className='font-heading text-[36px] font-bold leading-[1.15] text-vip-chalk sm:text-[52px]'>
          {pkg.status === 'refunded' ? 'Your payment has been returned.' : `You’re going to ${pkg.event_name}.`}
        </h1>
        <p className='max-w-[640px] text-[16px] leading-[1.5] text-vip-mist sm:text-[17px]'>
          {tx.data?.status_message || words.body} Booking {reference}.
        </p>
      </div>

      {pkg.status !== 'refunded' && (
        <VipPass
          pass={{
            reference,
            from: hasFlight ? (receipt?.from ?? '···') : '—',
            to: hasFlight ? (receipt?.to ?? '···') : '—',
            guest: receipt?.leadGuest || 'Lead guest',
            guests: receipt?.travellers ?? pkg.quantity,
            match: home && away ? `${home} vs ${away}` : pkg.event_name,
            date: `${formatVipShortDate(pkg.event_date)} · ${formatVipTime(pkg.event_date)}`,
            hospitality: receipt?.ticket ?? 'VIP hospitality',
            cabin: hasFlight ? (receipt?.cabin ?? '—') : '—',
          }}
          onAddToCalendar={() => {
            downloadVipCalendar({
              reference,
              title: pkg.event_name,
              kickoff: kickoffInstant(pkg.event_date, pkg.event_timezone || undefined).toISOString(),
              location: receipt ? `${receipt.venue}, ${receipt.city}` : pkg.event_name,
            })
            showVipToast('calendar')
          }}
        />
      )}

      {needsAttendees && (
        <VipNote className='flex w-full max-w-[760px] flex-col items-start gap-3'>
          <span>Your match tickets need the name of every attendee. Add them now so your tickets can be confirmed.</span>
          <VipButtonLink href={`/payment-success?session_id=${encodeURIComponent(sessionId)}&checkout=cart&vip_attendees=1`} size='s' arrow>
            Add attendee details
          </VipButtonLink>
        </VipNote>
      )}

      {/* Figma's three "what happens next" cards (506:4397), worded to what
          the backend really does. Figma's "Within 2 hours · Meet your
          concierge" and "Next 7 days · Visa, sorted" are not sold. */}
      <ul
        className={
          nextCards.length === 2 ? 'grid w-full max-w-[780px] gap-4 md:grid-cols-2' : 'grid w-full max-w-[1180px] gap-4 md:grid-cols-3'
        }
      >
        {nextCards.map((n) => (
          <li key={n.title} className='flex flex-col gap-2.5 rounded-[18px] border border-vip-line/8 bg-vip-tint/3 p-6'>
            <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.32px] text-vip-gold-text'>{n.when}</span>
            <span className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>{n.title}</span>
            <span className='text-[14px] leading-[normal] text-vip-mist'>{n.body}</span>
          </li>
        ))}
      </ul>

      {view.error && <VipError>{view.error.message}</VipError>}

      <div className='flex flex-wrap justify-center gap-3'>
        <VipButton onClick={() => setDetailsOpen(true)}>View my booking</VipButton>
        <VipButtonLink href='/vip' variant='ghost'>
          Back to VIP matches
        </VipButtonLink>
      </div>

      <VipBookingDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        reference={reference}
        title={home && away ? `${home} vs ${away}` : pkg.event_name}
        subtitle={`${formatVipMediumDate(pkg.event_date)} · ${formatVipTime(pkg.event_date)}${receipt ? ` · ${receipt.venue}` : ''} · ${pkg.quantity} guest${pkg.quantity === 1 ? '' : 's'}`}
        lines={detailLines}
        paid={receipt?.total ?? null}
        live={!final}
      />
    </div>
  )
}
