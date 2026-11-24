'use client'

import {
  Clock,
  Wifi,
  Armchair,
  Zap,
  Tv,
  Briefcase,
  Luggage,
  Leaf,
  ReceiptText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { currencySymbol } from '@/lib/currency'
import type {
  FlightOffer,
  FlightSegment,
  SegmentPassengerFare,
} from '@/features/flights/types'

/**
 * Ported from Travels' components/flights/itinerary-detail.tsx. Travels
 * quotes ancillary amounts (a paid bag, a change fee) through its own
 * multi-currency `formatMoney`/`useMoney` system, which matchday doesn't
 * have — this app always prices in the offer's own currency, so a small
 * local formatter using matchday's existing `currencySymbol` stands in for
 * it. Everything else is the same panel, reading the same offer shape.
 */
function fmtAmount(amount: string | number | null | undefined, currency?: string | null) {
  const n = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (!Number.isFinite(n)) return `${currencySymbol(currency)}0.00`
  return `${currencySymbol(currency)}${n.toFixed(2)}`
}

/* ── formatting ─────────────────────────────────────────────── */

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** "PT2H25M" → "2h 25m". */
export function fmtDuration(iso: string) {
  const h = iso.match(/(\d+)H/)?.[1]
  const m = iso.match(/(\d+)M/)?.[1]
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  if (m) return `${m}m`
  return iso
}

export function fmtDayAndTerminal(iso: string, terminal?: string | null) {
  const day = new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return terminal ? `${day} · Terminal ${terminal}` : day
}

export function minutesBetween(startIso: string, endIso: string) {
  return Math.max(
    0,
    Math.round(
      (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
    ),
  )
}

export function fmtMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}

/** Total journey minutes across every segment and every layover. */
export function offerTotalMinutes(offer: FlightOffer) {
  return offer.slices.reduce((total, slice) => {
    const first = slice.segments[0]
    const last = slice.segments[slice.segments.length - 1]
    if (!first || !last) return total
    return total + minutesBetween(first.departing_at, last.arriving_at)
  }, 0)
}

/**
 * Per-segment cabin/fare/baggage detail, falling back to the offer's
 * top-level passenger baggage if a segment doesn't carry its own
 * passengers[] block (e.g. an older cached offer).
 */
export function segmentFareInfo(
  segment: FlightSegment,
  offer: FlightOffer,
): SegmentPassengerFare | undefined {
  const fromSegment = segment.passengers?.[0]
  if (fromSegment) return fromSegment
  const fallbackBags = offer.passengers[0]?.baggages
  return fallbackBags ? { passenger_id: '', baggages: fallbackBags } : undefined
}

export function baggageSummary(fare?: SegmentPassengerFare) {
  const bags = fare?.baggages ?? []
  const carryOn = bags.find((b) => b.type === 'carry_on' && b.quantity > 0)
  const checked = bags.find((b) => b.type === 'checked' && b.quantity > 0)
  const parts: string[] = []
  if (checked)
    parts.push(
      `${checked.quantity} checked bag${checked.quantity > 1 ? 's' : ''}`,
    )
  if (carryOn)
    parts.push(`${carryOn.quantity} carry-on${carryOn.quantity > 1 ? 's' : ''}`)
  return parts.length ? parts.join(' · ') : 'Baggage not specified'
}

export function flightNumberOf(segment: FlightSegment) {
  const carrier = segment.marketing_carrier
  return `${carrier.iata_code ?? ''}${
    segment.marketing_carrier_flight_number ?? ''
  }`.trim()
}

/* ── small parts ────────────────────────────────────────────── */

/** Outlined pill used for aircraft type and the baggage/refund chips. */
export function Chip({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'good' | 'bad'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px] leading-none',
        tone === 'good' && 'border-status-good/40 text-status-good',
        tone === 'bad' && 'border-destructive/40 text-destructive',
        tone === 'muted' && 'border-border text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

/** Airline logo, or its IATA code when the carrier has no artwork. */
export function AirlineMark({
  name,
  code,
  logoUrl,
  className,
}: {
  name: string
  code?: string | null
  logoUrl?: string | null
  className?: string
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={cn('size-6 shrink-0 rounded-md object-contain', className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 font-mono text-[9px] font-bold text-primary',
        className,
      )}
    >
      {code ?? name.slice(0, 2).toUpperCase()}
    </span>
  )
}

/* ── one segment ────────────────────────────────────────────── */

function AmenityRow({ fare }: { fare?: SegmentPassengerFare }) {
  const amenities = fare?.cabin?.amenities
  if (!amenities) return null

  const pitch = amenities.seat?.pitch
  const items: {
    key: string
    icon: typeof Wifi
    label: string
    on: boolean
  }[] = [
    {
      key: 'seat',
      icon: Armchair,
      label: pitch && pitch !== 'n/a' ? `${pitch}" pitch` : 'Standard seat',
      on: !!pitch && pitch !== 'n/a',
    },
    {
      key: 'wifi',
      icon: Wifi,
      label: amenities.wifi?.available
        ? amenities.wifi.cost === 'free'
          ? 'Free Wi-Fi'
          : 'Wi-Fi (paid)'
        : 'No Wi-Fi',
      on: !!amenities.wifi?.available,
    },
    {
      key: 'power',
      icon: Zap,
      label: amenities.power?.available ? 'Power outlet' : 'No power',
      on: !!amenities.power?.available,
    },
  ]

  // Duffel exposes almost nothing about in-flight entertainment, so the chip
  // is only shown when the seat type actually says something.
  const seatType = amenities.seat?.type
  if (seatType) {
    items.push({ key: 'ife', icon: Tv, label: seatType, on: true })
  }

  return (
    <div className='mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1'>
      {items.map(({ key, icon: Icon, label, on }) => (
        <span
          key={key}
          className={cn(
            'flex items-center gap-1 font-mono text-[9.5px]',
            on ? 'text-status-good' : 'text-muted-foreground/60',
          )}
        >
          <Icon className='size-3' />
          {label}
        </span>
      ))}
    </div>
  )
}

function SegmentCard({
  segment,
  offer,
}: {
  segment: FlightSegment
  offer: FlightOffer
}) {
  const fare = segmentFareInfo(segment, offer)
  const carrier = segment.marketing_carrier
  const flightNumber = flightNumberOf(segment)

  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <div className='flex items-center gap-2'>
        <AirlineMark
          name={carrier.name}
          code={carrier.iata_code}
          logoUrl={carrier.logo_symbol_url}
        />
        <span className='truncate text-[12px] font-semibold text-foreground'>
          {carrier.name}
        </span>
        {flightNumber && (
          <span className='shrink-0 font-mono text-[10.5px] text-muted-foreground'>
            {flightNumber}
          </span>
        )}
        {segment.aircraft?.name && <Chip>{segment.aircraft.name}</Chip>}
        <span className='ml-auto shrink-0 font-mono text-[10.5px] text-muted-foreground'>
          {fmtDuration(segment.duration)}
        </span>
      </div>

      {/* Vertical timeline: hollow dot for departure, filled for arrival. */}
      <div className='mt-3 flex gap-3'>
        <div className='flex flex-col items-center pt-1'>
          <span className='size-2 shrink-0 rounded-full border-[1.5px] border-primary' />
          <span className='my-1 w-px flex-1 bg-border' />
          <span className='size-2 shrink-0 rounded-full bg-primary' />
        </div>

        <div className='min-w-0 flex-1 space-y-3'>
          {(
            [
              {
                key: 'dep',
                at: segment.departing_at,
                place: segment.origin,
                terminal: segment.origin_terminal,
              },
              {
                key: 'arr',
                at: segment.arriving_at,
                place: segment.destination,
                terminal: segment.destination_terminal,
              },
            ] as const
          ).map(({ key, at, place, terminal }) => (
            <div key={key}>
              <p className='font-heading text-[17px] font-bold leading-none text-foreground'>
                {fmtTime(at)}
              </p>
              <p className='mt-1 truncate text-[12px] text-foreground'>
                {place.name}{' '}
                <span className='font-mono text-[10.5px] text-muted-foreground'>
                  ({place.iata_code})
                </span>
              </p>
              <p className='font-mono text-[10px] text-muted-foreground'>
                {fmtDayAndTerminal(at, terminal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <AmenityRow fare={fare} />
    </div>
  )
}

/** The dashed strip between two segments. */
function LayoverStrip({
  from,
  to,
}: {
  from: FlightSegment
  to: FlightSegment
}) {
  const minutes = minutesBetween(from.arriving_at, to.departing_at)
  const sameTerminal =
    !!from.destination_terminal &&
    from.destination_terminal === to.origin_terminal
  const note = sameTerminal
    ? 'Same terminal · no re-check'
    : minutes < 60
      ? 'Short connection'
      : null

  return (
    <div className='my-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-dashed border-border px-3.5 py-1.5'>
      <Clock className='size-3 shrink-0 text-status-warn' />
      <span className='font-mono text-[11px] font-semibold text-foreground'>
        {fmtMinutes(minutes)} layover
      </span>
      <span className='truncate font-mono text-[11px] text-muted-foreground'>
        in {from.destination.city_name ?? from.destination.name}
      </span>
      {note && (
        <span
          className={cn(
            'ml-auto shrink-0 font-mono text-[10px]',
            minutes < 60 && !sameTerminal
              ? 'text-status-warn'
              : 'text-muted-foreground',
          )}
        >
          {note}
        </span>
      )}
    </div>
  )
}

/* ── baggage + fare conditions ──────────────────────────────── */

function BaggagePanel({ offer }: { offer: FlightOffer }) {
  const fare = offer.slices[0]?.segments[0]
    ? segmentFareInfo(offer.slices[0].segments[0], offer)
    : undefined
  const bags = fare?.baggages ?? []
  const carryOn = bags.find((b) => b.type === 'carry_on')
  const checked = bags.find((b) => b.type === 'checked')

  // Duffel prices extra bags as an available service; showing what one costs
  // is more use than repeating that none are included.
  const paidBag = offer.available_services?.find((s) => s.type === 'baggage')

  const rows = [
    {
      key: 'carry_on',
      icon: Briefcase,
      label: 'Carry-on',
      detail:
        carryOn && carryOn.quantity > 0
          ? `${carryOn.quantity} included`
          : 'Not included',
      ok: !!carryOn && carryOn.quantity > 0,
    },
    {
      key: 'checked',
      icon: Luggage,
      label: 'Checked bag',
      detail:
        checked && checked.quantity > 0
          ? `${checked.quantity} included`
          : paidBag
            ? `From ${fmtAmount(paidBag.total_amount, paidBag.total_currency)} if added`
            : 'Not included',
      ok: !!checked && checked.quantity > 0,
    },
  ]

  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <p className='font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground'>
        Baggage allowance
      </p>
      <ul className='mt-2.5 space-y-2'>
        {rows.map(({ key, icon: Icon, label, detail, ok }) => (
          <li key={key} className='flex items-start gap-2.5'>
            <Icon className='mt-0.5 size-3.5 shrink-0 text-muted-foreground' />
            <span className='min-w-0 flex-1'>
              <span className='block text-[12px] text-foreground'>{label}</span>
              <span
                className={cn(
                  'block font-mono text-[10.5px]',
                  ok ? 'text-status-good' : 'text-destructive',
                )}
              >
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function conditionValue(
  allowed: boolean | null | undefined,
  penaltyAmount?: string | null,
  penaltyCurrency?: string | null,
) {
  if (allowed === undefined || allowed === null)
    return { text: 'Not specified', tone: 'muted' as const }
  if (!allowed) return { text: 'Not allowed', tone: 'bad' as const }
  const fee = penaltyAmount ? parseFloat(penaltyAmount) : 0
  if (fee > 0)
    return {
      text: `${fmtAmount(penaltyAmount, penaltyCurrency)} fee`,
      tone: 'muted' as const,
    }
  return { text: 'Free', tone: 'good' as const }
}

function FareConditionsPanel({ offer }: { offer: FlightOffer }) {
  const change =
    offer.conditions?.change_before_departure ??
    offer.slices[0]?.conditions?.change_before_departure
  const refund =
    offer.conditions?.refund_before_departure ??
    offer.slices[0]?.conditions?.refund_before_departure

  const rows = [
    {
      key: 'changes',
      label: 'Changes',
      ...conditionValue(
        change?.allowed,
        change?.penalty_amount,
        change?.penalty_currency,
      ),
    },
    {
      key: 'cancellation',
      label: 'Cancellation',
      ...conditionValue(
        refund?.allowed,
        refund?.penalty_amount,
        refund?.penalty_currency,
      ),
    },
    {
      key: 'fare',
      label: 'Fare brand',
      text: offer.slices[0]?.fare_brand_name ?? 'Standard',
      tone: 'muted' as const,
    },
  ]

  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <p className='font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground'>
        Fare conditions
      </p>
      <ul className='mt-2.5 space-y-2'>
        {rows.map(({ key, label, text, tone }) => (
          <li key={key} className='flex items-center justify-between gap-3'>
            <span className='text-[12px] text-muted-foreground'>{label}</span>
            <span
              className={cn(
                'shrink-0 text-right font-mono text-[11px]',
                tone === 'good' && 'text-status-good',
                tone === 'bad' && 'text-destructive',
                tone === 'muted' && 'text-foreground',
              )}
            >
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── the panel ──────────────────────────────────────────────── */

/**
 * Full itinerary breakdown for an offer: every segment, the layovers between
 * them, and what the fare actually includes. Shared by the results card's
 * expanded state and the Fare wizard step.
 */
export function ItineraryDetail({ offer }: { offer: FlightOffer }) {
  return (
    <div className='space-y-4 bg-muted px-[22px] py-5'>
      {offer.slices.map((slice) => (
        <div key={slice.id}>
          <p className='mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground'>
            Itinerary · {slice.origin.iata_code} → {slice.destination.iata_code}{' '}
            · {fmtDuration(slice.duration)}
          </p>

          {slice.segments.map((segment, i) => (
            <div key={segment.id}>
              <SegmentCard segment={segment} offer={offer} />
              {i < slice.segments.length - 1 && (
                <LayoverStrip from={segment} to={slice.segments[i + 1]} />
              )}
            </div>
          ))}
        </div>
      ))}

      <div className='grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]'>
        <BaggagePanel offer={offer} />
        <FareConditionsPanel offer={offer} />
      </div>

      <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] text-muted-foreground'>
        {offer.total_emissions_kg ? (
          <span className='flex items-center gap-1.5'>
            <Leaf className='size-3.5' />
            {offer.total_emissions_kg} kg CO₂e estimated
          </span>
        ) : null}
        {offer.payment_requirements?.payment_required_by ? (
          <span className='flex items-center gap-1.5'>
            <Clock className='size-3.5' />
            Price held until{' '}
            {new Date(
              offer.payment_requirements.payment_required_by,
            ).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : null}
        <span className='flex items-center gap-1.5'>
          <ReceiptText className='size-3.5' />
          Taxes &amp; fees included
        </span>
      </div>
    </div>
  )
}
