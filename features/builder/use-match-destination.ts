'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  buildTripDefaults,
  countryCodeFromName,
  resolveCityDestination,
  resolveMatchDestination,
  type MatchDestination,
  type MatchTripDefaults,
} from '@/lib/match-destinations'
import { getPlaceSuggestions } from '@/features/flights/api'
import { findNearestAirport } from '@/features/flights/nearest-airport'
import type { PlaceSuggestion } from '@/features/flights/types'
import type { BuilderMatch } from './match'

/* Destination for a match: the built-in city table first (instant), and for
   any city it does not know (Luxembourg, Faro, Gdansk, ...) the same places
   API the airport picker uses, filtered to the venue's country. The venue
   country also gives the eSIM country, so eSIM no longer depends on the
   city being in the table. */

function airportsOf(list: PlaceSuggestion[]): PlaceSuggestion[] {
  return list.flatMap((p) => (p.type === 'airport' ? [p] : (p.airports ?? [])))
}

async function lookupDestination(city: string, countryName: string): Promise<MatchDestination> {
  const countryCode = countryCodeFromName(countryName)
  const base: MatchDestination = { city, countryName, countryCode, airportCode: '' }
  const pick = (list: PlaceSuggestion[]) => {
    const airports = airportsOf(list).filter((a) => a.iata_code)
    const local = countryCode
      ? airports.filter((a) => a.iata_country_code?.toUpperCase() === countryCode)
      : airports
    return local[0] ?? null
  }
  try {
    const first = await getPlaceSuggestions(city)
    const data = first.data ?? []
    let hit = pick(data)
    if (!hit && countryCode) {
      // No airport named for the city: choose the nearest one in the country.
      const anchor = data.find((p) => p.latitude != null && p.longitude != null)
      if (anchor) {
        const near = await findNearestAirport(anchor.latitude!, anchor.longitude!, countryCode)
        if (near) return { ...base, airportCode: near.iata }
      }
      const second = await getPlaceSuggestions(`${city} airport`)
      hit = pick(second.data ?? [])
    }
    return hit?.iata_code ? { ...base, airportCode: hit.iata_code } : base
  } catch {
    return base
  }
}

export function useMatchDestination(match: BuilderMatch, dateForDefaults: string): {
  tripDefaults: MatchTripDefaults | null
  resolving: boolean
} {
  const sync = useMemo(
    () => (match.venueCity ? resolveCityDestination(match.venueCity) : resolveMatchDestination(match.venue)),
    [match.venueCity, match.venue],
  )
  const city = match.venueCity ?? ''
  const enabled = !sync && !!city
  const q = useQuery({
    queryKey: ['match-destination', city.toLowerCase(), match.venueCountry ?? ''],
    queryFn: () => lookupDestination(city, match.venueCountry ?? ''),
    enabled,
    staleTime: Infinity,
    retry: false,
  })

  const destination = sync ?? q.data ?? null
  const tripDefaults = useMemo(
    () => (destination ? buildTripDefaults(destination, dateForDefaults) : null),
    [destination, dateForDefaults],
  )
  return { tripDefaults, resolving: enabled && q.isLoading }
}
