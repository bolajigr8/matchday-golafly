// features/flights/geocode.ts
//
// Ported from the travels project. Reverse geocoding for the "use my
// location" feature on the origin airport field.

/**
 * Reverse geocoding for the "use my location" feature on the origin
 * airport field. The flights places-suggestions endpoint (see api.ts)
 * requires a non-empty `query` — it 422s on an empty string even when
 * lat/lng are supplied. So instead of sending blank text, we first turn
 * the browser's raw coordinates into a real place name (e.g. "Port
 * Harcourt") and search *that*, with lat/lng still attached to help
 * disambiguate same-named places. This also tends to give better
 * results than a blank proximity-only lookup would.
 *
 * Uses BigDataCloud's free, keyless, CORS-enabled reverse-geocode
 * endpoint — built specifically for client-side/browser use, so this is
 * a direct `fetch()` and not routed through the app's own API client.
 *
 * IMPORTANT: this returns a list of CANDIDATE names, not a single best
 * guess, and the caller (getNearbyPlaces in api.ts) tries them in order
 * until one actually returns results from our own places API.
 *
 * Why: BigDataCloud's `city` field is the administrative area for the
 * coordinates, which can be a small town/LGA rather than the
 * commonly-known city — e.g. coordinates inside Port Harcourt, Nigeria
 * came back with `city: "Degema"` (a nearby, much smaller town) while
 * `locality: "Port Harcourt"` was the actual metro name. Our places API
 * has never heard of "Degema" as an airport-adjacent place and
 * correctly returns zero results for it, which used to surface as
 * "Couldn't find an airport near you" even though the airport lookup
 * would have succeeded for "Port Harcourt". Trying `locality` first
 * (falling back through `city`, `principalSubdivision`, `countryName`)
 * fixes that without needing to special-case any specific place.
 */
export async function reverseGeocodeCandidates(
  lat: number,
  lng: number,
): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
    if (!res.ok) return []
    const data = await res.json()

    // Order matters: `locality` (the commonly-used city/metro name) is
    // tried before the more granular administrative `city` field, since
    // the latter can name a smaller town that shares the same
    // coordinates region but isn't what our places API indexes airports
    // under. `principalSubdivision` (state/province) and `countryName`
    // are last-resort, broad fallbacks.
    const ordered = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ].filter((v): v is string => typeof v === 'string' && v.trim() !== '')

    // De-dupe while preserving order (locality/city are often identical).
    return Array.from(new Set(ordered))
  } catch {
    return []
  }
}

/**
 * ISO 3166-1 alpha-2 country code for a coordinate pair.
 *
 * Needed by the nearest-airport lookup, which can only query the airports
 * provider by country (see features/flights/nearest-airport.ts). All we
 * have on the GPS path is latitude and longitude, so this is the first
 * call resolveCoordsToAirport makes.
 *
 * Same keyless, CORS-enabled BigDataCloud endpoint as the candidate lookup
 * above — one more field off a response shape we already depend on.
 */
export async function reverseGeocodeCountry(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.countryCode === 'string' && data.countryCode
      ? data.countryCode.toUpperCase()
      : null
  } catch {
    return null
  }
}
