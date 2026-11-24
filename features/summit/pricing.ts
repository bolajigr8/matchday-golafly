// features/summit/pricing.ts
//
// What the cart shows, worked out from the customer's choices. Display only:
// the real total will come from the backend once it exists.

import { getSummitFx, getSummitTickets, getSummitTrip } from './api'
import type { SummitBooking, SummitCart, SummitCartLine } from './types'

const gbp = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

/** "£1,100" */
export function formatGbp(amount: number): string {
  return `£${gbp.format(Math.round(amount))}`
}

/** "≈ €649 · $732" */
export function approxOtherCurrencies(amountGbp: number): string {
  const fx = getSummitFx()
  return `≈ €${gbp.format(Math.round(amountGbp * fx.EUR))} · $${gbp.format(Math.round(amountGbp * fx.USD))}`
}

export function flightPrice(booking: Pick<SummitBooking, 'flightId' | 'cabin'>): number {
  const trip = getSummitTrip()
  const flight = trip.flights.find((f) => f.id === booking.flightId) ?? trip.flights[0]
  const cabin = trip.cabins.find((c) => c.key === booking.cabin) ?? trip.cabins[0]
  return Math.round(flight.price * cabin.multiplier)
}

/** Flight fare for one traveller in the chosen cabin. */
export function fareFor(flightId: string, cabin: SummitBooking['cabin']): number {
  return flightPrice({ flightId, cabin })
}

export function buildSummitCart(b: SummitBooking): SummitCart {
  const trip = getSummitTrip()
  const ticket = getSummitTickets().find((t) => t.key === b.ticket) ?? getSummitTickets()[0]
  const q = b.quantity
  const lines: SummitCartLine[] = [
    {
      key: 'ticket',
      title: `General Entry × ${q}`,
      detail: ticket.key === 'early' ? 'Early bird · both days' : 'Full price · both days',
      amount: ticket.price * q,
    },
  ]
  if (b.flightsOn) {
    const flight = trip.flights.find((f) => f.id === b.flightId) ?? trip.flights[0]
    lines.push({ key: 'flights', title: `Flights × ${q}`, detail: flight.cartDetail, amount: flightPrice(b) * q })
  }
  if (b.hotelOn) {
    const hotel = trip.hotels.find((h) => h.id === b.hotelId) ?? trip.hotels[0]
    lines.push({
      key: 'hotel',
      title: hotel.name,
      detail: `${hotel.stars}★ · ${q} room${q === 1 ? '' : 's'} · ${trip.nights} nights`,
      amount: hotel.pricePerNight * trip.nights * q,
    })
  }
  if (b.esimOn) {
    const plan = trip.esimPlans.find((p) => p.key === b.esimPlan) ?? trip.esimPlans[1]
    lines.push({ key: 'esim', title: `UK eSIM × ${q}`, detail: plan.label, amount: plan.price * q })
  }
  if (b.chauffeurOn) {
    lines.push({ key: 'chauffeur', title: 'Airport chauffeur', detail: 'Heathrow to hotel, both ways', amount: trip.chauffeur.price })
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), count: lines.length }
}
