'use client'

// features/promo/use-match-promo.ts
import { useQuery } from '@tanstack/react-query'
import { getMatchPromo } from './api'
import type { MatchPromo } from './types'

export const MATCH_PROMO_QUERY_KEY = ['match-promo'] as const

/** The match promo, or null while loading or when the request fails.
 *  A promo problem never blocks a page: callers just show plain prices. */
export function useMatchPromo(): MatchPromo | null {
  const { data } = useQuery({
    queryKey: MATCH_PROMO_QUERY_KEY,
    queryFn: getMatchPromo,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })
  return data ?? null
}
