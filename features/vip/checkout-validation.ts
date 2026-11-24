// features/vip/checkout-validation.ts
//
// The Checkout form and the POST /cart/checkout body it turns into
// (contract §2.7). Payment itself happens on Stripe's page, so there are
// no card fields anywhere.

import type { VipCheckoutBody, VipCheckoutPassenger, VipPackage } from './contract'
import { flightOfferOf, packageItem, packageTravellers } from './package'

export interface VipTraveller {
  /** The flight offer's passenger id (pas_…): checkout needs it. Without a
   *  flight it is a local id ("guest-1"), never sent. */
  passengerId: string
  sameAsContact: boolean
  title: VipCheckoutPassenger['title'] | ''
  givenName: string
  familyName: string
  gender: VipCheckoutPassenger['gender'] | ''
  /** YYYY-MM-DD */
  bornOn: string
  email: string
  phone: string
}

export interface VipCheckoutForm {
  email: string
  phone: string
  travellers: VipTraveller[]
}

export type VipCheckoutErrors = Record<string, string>

/** What each traveller card asks for, from what is in the package:
 *   • flight: everything the airline needs (title, names, gender, date of
 *     birth, email, phone), one card per passenger;
 *   • hotel (no flight): names and date of birth (all guests are adults),
 *     one card per traveller;
 *   • ticket only: the ticket holder's names, one card. */
export type VipTravellerFields = 'flight' | 'hotel' | 'ticket'

export function travellerFieldsFor(pkg: VipPackage): VipTravellerFields {
  if (packageItem(pkg, 'flight')) return 'flight'
  if (packageItem(pkg, 'stays')) return 'hotel'
  return 'ticket'
}

const digits = (s: string) => s.replace(/\D/g, '')
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
/* react-phone-input-2 stores "+<country><number>": ask for a real number. */
const isPhone = (s: string) => digits(s).length >= 8
const isName = (s: string) => /^[\p{L}][\p{L}' .-]*$/u.test(s.trim())

/** Age in whole years on `onDay` (YYYY-MM-DD). */
function ageOn(dob: string, onDay: string): number {
  const [y, m, d] = dob.split('-').map(Number)
  const [ty, tm, td] = onDay.split('-').map(Number)
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0)
}

function validDob(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y > 1900
}

export function blankTraveller(passengerId: string, sameAsContact: boolean): VipTraveller {
  return { passengerId, sameAsContact, title: '', givenName: '', familyName: '', gender: '', bornOn: '', email: '', phone: '' }
}

/** One traveller per passenger of the package's flight offer (or, without
 *  a flight, per ticket for a hotel, else just the ticket holder), keeping
 *  any details already typed (matched by id, then by position). */
export function travellersFor(pkg: VipPackage, saved: VipTraveller[]): VipTraveller[] {
  const fields = travellerFieldsFor(pkg)
  const ids =
    fields === 'flight'
      ? (flightOfferOf(pkg)?.passengers ?? []).map((p) => p.id)
      : Array.from({ length: fields === 'hotel' ? packageTravellers(pkg) : 1 }, (_, i) => `guest-${i + 1}`)
  return ids.map((id, i) => saved.find((t) => t.passengerId === id) ?? { ...(saved[i] ?? blankTraveller(id, i === 0)), passengerId: id })
}

/** A message per wrong or missing field (key = field id); empty when fine.
 *  `matchDay`: every traveller must be an adult (18+) on the match day. */
export function validateVipCheckout(
  form: VipCheckoutForm,
  matchDay: string,
  fields: VipTravellerFields = 'flight',
): VipCheckoutErrors {
  const e: VipCheckoutErrors = {}
  if (!isEmail(form.email)) e.email = 'Enter a valid email address.'
  if (!isPhone(form.phone)) e.phone = 'Enter a phone number with its country code.'
  const flight = fields === 'flight'
  form.travellers.forEach((t, i) => {
    const k = `traveller.${i}`
    if (flight && !t.title) e[`${k}.title`] = 'Choose a title.'
    if (!isName(t.givenName)) e[`${k}.givenName`] = 'Enter the first name as on the passport.'
    if (!isName(t.familyName)) e[`${k}.familyName`] = 'Enter the last name as on the passport.'
    if (flight && !t.gender) e[`${k}.gender`] = 'Choose one.'
    if (fields !== 'ticket') {
      if (!validDob(t.bornOn)) e[`${k}.bornOn`] = 'Enter a date of birth.'
      else if (ageOn(t.bornOn, matchDay) < 18) e[`${k}.bornOn`] = 'Every traveller must be 18 or over on the match day.'
    }
    if (flight && !t.sameAsContact) {
      if (!isEmail(t.email)) e[`${k}.email`] = 'Enter a valid email address.'
      if (!isPhone(t.phone)) e[`${k}.phone`] = 'Enter a phone number with its country code.'
    }
  })
  return e
}

/** The POST /cart/checkout body for this package (contract §2.7):
 *   • matchday: the ticket holder = traveller 1;
 *   • flights:  one entry per traveller, with the offer's pas_… ids;
 *   • stays:    rooms[].guests[] (first/last) for one hotel supplier,
 *               guests[] (given/family/born_on) for the other — the hotel
 *               line's `provider` says which; travellers are shared out
 *               across the rooms in order;
 *   • eSIM:     needs no entry. No coupon (refused on packages). */
export function buildVipCheckoutBody(pkg: VipPackage, form: VipCheckoutForm): VipCheckoutBody {
  const ticket = packageItem(pkg, 'matchday')
  const flight = packageItem(pkg, 'flight')
  const hotel = packageItem(pkg, 'stays')
  const people = form.travellers.map((t) => ({
    ...t,
    givenName: t.givenName.trim(),
    familyName: t.familyName.trim(),
    email: (t.sameAsContact ? form.email : t.email).trim(),
    phone: t.sameAsContact ? form.phone : t.phone,
  }))
  const lead = people[0]

  const body: VipCheckoutBody = {
    email: form.email.trim(),
    phone: form.phone,
    matchday: ticket && lead ? [{ cart_item_id: ticket.id, customer: { first_name: lead.givenName, last_name: lead.familyName } }] : [],
    flights: flight
      ? [
          {
            cart_item_id: flight.id,
            passengers: people.map((p) => ({
              id: p.passengerId,
              title: p.title as VipCheckoutPassenger['title'],
              given_name: p.givenName,
              family_name: p.familyName,
              gender: p.gender as VipCheckoutPassenger['gender'],
              born_on: p.bornOn,
              email: p.email,
              phone_number: p.phone,
            })),
          },
        ]
      : [],
    stays: [],
  }

  if (hotel) {
    if (hotel.provider === 'duffel') {
      body.stays.push({
        cart_item_id: hotel.id,
        guests: people.map((p) => ({
          given_name: p.givenName,
          family_name: p.familyName,
          ...(p.bornOn ? { born_on: p.bornOn } : {}),
        })),
      })
    } else {
      const roomCount = Math.max(1, Math.min(hotel.rooms ?? 1, people.length))
      const rooms = Array.from({ length: roomCount }, () => ({ guests: [] as { first_name: string; last_name: string }[] }))
      people.forEach((p, i) => rooms[i % roomCount].guests.push({ first_name: p.givenName, last_name: p.familyName }))
      body.stays.push({ cart_item_id: hotel.id, rooms })
    }
  }
  return body
}
