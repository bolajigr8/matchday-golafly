/**
 * Departure "time of day" buckets — Morning / Afternoon / Evening / Night —
 * used to filter search results client-side, the same way Stops / Airlines /
 * Fare type are already filtered in app/(public)/flights/client.tsx.
 *
 * Buckets are derived from each offer's outbound slice's first segment
 * `departing_at` (an ISO datetime), using the *local* hour — the same
 * conversion `toLocaleTimeString` does elsewhere in the app for the time
 * printed on flight cards — so a flight bucketed as "Evening" here is always
 * the same one showing an 18:00–23:59 departure on the card.
 */

export type DepartureTimeId = 'morning' | 'afternoon' | 'evening' | 'night'

export interface DepartureTimeOption {
  id: DepartureTimeId
  label: string
  /** Display range, matches the design spec (Morning 06:00–12:00 etc). */
  range: string
  /** Local hour this bucket starts at (inclusive). */
  fromHour: number
  /** Local hour this bucket ends at (exclusive). */
  toHour: number
}

export const DEPARTURE_TIME_OPTIONS: DepartureTimeOption[] = [
  {
    id: 'morning',
    label: 'Morning',
    range: '06:00 – 12:00',
    fromHour: 6,
    toHour: 12,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    range: '12:00 – 18:00',
    fromHour: 12,
    toHour: 18,
  },
  {
    id: 'evening',
    label: 'Evening',
    range: '18:00 – 00:00',
    fromHour: 18,
    toHour: 24,
  },
  {
    id: 'night',
    label: 'Night',
    range: '00:00 – 06:00',
    fromHour: 0,
    toHour: 6,
  },
]

export const ALL_DEPARTURE_TIME_IDS: DepartureTimeId[] =
  DEPARTURE_TIME_OPTIONS.map((o) => o.id)

/** Buckets an ISO departure datetime into one of the four slots above. */
export function getDepartureTimeBucket(
  iso: string | undefined,
): DepartureTimeId {
  const hour = iso ? new Date(iso).getHours() : NaN
  const match = DEPARTURE_TIME_OPTIONS.find(
    (o) => hour >= o.fromHour && hour < o.toHour,
  )
  return match ? match.id : 'night'
}
