// features/promo/types.ts
//
// Match Promo (GET /api/v1/match-promo, set in Admin → Settings → Match Promo).
// While it runs, the first `count` ticket checkouts each day get the percent
// set for the price band of ONE ticket. The backend applies it at payment;
// the site only shows it (badge, crossed-out price, banner).

export type PromoBand =
  | 'below_100'
  | '100_200'
  | '200_500'
  | '500_1000'
  | '1000_2000'
  | 'above_2000'

export type PromoBands = Record<PromoBand, number | null>

export interface MatchPromo {
  id: number
  /** Badge text, e.g. "BLACK FRIDAY". */
  label: string
  band_percents: PromoBands
  max_percent: number
  /** Daily limit; starts again every day in `timezone`. */
  count: number
  used_count: number
  remaining: number
  is_active: boolean
  starts_on: string | null
  ends_on: string | null
  /** On and inside its dates. */
  is_running: boolean
  /** Running, with slots left today and at least one band set. */
  applies_discount: boolean
  today: string
  timezone: string
  updated_at: string | null
}

export interface UpdateMatchPromoPayload {
  label: string
  count: number
  is_active: boolean
  starts_on: string | null
  ends_on: string | null
  band_percents: PromoBands
}

// Flight Promo (GET /api/v1/flight-promo, set in Admin → Settings → Flight Promo).
// While it runs, the first `count` flight checkouts each day get the percent
// set for the cabin and fare band. The backend applies it at payment; the
// site only shows it (badge, crossed-out price).

export type FlightPromoCabin = 'economy' | 'business' | 'first_class'
export type FlightPromoBand = 'below_100' | '100_500' | 'above_500'

/** Percent off per cabin and fare band; null means no discount there. */
export type FlightPromoBands = Record<FlightPromoCabin, Record<FlightPromoBand, number | null>>

export interface FlightPromo {
  id: number
  label: string
  flight_percents: FlightPromoBands
  max_percent: number
  count: number
  used_count: number
  remaining: number
  is_active: boolean
  starts_on: string | null
  ends_on: string | null
  is_running: boolean
  applies_discount: boolean
  today: string
  timezone: string
  updated_at: string | null
}

export interface UpdateFlightPromoPayload {
  label: string
  count: number
  is_active: boolean
  starts_on: string | null
  ends_on: string | null
  flight_percents: FlightPromoBands
}
