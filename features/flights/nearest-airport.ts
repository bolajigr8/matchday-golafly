// features/flights/nearest-airport.ts
//
// Ported from the travels project (unmodified) for the "use my location"
// origin-airport feature. See lib/geo.ts and features/flights/geocode.ts
// for the two helpers this depends on, and app/api/airports/route.ts for
// the server-side proxy it calls.

import { haversineKm } from '@/lib/geo'
import type { PlaceSuggestion } from './types'

/**
 * One airport as our own /api/airports proxy returns it — a trimmed subset
 * of the api-ninjas record (the raw one carries a large `runways` array we
 * have no use for).
 */
export interface AirportRecord {
  iata: string
  icao: string | null
  name: string
  city: string | null
  region: string | null
  country: string
  countryName: string | null
  latitude: number
  longitude: number
}

export interface NearestAirport extends AirportRecord {
  distanceKm: number
}

/**
 * Nearest airport to a coordinate pair, chosen from the airports the
 * provider lists for that country.
 *
 * WHY BY COUNTRY: api-ninjas has no proximity search, and on the free tier
 * the `city`, `name` and `region` filters are premium-only — `country` and
 * `iata` are the only ones that answer. What `country` gives back is the
 * country's ten large, IATA-coded, scheduled-service airports, which is
 * exactly the candidate set "nearest airport" should be choosing from: a
 * private airstrip two kilometres away is never the right answer.
 *
 * The consequence to know about: for somewhere far from any of a large
 * country's ten majors, the nearest one can still be a long way off. The
 * distance comes back on the result so callers can decide what to do with
 * it rather than silently pretending it is local.
 */
export async function findNearestAirport(
  latitude: number,
  longitude: number,
  countryCode: string,
): Promise<NearestAirport | null> {
  try {
    const res = await fetch(
      `/api/airports?country=${encodeURIComponent(countryCode)}`,
    )
    if (!res.ok) return null

    const body: { airports?: AirportRecord[] } = await res.json()
    const airports = body.airports ?? []
    if (airports.length === 0) return null

    let best: NearestAirport | null = null
    for (const airport of airports) {
      const distanceKm = haversineKm(
        { latitude, longitude },
        { latitude: airport.latitude, longitude: airport.longitude },
      )
      if (!best || distanceKm < best.distanceKm) {
        best = { ...airport, distanceKm }
      }
    }
    return best
  } catch {
    // Network failure, offline, blocked — the caller falls back to its own
    // lookup rather than surfacing this.
    return null
  }
}

/**
 * Look one airport up by its IATA code.
 *
 * Used to put a human label on a field that only holds a code. `iata` is
 * the one filter besides `country` that answers on the free tier, and the
 * proxy caches for a day, so this is cheap to call on selection.
 */
export async function lookupAirportByIata(
  iata: string,
): Promise<AirportRecord | null> {
  if (!/^[A-Za-z]{3}$/.test(iata)) return null
  try {
    const res = await fetch(`/api/airports?iata=${encodeURIComponent(iata)}`)
    if (!res.ok) return null
    const body: { airports?: AirportRecord[] } = await res.json()
    return body.airports?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Adapt an airport record to the shape AirportInput's `select()` already
 * speaks, so the geolocation path commits a value through exactly the
 * same code as a manual pick.
 */
export function airportToSuggestion(airport: AirportRecord): PlaceSuggestion {
  return {
    // Namespaced so it can never collide with an id from our own places API.
    id: `ninjas-${airport.iata}`,
    name: airport.name,
    iata_code: airport.iata,
    iata_country_code: airport.country,
    latitude: airport.latitude,
    longitude: airport.longitude,
    type: 'airport',
  }
}
