import { NextResponse, type NextRequest } from 'next/server'
import type { AirportRecord } from '@/features/flights/nearest-airport'

const API_URL = 'https://api.api-ninjas.com/v1/airports'

/**
 * Only these two reach the provider.
 *
 * Not just a passthrough guard: on the free tier `name`, `city` and `region`
 * come back as {"error": "... only available for premium users."}, so
 * forwarding them would turn a typo into a confusing empty result. Anything
 * else is dropped.
 */
const ALLOWED_PARAMS = ['iata', 'country'] as const

/** A day. The set of large airports in a country does not move. */
const CACHE_SECONDS = 86400

interface PlaceSuggestionLike {
  type?: string
  iata_code?: string | null
  name?: string | null
  iata_country_code?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
}

interface NinjaAirport {
  iata?: string | null
  icao?: string | null
  name?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  country_name?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  scheduled_service?: boolean
  is_closed?: boolean
}

function toAirportRecord(a: NinjaAirport): AirportRecord | null {
  const latitude = Number(a.latitude)
  const longitude = Number(a.longitude)

  // An airport with no IATA code cannot be put in a search field, and one
  // that is closed or has no scheduled service is never a useful answer.
  if (!a.iata || a.is_closed || a.scheduled_service === false) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    iata: a.iata,
    icao: a.icao ?? null,
    name: a.name ?? a.iata,
    city: a.city ?? null,
    region: a.region ?? null,
    country: a.country ?? '',
    countryName: a.country_name ?? null,
    latitude,
    longitude,
  }
}

/**
 * Server-side proxy for the api-ninjas Airports API.
 *
 * Ported from the travels project (unmodified). Exists so
 * `AIRPORTS_API_NINJAS_KEY` stays on the server — calling the provider
 * straight from the component would put the key in the client bundle.
 * That's also why the env var deliberately has no NEXT_PUBLIC_ prefix.
 *
 * If AIRPORTS_API_NINJAS_KEY is never set, this degrades gracefully to
 * matchday's own /api/v1/flights/places/suggestions endpoint for IATA
 * lookups (already used by AirportInput's autocomplete) rather than 500ing
 * — api-ninjas is an optional enrichment, not a hard dependency.
 */
export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams
  const key = process.env.AIRPORTS_API_NINJAS_KEY
  if (!key) {
    const iata = incoming.get('iata')?.trim().toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')

    if (iata && baseUrl) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const headers: HeadersInit = { Accept: 'application/json' }
        const token = process.env.NEXT_PUBLIC_API_TOKEN
        if (token) headers.Authorization = `Bearer ${token}`

        const places = await fetch(
          `${baseUrl}/api/v1/flights/places/suggestions?query=${encodeURIComponent(iata)}`,
          { headers, signal: controller.signal, cache: 'no-store' },
        )
        clearTimeout(timeout)

        if (places.ok) {
          const body: unknown = await places.json()
          const suggestions =
            body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)
              ? (body.data as PlaceSuggestionLike[])
              : []
          const airports = suggestions
            .filter((a) => a.type === 'airport' && a.iata_code?.toUpperCase() === iata)
            .map((a) => ({
              iata,
              icao: null,
              name: a.name ?? iata,
              city: null,
              region: null,
              country: a.iata_country_code ?? '',
              countryName: null,
              latitude: Number(a.latitude),
              longitude: Number(a.longitude),
            }))
            .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))

          return NextResponse.json(
            { airports, degraded: true },
            { status: 200, headers: { 'Cache-Control': 'no-store' } },
          )
        }
      } catch {
        // Fall through to an empty, successful degraded response below.
      }
    }

    return NextResponse.json(
      { airports: [], degraded: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const params = new URLSearchParams()
  for (const name of ALLOWED_PARAMS) {
    const value = incoming.get(name)
    if (value) params.set(name, value)
  }

  if ([...params.keys()].length === 0) {
    return NextResponse.json(
      { error: 'Provide an iata or country query parameter', airports: [] },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: { 'X-Api-Key': key },
      next: { revalidate: CACHE_SECONDS },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Airports lookup failed (${res.status})`, airports: [] },
        { status: 502 },
      )
    }

    const data: unknown = await res.json()

    // The provider answers errors with a 200 and an {"error": "..."} object
    // rather than a status code, so a non-array body is the failure signal.
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Airports lookup returned no list', airports: [] },
        { status: 502 },
      )
    }

    const airports = (data as NinjaAirport[])
      .map(toAirportRecord)
      .filter((a): a is AirportRecord => a !== null)

    return NextResponse.json({ airports })
  } catch {
    return NextResponse.json(
      { error: 'Airports lookup is unavailable', airports: [] },
      { status: 502 },
    )
  }
}
