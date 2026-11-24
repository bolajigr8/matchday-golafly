'use client'

import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getStayCountries } from './api'
import type { StayCountry } from './types'

/**
 * Citizenship of the main guest, sent as `residency` on the ETG hotel searches
 * (POST /stays/search-regions, /stays/search-hp) and on add-to-cart
 * (POST /cart/stays). See "Citizenship and room name API contract" v1.0.
 *
 * The rules this module serves:
 *  - the selector only offers codes from GET /stays/countries;
 *  - a default is fine only while it is VISIBLE and changeable before search;
 *  - the same value goes on search results, hotel page and cart for a booking;
 *  - changing it means searching again (never reuse the old prices).
 */

import { normalizeResidency } from './residency-core'

export { DEFAULT_RESIDENCY, normalizeResidency } from './residency-core'

const STORAGE_KEY = 'golafly:stays-countries:v1'

function readCached(): StayCountry[] | undefined {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as StayCountry[])
      : undefined
  } catch {
    return undefined
  }
}

function writeCached(list: StayCountry[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Storage blocked or full: the in-memory query cache still holds it.
  }
}

/**
 * The ~250 countries, in the backend's order. The list is static, so it is
 * fetched once per browser session: kept in sessionStorage across reloads
 * and never refetched while the tab lives.
 */
export function useStayCountries() {
  return useQuery<StayCountry[], AxiosError>({
    queryKey: ['stay-countries'],
    queryFn: async () => {
      const cached = typeof window !== 'undefined' ? readCached() : undefined
      if (cached) return cached
      const res = await getStayCountries()
      const list = (res.data ?? []).filter(
        (c): c is StayCountry =>
          !!c && typeof c.code === 'string' && typeof c.name === 'string',
      )
      if (list.length > 0) writeCached(list)
      return list
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

export function countryName(
  countries: readonly StayCountry[] | undefined,
  code: string | null | undefined,
): string | null {
  const c = normalizeResidency(code)
  if (!c) return null
  return countries?.find((x) => x.code === c)?.name ?? null
}

/**
 * A sensible visible pre-selection for a guest who has never picked: the
 * region of the browser's language ("en-NG" → "ng"), when the backend offers
 * it. Returns null when there is nothing better than the default.
 */
export function guessResidencyFromBrowser(
  countries: readonly StayCountry[],
): string | null {
  if (typeof navigator === 'undefined') return null
  const locales = [...(navigator.languages ?? []), navigator.language]
  for (const locale of locales) {
    const region = locale?.split('-')[1]
    if (!region || region.length !== 2) continue
    const code = region.toLowerCase()
    if (countries.some((c) => c.code === code)) return code
  }
  return null
}

/**
 * The message to place next to the selector when a search (422) or
 * add-to-cart rejected the citizenship: `errors.residency[0]`, as sent.
 */
export function residencyErrorOf(error: unknown): string | null {
  const data = (error as AxiosError<{ errors?: Record<string, unknown> }>)
    ?.response?.data
  const list = data?.errors?.residency
  if (Array.isArray(list) && typeof list[0] === 'string') return list[0]
  return null
}

/** Accent- and case-insensitive text for matching what the guest types. */
export function foldForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    .toLowerCase()
    .trim()
}
