// lib/venue-addresses.ts
//
// Street address and postal code per venue, for the SportsEvent schema on
// match pages (lib/golafly-schema.tsx → location.address). Google needs a
// street address for event rich results; a city alone is not enough
// (SEO brief, Nov 2026, Task 3).
//
// The MatchDay API's venue object has no street or postal code (checked
// Nov 2026: GET /venues returns venue_id, venue_name, venue_image, capacity,
// venue_city_name, venue_country_name, categories). The SEO team supplies
// the addresses from the venue list we sent them; add each one here keyed by
// the API's venue_id.
//
// Rules from the brief: never guess and never use placeholder text. If a
// value isn't known, leave it out and the schema omits that property.
// City and country already come from the API.

export interface VenueAddress {
  /** Street and number, e.g. "Sir Matt Busby Way". */
  streetAddress?: string
  postalCode?: string
}

/** venue_id → address. Example entry:
 *    1234: { streetAddress: 'Sir Matt Busby Way', postalCode: 'M16 0RA' }, */
export const VENUE_ADDRESSES: Readonly<Record<number, VenueAddress>> = {}

export function venueAddress(venueId: number | null | undefined): VenueAddress {
  if (venueId == null) return {}
  const a = VENUE_ADDRESSES[venueId]
  if (!a) return {}
  return {
    streetAddress: a.streetAddress?.trim() || undefined,
    postalCode: a.postalCode?.trim() || undefined,
  }
}
