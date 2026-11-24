// features/summit/mock-data.ts
//
// MOCK DATA for the World Football Summit screens: the values written in the
// Figma design ("WFS" file). Read only through features/summit/api.ts so the
// real API can replace this file without touching a screen.

import type { SummitEvent, SummitEventKey, SummitTicketOption, SummitTripConfig } from './types'

export const MOCK_SUMMIT_EVENTS: Record<SummitEventKey, SummitEvent> = {
  london: {
    key: 'london',
    city: 'LONDON',
    year: '27',
    status: 'ON SALE',
    onSale: true,
    when: '10 & 11 March 2027',
    where: 'Fulham Pier, Craven Cottage',
    datesShort: '10 & 11 MAR',
    venueShort: 'FULHAM PIER',
    badgeLine: 'WFS × GOLAFLY · LONDON 27',
    badgeFoot: '10 & 11 MAR · FULHAM PIER',
    airport: 'LHR',
    heroSub:
      'Two days inside a Premier League stadium on the Thames with the people who run football. Your official ticket, flights from your city and a hotel by the river, all in one booking.',
    name: 'WFS London',
    stripName: 'WFS LONDON 27',
    cartName: 'WFS LONDON 2027',
  },
  riyadh: {
    key: 'riyadh',
    city: 'RIYADH',
    year: '27',
    status: 'NEW DATES SOON',
    onSale: false,
    when: 'New dates soon · AFC Asian Cup 2027',
    where: 'Misk City, Riyadh',
    datesShort: 'DATES TBA',
    venueShort: 'MISK CITY',
    badgeLine: 'WFS × GOLAFLY · RIYADH 27',
    badgeFoot: 'DATES TBA · MISK CITY',
    airport: 'RUH',
    heroSub:
      "WFS moved Riyadh to run during the rescheduled AFC Asian Cup in Saudi Arabia. Join the list and you'll be first to book the moment new dates land, with Saudi eVisa support included.",
    name: 'WFS Riyadh',
    stripName: 'WFS RIYADH 27',
    cartName: 'WFS RIYADH 2027',
  },
}

/** Early-bird price ends at the start of this day (London): "on 11 December". */
export const MOCK_EARLY_BIRD_ENDS = '2026-12-11T00:00:00Z'

export const MOCK_SUMMIT_TICKETS: SummitTicketOption[] = [
  {
    key: 'early',
    title: 'Early bird · General Entry',
    note: 'Both days · available until 10 December 2026',
    price: 550,
    chip: 'SAVE £200',
    available: true,
  },
  {
    key: 'full',
    title: 'Full price · General Entry',
    note: '',
    price: 750,
    available: false,
  },
]

export const MOCK_SUMMIT_TRIP: SummitTripConfig = {
  nights: 3,
  stayDates: '9 to 12 March',
  arriveNote: 'Arrive 9 March, fly home 12 March.',
  /* Figma prices are the Economy fares; the other cabins have no price in
     the design, so these multipliers are placeholders (NOT-FIGMA). */
  cabins: [
    { key: 'economy', label: 'Economy', multiplier: 1 },
    { key: 'premium', label: 'Premium', multiplier: 1.6 },
    { key: 'business', label: 'Business', multiplier: 3.2 },
    { key: 'first', label: 'First', multiplier: 5 },
  ],
  flights: [
    {
      id: 'ba',
      airline: 'British Airways',
      detail: 'Direct · to Heathrow',
      cartDetail: 'British Airways · direct',
      depart: '23:10',
      arrive: '05:40 +1',
      duration: '6h 30m',
      price: 780,
    },
    {
      id: 'vs',
      airline: 'Virgin Atlantic',
      detail: 'Direct · to Heathrow',
      cartDetail: 'Virgin Atlantic · direct',
      depart: '22:45',
      arrive: '05:15 +1',
      duration: '6h 30m',
      price: 820,
    },
    {
      id: 'qr',
      airline: 'Qatar Airways',
      detail: '1 stop · to Heathrow',
      cartDetail: 'Qatar Airways · 1 stop',
      depart: '09:30',
      arrive: '16:10',
      duration: '6h 40m',
      price: 690,
    },
  ],
  hotels: [
    {
      id: 'putney',
      name: 'Boutique · Putney Bridge',
      stars: 4,
      detail: '8 min walk to Craven Cottage · breakfast',
      pricePerNight: 190,
      image: '/figma/summit/hotel-putney.jpg',
      short: '4★ Putney Bridge',
    },
    {
      id: 'chelsea',
      name: 'Riverside · Chelsea Harbour',
      stars: 5,
      detail: '12 min by car · spa and river views',
      pricePerNight: 320,
      image: '/figma/summit/hotel-chelsea.jpg',
      short: '5★ Chelsea Harbour',
    },
  ],
  /* Figma shows one eSIM price (£10 per person, 10 GB selected). The other
     two plan prices are placeholders (NOT-FIGMA). */
  esimPlans: [
    { key: '5gb', label: '5 GB', price: 6 },
    { key: '10gb', label: '10 GB', price: 10 },
    { key: 'unlimited', label: 'Unlimited', price: 24 },
  ],
  chauffeur: { price: 140, detail: 'Meet and greet at arrivals' },
}

/** "≈ €649 · $732" under GBP prices (rates implied by the Figma figures). */
export const MOCK_FX = { EUR: 1.1796, USD: 1.3302 }

export const MOCK_BOOKING_REFERENCE = 'GLF-WFS-8K2QD'

/** Hero marquee. */
export const SUMMIT_AUDIENCES = ['CLUBS', 'LEAGUES', 'INVESTORS', 'BRANDS', 'MEDIA', 'AGENTS', 'FEDERATIONS', 'FOUNDERS']
