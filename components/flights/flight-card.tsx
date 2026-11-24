'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, ChevronDown, Luggage, RefreshCw, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlightSalePrice } from '@/components/flights/flight-sale-price'
import {
  ItineraryDetail,
  AirlineMark,
  Chip,
  fmtTime,
  fmtDuration,
  segmentFareInfo,
  baggageSummary,
  flightNumberOf,
} from '@/components/flights/itinerary-detail'
import type { FlightOffer, FlightSlice } from '@/features/flights/types'

/**
 * Ported from Travels' results card. Two things are deliberately different
 * from that source, both because matchday doesn't have the subsystem
 * Travels built this against:
 *  - the sale price uses the flight promo (cabin and fare band), shown in
 *    the offer's own currency, instead of Travels' multi-currency `useMoney`.
 *  - selecting a flight calls back into the wizard (`onSelect`) instead of
 *    navigating to a separate /flights/select route or a cart-context
 *    "add" button, since this card also has to keep working, unchanged,
 *    on matchday's own standalone /flights results page, which has no
 *    `onSelect` and still expects the old "View Deal" link.
 */

function stopsLabel(slice: FlightSlice) {
  const stops = slice.segments.length - 1
  if (stops === 0) return 'Nonstop'
  const via = slice.segments
    .slice(0, -1)
    .map((s) => s.destination.city_name ?? s.destination.iata_code)
    .join(', ')
  return `${stops} stop${stops > 1 ? 's' : ''} · ${via}`
}

/* ── one leg: airline row + horizontal timeline ─────────────── */

function SliceRow({ slice }: { slice: FlightSlice }) {
  const first = slice.segments[0]
  const last = slice.segments[slice.segments.length - 1]
  if (!first || !last) return null

  const stops = slice.segments.length - 1
  const carrier = first.marketing_carrier
  const flightNumber = flightNumberOf(first)

  return (
    <div className='py-3'>
      <div className='flex items-center gap-2'>
        <AirlineMark
          name={carrier.name}
          code={carrier.iata_code}
          logoUrl={carrier.logo_symbol_url}
        />
        <span className='truncate text-[12px] font-semibold text-foreground'>
          {carrier.name}
        </span>
        {first.aircraft?.name && (
          <span className='hidden sm:inline'>
            <Chip>{first.aircraft.name}</Chip>
          </span>
        )}
        {flightNumber && (
          <span className='shrink-0 font-mono text-[10.5px] text-muted-foreground'>
            {flightNumber}
          </span>
        )}
      </div>

      <div className='mt-2.5 flex items-start gap-3'>
        <div className='w-[58px] shrink-0'>
          <p className='font-heading text-[21px] font-bold leading-none text-foreground'>
            {fmtTime(first.departing_at)}
          </p>
          <p className='mt-1 font-mono text-[11px] text-brand-text'>
            {slice.origin.iata_code}
          </p>
        </div>

        <div className='flex min-w-0 flex-1 flex-col items-center pt-1'>
          <span className='font-mono text-[10.5px] text-muted-foreground'>
            {fmtDuration(slice.duration)}
          </span>

          {/* Dotted connector: a plane at the midpoint, and a dot at each
              intermediate stop, spaced along the line so the number of
              stops reads before the label underneath does. */}
          <div className='relative my-1.5 h-3 w-full'>
            <span className='absolute inset-x-0 top-1/2 border-t-[1.5px] border-dotted border-border' />
            {slice.segments.slice(0, -1).map((seg, i) => (
              <span
                key={seg.id}
                style={{ left: `${((i + 1) / (stops + 1)) * 100}%` }}
                className='absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-warn'
              />
            ))}
            <Plane className='absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-card text-brand-text' />
          </div>

          <span
            className={cn(
              'truncate font-mono text-[10px]',
              stops === 0 ? 'text-status-good' : 'text-status-warn',
            )}
          >
            {stopsLabel(slice)}
          </span>
        </div>

        <div className='w-[58px] shrink-0 text-right'>
          <p className='font-heading text-[21px] font-bold leading-none text-foreground'>
            {fmtTime(last.arriving_at)}
          </p>
          <p className='mt-1 font-mono text-[11px] text-brand-text'>
            {slice.destination.iata_code}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── card ──────────────────────────────────────────────────── */

interface FlightCardProps {
  offer: FlightOffer
  index: number
  /** Provided by the matchday wizard (Extras page) to select this flight
   *  and move on. When omitted (matchday's own standalone /flights results
   *  page), the price column falls back to a "View Deal" link instead. */
  onSelect?: (offer: FlightOffer) => void
  selected?: boolean
  /** Controlled expand/collapse for the itinerary detail panel. When
   *  omitted, the card manages its own open/closed state. */
  expanded?: boolean
  onToggle?: () => void
}

export function FlightCard({
  offer,
  index,
  onSelect,
  selected,
  expanded: expandedProp,
  onToggle,
}: FlightCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = expandedProp ?? internalExpanded
  const toggle = onToggle ?? (() => setInternalExpanded((v) => !v))

  const multi = offer.slices.length > 1
  const fareBrand = offer.slices[0]?.fare_brand_name ?? 'Economy'

  const firstSegment = offer.slices[0]?.segments[0]
  const bags = firstSegment ? segmentFareInfo(firstSegment, offer) : undefined
  const refundable =
    offer.conditions?.refund_before_departure?.allowed ??
    offer.slices[0]?.conditions?.refund_before_departure?.allowed

  return (
    <motion.article
      className='overflow-hidden rounded-[18px] border border-border bg-card transition-colors hover:border-brand-text/30'
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.05, duration: 0.36 }}
    >
      <div className='flex flex-col sm:flex-row'>
        {/* The left area is one button: the whole itinerary toggles the
            detail panel, which is why "View details" is a label rather
            than a second control nested inside a clickable region. */}
        <button
          type='button'
          onClick={toggle}
          aria-expanded={expanded}
          className='min-w-0 flex-1 px-5 py-2 text-left'
        >
          <div className='divide-y divide-border'>
            {offer.slices.map((slice) => (
              <SliceRow key={slice.id} slice={slice} />
            ))}
          </div>

          <div className='flex flex-wrap items-center gap-2 border-t border-border/60 py-2.5'>
            <Chip>
              <Luggage className='size-3' />
              {baggageSummary(bags)}
            </Chip>
            {refundable !== undefined && refundable !== null && (
              <Chip tone={refundable ? 'good' : 'bad'}>
                {refundable ? (
                  <RefreshCw className='size-3' />
                ) : (
                  <XCircle className='size-3' />
                )}
                {refundable ? 'Refundable' : 'Non-refundable'}
              </Chip>
            )}
            <span className='ml-auto flex shrink-0 items-center gap-1 font-mono text-[10.5px] font-bold text-brand-text'>
              {expanded ? 'Hide details' : 'View details'}
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform',
                  expanded && 'rotate-180',
                )}
              />
            </span>
          </div>
        </button>

        {/* Fixed-width price column so it lines up down the whole list no
            matter how long an airline name runs. On mobile the price and
            its detail line come first (right-aligned) with the button
            below — on desktop the button leads, both centered. */}
        <div className='flex flex-col-reverse items-end justify-center gap-2 border-t border-border p-4 sm:flex-col sm:items-center sm:w-[176px] sm:shrink-0 sm:border-l sm:border-t-0'>
          {onSelect ? (
            <motion.button
              type='button'
              onClick={() => onSelect(offer)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex w-auto items-center justify-center rounded-full px-5 py-2 font-mono text-[12px] font-bold transition-all sm:w-full',
                selected
                  ? 'bg-primary text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]'
                  : 'border border-brand-text/40 bg-primary/15 text-brand-text hover:bg-primary/25',
              )}
            >
              {selected ? 'Added ✓' : 'Select'}
            </motion.button>
          ) : (
            <motion.div
              className='w-auto sm:w-full'
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={`/flights/select?offerId=${offer.id}`}
                className='flex w-full items-center justify-center rounded-full bg-primary px-5 py-2 font-mono text-[12px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
              >
                View Deal
              </Link>
            </motion.div>
          )}

          <div className='text-right sm:mt-1 sm:text-center'>
            <FlightSalePrice
              offer={offer}
              amountClassName='font-heading text-[23px] font-bold leading-none text-foreground'
              className='items-end sm:items-center'
            />
            <p className='mt-1 font-mono text-[9px] text-muted-foreground'>
              {multi ? 'round trip' : 'per person'} · {fareBrand}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='overflow-hidden border-t border-border'
          >
            <ItineraryDetail offer={offer} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

/* ── skeleton ──────────────────────────────────────────────── */
export function FlightCardSkeleton() {
  return (
    <div className='animate-pulse overflow-hidden rounded-[18px] border border-border bg-card'>
      <div className='flex flex-col sm:flex-row'>
        <div className='flex-1 space-y-3 p-5'>
          <div className='flex items-center gap-3'>
            <div className='size-6 rounded-md bg-muted' />
            <div className='h-3 w-28 rounded bg-muted' />
          </div>
          <div className='flex items-center gap-3'>
            <div className='h-6 w-14 rounded bg-muted' />
            <div className='h-px flex-1 bg-muted' />
            <div className='h-6 w-14 rounded bg-muted' />
          </div>
        </div>
        <div className='flex items-center justify-end border-t border-border p-4 sm:w-[176px] sm:border-l sm:border-t-0'>
          <div className='h-9 w-24 rounded-full bg-muted' />
        </div>
      </div>
    </div>
  )
}
