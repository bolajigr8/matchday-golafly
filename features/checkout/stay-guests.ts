// features/checkout/stay-guests.ts
//
// Guest names for a hotel in the cart checkout (POST /cart/checkout `stays`).
// Same rules as the travels cart checkout (features/cart/checkout-schema.ts):
//  - ETG: one name per guest, room by room; a gender only when the hotel
//    requires it (its is_gender_specification_required, kept on the cart
//    line as `genderRequired`; asked anyway when that flag is missing).
//  - Duffel: exactly as many guests as were searched for, date of birth
//    optional.

import { z } from 'zod'
import type { CartCheckoutStayPayload } from '@/features/cart/types'
import type { StayGuest } from '@/features/stays/types'
import { normalizeRoomGuests } from '@/features/stays/utils'

const STAY_NAME_RE = /^[\p{L}\p{M}\s',.’-]+$/u
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type StayGender = 'male' | 'female' | 'unknown' | ''

export interface StayGuestDraft {
  first_name: string
  last_name: string
  gender: StayGender
}
export interface StayChildDraft extends StayGuestDraft {
  age: number
}
export interface StayRoomDraft {
  adults: StayGuestDraft[]
  children: StayChildDraft[]
}
export interface DuffelGuestDraft {
  given_name: string
  family_name: string
  born_on: string
}

/** What the checkout needs to know about the hotel line in the cart. */
export interface StayCheckoutLine {
  provider: 'etg' | 'duffel'
  hotelName: string
  roomName: string
  occupancy: StayGuest[]
  genderRequired: boolean
  residency: string | null
}

export function stayCheckoutLine(payload: Record<string, unknown> | undefined): StayCheckoutLine | null {
  if (!payload) return null
  const occupancy = Array.isArray(payload.occupancy)
    ? normalizeRoomGuests(payload.occupancy as StayGuest[])
    : normalizeRoomGuests([
        {
          adults: Number(payload.adults) || 1,
          children: [],
        },
      ])
  return {
    provider: payload.provider === 'duffel' ? 'duffel' : 'etg',
    hotelName: String(payload.hotelName ?? 'Hotel'),
    roomName: String(payload.roomName ?? ''),
    occupancy,
    // Missing flag: ask anyway (safer than a booking ETG refuses).
    genderRequired: payload.genderRequired !== false,
    residency: typeof payload.residency === 'string' ? payload.residency : null,
  }
}

const blank = (): StayGuestDraft => ({ first_name: '', last_name: '', gender: '' })

export function emptyStayRooms(occupancy: StayGuest[]): StayRoomDraft[] {
  return occupancy.map((room) => ({
    adults: Array.from({ length: room.adults }, blank),
    children: room.children.map((age) => ({ ...blank(), age })),
  }))
}

export function duffelGuestCount(occupancy: StayGuest[]): number {
  return Math.max(1, occupancy.reduce((sum, r) => sum + r.adults + r.children.length, 0))
}

export function emptyDuffelGuests(count: number): DuffelGuestDraft[] {
  return Array.from({ length: count }, () => ({ given_name: '', family_name: '', born_on: '' }))
}

const name = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .regex(STAY_NAME_RE, `${label} may only contain letters`)

function etgRoomsSchema(genderRequired: boolean) {
  const gender = genderRequired
    ? z.enum(['male', 'female', 'unknown'], { errorMap: () => ({ message: 'Select a gender for this guest' }) })
    : z.enum(['male', 'female', 'unknown']).or(z.literal('')).optional()
  const guest = z.object({ first_name: name('First name', 50), last_name: name('Last name', 50), gender })
  return z.object({
    rooms: z
      .array(z.object({ adults: z.array(guest).min(1), children: z.array(guest.extend({ age: z.number().int().min(0).max(17) })) }))
      .min(1),
  })
}

function duffelGuestsSchema(count: number) {
  return z.object({
    guests: z
      .array(
        z.object({
          given_name: name('First name', 100),
          family_name: name('Last name', 100),
          born_on: z.string().optional().refine((v) => !v || DATE_RE.test(v), 'Enter a valid date of birth'),
        }),
      )
      .length(count),
  })
}

/** Field errors keyed like "rooms.0.adults.1.first_name" / "guests.0.given_name". */
export function validateStayGuests(
  line: StayCheckoutLine,
  rooms: StayRoomDraft[],
  duffel: DuffelGuestDraft[],
): Record<string, string> {
  const parsed =
    line.provider === 'duffel'
      ? duffelGuestsSchema(duffelGuestCount(line.occupancy)).safeParse({ guests: duffel })
      : etgRoomsSchema(line.genderRequired).safeParse({ rooms })
  if (parsed.success) return {}
  const out: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.')
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export function stayCheckoutPayload(
  cartItemId: string,
  line: StayCheckoutLine,
  rooms: StayRoomDraft[],
  duffel: DuffelGuestDraft[],
): CartCheckoutStayPayload {
  if (line.provider === 'duffel') {
    return {
      cart_item_id: cartItemId,
      guests: duffel.map((g) => ({
        given_name: g.given_name.trim(),
        family_name: g.family_name.trim(),
        ...(g.born_on ? { born_on: g.born_on } : {}),
      })),
    }
  }
  return {
    cart_item_id: cartItemId,
    language: 'en',
    rooms: rooms.map((room) => ({
      guests: [
        ...room.adults.map((g) => ({
          first_name: g.first_name.trim(),
          last_name: g.last_name.trim(),
          ...(g.gender ? { gender: g.gender } : {}),
        })),
        // ETG: a guest with an age but no is_child counts as an adult.
        ...room.children.map((g) => ({
          first_name: g.first_name.trim(),
          last_name: g.last_name.trim(),
          is_child: true,
          age: g.age,
          ...(g.gender ? { gender: g.gender } : {}),
        })),
      ],
    })),
  }
}
