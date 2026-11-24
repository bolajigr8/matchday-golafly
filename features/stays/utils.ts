// features/stays/utils.ts
//
// Copied from the travels app. Guests are a real per-room breakdown
// (searchParams.guests); nothing guesses a split from flat totals any more.

import type { StayGuest } from './types'

/**
 * NOTE — this file used to contain distributeAdultsAcrossRooms /
 * distributeChildrenAcrossRooms / buildRoomGuestCounts, which guessed an
 * even split of a flat guest count across rooms. That's gone: the
 * supplier prices each room configuration separately, so a guessed
 * split is a different (and differently priced) product from what the
 * user actually meant, and the backend now verifies the guests you send
 * against what was priced — a guessed split produces a 422
 * occupancy_mismatch at the booking form instead of a silently
 * mispriced booking. The Guests & Rooms widget now collects a real
 * per-room breakdown directly (see store/stays.ts `searchParams.guests`
 * and components/stays/guests-rooms-picker.tsx), so these helpers just
 * operate on that array instead of reconstructing it.
 */

export const MAX_ADULTS_PER_ROOM = 6
export const MAX_CHILDREN_PER_ROOM = 4
export const MAX_ROOMS_PER_BOOKING = 9
export const MAX_CHILD_AGE = 17

export function createEmptyRoom(): StayGuest {
  return { adults: 2, children: [] }
}

export function totalAdults(guests: StayGuest[]): number {
  return guests.reduce((sum, r) => sum + r.adults, 0)
}

export function totalChildren(guests: StayGuest[]): number {
  return guests.reduce((sum, r) => sum + r.children.length, 0)
}

export function totalRooms(guests: StayGuest[]): number {
  return guests.length
}

export function totalGuests(guests: StayGuest[]): number {
  return totalAdults(guests) + totalChildren(guests)
}

/**
 * Deep-clones and defends against a persisted/legacy value that's empty
 * or malformed (e.g. from an older localStorage snapshot) by falling
 * back to a single default room.
 */
export function normalizeRoomGuests(
  guests: StayGuest[] | null | undefined,
): StayGuest[] {
  if (!guests || guests.length === 0) return [createEmptyRoom()]
  return guests.map((r) => ({
    adults: Math.max(1, Math.min(MAX_ADULTS_PER_ROOM, r.adults || 1)),
    children: (r.children ?? [])
      .slice(0, MAX_CHILDREN_PER_ROOM)
      .map((age) => Math.max(0, Math.min(MAX_CHILD_AGE, age))),
  }))
}

export function addRoom(guests: StayGuest[]): StayGuest[] {
  if (guests.length >= MAX_ROOMS_PER_BOOKING) return guests
  return [...guests, createEmptyRoom()]
}

export function removeRoom(guests: StayGuest[], index: number): StayGuest[] {
  if (guests.length <= 1) return guests
  return guests.filter((_, i) => i !== index)
}

export function setRoomAdults(
  guests: StayGuest[],
  index: number,
  adults: number,
): StayGuest[] {
  const clamped = Math.max(1, Math.min(MAX_ADULTS_PER_ROOM, adults))
  return guests.map((r, i) => (i === index ? { ...r, adults: clamped } : r))
}

export function setRoomChildCount(
  guests: StayGuest[],
  index: number,
  count: number,
): StayGuest[] {
  const clamped = Math.max(0, Math.min(MAX_CHILDREN_PER_ROOM, count))
  return guests.map((r, i) => {
    if (i !== index) return r
    const next = r.children.slice(0, clamped)
    while (next.length < clamped) next.push(8)
    return { ...r, children: next }
  })
}

export function setRoomChildAge(
  guests: StayGuest[],
  roomIndex: number,
  childIndex: number,
  age: number,
): StayGuest[] {
  const clamped = Math.max(0, Math.min(MAX_CHILD_AGE, age))
  return guests.map((r, i) => {
    if (i !== roomIndex) return r
    const children = [...r.children]
    children[childIndex] = clamped
    return { ...r, children }
  })
}

/**
 * Two guests arrays are the same room configuration if every room has
 * the same adult count and the same set of child ages, in the same room
 * order. Order matters — ETG assigns rates per room position, so a
 * reordered-but-otherwise-identical array is NOT considered the same
 * request and should trigger a fresh search rather than reusing stale
 * results.
 */
export function guestsEqual(a: StayGuest[], b: StayGuest[]): boolean {
  if (a.length !== b.length) return false
  return a.every((room, i) => {
    const other = b[i]
    if (!other || room.adults !== other.adults) return false
    if (room.children.length !== other.children.length) return false
    return room.children.every((age, j) => age === other.children[j])
  })
}

export function summarizeGuests(guests: StayGuest[]): string {
  const adults = totalAdults(guests)
  const children = totalChildren(guests)
  const rooms = totalRooms(guests)
  const parts = [`${adults} Guest${adults !== 1 ? 's' : ''}`]
  if (children > 0) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`)
  parts.push(`${rooms} Room${rooms !== 1 ? 's' : ''}`)
  return parts.join(' · ')
}

/** One room's occupancy, as sent to the hotel APIs. Kept as a named alias
 *  for the checkout guest forms. */
export type RoomGuestCount = StayGuest
