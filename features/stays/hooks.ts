// features/stays/hooks.ts

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import {
  getStayRegions,
  searchStaysByRegion,
  searchStayByHotelId,
  prebookStay,
  submitBookingForm,
  checkoutStay,
  getBookingStatus,
  cancelBookingOrder,
} from './api'
import { isTerminalBookingStatus } from './status'
import type {
  StayApiResponse,
  StayRegion,
  StayHotelListItem,
  StayHotelDetail,
  PrebookResult,
  BookingFormPayload,
  BookingFormResult,
  BookingCheckoutResult,
  BookingStatusResult,
  CancelOrderResult,
  SearchRegionPayload,
  SearchHotelPayload,
  PrebookPayload,
} from './types'

interface ApiErr {
  message?: string
}

// ── Region autocomplete ─────────────────────────────────────────
export function useStayRegions(q: string) {
  return useQuery<StayApiResponse<StayRegion[]>, AxiosError<ApiErr>>({
    queryKey: ['stay-regions', q],
    queryFn: () => getStayRegions(q),
    enabled: q.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  })
}

// ── Search hotels by region ─────────────────────────────────────
export function useSearchStaysByRegion() {
  return useMutation<
    StayApiResponse<{ hotels: StayHotelListItem[] }>,
    AxiosError<ApiErr>,
    SearchRegionPayload
  >({
    mutationKey: ['stay-search-region'],
    mutationFn: searchStaysByRegion,
  })
}

// ── Hotel detail ────────────────────────────────────────────────
export function useSearchStayByHotelId() {
  return useMutation<
    StayApiResponse<StayHotelDetail>,
    AxiosError<ApiErr>,
    SearchHotelPayload
  >({
    mutationKey: ['stay-hotel-detail'],
    mutationFn: searchStayByHotelId,
  })
}

// ── Prebook ─────────────────────────────────────────────────────
/** `keepCurrency` is NOT sent in the body: it pins the X-Currency header of
 *  this one call (see `prebookStay`). */
export type PrebookVariables = PrebookPayload & { keepCurrency?: string }

export function usePrebookStay() {
  return useMutation<
    StayApiResponse<PrebookResult>,
    AxiosError<ApiErr>,
    PrebookVariables
  >({
    mutationKey: ['stay-prebook'],
    mutationFn: ({ keepCurrency, ...payload }) =>
      prebookStay(payload, keepCurrency),
  })
}

// ── Booking form ────────────────────────────────────────────────
export function useSubmitBookingForm() {
  return useMutation<
    StayApiResponse<BookingFormResult>,
    AxiosError<ApiErr>,
    BookingFormPayload
  >({
    mutationKey: ['stay-booking-form'],
    mutationFn: submitBookingForm,
  })
}

// ── Checkout ─────────────────────────────────────────────────────
export function useCheckoutStay() {
  return useMutation<
    StayApiResponse<BookingCheckoutResult>,
    AxiosError<ApiErr>,
    number
  >({
    mutationKey: ['stay-checkout'],
    mutationFn: checkoutStay,
  })
}

// ── Booking status ───────────────────────────────────────────────
// Polls every 4s until the status reaches a terminal state (confirmed,
// cancelled, or a payment-received-but-booking-failed style outcome).
export function useBookingStatus(booking_id: number | null) {
  return useQuery<StayApiResponse<BookingStatusResult>, AxiosError<ApiErr>>({
    queryKey: ['stay-booking-status', booking_id],
    queryFn: () => getBookingStatus(booking_id!),
    enabled: !!booking_id,
    refetchInterval: (query) => {
      const status = (
        query.state.data as StayApiResponse<BookingStatusResult> | undefined
      )?.data?.status
      return isTerminalBookingStatus(status) ? false : 4_000
    },
  })
}

// ── Cancel a booking order ────────────────────────────────────────
export function useCancelBookingOrder() {
  return useMutation<
    StayApiResponse<CancelOrderResult>,
    AxiosError<ApiErr>,
    { bookingId: number; reason: string }
  >({
    mutationKey: ['stay-cancel-order'],
    mutationFn: ({ bookingId, reason }) =>
      cancelBookingOrder(bookingId, reason),
  })
}

// ── Destination availability (for "Coming soon" badges) ─
const availabilityCache = new Map<string, boolean>()

export function useDestinationAvailability(
  cityNames: string[],
  /** Citizenship of the main guest: availability can depend on it. */
  residency: string,
) {
  const [status, setStatus] = useState<Record<string, boolean | undefined>>(
    () => {
      const initial: Record<string, boolean | undefined> = {}
      for (const c of cityNames) {
        initial[c] = availabilityCache.get(`${residency}|${c}`)
      }
      return initial
    },
  )

  useEffect(() => {
    let cancelled = false
    const today = new Date()
    const checkin = new Date(today.getTime() + 86400000)
      .toISOString()
      .slice(0, 10)
    const checkout = new Date(today.getTime() + 86400000 * 3)
      .toISOString()
      .slice(0, 10)

    async function checkCity(city: string) {
      if (availabilityCache.has(`${residency}|${city}`)) {
        if (!cancelled) {
          setStatus((s) => ({ ...s, [city]: availabilityCache.get(`${residency}|${city}`) }))
        }
        return
      }
      try {
        const regionsRes = await getStayRegions(city)
        const match = regionsRes.data?.[0]
        if (!match) {
          availabilityCache.set(`${residency}|${city}`, false)
          if (!cancelled) setStatus((s) => ({ ...s, [city]: false }))
          return
        }
        const searchRes = await searchStaysByRegion({
          checkin,
          checkout,
          residency,
          language: 'en',
          guests: [{ adults: 2, children: [] }],
          region_id: match.region_id,
          currency: 'EUR',
          filter: { star_rating: [1, 2, 3, 4, 5] },
        })
        const hasInventory = (searchRes.data?.hotels?.length ?? 0) > 0
        availabilityCache.set(`${residency}|${city}`, hasInventory)
        if (!cancelled) setStatus((s) => ({ ...s, [city]: hasInventory }))
      } catch {
        availabilityCache.set(`${residency}|${city}`, false)
        if (!cancelled) setStatus((s) => ({ ...s, [city]: false }))
      }
    }

    cityNames.forEach((c) => {
      if (!availabilityCache.has(`${residency}|${c}`)) checkCity(c)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityNames.join('|'), residency])

  return status
}
