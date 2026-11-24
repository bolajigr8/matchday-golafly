'use client'

// features/promo/use-flight-promo.ts
import { useQuery } from '@tanstack/react-query'
import type { FlightOffer } from '@/features/flights/types'
import { getFlightPromo } from './api'
import { flightOfferQuote, type FlightOfferQuote } from './flight-pricing'
import type { FlightPromo } from './types'

export const FLIGHT_PROMO_QUERY_KEY = ['flight-promo'] as const

/** The flight promo, or null while loading or when the request fails.
 *  A promo problem never blocks a page: callers just show plain prices. */
export function useFlightPromo(): FlightPromo | null {
  const { data } = useQuery({
    queryKey: FLIGHT_PROMO_QUERY_KEY,
    queryFn: getFlightPromo,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })
  return data ?? null
}

export function useFlightOfferQuote(
  offer: Pick<FlightOffer, 'total_amount' | 'total_currency' | 'price_breakdown' | 'slices'>,
): FlightOfferQuote {
  return flightOfferQuote(useFlightPromo(), offer)
}
