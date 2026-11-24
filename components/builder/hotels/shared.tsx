'use client'

// Pieces shared by the match builder's ETG and Duffel hotel steps
// (/builder/extras): the step names, small display helpers, and the one
// place a chosen room is put in the cart.

import type { ReactNode } from 'react'
import { ChevronLeft, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCart } from '@/features/cart/context'
import { addStayToCartApi, cartApiError, getCartApi } from '@/features/cart/api'
import { cartCurrencyConflict } from '@/features/cart/currency'
import type { CartApiStayPayload } from '@/features/cart/types'
import { builderStepHref } from '@/features/builder/enter'
import type { StayGuest } from '@/features/stays/types'
import { totalAdults, totalChildren } from '@/features/stays/utils'

/** Same sub-steps as the travels Stays flow, on one page. */
export const HOTEL_STEPS = ['Search', 'Results', 'Hotel', 'Done'] as const
export type HotelStep = 'search' | 'results' | 'hotel' | 'done'
export const HOTEL_STEP_NUMBER: Record<HotelStep, number> = {
  search: 1,
  results: 2,
  hotel: 3,
  done: 4,
}

/** Where the match puts the hotel by default (1 day either side of kickoff). */
export interface HotelDefaults {
  city: string
  checkin: string
  checkout: string
}

export const RESULTS_PER_PAGE = 10

export function nightsBetween(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 1
  const ms = new Date(checkout).getTime() - new Date(checkin).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

/** "12 Mar 2027" from an ISO date, without a timezone shift. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function guestsLabel(guests: StayGuest[]): string {
  const adults = totalAdults(guests)
  const children = totalChildren(guests)
  const parts = [`${adults} adult${adults === 1 ? '' : 's'}`]
  if (children) parts.push(`${children} child${children === 1 ? '' : 'ren'}`)
  parts.push(`${guests.length} room${guests.length === 1 ? '' : 's'}`)
  return parts.join(' · ')
}

export function Stars({ count, className }: { count: number | null | undefined; className?: string }) {
  const n = Math.max(0, Math.min(5, Math.round(count ?? 0)))
  if (!n) return null
  return (
    <span className={cn('flex items-center gap-0.5', className)} aria-label={`${n} star${n === 1 ? '' : 's'}`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} aria-hidden className='size-3 fill-amber-400 text-amber-400' />
      ))}
    </span>
  )
}

export function StepBackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
    >
      <ChevronLeft className='size-3.5' />
      {children}
    </button>
  )
}

/** A label + value tile, as in the travels hotel page summary. */
export function SummaryTile({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-background p-3', className)}>
      <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>{label}</p>
      <div className='mt-0.5 text-[12px] font-medium text-foreground'>{children}</div>
    </div>
  )
}

/** Fields stored on the local cart line, read back by the checkout page. */
export interface HotelCartLine {
  provider: 'etg' | 'duffel'
  name: string
  roomName: string
  image?: string | null
  checkin: string
  checkout: string
  occupancy: StayGuest[]
  price: number
  currency: string
  bookHash?: string
  quoteId?: string
  hotelId: string
  residency?: string
}

/**
 * Puts the chosen room in the cart the moment the guest confirms it, the
 * same way the flight and eSIM steps do. A hotel already in the cart is
 * replaced (removed on the server first, so no stale duplicate is left).
 * Returns false, with a toast, when the cart refused it.
 */
export function useAddHotelToCart(matchId: string | null) {
  const { addItem, removeTypeAndServer } = useCart()

  return async function addHotelToCart(
    payload: CartApiStayPayload,
    line: HotelCartLine,
  ): Promise<boolean> {
    try {
      await removeTypeAndServer('hotel')
      const cart = await getCartApi()
      const conflict = cartCurrencyConflict(cart.data, payload.currency)
      if (conflict) {
        toast.error(conflict)
        return false
      }
      const response = await addStayToCartApi(payload)
      const serverItem = response.data.items.find(
        (item) =>
          item.type === 'stays' &&
          (line.provider === 'duffel'
            ? item.quoteId === line.quoteId || String(item.hotelId) === line.hotelId
            : item.bookHash === line.bookHash || String(item.hotelId) === line.hotelId),
      )
      if (!serverItem) {
        toast.error('The hotel was not added to your cart. Please try again.')
        return false
      }
      const adults = totalAdults(line.occupancy)
      const children = totalChildren(line.occupancy)
      addItem(
        {
          key: `hotel:${line.provider}:${line.hotelId}`,
          type: 'hotel',
          name: line.name,
          detail: `${shortDate(line.checkin)} → ${shortDate(line.checkout)} · ${line.roomName}`,
          price: line.price,
          image: line.image ?? undefined,
          href: builderStepHref('/builder/extras', matchId),
          checkoutPayload: {
            serverId: serverItem.id,
            provider: line.provider,
            ...(line.bookHash ? { bookHash: line.bookHash } : {}),
            ...(line.quoteId ? { quoteId: line.quoteId } : {}),
            hotelId: line.hotelId,
            hotelName: line.name,
            roomName: line.roomName,
            checkin: line.checkin,
            checkout: line.checkout,
            adults,
            children,
            occupancy: line.occupancy,
            currency: line.currency,
            ...(line.residency ? { residency: line.residency } : {}),
            // ETG asks a gender per guest only for some hotels.
            ...(line.provider === 'etg' ? { genderRequired: payload.gender_required !== false } : {}),
          },
        },
        { silent: true },
      )
      return true
    } catch (err) {
      toast.error(cartApiError(err))
      return false
    }
  }
}
