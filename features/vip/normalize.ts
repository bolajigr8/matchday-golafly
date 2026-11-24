// features/vip/normalize.ts
//
// The hotel rates and the hotel lock come back in the hotel supplier's own
// shape (contract §2.4 and §4): one supplier lists `rooms[]` with a
// `book_hash` per room; the other lists `accommodation.rooms[].rates[]`
// with an `id` per rate. These readers turn either into one small shape
// for the VIP screens. They never guess a price: a missing figure stays
// null and the screen says the price is confirmed in the basket.
//
// The supplier is never shown to the customer.

export interface VipMoney {
  amount: number
  currency: string
}

export interface VipHotelRate {
  /** What POST …/hotel/lock takes as rate_id. */
  rateId: string
  /** The supplier's FULL room name (qualifiers included): shown in full. */
  roomName: string
  /** Short type + qualifiers, when the supplier splits them (styled title). */
  mainRoomType: string | null
  miscRoomType: string | null
  /** Per night as the supplier quotes it, or null. */
  pricePerNight: VipMoney | null
  bedType: string | null
  maxGuests: number | null
  amenities: string[]
  /** "21 Oct 2026, 17:00 (hotel time)" style text, or null. */
  freeCancellationBefore: string | null
  images: string[]
  /** Total for the stay, all rooms, as the supplier quotes it. */
  price: VipMoney | null
  /** "Breakfast included", "Room only" … or null. */
  board: string | null
  /** true / false when the supplier says so, null when it doesn't. */
  refundable: boolean | null
  image: string | null
  /** Taxes the guest pays at the hotel (never added to the price). */
  payAtProperty: VipMoney | null
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

function money(amount: unknown, currency: unknown): VipMoney | null {
  const a = num(amount)
  const c = str(currency)
  return a !== null && c ? { amount: a, currency: c.toUpperCase() } : null
}

const BOARD: Record<string, string> = {
  room_only: 'Room only',
  breakfast: 'Breakfast included',
  half_board: 'Half board',
  full_board: 'Full board',
  all_inclusive: 'All inclusive',
  nomeal: 'Room only',
}

function boardLabel(raw: unknown, hasBreakfast?: unknown): string | null {
  const key = str(raw)?.toLowerCase()
  if (key && BOARD[key]) return BOARD[key]
  if (key) return key.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  if (hasBreakfast === true) return 'Breakfast included'
  return null
}

function photos(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((p) => str(p) ?? (isObj(p) ? str(p.url) : null)).filter((x): x is string => !!x)
}
const strList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .map((a) => str(a) ?? (isObj(a) ? (str(a.description) ?? str(a.type)) : null))
        .filter((x): x is string => !!x)
        .map((a) => a.replace(/[-_]/g, ' '))
    : []

/** A cancellation deadline as text: the supplier's own display string, or
 *  the instant written out in UTC (labelled, never the viewer's clock). */
function deadline(display: unknown, iso: unknown, zone?: unknown): string | null {
  const d = str(display)
  if (d) return str(zone) && str(zone) !== 'UTC' ? `${d} (hotel time)` : d
  const raw = str(iso)
  if (!raw) return null
  const at = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`)
  if (Number.isNaN(at.getTime())) return null
  const tz = str(zone) ?? 'UTC'
  try {
    const text = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    }).format(at)
    return tz === 'UTC' ? `${text} UTC` : `${text} (hotel time)`
  } catch {
    return null
  }
}

/** ETG-style room (rate id = book_hash). */
function fromFlatRoom(r: Record<string, unknown>): VipHotelRate | null {
  const rateId = str(r.book_hash)
  if (!rateId) return null
  const atProperty = isObj(r.total_payable_at_property)
    ? money(r.total_payable_at_property.amount, r.total_payable_at_property.currency)
    : null
  const refundable = typeof r.is_refundable === 'boolean' ? r.is_refundable : null
  const images = photos(r.images)
  return {
    rateId,
    roomName: str(r.room_name) ?? str(r.main_room_type) ?? 'Room',
    mainRoomType: str(r.main_room_type),
    miscRoomType: str(r.misc_room_type),
    price: money(r.total_price, r.currency),
    pricePerNight: money(r.price_per_night, r.currency),
    board: boardLabel(r.meal_type, r.has_breakfast),
    refundable,
    bedType: str(r.bed_type),
    maxGuests: num(r.max_guests),
    amenities: strList(r.amenities),
    freeCancellationBefore:
      refundable === true ? deadline(r.free_cancellation_before_display, r.free_cancellation_before, r.hotel_timezone) : null,
    image: images[0] ?? null,
    images,
    payAtProperty: atProperty && atProperty.amount > 0 ? atProperty : null,
  }
}

/** Duffel-style room with rates[] (rate id = rates[].id). */
function fromNestedRoom(room: Record<string, unknown>): VipHotelRate[] {
  const rates = Array.isArray(room.rates) ? room.rates : []
  const name = str(room.name) ?? str(room.room_name) ?? 'Room'
  const images = photos(room.photos)
  const beds = Array.isArray(room.beds)
    ? room.beds
        .filter(isObj)
        .map((b) => {
          const n = num(b.count) ?? 1
          const t = str(b.type)
          return t ? `${n} ${t.replace(/[-_]/g, ' ')} bed${n === 1 ? '' : 's'}` : null
        })
        .filter(Boolean)
        .join(', ')
    : ''
  return rates.filter(isObj).flatMap((rate) => {
    const rateId = str(rate.id)
    if (!rateId) return []
    const timeline = Array.isArray(rate.cancellation_timeline) ? rate.cancellation_timeline.filter(isObj) : null
    /* Free cancellation = a full refund is still possible before a time. */
    const total = num(rate.total_amount)
    const full = timeline?.find((t) => total !== null && num(t.refund_amount) === total)
    return [
      {
        rateId,
        roomName: name,
        mainRoomType: null,
        miscRoomType: null,
        price: money(rate.total_amount, rate.total_currency),
        pricePerNight: null,
        board: boardLabel(rate.board_type),
        refundable: timeline ? timeline.length > 0 : null,
        bedType: beds || null,
        maxGuests: null,
        amenities: [],
        freeCancellationBefore: full ? deadline(null, full.before) : null,
        image: images[0] ?? null,
        images,
        payAtProperty: null,
      },
    ]
  })
}

/** Every bookable rate in a rates answer, cheapest first (unknown prices last). */
export function normalizeHotelRates(raw: unknown): VipHotelRate[] {
  if (!isObj(raw)) return []
  const accommodation = isObj(raw.accommodation) ? raw.accommodation : null
  const rooms: unknown[] = Array.isArray(raw.rooms)
    ? raw.rooms
    : accommodation && Array.isArray(accommodation.rooms)
      ? accommodation.rooms
      : []
  const out = rooms.filter(isObj).flatMap((r) => (Array.isArray(r.rates) ? fromNestedRoom(r) : [fromFlatRoom(r)].filter((x): x is VipHotelRate => !!x)))
  return out.sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity))
}

export interface VipHotelLock {
  lockId: string
  priceChanged: boolean
  /** The locked price (show this, never the rates one). null = not given. */
  price: VipMoney | null
}

export function normalizeHotelLock(raw: unknown): VipHotelLock | null {
  if (!isObj(raw)) return null
  const lockId = str(raw.id)
  if (!lockId) return null
  const nested = Array.isArray(raw.rates) && isObj(raw.rates[0]) ? raw.rates[0] : null
  const price =
    money(raw.total_price, raw.currency) ??
    money(raw.total_amount, raw.total_currency) ??
    (nested ? (money(nested.total_price, nested.currency) ?? money(nested.total_amount, nested.total_currency)) : null) ??
    (isObj(raw.price) ? money(raw.price.amount, raw.price.currency) : null)
  return { lockId, priceChanged: raw.price_changed === true, price }
}

/** What the rates answer says about the hotel itself. The VIP endpoints have
 *  no hotel-information call, so this is filled only when the supplier's
 *  rates answer carries it (one supplier nests it in `accommodation`);
 *  every field is optional and the screen hides what is missing. */
export interface VipHotelInfo {
  description: string[]
  phone: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  checkInTime: string | null
  checkOutTime: string | null
  photos: string[]
  amenities: string[]
}

export function normalizeHotelInfo(raw: unknown): VipHotelInfo {
  const src = isObj(raw) ? (isObj(raw.accommodation) ? raw.accommodation : isObj(raw.hotel) ? raw.hotel : raw) : {}
  const location = isObj(src.location) ? src.location : null
  const coords = location && isObj(location.geographic_coordinates) ? location.geographic_coordinates : null
  const checkIn = isObj(src.check_in_information) ? src.check_in_information : null
  const description = str(src.description)
  const structured = Array.isArray(src.description_struct)
    ? src.description_struct.filter(isObj).flatMap((b) => (Array.isArray(b.paragraphs) ? b.paragraphs.map(str) : []))
    : []
  const time = (v: unknown) => str(v)?.slice(0, 5) ?? null
  return {
    description: [...(description ? description.split(/\n{2,}/) : []), ...structured].filter((x): x is string => !!x),
    phone: str(src.phone_number) ?? str(src.phone),
    email: str(src.email),
    latitude: num(coords?.latitude ?? src.latitude),
    longitude: num(coords?.longitude ?? src.longitude),
    checkInTime: time(checkIn?.check_in_after_time ?? src.check_in_time),
    checkOutTime: time(checkIn?.check_out_before_time ?? src.check_out_time),
    photos: photos(src.photos ?? src.images),
    amenities: strList(src.amenities),
  }
}
