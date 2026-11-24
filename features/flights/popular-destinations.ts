// features/flights/popular-destinations.ts

export interface PopularDestination {
  iataCode: string
  city: string
  countryFlag: string
}

/** Quick-pick shortcuts shown in the airport picker's empty state, before
 *  the person has typed anything — same role as Travels' "Popular
 *  destinations" row. These are real, valid airports; nothing here claims
 *  to reflect live pricing, availability, or trending data. */
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  { iataCode: 'LHR', city: 'London', countryFlag: '🇬🇧' },
  { iataCode: 'MAD', city: 'Madrid', countryFlag: '🇪🇸' },
  { iataCode: 'DXB', city: 'Dubai', countryFlag: '🇦🇪' },
  { iataCode: 'JFK', city: 'New York', countryFlag: '🇺🇸' },
  { iataCode: 'CDG', city: 'Paris', countryFlag: '🇫🇷' },
  { iataCode: 'GRU', city: 'São Paulo', countryFlag: '🇧🇷' },
]
