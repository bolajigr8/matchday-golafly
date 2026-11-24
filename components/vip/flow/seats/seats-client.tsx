'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VipButton } from '@/components/vip/flow/button'
import { VipSelect, type VipSelectOption } from '@/components/vip/flow/select'
import { VipError, VipLoading, VipNote, VipNotice } from '@/components/vip/flow/state'
import { VipStepper } from '@/components/vip/flow/stepper'
import { clearCartApi } from '@/features/cart/api'
import { useCart } from '@/features/cart/context'
import { vipApi } from '@/features/vip/api'
import { toVipError } from '@/features/vip/errors'
import { vipEventView } from '@/features/vip/clubs'
import type { VipListing, VipPackage } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import { useVipEvent, useVipListings } from '@/features/vip/hooks'
import { isVipMock } from '@/features/vip/mode'
import { useVipPlan } from '@/features/vip/plan'
import { getVipPrefs } from '@/features/vip/prefs'
import { vipFlowHref } from '@/features/vip/routes'
import { clearVipSession, setVipSession } from '@/features/vip/session'
import { useVipAction, useVipPackage } from '@/features/vip/use-package'
import { listingQuantities, VipListingCard } from './listing-card'
import { VipMatchBanner } from './match-banner'
import { VipStadiumMap } from './stadium-map'

/* VIP Flow · 2 · Seats (Figma 506:3508). Step 1 of the builder: the VIP
   tickets of the match (GET …/events/{id}/listings). "Buy" creates the
   package (POST /hospitality/packages) or, when one exists, changes its
   ticket (PUT …/ticket), then moves on to Extras. */

type Sort = 'price-asc' | 'price-desc'

const SORT_OPTIONS: VipSelectOption<Sort>[] = [
  { value: 'price-asc', label: 'Lowest price' },
  { value: 'price-desc', label: 'Highest price' },
]

const BASKET_BUSY = 'basket already has items'

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function VipSeatsClient({ club, eventId }: { club: string; eventId: number }) {
  const router = useRouter()
  const { event, loading: eventLoading, missing, error: eventError } = useVipEvent(club, eventId)
  const listingsQ = useVipListings(club, eventId)
  const { pkg, otherSession, setPackage, ready } = useVipPackage(club, eventId)
  const { busy, error, setError, run } = useVipAction()
  const { clear: clearLocalCart } = useCart()

  /* ?category= comes from the landing page's "Book my VIP experience". */
  const searchParams = useSearchParams()
  const [category, setCategory] = useState<string>(() => searchParams.get('category') || 'all')
  const [sort, setSort] = useState<Sort>('price-asc')
  /* The real seating plan: mini maps on the cards, hover lights the big map. */
  const { plan, thumbFor, loading: planLoading } = useVipPlan(event?.svg_url)
  const [focusId, setFocusId] = useState<number | null>(null)
  /* Quantity shown on each card (defaults to the package's, else the first allowed). */
  const [cardQty, setCardQty] = useState<Record<number, number>>({})
  /* "Changing your ticket removes …" confirmation, for this listing + qty. */
  const [confirmChange, setConfirmChange] = useState<{ listing: VipListing; qty: number } | null>(null)

  const listings = useMemo(() => listingsQ.data?.data ?? [], [listingsQ.data])
  const ticketItem = pkg?.items.find((i) => i.type === 'matchday')
  const selectedListingId = ticketItem?.listingId ? Number(ticketItem.listingId) : null

  const categories = useMemo(
    () => [...new Set(listings.map((l) => l.category.category_name))].sort(),
    [listings],
  )
  const shown = useMemo(
    () =>
      listings
        .filter((l) => category === 'all' || l.category.category_name === category)
        .sort((a, b) => {
          const d = a.price_details.price_per_ticket - b.price_details.price_per_ticket
          return Number(b.listing_id === selectedListingId) - Number(a.listing_id === selectedListingId) || (sort === 'price-asc' ? d : -d)
        }),
    [listings, category, sort, selectedListingId],
  )

  const qtyFor = (l: VipListing) => {
    const options = listingQuantities(l)
    const wanted =
      cardQty[l.listing_id] ??
      (l.listing_id === selectedListingId ? ticketItem?.quantity : undefined) ??
      /* the landing page's GUESTS, when this ticket can be sold in that number */
      (options.includes(getVipPrefs().guests) ? getVipPrefs().guests : undefined) ??
      options[0] ??
      1
    return options.includes(wanted) ? wanted : (options[0] ?? 1)
  }

  const goToExtras = () => router.push(vipFlowHref(club, eventId, 'extras'))

  const remember = (p: VipPackage, quantity: number) => {
    setVipSession({
      packageId: p.id,
      club,
      eventId,
      quantity,
      /* Started as a guest: keep sending the guest cart token even after a
         login (contract §9). */
      guestStarted: !Cookies.get('matchday:token'),
      stripeSessionId: null,
    })
    setPackage(p)
  }

  const create = async (l: VipListing, qty: number) => {
    const p = await run(`buy-${l.listing_id}`, () =>
      vipApi.createPackage({ club, event_id: eventId, listing_id: l.listing_id, quantity: qty }, newKey()),
    )
    if (p) {
      remember(p, qty)
      goToExtras()
    }
  }

  const change = async (l: VipListing, qty: number) => {
    if (!pkg) return
    setConfirmChange(null)
    const p = await run(`buy-${l.listing_id}`, () =>
      vipApi.changeTicket(pkg.id, { event_id: eventId, listing_id: l.listing_id, quantity: qty }),
    )
    if (p) {
      remember(p, qty)
      goToExtras()
    }
  }

  /* Another package is in progress: Buy stays clickable and brings the
     customer to the choice (continue it, or remove it and start here). */
  const [flashOther, setFlashOther] = useState(0)
  const showOtherChoice = () => {
    document.getElementById('vip-other-package')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlashOther((n) => n + 1)
  }

  const buy = (l: VipListing, qty: number) => {
    setError(null)
    if (otherSession) return showOtherChoice()
    if (pkg) {
      const same = selectedListingId === l.listing_id && ticketItem?.quantity === qty
      if (same) return goToExtras()
      /* The flight, hotel and eSIM follow the ticket's dates and headcount,
         so changing it removes them: warn first (contract §2.2). */
      const hasMore = pkg.items.some((i) => i.type !== 'matchday')
      if (hasMore) return setConfirmChange({ listing: l, qty })
      return void change(l, qty)
    }
    void create(l, qty)
  }

  /* One package per basket: remove the other match's package first. */
  const startOver = async () => {
    if (!otherSession) return
    const done = await run('start-over', async () => {
      try {
        await vipApi.deletePackage(otherSession.packageId)
      } catch (err) {
        /* Already gone: nothing left to remove. */
        if (toVipError(err).status !== 404) throw err
      }
      return true
    })
    if (done) clearVipSession()
  }

  /* The basket holds other things: empty it (with the customer's OK). */
  const clearBasket = async () => {
    const done = await run('clear-basket', async () => {
      await clearCartApi()
      return true
    })
    if (done) clearLocalCart()
  }

  if (eventLoading || !ready) {
    return (
      <div className='page-container py-10'>
        <VipLoading />
      </div>
    )
  }
  if (missing || eventError || !event) {
    return (
      <div className='page-container py-16'>
        <VipNotice
          title='This match isn’t available as a VIP package'
          message={eventError && eventError.status !== 404 ? eventError.message : 'Pick another match.'}
          action={{ href: '/vip#pick-your-match', label: 'See VIP matches' }}
        />
      </div>
    )
  }

  const match = vipEventView(event)
  const prices = shown.map((l) => l.price_details.price_per_ticket)
  const currency = listingsQ.data?.meta.currency ?? match.priceFrom?.currency ?? 'EUR'
  const basketBusy = !!error && error.message.toLowerCase().includes(BASKET_BUSY)
  const categoryOptions: VipSelectOption<string>[] = [
    { value: 'all', label: 'All hospitality' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className='page-container flex flex-col gap-6 pb-20 pt-8 sm:pt-9 lg:pb-24'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
        <Link
          href={vipFlowHref(club, eventId)}
          className='flex w-fit items-center gap-[7px] font-mono text-[12px] leading-[normal] text-vip-chalk transition-colors hover:text-vip-gold-text'
        >
          <ArrowLeft aria-hidden className='size-3' strokeWidth={2} />
          Back to match
        </Link>
        <VipStepper club={club} eventId={eventId} current='seats' />
      </div>

      <VipMatchBanner match={match} />

      {otherSession && (
        <div
          id='vip-other-package'
          key={flashOther}
          className={cn('scroll-mt-28 rounded-[14px]', flashOther > 0 && 'animate-[vip-attention_1.6s_ease-out_1]')}
        >
        <VipNote className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <span>You already have a VIP package in progress for another match. One package can be built at a time.</span>
          <span className='flex shrink-0 flex-wrap gap-2'>
            <VipButton size='s' variant='ghost' onClick={() => router.push(vipFlowHref(otherSession.club, otherSession.eventId, 'extras'))}>
              Continue that one
            </VipButton>
            <VipButton size='s' onClick={startOver} disabled={busy === 'start-over'}>
              {busy === 'start-over' ? 'Removing…' : 'Remove it and start here'}
            </VipButton>
          </span>
        </VipNote>
        </div>
      )}

      {/* Filter bar (506:3595) */}
      <div className='flex flex-col gap-3 rounded-[18px] border border-vip-line/8 bg-vip-tint/3 px-[18px] py-4 md:flex-row md:items-center md:justify-between md:gap-4'>
        <div className='flex flex-wrap items-center gap-3.5'>
          {categories.length > 1 && (
            <VipSelect label='Hospitality' value={category} options={categoryOptions} onChange={setCategory} />
          )}
        </div>
        <VipSelect label='Sort' value={sort} options={SORT_OPTIONS} onChange={setSort} align='end' />
      </div>

      {error && (
        <div className='flex flex-col items-start gap-3'>
          <VipError>{error.message}</VipError>
          {basketBusy && !isVipMock && (
            <VipButton size='s' variant='ghost' onClick={clearBasket} disabled={busy === 'clear-basket'}>
              {busy === 'clear-basket' ? 'Clearing…' : 'Empty my basket, then choose again'}
            </VipButton>
          )}
        </div>
      )}

      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <div className='flex w-full flex-col gap-3.5 lg:w-[600px] lg:shrink-0'>
          <div className='flex items-center justify-between gap-3'>
            <p className='flex items-center gap-2.5 text-[14px] leading-[normal]' aria-live='polite'>
              <span className='font-semibold text-vip-chalk'>
                {shown.length} hospitality option{shown.length === 1 ? '' : 's'}
              </span>
              {prices.length > 0 && (
                <span className='text-vip-mist'>From {formatVipPrice(Math.min(...prices), currency)}</span>
              )}
            </p>
            <button
              type='button'
              onClick={() => void listingsQ.refetch()}
              disabled={listingsQ.isFetching}
              className='flex items-center gap-1.5 text-[13px] font-semibold leading-[normal] text-vip-gold-text transition-opacity hover:opacity-80 disabled:opacity-60'
            >
              <RotateCw aria-hidden className={listingsQ.isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} strokeWidth={2.25} />
              Refresh
            </button>
          </div>

          {listingsQ.isLoading && <VipLoading className='h-[224px]' />}
          {listingsQ.error ? <VipError>{(listingsQ.error as Error).message}</VipError> : null}

          {shown.map((l) => {
            const qty = qtyFor(l)
            return (
              <div key={l.listing_id} className='flex flex-col gap-2'>
                <VipListingCard
                  listing={l}
                  qty={qty}
                  selected={l.listing_id === selectedListingId}
                  onQty={(n) => setCardQty((m) => ({ ...m, [l.listing_id]: n }))}
                  onBuy={() => buy(l, qty)}
                  busy={busy === `buy-${l.listing_id}`}
                  disabled={!!busy}
                  thumb={thumbFor(l)}
                  onFocusChange={(on) => setFocusId((cur) => (on ? l.listing_id : cur === l.listing_id ? null : cur))}
                />
                {confirmChange?.listing.listing_id === l.listing_id && (
                  <VipNote className='flex flex-col items-start gap-3'>
                    <span>
                      Changing your ticket removes the flight, hotel and eSIM in your package, because they follow your
                      ticket&apos;s dates and number of travellers. You&apos;ll choose them again next.
                    </span>
                    <span className='flex flex-wrap gap-2'>
                      <VipButton size='s' onClick={() => void change(confirmChange.listing, confirmChange.qty)}>
                        Change my ticket
                      </VipButton>
                      <VipButton size='s' variant='ghost' onClick={() => setConfirmChange(null)}>
                        Keep my current ticket
                      </VipButton>
                    </span>
                  </VipNote>
                )}
              </div>
            )
          })}

          {listingsQ.isSuccess && listings.length === 0 && (
            <VipNotice
              title='No VIP tickets left for this match'
              message='Pick another match, or check back later.'
              action={{ href: '/vip#pick-your-match', label: 'See VIP matches' }}
            />
          )}
        </div>

        {/* Stadium map (Figma 506:3745), on the real seating plan. */}
        <VipStadiumMap
          /* Phones: the map comes first, so people see where the seats are. */
          className='order-first min-w-0 flex-1 lg:order-none lg:sticky lg:top-[100px]'
          event={event}
          listings={listings}
          selected={listings.find((l) => l.listing_id === selectedListingId)}
          focus={listings.find((l) => l.listing_id === focusId) ?? null}
          plan={plan}
          planLoading={planLoading}
          activeCategory={category}
          onPickCategory={(c) => setCategory((cur) => (cur === c ? 'all' : c))}
        />
      </div>

      {/* Good to know (506:3811) */}
      <section className='mt-6 flex flex-col gap-3.5 rounded-[18px] border border-vip-line/8 bg-vip-tint/3 p-6'>
        <h2 className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>Good to know before you book</h2>
        <ul className='flex flex-col gap-3.5'>
          {[
            'Your match tickets are booked first. Your flight, hotel and eSIM are booked as soon as they are secured.',
            'Flights are Business or First Class on every leg, and land at least 4 hours before kick-off.',
            `Kick-off times are local time in ${match.city}.`,
            'One basket holds one VIP package, paid in one payment.',
          ].map((t) => (
            <li key={t} className='flex gap-2.5 text-[14px] leading-[normal] text-vip-mist'>
              <span aria-hidden className='text-[12px] text-vip-gold-strong'>
                ✦
              </span>
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
