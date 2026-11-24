// lib/stays-config.ts
//
// Deployment switches for hotels (Stays) in the matchday app. Same names and
// meaning as the travels app's lib/config.ts, so one setting does the same
// thing on both sites.

/**
 * Whether hotels are shown as a live, bookable product on this deployment:
 * the hotel step in the match builder (/builder/extras).
 *
 * Hotels depend on a supplier (ETG / Duffel) being approved for the
 * environment, so they stay hidden unless NEXT_PUBLIC_STAYS_LIVE=true. An
 * unset or malformed value never exposes an unapproved integration.
 */
export const STAYS_LIVE = process.env.NEXT_PUBLIC_STAYS_LIVE === 'true'

/**
 * Which hotel supplier is used ONLY when GET /stays/providers fails (network
 * error, endpoint missing). The admin setting always wins when it loads; an
 * empty list means "no hotels", not this fallback. Using it logs a console
 * warning for the team. NEXT_PUBLIC_STAYS_PROVIDER=duffel selects Duffel;
 * anything else is ETG (the backend's default).
 */
export type StaysProvider = 'etg' | 'duffel'

export const STAYS_PROVIDER: StaysProvider =
  process.env.NEXT_PUBLIC_STAYS_PROVIDER === 'duffel' ? 'duffel' : 'etg'
