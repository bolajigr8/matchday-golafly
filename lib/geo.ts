const EARTH_RADIUS_KM = 6371

export interface Coords {
  latitude: number
  longitude: number
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/**
 * Great-circle distance in kilometres between two points.
 *
 * Used to pick the nearest airport from a candidate list, and to sanity-
 * check a name-based fallback match before committing to it. Straight-line
 * distance is the right measure here: it is what every travel site shows,
 * and a road-distance routing API would add a dependency for no real gain.
 *
 * (Ported from the travels project's lib/geo.ts.)
 */
export function haversineKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}
