'use client'

import { useEffect, useState } from 'react'
import type { AvailableService, FlightOffer } from './types'

export const EXTRA_OPTIONS = [
  {
    id: 'priority',
    title: 'Priority Boarding',
    body: 'Skip the queue and board first. Perfect if you travel with carry-on only.',
  },
  {
    id: 'insurance',
    title: 'Travel Insurance',
    body: 'International medical coverage, 24/7 assistance, and trip cancellation protection.',
  },
] as const

export interface SelectedSeat {
  designator: string
  serviceId: string
  passengerId: string
  segmentId: string
  amount: number
  currency: string
}

export function seatKey(segmentId: string, passengerId: string) {
  return `${segmentId}::${passengerId}`
}

export interface SelectedBag {
  serviceId: string
  passengerId: string
  groupKey: string
  amount: number
  currency: string
}

export function bagKey(passengerId: string, groupKey: string) {
  return `${passengerId}::${groupKey}`
}

export interface AncillaryState {
  bags: Record<string, SelectedBag>
  skipBags: boolean
  seats: Record<string, SelectedSeat>
}

const DEFAULT_STATE: AncillaryState = {
  bags: {},
  skipBags: false,
  seats: {},
}

const storageKey = (offerId: string) => `flight-ancillaries:${offerId}`

export function useAncillaries(offerId: string | null) {
  const [state, setState] = useState<AncillaryState>(DEFAULT_STATE)

  useEffect(() => {
    if (!offerId) return
    try {
      const raw = sessionStorage.getItem(storageKey(offerId))
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) })
      else setState(DEFAULT_STATE)
    } catch {
      setState(DEFAULT_STATE)
    }
  }, [offerId])

  function update(patch: Partial<AncillaryState>) {
    setState((prev) => {
      const next = { ...prev, ...patch }
      if (offerId) {
        try {
          sessionStorage.setItem(storageKey(offerId), JSON.stringify(next))
        } catch {
          /* storage full / unavailable — selection still works in-memory */
        }
      }
      return next
    })
  }

  function setBag(passengerId: string, group: BaggageGroup, on: boolean) {
    const pax = group.perPassenger.find((p) => p.passengerId === passengerId)
    if (!pax) return
    const key = bagKey(passengerId, group.key)
    const nextBags = { ...state.bags }
    if (on) {
      nextBags[key] = {
        serviceId: pax.serviceId,
        passengerId,
        groupKey: group.key,
        amount: pax.amount,
        currency: group.currency,
      }
    } else {
      delete nextBags[key]
    }
    update({ bags: nextBags })
  }

  return { state, update, setBag }
}

export interface BaggageGroup {
  key: string
  label: string
  maxWeightKg: number | null
  maxLengthCm: number | null
  maxHeightCm: number | null
  maxDepthCm: number | null
  currency: string
  segmentIds: string[]
  perPassenger: { passengerId: string; serviceId: string; amount: number }[]
}

export function groupBaggageOptions(
  offer: FlightOffer | undefined,
): BaggageGroup[] {
  const services: AvailableService[] = (offer?.available_services ?? []).filter(
    (s) => s.type === 'baggage',
  )
  const groups = new Map<string, AvailableService[]>()
  for (const s of services) {
    // IMPORTANT: segment_ids must be part of the grouping key. Duffel
    // scopes each baggage service to specific segment(s) — a round trip
    // typically has ONE service per leg per passenger, same type/weight/
    // price but different segment_ids and different `ase_` id. Grouping
    // by type+weight+price alone (the old key) silently collapsed the
    // outbound and return bag services into a single group, and
    // setBag()'s .find() then only ever selected the FIRST one —
    // meaning a customer who checked the box once for a round trip could
    // end up with baggage purchased for only one leg. Sorting the
    // segment ids keeps the key stable regardless of array order.
    const segKey = [...s.segment_ids].sort().join('+')
    const key = `${s.metadata?.type ?? 'bag'}-${s.metadata?.maximum_weight_kg ?? 'na'}-${s.total_amount}-${segKey}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }
  return [...groups.entries()].map(([key, list]) => {
    const meta = list[0].metadata
    const weight = meta?.maximum_weight_kg ?? null
    const typeLabel = meta?.type === 'checked' ? 'Checked Bag' : 'Extra Bag'
    return {
      key,
      label: weight ? `${typeLabel} (${weight}kg)` : typeLabel,
      maxWeightKg: weight,
      maxLengthCm: meta?.maximum_length_cm ?? null,
      maxHeightCm: meta?.maximum_height_cm ?? null,
      maxDepthCm: meta?.maximum_depth_cm ?? null,
      currency: list[0].total_currency,
      segmentIds: list[0].segment_ids,
      perPassenger: list.flatMap((s) =>
        (s.passenger_ids.length > 0 ? s.passenger_ids : ['']).map((pid) => ({
          passengerId: pid,
          serviceId: s.id,
          amount: parseFloat(s.total_amount),
        })),
      ),
    }
  })
}

export function findSegmentInfo(
  offer: FlightOffer | undefined,
  segmentId: string,
) {
  for (const slice of offer?.slices ?? []) {
    const seg = slice.segments.find((s) => s.id === segmentId)
    if (seg) return { slice, segment: seg }
  }
  return null
}

export interface AncillaryLineItem {
  label: string
  amount: number
  category: 'bag' | 'seat'
}

export function ancillaryLineItems(
  state: AncillaryState,
  offer: FlightOffer | undefined,
): AncillaryLineItem[] {
  const items: AncillaryLineItem[] = []

  if (!state.skipBags) {
    // FIX (duplicate React key "Bag"): every bag line item previously
    // shared the literal label "Bag", which booking-summary.tsx keys off
    // of — causing "two children with the same key" the moment more than
    // one bag was selected. Labels are now unique per bag, built from the
    // bag's own group info (type/weight) plus which passenger it belongs
    // to, so no two line items can ever collide.
    const groups = offer ? groupBaggageOptions(offer) : []
    for (const bag of Object.values(state.bags)) {
      const group = groups.find((g) => g.key === bag.groupKey)
      const passenger = offer?.passengers.find((p) => p.id === bag.passengerId)
      const paxLabel = passenger?.given_name
        ? passenger.given_name
        : bag.passengerId
      items.push({
        label: `${group?.label ?? 'Bag'} — ${paxLabel}`,
        amount: bag.amount,
        category: 'bag',
      })
    }
  }

  for (const seat of Object.values(state.seats)) {
    items.push({
      label: `Seat ${seat.designator}`,
      amount: seat.amount,
      category: 'seat',
    })
  }

  return items
}

export function ancillariesTotal(items: AncillaryLineItem[]) {
  return items.reduce((sum, i) => sum + i.amount, 0)
}

export function ancillaryServicesPayload(state: AncillaryState): {
  id: string
  quantity: number
  passenger_id?: string
  segment_id?: string
}[] {
  const services: {
    id: string
    quantity: number
    passenger_id?: string
    segment_id?: string
  }[] = []

  if (!state.skipBags) {
    for (const bag of Object.values(state.bags)) {
      services.push({
        id: bag.serviceId,
        quantity: 1,
        passenger_id: bag.passengerId || undefined,
      })
    }
  }

  for (const seat of Object.values(state.seats)) {
    services.push({
      id: seat.serviceId,
      quantity: 1,
      passenger_id: seat.passengerId,
      segment_id: seat.segmentId,
    })
  }

  return services
}
