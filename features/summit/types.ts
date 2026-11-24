// features/summit/types.ts
//
// World Football Summit (Figma "WFS"). UI-first: every value the screens
// show comes through these types from features/summit/api.ts, which today
// reads mock data. No backend contract exists yet, so nothing here is a
// promise about the real API: swap api.ts when one arrives.

export type SummitEventKey = 'london' | 'riyadh'

export interface SummitEvent {
  key: SummitEventKey
  /** "LONDON" */
  city: string
  /** "27" (lime part of the hero headline). */
  year: string
  /** Tab chip: "ON SALE" / "NEW DATES SOON". */
  status: string
  onSale: boolean
  /** Hero "WHEN" / "WHERE". */
  when: string
  where: string
  /** Short forms for the event strip and the badge. */
  datesShort: string
  venueShort: string
  badgeLine: string
  badgeFoot: string
  /** Arrival airport on the badge / route ("LHR"). */
  airport: string
  heroSub: string
  /** Flow labels: "WFS London", "WFS LONDON 27", "WFS LONDON 2027". */
  name: string
  stripName: string
  cartName: string
}

export type TicketOptionKey = 'early' | 'full'

export interface SummitTicketOption {
  key: TicketOptionKey
  title: string
  note: string
  /** GBP, per attendee. */
  price: number
  /** "SAVE £200" chip, when there is one. */
  chip?: string
  /** Shown but not choosable (greyed in Figma). */
  available: boolean
}

export type CabinKey = 'economy' | 'premium' | 'business' | 'first'

export interface SummitFlight {
  id: string
  airline: string
  /** "Direct · to Heathrow" */
  detail: string
  /** Cart line: "British Airways · direct" */
  cartDetail: string
  depart: string
  arrive: string
  duration: string
  /** GBP per person, return, Economy. */
  price: number
}

export interface SummitHotel {
  id: string
  name: string
  stars: 4 | 5
  detail: string
  /** GBP per room, per night. */
  pricePerNight: number
  image: string
  /** Booking summary: "4★ Putney Bridge" */
  short: string
}

export type EsimPlanKey = '5gb' | '10gb' | 'unlimited'

export interface SummitEsimPlan {
  key: EsimPlanKey
  label: string
  /** GBP per person. */
  price: number
}

export interface SummitTripConfig {
  /** Hotel nights and the copy around them. */
  nights: number
  stayDates: string
  arriveNote: string
  cabins: { key: CabinKey; label: string; multiplier: number }[]
  flights: SummitFlight[]
  hotels: SummitHotel[]
  esimPlans: SummitEsimPlan[]
  chauffeur: { price: number; detail: string }
}

export interface SummitAttendee {
  fullName: string
  jobTitle: string
  organisation: string
  email: string
}

export type BookingAs = 'individual' | 'company'
export type PaymentMethod = 'card' | 'bank' | 'instalments'

export interface SummitBilling {
  bookingAs: BookingAs
  company: string
  taxId: string
  invoiceEmail: string
  address: string
}

export interface SummitTraveller {
  passportName: string
  passportNumber: string
}

/** What the customer has chosen so far (kept in the browser session). */
export interface SummitBooking {
  event: SummitEventKey
  ticket: TicketOptionKey
  quantity: number
  attendees: SummitAttendee[]
  /** Trip step. */
  flightsOn: boolean
  flightId: string
  cabin: CabinKey
  flyingFrom: string
  hotelOn: boolean
  hotelId: string
  esimOn: boolean
  esimPlan: EsimPlanKey
  chauffeurOn: boolean
  /** Pay step (never card details). */
  billing: SummitBilling
  travellers: SummitTraveller[]
  payment: PaymentMethod
  agreed: boolean
  /** Set once "paid" (mock). */
  reference: string | null
  paidTotal: number | null
}

export interface SummitCartLine {
  key: 'ticket' | 'flights' | 'hotel' | 'esim' | 'chauffeur'
  title: string
  detail: string
  amount: number
}

export interface SummitCart {
  lines: SummitCartLine[]
  total: number
  /** Things in the cart (the lime chip). */
  count: number
}
