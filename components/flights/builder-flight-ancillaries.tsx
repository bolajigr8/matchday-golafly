'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Armchair,
  Briefcase,
  Check,
  Luggage,
  User,
  ShieldCheck,
  RefreshCw,
  Ban,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { currencySymbol } from '@/lib/currency'
import { useFlightOffer, useSeatMap } from '@/features/flights/hooks'
import type {
  FlightOffer,
  SeatMapElement,
  SeatMapEntry,
} from '@/features/flights/types'
import {
  useAncillaries,
  ancillaryLineItems,
  ancillariesTotal,
  groupBaggageOptions,
  bagKey,
  seatKey,
} from '@/features/flights/ancillaries'

/**
 * Fare/baggage/change-refund summary — built entirely from fields
 * Matchday's FlightOffer type already carries (fare_brand_name,
 * passengers[].baggages, slices[].conditions). Deliberately does NOT
 * show seat/wifi/power cabin amenities the way Travels does — that data
 * lives on a per-segment `passengers[]` block that isn't part of
 * Matchday's current offer response. See the backend requirements doc:
 * if the backend starts returning that block, this is where it'd be
 * added, not invented here from nothing.
 */
function FareBenefitsSummary({ offer }: { offer: FlightOffer }) {
  const brandName = offer.slices[0]?.fare_brand_name ?? 'Economy'
  const bags = offer.passengers[0]?.baggages ?? []
  const checkedBag = bags.find((b) => b.type === 'checked' && b.quantity > 0)
  const carryOn = bags.find((b) => b.type === 'carry_on' && b.quantity > 0)
  const refundable = offer.conditions?.refund_before_departure
  const changeable = offer.conditions?.change_before_departure
  const isRefundable =
    typeof refundable === 'object' &&
    refundable !== null &&
    'allowed' in refundable &&
    (refundable as { allowed: boolean }).allowed
  const isChangeable =
    typeof changeable === 'object' &&
    changeable !== null &&
    'allowed' in changeable &&
    (changeable as { allowed: boolean }).allowed

  return (
    <div className='mb-5 rounded-xl border border-border bg-muted/30 p-4'>
      <p className='mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
        {brandName} fare includes
      </p>
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
        <div className='flex items-center gap-1.5 text-[12px]'>
          <Luggage
            className={cn(
              'size-3.5 shrink-0',
              carryOn ? 'text-emerald-500' : 'text-muted-foreground',
            )}
          />
          <span
            className={carryOn ? 'text-foreground' : 'text-muted-foreground'}
          >
            {carryOn ? 'Carry-on included' : 'No carry-on'}
          </span>
        </div>
        <div className='flex items-center gap-1.5 text-[12px]'>
          <Luggage
            className={cn(
              'size-3.5 shrink-0',
              checkedBag ? 'text-emerald-500' : 'text-muted-foreground',
            )}
          />
          <span
            className={checkedBag ? 'text-foreground' : 'text-muted-foreground'}
          >
            {checkedBag
              ? `${checkedBag.quantity} checked bag${checkedBag.quantity > 1 ? 's' : ''}`
              : 'No checked bag'}
          </span>
        </div>
        <div className='flex items-center gap-1.5 text-[12px]'>
          {isChangeable ? (
            <RefreshCw className='size-3.5 shrink-0 text-emerald-500' />
          ) : (
            <Ban className='size-3.5 shrink-0 text-muted-foreground' />
          )}
          <span
            className={
              isChangeable ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {isChangeable ? 'Changes allowed' : 'No changes'}
          </span>
        </div>
        <div className='flex items-center gap-1.5 text-[12px]'>
          {isRefundable ? (
            <ShieldCheck className='size-3.5 shrink-0 text-emerald-500' />
          ) : (
            <Ban className='size-3.5 shrink-0 text-muted-foreground' />
          )}
          <span
            className={
              isRefundable ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {isRefundable ? 'Refundable' : 'Non-refundable'}
          </span>
        </div>
      </div>
    </div>
  )
}

const PAX_LABEL: Record<string, string> = {
  adult: 'Adult',
  child: 'Child',
  infant_without_seat: 'Infant',
}

function rowNumber(row: { elements: SeatMapElement[] }) {
  const seat = row.elements.find((e) => e.type === 'seat' && e.designator)
  return seat?.designator?.match(/^\d+/)?.[0] ?? null
}
function seatPriceForPassenger(el: SeatMapElement, passengerId: string) {
  return el.prices?.find((p) => p.passenger_id === passengerId) ?? null
}

export function BuilderFlightAncillaries({
  offerId,
  onTotalChange,
  forceTab,
  hideFareSummary,
}: {
  offerId: string
  onTotalChange?: (total: number) => void
  /**
   * Controlled tab, for when Bags and Seats are presented as two separate
   * wizard steps (see app/builder/extras/client.tsx) rather than as an
   * in-place tab switcher. When set, the internal tab buttons are hidden
   * and this value wins.
   */
  forceTab?: 'bags' | 'seats'
  /** Hide the fare-benefits recap — pass this when the wizard already
   *  showed it on the Fare step immediately before this one, so it isn't
   *  repeated twice in a row (e.g. Bags → Seats). */
  hideFareSummary?: boolean
}) {
  const [internalTab, setInternalTab] = useState<'bags' | 'seats'>('bags')
  const tab = forceTab ?? internalTab
  const setTab = setInternalTab
  const [activePassenger, setActivePassenger] = useState<string | null>(null)
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  const {
    data: offerData,
    isLoading: offerLoading,
    isError: offerFailed,
  } = useFlightOffer(offerId)
  const offer = offerData?.data
  const {
    data: seatMapData,
    isLoading: seatLoading,
    isError: seatMapFailed,
  } = useSeatMap(offerId)
  const seatMaps: SeatMapEntry[] = seatMapData?.data ?? []
  const { state, update, setBag } = useAncillaries(offerId)
  const passengers = offer?.passengers ?? []
  const bagGroups = useMemo(() => groupBaggageOptions(offer), [offer])
  const items = useMemo(() => ancillaryLineItems(state, offer), [state, offer])
  const total = ancillariesTotal(items)
  const symbol = currencySymbol(offer?.total_currency ?? 'EUR')
  const currentSegment =
    activeSegment ?? offer?.slices[0]?.segments[0]?.id ?? null
  const currentPassenger = activePassenger ?? passengers[0]?.id ?? null
  const currentMap = seatMaps.find((m) => m.segment_id === currentSegment)
  const currentCabin = currentMap?.cabins[0]

  useEffect(() => {
    onTotalChange?.(total)
  }, [onTotalChange, total])

  if (offerFailed || (!offerLoading && !offer))
    return (
      <section className='rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-5 text-sm'>
        <p className='flex items-center gap-2 font-semibold text-foreground'>
          <User className='size-4 text-destructive' />
          Couldn&apos;t load seat & baggage options for this flight
        </p>
        <p className='mt-1 text-xs text-muted-foreground'>
          Your flight is still selected — you can continue to checkout and add
          seats or bags later, or try re-selecting the flight above.
        </p>
      </section>
    )

  if (offerLoading)
    return (
      <section className='rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground'>
        Loading flight options…
      </section>
    )

  // TS can't chain the boolean logic in the two guards above into
  // "offer is defined" on its own — this final guard makes it explicit
  // so `offer` is never read as possibly-undefined below.
  if (!offer) return null

  // BUG FIX: this used to default to `true` when the offer had no baggage
  // data at all, while the (separately, correctly derived) fare summary
  // above defaults the exact same "no data" case to false ("No carry-on").
  // That mismatch is exactly what produced the fare summary saying
  // "No carry-on" right above a baggage tab that still claimed "Carry-on:
  // Included" — same offer, same field, two different assumptions.
  // Absence of data now means "not confirmed included" everywhere, not
  // "assume yes" in one place and "assume no" in the other.
  const carryOnIncluded =
    passengers[0]?.baggages?.some(
      (b) => b.type === 'carry_on' && b.quantity > 0,
    ) ?? false

  function selectSeat(el: SeatMapElement) {
    if (
      !currentSegment ||
      !currentPassenger ||
      el.type !== 'seat' ||
      !el.available ||
      !el.designator
    )
      return
    const price = seatPriceForPassenger(el, currentPassenger)
    if (!price) return
    const key = seatKey(currentSegment, currentPassenger)
    const nextSeats = { ...state.seats }
    if (nextSeats[key]?.designator === el.designator) delete nextSeats[key]
    else
      nextSeats[key] = {
        designator: el.designator,
        serviceId: price.service_id,
        passengerId: currentPassenger,
        segmentId: currentSegment,
        amount: Number(price.amount),
        currency: price.currency,
      }
    update({ seats: nextSeats })
  }

  return (
    <section className='rounded-2xl border border-primary/20 bg-card p-5'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='font-heading text-base font-bold'>Flight extras</p>
          <p className='text-xs text-muted-foreground'>
            Select baggage and seats before the combined checkout. These
            selections become flight booking services.
          </p>
        </div>
        <div className='rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary'>
          Extras {symbol}
          {total.toFixed(2)}
        </div>
      </div>
      {!hideFareSummary && <FareBenefitsSummary offer={offer} />}

      {!forceTab && (
        <div className='mb-5 grid grid-cols-2 rounded-xl border border-border bg-muted p-1'>
          <button
            type='button'
            onClick={() => setTab('bags')}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-bold',
              tab === 'bags' && 'bg-primary text-primary-foreground',
            )}
          >
            <Luggage className='mr-1 inline size-3.5' />
            Baggage
          </button>
          <button
            type='button'
            onClick={() => setTab('seats')}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-bold',
              tab === 'seats' && 'bg-primary text-primary-foreground',
            )}
          >
            <Armchair className='mr-1 inline size-3.5' />
            Seats
          </button>
        </div>
      )}
      {tab === 'bags' && (
        <div className='space-y-4'>
          {/* BUG FIX: this grid used to have a "Personal item" tile
              hardcoded to always say "Included" — there is no
              `personal_item` field anywhere in FlightOffer.baggages
              (only 'carry_on' | 'checked', see features/flights/types.ts),
              so that claim wasn't derived from the offer at all. It was
              invented UI copy, and could contradict the real fare summary
              above whenever a fare genuinely had no free carry-on. Removed
              rather than left as a guess; only the Carry-on tile remains,
              and it's driven by carryOnIncluded above. */}
          <div className='grid grid-cols-1 gap-3'>
            <div className='flex items-start gap-3 rounded-xl border border-border p-4'>
              <div className='grid size-9 shrink-0 place-items-center rounded-lg bg-muted'>
                <Briefcase className='size-4 text-primary' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-bold'>Carry-on</p>
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  Standard cabin bag, fits in the overhead bin
                </p>
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold',
                    carryOnIncluded
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {carryOnIncluded
                    ? '✓ Included in fare'
                    : '✕ Not included in this fare'}
                </span>
              </div>
            </div>
          </div>
          {bagGroups.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground'>
              No additional baggage is available for this fare.
            </div>
          ) : (
            bagGroups.map((group) => (
              <div
                key={group.key}
                className={cn(
                  'rounded-xl border border-border p-4',
                  state.skipBags && 'opacity-50',
                )}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-bold'>{group.label}</p>
                    <p className='text-[10px] text-muted-foreground'>
                      {group.maxWeightKg
                        ? `Up to ${group.maxWeightKg}kg · `
                        : ''}
                      {currencySymbol(group.currency)}
                      {(group.perPassenger[0]?.amount ?? 0).toFixed(2)} per
                      passenger
                    </p>
                  </div>
                  <Luggage className='size-5 text-primary' />
                </div>
                <div className='mt-3 space-y-2'>
                  {passengers.map((pax, i) => {
                    const option = group.perPassenger.find(
                      (p) => p.passengerId === pax.id,
                    )
                    if (!option) return null
                    const key = bagKey(pax.id, group.key)
                    const selected = !!state.bags[key]
                    return (
                      <label
                        key={pax.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs',
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border',
                        )}
                      >
                        <span className='flex items-center gap-2'>
                          <User className='size-3.5' />
                          {pax.given_name || `Passenger ${i + 1}`}
                          <span className='rounded-full bg-muted px-2 py-0.5 text-[9px]'>
                            {pax.type
                              ? (PAX_LABEL[pax.type] ?? pax.type)
                              : 'Passenger'}
                          </span>
                        </span>
                        <span className='flex items-center gap-2 font-mono font-bold'>
                          {currencySymbol(group.currency)}
                          {option.amount.toFixed(2)}
                          <input
                            type='checkbox'
                            checked={selected}
                            disabled={state.skipBags}
                            onChange={(e) =>
                              setBag(pax.id, group, e.target.checked)
                            }
                          />
                          {selected && (
                            <Check className='size-3.5 text-primary' />
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <label className='flex cursor-pointer items-center gap-2 text-xs'>
            <input
              type='checkbox'
              checked={state.skipBags}
              onChange={() => update({ skipBags: !state.skipBags, bags: {} })}
              className='size-4 accent-primary'
            />
            I don't need extra baggage.
          </label>
        </div>
      )}
      {tab === 'seats' && (
        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {offer.slices
              .flatMap((slice) => slice.segments)
              .map((segment) => (
                <button
                  key={segment.id}
                  type='button'
                  onClick={() => setActiveSegment(segment.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-xs',
                    currentSegment === segment.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border',
                  )}
                >
                  <span className='font-bold'>
                    {segment.origin.iata_code} → {segment.destination.iata_code}
                  </span>
                </button>
              ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            {passengers.map((pax, i) => (
              <button
                key={pax.id}
                type='button'
                onClick={() => setActivePassenger(pax.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs',
                  currentPassenger === pax.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border',
                )}
              >
                {pax.given_name || `Passenger ${i + 1}`}
              </button>
            ))}
          </div>
          {!seatLoading && currentCabin && (
            <p className='flex items-start gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] leading-snug text-foreground'>
              <Info className='mt-0.5 size-3.5 shrink-0 text-primary' />
              <span className='font-bold'>
                Seat selection is optional — skip it and the airline assigns
                one at check-in. Pick seats per passenger and per leg above.
              </span>
            </p>
          )}
          {seatLoading ? (
            <div className='rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground'>
              Loading seat map…
            </div>
          ) : !currentCabin ? (
            <div className='rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground'>
              No seat map is available for this flight. You can continue and the
              airline will assign a seat.
            </div>
          ) : (
            <div className='overflow-x-auto rounded-xl border border-border bg-background p-4'>
              <p className='mb-4 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                {currentCabin.cabin_class}
              </p>
              <div className='flex min-w-130 flex-col items-center gap-1'>
                {currentCabin.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className='flex items-center gap-2'>
                    <span className='w-6 text-right font-mono text-[9px] text-muted-foreground'>
                      {rowNumber(row)}
                    </span>
                    <div className='flex gap-1'>
                      {row.elements.map((el, i) => {
                        if (el.type !== 'seat')
                          return <div key={i} className='size-7' />
                        const price = currentPassenger
                          ? seatPriceForPassenger(el, currentPassenger)
                          : null
                        const key =
                          currentSegment && currentPassenger
                            ? seatKey(currentSegment, currentPassenger)
                            : ''
                        const selected =
                          !!key &&
                          state.seats[key]?.designator === el.designator
                        const otherPaxSelected =
                          !!currentSegment &&
                          !selected &&
                          Object.entries(state.seats).some(
                            ([k, v]) =>
                              k.startsWith(`${currentSegment}:`) &&
                              v.designator === el.designator,
                          )
                        const unavailable = el.available === false || !price
                        return (
                          <button
                            key={`${el.designator}-${i}`}
                            type='button'
                            disabled={unavailable}
                            onClick={() => selectSeat(el)}
                            title={
                              price
                                ? `${el.name ?? el.designator ?? 'Seat'} · ${currencySymbol(offer.total_currency)}${Number(price.amount).toFixed(2)}`
                                : (el.name ?? el.designator ?? 'Seat')
                            }
                            className={cn(
                              'grid size-7 place-items-center rounded text-[8px] font-bold',
                              selected
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background'
                                : otherPaxSelected
                                  ? 'bg-status-good/30 text-status-good ring-1 ring-status-good'
                                  : unavailable
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/15 text-primary hover:bg-primary/30',
                            )}
                          >
                            {el.designator?.replace(/^\d+/, '') || '•'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className='mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-4 text-[10px]'>
                <div className='flex items-center gap-1.5'>
                  <span className='inline-block size-3 rounded-sm bg-primary/15' />
                  <span className='font-mono text-muted-foreground'>
                    Available
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='inline-block size-3 rounded-sm bg-primary ring-2 ring-primary ring-offset-1 ring-offset-background' />
                  <span className='font-mono text-muted-foreground'>
                    Selected (this passenger)
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='inline-block size-3 rounded-sm bg-status-good/30 ring-1 ring-status-good' />
                  <span className='font-mono text-muted-foreground'>
                    Selected (other passenger)
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='inline-block size-3 rounded-sm bg-muted' />
                  <span className='font-mono text-muted-foreground'>
                    Unavailable
                  </span>
                </div>
              </div>

              {currentSegment && currentPassenger && (
                <div className='mt-3 text-center font-mono text-[10.5px] text-muted-foreground'>
                  {(() => {
                    const key = seatKey(currentSegment, currentPassenger)
                    const picked = state.seats[key]
                    if (!picked)
                      return (
                        <span className='font-bold text-foreground'>
                          No seat selected for this passenger on this leg.
                        </span>
                      )
                    return (
                      <span className='text-foreground'>
                        Seat {picked.designator} selected ·{' '}
                        {currencySymbol(offer.total_currency)}
                        {picked.amount.toFixed(2)}
                      </span>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
