// features/vip/package.ts
//
// Small readers over the package shape the backend returns (contract
// §2.2–2.6). Nothing is calculated here: prices are the backend's
// price_summary, lines are the backend's items.

import { ancillaryServicesPayload, type AncillaryState } from '@/features/flights/ancillaries'
import type { FlightSlice } from '@/features/flights/types'
import type {
  VipFlightOffer,
  VipFlightService,
  VipPackage,
  VipPackageItem,
  VipPackageMode,
  VipStepName,
} from './contract'

export function packageItem(p: VipPackage | null | undefined, type: VipPackageItem['type']): VipPackageItem | null {
  return p?.items.find((i) => i.type === type) ?? null
}

/** The mode the package was created under (contract §1, "The two modes").
 *  An answer without it is a package-mode one. */
export function packageMode(p: VipPackage | null | undefined): VipPackageMode {
  return p?.mode === 'flexible' ? 'flexible' : 'package'
}

/** Is this step needed to check out? From `required_steps` when sent,
 *  else from the step's own `optional` flag. */
export function stepRequired(p: VipPackage, step: VipStepName): boolean {
  if (p.required_steps?.length) return p.required_steps.includes(step)
  return !p.steps[step].optional
}

/** Travellers = the ticket quantity (contract §2.2). */
export function packageTravellers(p: VipPackage | null | undefined): number {
  return packageItem(p, 'matchday')?.quantity ?? 1
}

/* The package's flight line may carry only `offerId` (the Postman examples
   are trimmed that way), while checkout needs the offer's passengers[].id
   (contract §2.3: "Keep each offer's passengers[].id"). So the offer the
   customer added is kept per package in sessionStorage and used whenever
   the line has no `offer` of its own, as long as the ids match. */
const offerKey = (packageId: string) => `golafly-vip-offer:${packageId}`

export function rememberFlightOffer(packageId: string, offer: VipFlightOffer): void {
  try {
    sessionStorage.setItem(offerKey(packageId), JSON.stringify(offer))
  } catch {
    /* storage full or blocked: the line's own offer is still used if present */
  }
}

function storedFlightOffer(packageId: string, offerId: string | undefined): VipFlightOffer | null {
  if (!offerId) return null
  try {
    const raw = sessionStorage.getItem(offerKey(packageId))
    const offer = raw ? (JSON.parse(raw) as VipFlightOffer) : null
    return offer?.id === offerId ? offer : null
  } catch {
    return null
  }
}

export function flightOfferOf(p: VipPackage | null | undefined): VipFlightOffer | null {
  const line = packageItem(p, 'flight')
  if (!p || !line) return null
  return (line.offer as VipFlightOffer | undefined) ?? storedFlightOffer(p.id, line.offerId)
}

export function hasReturnFlight(p: VipPackage | null | undefined): boolean {
  return (flightOfferOf(p)?.slices.length ?? 0) > 1
}

/** "business" / "first" for an offer (the cabin of its first leg). */
export function offerCabin(offer: VipFlightOffer): string | null {
  const c = offer.slices[0]?.segments[0]?.passengers?.[0]?.cabin_class ?? offer.slices[0]?.fare_brand_name ?? null
  if (!c) return null
  const k = c.toLowerCase()
  if (k.includes('first')) return 'First Class'
  if (k.includes('business')) return 'Business'
  return c
}

export function sliceStops(slice: FlightSlice): number {
  return Math.max(0, slice.segments.length - 1)
}

export function sliceCarrier(slice: FlightSlice): string {
  return slice.segments[0]?.marketing_carrier?.name ?? ''
}

/** Bags and seats the customer picked in the main flow's ancillaries step
 *  (kept per offer in sessionStorage by features/flights/ancillaries.ts),
 *  shaped for POST …/flight `services`. */
export function storedFlightServices(offerId: string): VipFlightService[] {
  try {
    const raw = sessionStorage.getItem(`flight-ancillaries:${offerId}`)
    if (!raw) return []
    const state = { bags: {}, skipBags: false, seats: {}, ...JSON.parse(raw) } as AncillaryState
    return ancillaryServicesPayload(state).slice(0, 50)
  } catch {
    return []
  }
}
