// features/vip/mock/server.ts
//
// TEST MODE ONLY (NEXT_PUBLIC_VIP_API_MODE=mock, see features/vip/mode.ts).
//
// A stand-in for the backend that answers every VIP call the way the
// "MatchDay VIP packages: Frontend API contract" describes, built from the
// contract's own examples ("FC Barcelona vs Rival", listing 9001611,
// offer off_…, "Hotel Four", "Spain 5GB" …), so the whole flow can be
// clicked through before the backend is live. It runs in the browser,
// keeps its state in localStorage, and never calls the backend, the cart
// or Stripe. Errors use the contract's exact words (§8).
//
// Nothing in here is ever used in live mode.

import type { FlightSegment, FlightSlice } from '@/features/flights/types'
import type { PriceSummary, PriceSummaryLine } from '@/features/price-breakdown/types'
import type {
  VipAddFlightBody,
  VipChangeTicketBody,
  VipCheckoutBody,
  VipCheckoutResult,
  VipClub,
  VipCreatePackageBody,
  VipEsimPage,
  VipEsimPlan,
  VipEvent,
  VipEventsPage,
  VipFlightOffer,
  VipFlightSearchBody,
  VipHotelLockRaw,
  VipHotelOption,
  VipHotelRatesRaw,
  VipHotelSearchBody,
  VipLedgerTransaction,
  VipListing,
  VipListingsPage,
  VipPackage,
  VipPackageItem,
  VipPackageStatus,
  VipPackageView,
  VipPaidPackage,
  VipPackageMode,
  VipSettings,
  VipStepName,
} from '../contract'
import { VipApiError } from '../errors'
import type { VipApi } from '../live'

/* The admin's switch and mode (contract §1), kept in this browser so the
   test admin (features/admin/vip/mock.ts) can change them. Default: on,
   package mode. */
export const MOCK_SETTINGS_KEY = 'golafly-vip-mock-settings'

export function mockSettings(): { enabled: boolean; mode: VipPackageMode } {
  try {
    const raw = JSON.parse(localStorage.getItem(MOCK_SETTINGS_KEY) ?? 'null') as {
      enabled?: unknown
      mode?: unknown
    } | null
    return { enabled: raw?.enabled !== false, mode: raw?.mode === 'flexible' ? 'flexible' : 'package' }
  } catch {
    return { enabled: true, mode: 'package' }
  }
}

/** Every public route is a 404 with an empty message while VIP is off. */
function switchedOn() {
  if (!mockSettings().enabled) fail(404, '')
}

/* ── Catalogue (contract examples) ──────────────────────────────────── */

const CLUBS: VipClub[] = [
  { slug: 'barcelona', name: 'FC Barcelona', city: 'Barcelona', airports: ['BCN'] },
  { slug: 'real_madrid', name: 'Real Madrid', city: 'Madrid', airports: ['MAD'] },
  { slug: 'atletico_madrid', name: 'Atlético de Madrid', city: 'Madrid', airports: ['MAD'] },
]

function ev(id: number, club: VipClub, teamId: number, date: string, from: number): VipEvent {
  return {
    id,
    name: `${club.name} vs Rival`,
    date,
    venue: { venue_id: 50 + teamId, venue_name: 'Stadium' },
    team1: { id: teamId, name: club.name },
    team2: { id: 99, name: 'Rival' },
    vip_price_from: { currency_code: 'EUR', price: from },
    hospitality: { club: club.slug, city: club.city, airports: club.airports },
    /* Camp Nou's plan, from the Postman "Events of a club" example. */
    ...(club.slug === 'barcelona'
      ? { svg_url: 'https://cdn.footballticketnet.com/seating-plans/uploaded/31.svg?v=1784636194177' }
      : {}),
  }
}

/* The two real Camp Nou VIP listings from the Postman "VIP listings of a
   match" example (Players Zone, category 340, with seating_blocks), so the
   stadium map has real blocks to light up in test mode. */
const CAMP_NOU_LISTINGS = (eventId: number): VipListing[] => [
  {
    listing_id: 1485152,
    event_id: eventId,
    category: {
      category_id: 340,
      category_name: 'Barca VIP Hospitality Players Zone',
      seating_blocks: 'VIP_Players-Zone_2;VIP_Players-Zone_3;VIP_Players-Zone_4;VIP_Players-Zone_5;VIP_Players-Zone_6',
    },
    quantity: 7,
    price_details: { currency: 'EUR', price_per_ticket: 1434.59 },
    seat_details: { block: 'VIP_Players-Zone_4', row: '', extra_note_hospitality: 'Good hospitality boxes' },
    split: { split_type: 'UP_7TOGETHER', splits: [1, 2, 3, 4, 5, 6, 7] },
    note: 'Premium View · Central View · Full hospitality (food and drinks included) · Close to the Pitch',
  },
  {
    listing_id: 1676237,
    event_id: eventId,
    category: {
      category_id: 340,
      category_name: 'Barca VIP Hospitality Players Zone',
      seating_blocks: 'VIP_Players-Zone_2;VIP_Players-Zone_3;VIP_Players-Zone_4;VIP_Players-Zone_5;VIP_Players-Zone_6',
    },
    quantity: 4,
    price_details: { currency: 'EUR', price_per_ticket: 1983.59 },
    seat_details: { block: '', row: '', extra_note_hospitality: 'Good hospitality boxes' },
    split: { split_type: 'UP_4TOGETHER', splits: [1, 2, 3, 4] },
    note: '',
  },
]

const EVENTS: Record<string, VipEvent[]> = {
  barcelona: [ev(2001, CLUBS[0], 2, '2027-03-06T21:00:00', 480), ev(2002, CLUBS[0], 2, '2027-04-10T18:30:00', 520)],
  real_madrid: [ev(3001, CLUBS[1], 3, '2027-03-13T21:00:00', 610), ev(3002, CLUBS[1], 3, '2027-04-24T16:15:00', 650)],
  atletico_madrid: [ev(4001, CLUBS[2], 4, '2027-03-20T18:30:00', 390)],
}

function listingsFor(e: VipEvent): VipListing[] {
  const base = e.vip_price_from?.price ?? 480
  return [
    {
      listing_id: e.id * 10000 + 1611,
      event_id: e.id,
      category: { category_id: 1611, category_name: 'VIP Hospitality Balcony' },
      quantity: 10,
      price_details: { currency: 'EUR', price_per_ticket: base },
      seat_details: { block: '1', row: '1', extra_note_hospitality: 'Food and drinks included' },
      split: { split_type: 'SINGLE', splits: [1, 2, 3] },
      note: '',
    },
    {
      listing_id: e.id * 10000 + 1612,
      event_id: e.id,
      category: { category_id: 1612, category_name: 'VIP Hospitality Lounge' },
      quantity: 4,
      price_details: { currency: 'EUR', price_per_ticket: 1200 },
      seat_details: { block: '12', row: '4', extra_note_hospitality: 'Lounge access, three-course dinner and open bar' },
      split: { split_type: 'PAIRS', splits: [2, 4] },
      note: '',
    },
    ...(e.hospitality.club === 'barcelona' ? CAMP_NOU_LISTINGS(e.id) : []),
  ]
}

const ESIMS: VipEsimPlan[] = [
  { package_id: 'es-5gb', title: 'Spain 5GB', data: '5 GB', validity_days: 7, price: 10.0, currency: 'EUR' },
  { package_id: 'es-20gb', title: 'Spain 20GB', data: '20 GB', validity_days: 15, price: 25.0, currency: 'EUR' },
]

const HOTELS: VipHotelOption[] = [
  {
    option_id: '1001',
    provider: 'etg',
    name: 'Hotel Four',
    stars: 4,
    address: '1 Example Street',
    photos: ['/figma/vip/hotel-suite.jpg'],
    price_from: null,
    price_breakdown: null,
  },
  {
    option_id: 'acc_0000EXAMPLE5',
    provider: 'duffel',
    name: 'Hotel Five',
    stars: 5,
    address: '5 Example Avenue',
    photos: [],
    price_from: { amount: '180.00', currency: 'EUR' },
    price_breakdown: null,
  },
]

/* ── State (localStorage) ───────────────────────────────────────────── */

interface MockFlight {
  offer: VipFlightOffer
  services: number
  expiresAt: number
}
interface MockHotel {
  optionId: string
  provider: string
  name: string
  roomName: string
  total: number
  checkin: string
  checkout: string
  rooms: number
  expiresAt: number
}
interface MockPkg {
  id: string
  status: VipPackageStatus
  /** Set when the package is created; never changes. */
  mode: VipPackageMode
  club: string
  event: VipEvent
  listing: VipListing
  quantity: number
  flight: MockFlight | null
  hotel: MockHotel | null
  esim: { plan: VipEsimPlan; quantity: number } | null
  /* latest searches */
  offers: Record<string, VipFlightOffer>
  hotelSearch: { rooms: number; checkIn: string; checkOut: string; nights: number; withFlight: boolean; at: number } | null
  rates: Record<string, { optionId: string; name: string; total: number }>
  locks: Record<string, { rateId: string; total: number; at: number }>
  sessionId: string | null
  paidAt: number | null
}
interface MockDb {
  packages: Record<string, MockPkg>
  idem: Record<string, string>
}

const KEY = 'golafly-vip-mock-db'
const FLIGHT_HOLD_MS = 30 * 60_000
const HOTEL_HOLD_MS = 30 * 60_000

function load(): MockDb {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as MockDb
  } catch {
    /* start fresh */
  }
  return { packages: {}, idem: {} }
}
function save(db: MockDb) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms))
const rid = (n = 10) =>
  Array.from({ length: n }, () => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Math.floor(Math.random() * 32)]).join('')
const fail = (status: number, message: string): never => {
  throw new VipApiError(message, status)
}
const minor = (n: number) => Math.round(n * 100)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return iso(d)
}
const addDaysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
/* Today in the club's timezone (Europe/Madrid). */
const todayMadrid = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

function findClub(slug: string): VipClub {
  return CLUBS.find((c) => c.slug === slug) ?? fail(404, 'Unknown club.')
}
function findEvent(club: string, eventId: number): VipEvent {
  findClub(club)
  return (EVENTS[club] ?? []).find((e) => e.id === eventId) ?? fail(404, 'Event not found.')
}
function getPkg(db: MockDb, id: string): MockPkg {
  switchedOn()
  return db.packages[id] ?? fail(404, 'Package not found.')
}
function editable(p: MockPkg) {
  if (p.status !== 'building' && p.status !== 'checkout_started') fail(422, 'This package can no longer be changed.')
  /* Going back from Stripe: the old payment page is closed, back to building. */
  if (p.status === 'checkout_started') {
    p.status = 'building'
    p.sessionId = null
  }
}

/* ── Package view (building shape) ──────────────────────────────────── */

function itemId(p: MockPkg, kind: string) {
  return `${p.id.slice(-8).toLowerCase()}-${kind}`
}

function view(p: MockPkg, guestToken?: string): VipPackage {
  const now = Date.now()
  const flightExpired = !!p.flight && p.flight.expiresAt < now
  const hotelExpired = !!p.hotel && p.hotel.expiresAt < now
  const flightDone = !!p.flight && !flightExpired
  const hotelDone = !!p.hotel && !hotelExpired
  const ticketTotal = p.listing.price_details.price_per_ticket * p.quantity

  const items: VipPackageItem[] = [
    {
      id: itemId(p, 'ticket'),
      type: 'matchday',
      eventId: String(p.event.id),
      listingId: String(p.listing.listing_id),
      quantity: p.quantity,
      eventName: p.event.name,
      eventDate: p.event.date,
      categoryName: p.listing.category.category_name,
      block: p.listing.seat_details.block ?? null,
      row: p.listing.seat_details.row ?? null,
      currency: 'EUR',
      unitAmount: p.listing.price_details.price_per_ticket,
      hospitalityPackageId: p.id,
      expired: false,
    },
  ]
  const lines: PriceSummaryLine[] = [
    { item_id: itemId(p, 'ticket'), item_type: 'matchday', key: 'match_ticket_price', label: 'Match ticket price', amount_minor: minor(ticketTotal), amount: ticketTotal },
    { item_id: itemId(p, 'ticket'), item_type: 'matchday', key: 'third_party_fee', label: 'Third-party fee', amount_minor: minor(ticketTotal * 0.15), amount: ticketTotal * 0.15 },
  ]
  let total = ticketTotal * 1.15

  /* Lines trimmed like the Postman examples: the flight line has only
     offerId, the hotel no room/photo, the eSIM no plan details. */
  if (p.flight) {
    const f = Number(p.flight.offer.total_amount) + p.flight.services
    items.push({
      id: itemId(p, 'flight'),
      type: 'flight',
      offerId: p.flight.offer.id,
      currency: 'EUR',
      hospitalityPackageId: p.id,
      expired: flightExpired,
      expiresAt: new Date(p.flight.expiresAt).toISOString(),
    })
    lines.push({ item_id: itemId(p, 'flight'), item_type: 'flight', key: 'flight_ticket_price', label: 'Flight ticket price', amount_minor: minor(f), amount: f })
    total += f
  }
  if (p.hotel) {
    items.push({
      id: itemId(p, 'hotel'),
      type: 'stays',
      provider: p.hotel.provider as 'etg' | 'duffel',
      hotelName: p.hotel.name,
      checkin: p.hotel.checkin,
      checkout: p.hotel.checkout,
      rooms: p.hotel.rooms,
      adults: p.quantity,
      currency: 'EUR',
      hospitalityPackageId: p.id,
      expired: hotelExpired,
      expiresAt: new Date(p.hotel.expiresAt).toISOString(),
    })
    lines.push({ item_id: itemId(p, 'hotel'), item_type: 'stays', key: 'hotel_price', label: 'Hotel price', amount_minor: minor(p.hotel.total), amount: p.hotel.total })
    total += p.hotel.total
  }
  if (p.esim) {
    const e = p.esim.plan.price * p.esim.quantity
    items.push({
      id: itemId(p, 'esim'),
      type: 'esim',
      packageId: p.esim.plan.package_id,
      quantity: p.esim.quantity,
      currency: 'EUR',
      hospitalityPackageId: p.id,
      expired: false,
    })
    lines.push({ item_id: itemId(p, 'esim'), item_type: 'esim', key: 'esim_price', label: 'eSIM price', amount_minor: minor(e), amount: e })
    total += e
  }
  const fee = ticketTotal * 0.1
  total += fee
  const summary: PriceSummary = {
    currency: 'EUR',
    complete: true,
    lines,
    golafly_booking_fee: { amount_minor: minor(fee), amount: fee },
    discount: null,
    total: { amount_minor: minor(total), amount: Math.round(total * 100) / 100 },
  } as PriceSummary

  /* Contract 2.6: package mode needs the ticket, flight and hotel (none
     expired); flexible needs the ticket only, unless a flight or hotel that
     is present has expired. In flexible mode the hotel is never blocked. */
  const flexible = p.mode === 'flexible'
  const ready = flexible ? !flightExpired && !hotelExpired : flightDone && hotelDone
  const hotelBlocked = !flexible && !flightDone
  const required: VipStepName[] = flexible ? ['ticket'] : ['ticket', 'flight', 'hotel']
  const optional: VipStepName[] = flexible ? ['flight', 'hotel', 'esim'] : ['esim']
  const hotelDates = p.hotel
    ? { check_in: p.hotel.checkin, check_out: p.hotel.checkout, nights: addDaysBetween(p.hotel.checkin, p.hotel.checkout) }
    : p.hotelSearch && !p.hotelSearch.withFlight
      ? { check_in: p.hotelSearch.checkIn, check_out: p.hotelSearch.checkOut, nights: p.hotelSearch.nights }
      : null

  return {
    id: p.id,
    status: p.status,
    club: p.club,
    mode: p.mode,
    required_steps: required,
    optional_steps: optional,
    steps: {
      ticket: { done: true, next: false, blocked: false, optional: false },
      flight: { done: flightDone, next: !flightDone && !flexible, blocked: false, optional: flexible, expired: flightExpired },
      hotel: {
        done: hotelDone,
        next: !hotelDone && !hotelBlocked && !flexible,
        blocked: hotelBlocked,
        optional: flexible,
        expired: hotelExpired,
      },
      esim: { done: !!p.esim, next: false, blocked: false, optional: true },
    },
    ready_for_checkout: ready,
    hotel_dates: hotelDates,
    items,
    price_summary: summary,
    ...(guestToken ? { guest_token: guestToken } : {}),
  }
}

/* ── After payment (time-driven, so the success page can be watched) ── */

function paidStage(p: MockPkg): 'paid' | 'ticket_secured' | 'completed' {
  const s = (Date.now() - (p.paidAt ?? Date.now())) / 1000
  return s < 25 ? 'paid' : s < 50 ? 'ticket_secured' : 'completed'
}

const HELD = {
  flight: 'Your flight will be booked as soon as your match tickets are confirmed.',
  hotel: 'Your hotel will be booked as soon as your match tickets are confirmed.',
  esim: 'Your eSIM will be ready as soon as your match tickets are confirmed.',
}

function paidView(p: MockPkg): VipPaidPackage {
  const stage = paidStage(p)
  const held = stage === 'paid'
  const done = stage === 'completed'
  /* A flexible package may hold only some items, or the ticket alone. */
  const items: VipPaidPackage['items'] = []
  if (p.flight) items.push({ type: 'flight', status: done ? 'confirmed' : 'confirming', status_message: held ? HELD.flight : null })
  if (p.hotel) items.push({ type: 'hotel', status: done ? 'confirmed' : 'needs_reconciliation', status_message: held ? HELD.hotel : null })
  if (p.esim) items.push({ type: 'esim', status: done ? 'confirmed' : 'processing', status_message: held ? HELD.esim : null })
  return {
    id: p.id,
    status: stage,
    club: p.club,
    mode: p.mode,
    required_steps: p.mode === 'flexible' ? ['ticket'] : ['ticket', 'flight', 'hotel'],
    optional_steps: p.mode === 'flexible' ? ['flight', 'hotel', 'esim'] : ['esim'],
    event_name: p.event.name,
    event_date: p.event.date,
    event_timezone: 'Europe/Madrid',
    quantity: p.quantity,
    ticket: { status: stage === 'paid' ? 'processing' : stage === 'completed' ? 'tickets_sent' : 'confirmed' },
    items,
  }
}

/* ── Flight offers ──────────────────────────────────────────────────── */

const AIRPORT_NAMES: Record<string, string> = { BCN: 'Barcelona El Prat', MAD: 'Adolfo Suárez Madrid-Barajas', LHR: 'Heathrow Airport' }
const airport = (code: string, tz?: string) => ({
  id: `arp_${code.toLowerCase()}`,
  iata_code: code,
  name: AIRPORT_NAMES[code] ?? `${code} Airport`,
  city_name: undefined,
  time_zone: tz,
})
const CARRIER = { id: 'arl_0000EXAMPLE', name: 'Example Airways', iata_code: 'ZZ' }

function segment(id: string, from: string, to: string, dep: string, arr: string, dur: string, pax: string[], cabin: string): FlightSegment {
  return {
    id,
    departing_at: dep,
    arriving_at: arr,
    origin: airport(from),
    destination: airport(to, ['BCN', 'MAD'].includes(to) ? 'Europe/Madrid' : undefined),
    operating_carrier: CARRIER,
    marketing_carrier: CARRIER,
    marketing_carrier_flight_number: id.slice(-3),
    duration: dur,
    passengers: pax.map((p) => ({ passenger_id: p, cabin_class: cabin, baggages: [{ quantity: 2, type: 'checked' }] })),
  }
}

function offersFor(p: MockPkg, body: VipFlightSearchBody): VipFlightOffer[] {
  const to = p.event.hospitality.airports[0]
  const matchDay = p.event.date.slice(0, 10)
  const dep = body.departure_date ?? addDays(matchDay, -1)
  const ret = body.return ? (body.return_date ?? addDays(matchDay, 1)) : null
  const pax = Array.from({ length: p.quantity }, (_, i) => `pas_0000EXAMPLE${i + 1}`)
  const variants: { cabin: 'business' | 'first'; time: [string, string]; price: number; tag: string }[] = [
    { cabin: 'business', time: ['08:00', '11:10'], price: 800, tag: '1' },
    { cabin: 'first', time: ['10:30', '13:40'], price: 1600, tag: '2' },
    { cabin: 'business', time: ['14:15', '17:25'], price: 690, tag: '3' },
  ]
  const kickoff = new Date(`${p.event.date}+01:00`).getTime()
  return variants
    .filter((v) => body.cabin_class === 'any' || v.cabin === body.cabin_class)
    .map((v) => {
      const out: FlightSlice = {
        id: `sli_out${v.tag}`,
        origin: airport(body.origin),
        destination: airport(to),
        departure_date: dep,
        duration: 'PT2H10M',
        fare_brand_name: v.cabin === 'first' ? 'First' : 'Business',
        segments: [segment(`seg_0000EXAMPLE${v.tag}1`, body.origin, to, `${dep}T${v.time[0]}:00`, `${dep}T${v.time[1]}:00`, 'PT2H10M', pax, v.cabin)],
      }
      const slices = [out]
      if (ret)
        slices.push({
          id: `sli_ret${v.tag}`,
          origin: airport(to),
          destination: airport(body.origin),
          departure_date: ret,
          duration: 'PT2H20M',
          fare_brand_name: out.fare_brand_name,
          segments: [segment(`seg_0000EXAMPLE${v.tag}2`, to, body.origin, `${ret}T16:00:00`, `${ret}T17:20:00`, 'PT2H20M', pax, v.cabin)],
        })
      const arrival = `${dep}T${v.time[1]}:00+01:00`
      const total = v.price * p.quantity * (ret ? 2 : 1)
      return {
        id: `off_0000EXAMPLE${v.tag}${rid(4)}`,
        total_amount: total.toFixed(2),
        total_currency: 'EUR',
        slices,
        passengers: pax.map((id) => ({ id, type: 'adult' as const })),
        created_at: new Date().toISOString(),
        hospitality: {
          arrival_local: arrival,
          hours_before_kickoff: Math.round(((kickoff - new Date(arrival).getTime()) / 3_600_000) * 10) / 10,
        },
      }
    })
}

/* ── The API ────────────────────────────────────────────────────────── */

export const mockVipApi: VipApi = {
  async getSettings(): Promise<VipSettings> {
    await wait(150)
    switchedOn()
    return { mode: mockSettings().mode }
  },

  async getClubs() {
    await wait()
    switchedOn()
    return CLUBS
  },

  async getEvents(club, page): Promise<VipEventsPage> {
    await wait()
    switchedOn()
    findClub(club)
    const all = EVENTS[club] ?? []
    return { data: page === 1 ? all : [], meta: { current_page: page, per_page: 20, total_events: all.length, has_more: false } }
  },

  async getListings(club, eventId): Promise<VipListingsPage> {
    await wait()
    switchedOn()
    const e = findEvent(club, eventId)
    const data = listingsFor(e)
    const prices = data.map((l) => l.price_details.price_per_ticket)
    return {
      data,
      meta: { currency: 'EUR', min_price: Math.min(...prices), max_price: Math.max(...prices), total_tickets: data.reduce((s, l) => s + l.quantity, 0) },
    }
  },

  async createPackage(body: VipCreatePackageBody, idempotencyKey) {
    await wait()
    const db = load()
    const repeat = db.idem[idempotencyKey]
    if (repeat && db.packages[repeat]) return view(db.packages[repeat])
    const event = findEvent(body.club, body.event_id)
    const listing = listingsFor(event).find((l) => l.listing_id === body.listing_id)
    if (!listing) fail(422, "This ticket isn't available as a VIP package.")
    if (body.quantity < 1) fail(422, 'Quantity must be at least 1.')
    if (!listing!.split.splits.includes(body.quantity)) fail(422, "This ticket isn't available as a VIP package.")
    if (body.quantity > listing!.quantity) fail(422, `Only ${listing!.quantity} ticket(s) still available on this listing.`)
    /* A cart that already holds a live package refuses a second one. */
    if (Object.values(db.packages).some((p) => p.status === 'building' || p.status === 'checkout_started'))
      fail(422, 'Your basket already has items. Check out or clear it before building a VIP package.')
    switchedOn()
    const id = `01J${rid(23)}`
    db.packages[id] = {
      id,
      status: 'building',
      mode: mockSettings().mode,
      club: body.club,
      event,
      listing: listing!,
      quantity: body.quantity,
      flight: null,
      hotel: null,
      esim: null,
      offers: {},
      hotelSearch: null,
      rates: {},
      locks: {},
      sessionId: null,
      paidAt: null,
    }
    db.idem[idempotencyKey] = id
    save(db)
    return view(db.packages[id], `tok_mock_${rid(12)}`)
  },

  async getPackage(id, sessionId): Promise<VipPackageView> {
    await wait(250)
    const db = load()
    const p = getPkg(db, id)
    if (p.status === 'paid' || p.status === 'ticket_secured' || p.status === 'completed') {
      if (sessionId && sessionId !== p.sessionId) fail(404, 'Package not found.')
      return paidView(p)
    }
    return view(p)
  },

  async changeTicket(id, body: VipChangeTicketBody) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    const listing = listingsFor(p.event).find((l) => l.listing_id === body.listing_id && l.event_id === body.event_id)
    if (!listing || !listing.split.splits.includes(body.quantity)) fail(422, "This ticket isn't available as a VIP package.")
    editable(p)
    Object.assign(p, { listing, quantity: body.quantity, flight: null, hotel: null, esim: null, offers: {}, hotelSearch: null, rates: {}, locks: {} })
    save(db)
    return view(p)
  },

  async deletePackage(id) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    editable(p)
    delete db.packages[id]
    save(db)
    return null
  },

  async searchFlights(id, body) {
    await wait(900)
    const db = load()
    const p = getPkg(db, id)
    if (!/^[A-Za-z]{3}$/.test(body.origin)) fail(422, 'The origin field must be 3 characters.')
    const matchDay = p.event.date.slice(0, 10)
    if (body.departure_date && (body.departure_date < addDays(matchDay, -1) || body.departure_date > matchDay))
      fail(422, 'That date is outside the window this package allows.')
    if (body.return && body.return_date && (body.return_date < addDays(matchDay, 1) || body.return_date > addDays(matchDay, 3)))
      fail(422, 'That date is outside the window this package allows.')
    const offers = offersFor(p, { ...body, origin: body.origin.toUpperCase() })
    p.offers = Object.fromEntries(offers.map((o) => [o.id, o]))
    save(db)
    return offers
  },

  async addFlight(id, body: VipAddFlightBody) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    const offer = p.offers[body.offer_id]
    if (!offer) fail(422, 'This flight offer is invalid or expired. Please search again.')
    editable(p)
    const sameOffer = p.flight?.offer.id === body.offer_id
    p.flight = { offer: offer!, services: 0, expiresAt: Date.now() + FLIGHT_HOLD_MS }
    /* A different flight removes the hotel: its dates followed the old one,
       or (flexible) were picked without a flight. */
    if (!sameOffer) {
      p.hotel = null
      p.hotelSearch = null
      p.rates = {}
      p.locks = {}
    }
    save(db)
    return view(p)
  },

  async searchHotels(id, body: VipHotelSearchBody) {
    await wait(900)
    const db = load()
    const p = getPkg(db, id)
    const matchDay = p.event.date.slice(0, 10)
    if (!p.flight && p.mode !== 'flexible') fail(422, 'Add a flight to this package first.')
    if (p.flight && p.flight.expiresAt < Date.now()) fail(422, 'Your flight has expired. Please choose your flight again.')
    // Contract 2.6: a real country code (upper or lower case), no spaces.
    if (!/^[A-Za-z]{2}$/.test(body.residency ?? '') || ['zz', 'en'].includes(String(body.residency).toLowerCase())) {
      throw new VipApiError('Validation failed', 422, { residency: ['Select a valid citizenship.'] })
    }
    if (body.rooms < 1 || body.rooms > Math.min(p.quantity, 9)) fail(422, 'You can book at most one room per traveller.')
    let checkIn: string
    let checkOut: string
    if (p.flight) {
      /* Contract 2.4, with a flight: check-in = the day the outbound lands. */
      if (body.check_in) fail(422, 'Your hotel dates follow your flight.')
      checkIn = p.flight.offer.slices[0].segments[p.flight.offer.slices[0].segments.length - 1].arriving_at.slice(0, 10)
      const back = p.flight.offer.slices[1]
      const returnDay = back ? (back.segments[0]?.departing_at ?? back.departure_date).slice(0, 10) : null
      if (body.nights !== undefined && (body.nights < 1 || body.nights > 7)) fail(422, 'Choose between 1 and 7 nights.')
      if (!returnDay && body.nights === undefined) fail(422, 'Choose between 1 and 7 nights.')
      checkOut = body.nights !== undefined ? addDays(checkIn, body.nights) : returnDay!
      if (returnDay && checkOut > returnDay) fail(422, `Your hotel must check out by your return flight on ${returnDay}.`)
    } else {
      /* Flexible, no flight: the customer picks the dates (contract 2.4). */
      const earliest = addDays(matchDay, -2) > todayMadrid() ? addDays(matchDay, -2) : todayMadrid()
      if (earliest > matchDay) fail(422, 'We could not work out your hotel dates.')
      if (body.check_in && !/^\d{4}-\d{2}-\d{2}$/.test(body.check_in)) {
        throw new VipApiError('Validation failed', 422, { check_in: ['The check in field must be a valid date.'] })
      }
      if (!body.check_in || body.check_in < earliest || body.check_in > matchDay)
        fail(422, `Choose a check-in between ${earliest} and ${matchDay}.`)
      if (!body.nights || body.nights < 1 || body.nights > 7) fail(422, 'Choose between 1 and 7 nights.')
      checkIn = body.check_in!
      checkOut = addDays(checkIn, body.nights!)
    }
    if (checkOut <= matchDay) fail(422, 'Your stay must include the night of the match.')
    editable(p)
    p.hotelSearch = {
      rooms: body.rooms,
      checkIn,
      checkOut,
      nights: addDaysBetween(checkIn, checkOut),
      withFlight: !!p.flight,
      at: Date.now(),
    }
    p.rates = {}
    p.locks = {}
    save(db)
    return HOTELS.map((h) => ({ ...h, address: `${h.address}, ${p.event.hospitality.city}` }))
  },

  async getHotelRates(id, optionId): Promise<VipHotelRatesRaw> {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    if (!p.hotelSearch) fail(422, 'Search for hotels first.')
    const hotel = HOTELS.find((h) => h.option_id === optionId) ?? fail(404, 'Hotel not found.')
    const rooms = p.hotelSearch!.rooms
    const nights = p.hotelSearch!.nights
    const per = hotel.stars === 5 ? 180 : 140
    const r1 = per * nights * rooms
    const r2 = (per + 90) * nights * rooms
    if (hotel.provider === 'etg') {
      const a = 'h-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      const b = 'h-changed-bbbb-cccc-dddd-eeeeeeeeeeee'
      p.rates[a] = { optionId, name: 'Premium Double room (city view)', total: r1 }
      p.rates[b] = { optionId, name: 'Junior Suite', total: r2 }
      save(db)
      /* The normal hotel screen's ETG room fields (test mode only). */
      return {
        rooms: [
          {
            book_hash: a,
            room_name: 'Premium Double room (city view)',
            main_room_type: 'Premium Double room',
            misc_room_type: 'city view',
            total_price: r1,
            price_per_night: r1 / nights,
            currency: 'EUR',
            meal_type: 'breakfast',
            has_breakfast: true,
            is_refundable: true,
            free_cancellation_before: '2027-03-01T15:00:00',
            free_cancellation_before_display: '1 Mar 2027, 16:00',
            hotel_timezone: 'Europe/Madrid',
            bed_type: 'double',
            max_guests: 2,
            amenities: ['air-conditioning', 'minibar', 'safe', 'free-wifi', 'rain-shower'],
            images: ['/figma/vip/hotel-suite.jpg'],
          },
          {
            book_hash: b,
            room_name: 'Junior Suite',
            total_price: r2,
            price_per_night: r2 / nights,
            currency: 'EUR',
            meal_type: 'nomeal',
            has_breakfast: false,
            is_refundable: false,
            free_cancellation_before: null,
            bed_type: 'king',
            max_guests: 3,
            amenities: ['bathtub', 'lounge-area', 'free-wifi'],
            images: [],
          },
        ],
      }
    }
    const a = 'rat_0000EXAMPLE1'
    const b = 'rat_0000EXAMPLE2'
    p.rates[a] = { optionId, name: 'Deluxe King Room', total: r1 }
    p.rates[b] = { optionId, name: 'Grand Suite', total: r2 }
    save(db)
    /* Duffel Stays accommodation shape (test mode only). */
    return {
      accommodation: {
        description: 'A five star hotel close to the stadium, with a rooftop pool and spa.\n\nThe match is a short taxi ride away.',
        phone_number: '+34 900 000 000',
        email: 'stay@example.test',
        location: { geographic_coordinates: { latitude: 41.3809, longitude: 2.1228 } },
        check_in_information: { check_in_after_time: '15:00', check_out_before_time: '12:00' },
        photos: [{ url: '/figma/vip/hotel-suite.jpg' }],
        amenities: [{ type: 'spa', description: 'Spa' }, { type: 'pool', description: 'Pool' }, { type: 'gym', description: 'Gym' }],
        rooms: [
          {
            name: 'Deluxe King Room',
            photos: [{ url: '/figma/vip/hotel-suite.jpg' }],
            beds: [{ type: 'king', count: 1 }],
            rates: [
              {
                id: a,
                total_amount: r1.toFixed(2),
                total_currency: 'EUR',
                board_type: 'breakfast',
                cancellation_timeline: [{ before: '2027-03-01T15:00:00Z', refund_amount: r1.toFixed(2), currency: 'EUR' }],
              },
            ],
          },
          {
            name: 'Grand Suite',
            photos: [],
            beds: [{ type: 'king', count: 1 }, { type: 'single', count: 1 }],
            rates: [{ id: b, total_amount: r2.toFixed(2), total_currency: 'EUR', board_type: 'room_only', cancellation_timeline: [] }],
          },
        ],
      },
    }
  },

  async lockHotel(id, rateId): Promise<VipHotelLockRaw> {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    const rate = p.rates[rateId] ?? fail(404, 'Rate not found.')
    editable(p)
    /* Test case: the ETG "Junior Suite" rate comes back with a new price. */
    const changed = rateId.startsWith('h-changed')
    const total = changed ? rate!.total + 20 : rate!.total
    const lockId = rateId.startsWith('h-') ? rateId.replace('h-', 'p-') : `quo_${rid(10)}`
    p.locks[lockId] = { rateId, total, at: Date.now() }
    save(db)
    return rateId.startsWith('h-')
      ? { id: lockId, price_changed: changed, total_price: total, currency: 'EUR' }
      : { id: lockId, total_amount: total.toFixed(2), total_currency: 'EUR' }
  },

  async addHotel(id, lockId) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    const lock = p.locks[lockId] ?? fail(404, 'Hotel not found.')
    if (!p.flight && p.mode !== 'flexible') fail(422, 'Add a flight to this package first.')
    if (!p.hotelSearch) fail(422, 'Search for hotels first.')
    editable(p)
    const rate = p.rates[lock!.rateId]
    const hotel = HOTELS.find((h) => h.option_id === rate.optionId)!
    p.hotel = {
      optionId: rate.optionId,
      provider: hotel.provider,
      name: hotel.name,
      roomName: rate.name,
      total: lock!.total,
      checkin: p.hotelSearch!.checkIn,
      checkout: p.hotelSearch!.checkOut,
      rooms: p.hotelSearch?.rooms ?? 1,
      expiresAt: Date.now() + HOTEL_HOLD_MS,
    }
    save(db)
    return view(p)
  },

  async getEsims(id, page): Promise<VipEsimPage> {
    await wait()
    getPkg(load(), id)
    return { data: page === 1 ? ESIMS : [], pagination: { total: ESIMS.length, per_page: 15, page, last_page: 1 } }
  },

  async addEsim(id, packageId, quantity) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    if (quantity < 1 || quantity > p.quantity) fail(422, `Choose between 1 and ${p.quantity} eSIMs.`)
    const plan = ESIMS.find((e) => e.package_id === packageId) ?? fail(422, "This eSIM isn't available for your package.")
    editable(p)
    p.esim = { plan: plan!, quantity }
    save(db)
    return view(p)
  },

  async removeFlight(id) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    editable(p)
    /* The hotel goes with it: its dates came from the flight. */
    Object.assign(p, { flight: null, hotel: null, offers: {}, hotelSearch: null, rates: {}, locks: {} })
    save(db)
    return view(p)
  },

  async removeHotel(id) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    editable(p)
    Object.assign(p, { hotel: null, locks: {} })
    save(db)
    return view(p)
  },

  async removeEsim(id) {
    await wait()
    const db = load()
    const p = getPkg(db, id)
    editable(p)
    p.esim = null
    save(db)
    return view(p)
  },

  async checkout(body: VipCheckoutBody): Promise<VipCheckoutResult> {
    await wait(1200)
    const db = load()
    const p = Object.values(db.packages).find((x) => x.status === 'building' || x.status === 'checkout_started') ?? fail(404, 'Cart not found.')
    if (!mockSettings().enabled) fail(409, 'VIP packages are unavailable right now.')
    if (p!.mode === 'package' && !p!.flight) fail(422, 'Add a flight to your package first.')
    if (p!.mode === 'package' && !p!.hotel) fail(422, 'Add a hotel to your package first.')
    if (p!.flight && p!.flight.expiresAt < Date.now()) {
      p!.status = 'building'
      save(db)
      fail(422, 'Your flight price expired. Please choose your flight again.')
    }
    if (p!.hotel && p!.hotel.expiresAt < Date.now()) {
      p!.status = 'building'
      save(db)
      fail(422, 'Your hotel price expired. Please choose your hotel again.')
    }
    if (!body.email || !body.matchday?.[0]?.customer?.first_name) fail(422, 'Unable to start checkout. Please try again.')
    if (p!.flight && !body.flights?.[0]?.passengers?.length) fail(422, 'Unable to start checkout. Please try again.')
    if (p!.hotel && !body.stays?.length) fail(422, 'Unable to start checkout. Please try again.')
    const sessionId = `cs_test_mock${rid(16)}`
    const summary = view(p!).price_summary
    /* Test mode skips Stripe: the "payment" succeeds at once and the
       customer lands on our success page, as Stripe would send them. */
    p!.status = 'paid'
    p!.sessionId = sessionId
    p!.paidAt = Date.now()
    save(db)
    return {
      checkout_url: `${window.location.origin}/payment-success?session_id=${sessionId}&checkout=cart`,
      session_id: sessionId,
      ledger_ids: [4821, 4822, 4823],
      matchday_order_ids: [310],
      checkout_type: 'cart',
      hospitality_package_id: p!.id,
      price_summary: summary,
    }
  },

  async getTransaction(sessionId): Promise<VipLedgerTransaction> {
    await wait(300)
    const db = load()
    const p = Object.values(db.packages).find((x) => x.sessionId === sessionId) ?? fail(404, 'Transaction not found.')
    const v = paidView(p!)
    const stage = paidStage(p!)
    return {
      status: stage === 'completed' ? 'completed' : 'processing',
      status_message: stage === 'paid' ? 'Your VIP package items will be booked as soon as your match tickets are confirmed.' : null,
      payment_status: 'paid',
      checkout_type: 'cart',
      hospitality_package_id: p!.id,
      item_count: v.items.length + 1,
      items: v.items.map((i) => ({ status: i.status, status_message: i.status_message, payment_status: 'paid' })),
      matchday_orders: [{ order_id: 310, status: stage === 'paid' ? 'paid' : 'confirmed', payment_status: 'paid', quantity: p!.quantity, attendees_required: [] }],
    }
  },
}
