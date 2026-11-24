'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEPARTURE_TIME_OPTIONS,
  type DepartureTimeId,
} from '@/features/flights/departure-time'

const STOPS_OPTIONS = ['Direct', '1 Stop', '2+ Stops'] as const

const DEPARTURE_TIME_ICONS: Record<DepartureTimeId, LucideIcon> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
}

/**
 * Collapsible filter group — click the title to expand/collapse, like
 * Booking.com's "Stays" filter sidebar. Sections default open so nothing
 * looks hidden on first load; the person can then collapse whichever
 * they're not using to get to the rest faster.
 */
function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className='border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between'
        aria-expanded={open}
      >
        <h3 className='font-mono text-[10px] font-bold uppercase tracking-[1.5px] text-muted-foreground'>
          {title}
        </h3>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden'
          >
            <div className='pt-2.5'>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface Props {
  selectedStops: string[]
  toggleStop: (s: string) => void
  /** Airlines present in the current results, with their lowest total price */
  airlines: { name: string; minPrice: number }[]
  activeAirlines: string[]
  toggleAirline: (a: string) => void
  /** Fare brands present in the current results (from offer.slices[0].fare_brand_name), with lowest price */
  fareBrands: { name: string; minPrice: number }[]
  activeFareBrands: string[]
  toggleFareBrand: (f: string) => void
  /** Departure "time of day" buckets (morning/afternoon/evening/night) */
  selectedDepartureTimes: string[]
  toggleDepartureTime: (id: string) => void
  /** Min/max total price across the current results */
  priceBounds?: { min: number; max: number }
  /** Current "up to" price — null means no cap */
  maxPrice: number | null
  onMaxPriceChange: (v: number) => void
  currencySymbol?: string
  onReset?: () => void
}

export function FlightFiltersSidebar({
  selectedStops,
  toggleStop,
  airlines,
  activeAirlines,
  toggleAirline,
  fareBrands,
  activeFareBrands,
  toggleFareBrand,
  selectedDepartureTimes,
  toggleDepartureTime,
  priceBounds,
  maxPrice,
  onMaxPriceChange,
  currencySymbol = '€',
  onReset,
}: Props) {
  const priceValue = maxPrice ?? priceBounds?.max ?? 0

  return (
    <aside className='overflow-hidden rounded-2xl border border-border bg-card'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-border px-4 py-3'>
        <p className='font-heading text-sm font-bold text-foreground'>
          Filters
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className='font-mono text-[10px] text-primary hover:underline'
          >
            Reset all
          </button>
        )}
      </div>

      <div className='p-4'>
        {/* Stops */}
        <FilterSection title='Stops'>
          <div className='flex flex-wrap gap-2'>
            {STOPS_OPTIONS.map((stop) => {
              const on = selectedStops.includes(stop)
              return (
                <motion.button
                  key={stop}
                  onClick={() => toggleStop(stop)}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors',
                    on
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {stop}
                </motion.button>
              )
            })}
          </div>
        </FilterSection>

        {/* Departure time — bucketed from each offer's outbound departure
         * hour (see features/flights/departure-time.ts). Client-side, same
         * as Stops above, so it applies instantly with no re-search. */}
        <FilterSection title='Departure Time'>
          <div className='grid grid-cols-2 gap-2'>
            {DEPARTURE_TIME_OPTIONS.map((opt) => {
              const on = selectedDepartureTimes.includes(opt.id)
              const Icon = DEPARTURE_TIME_ICONS[opt.id]
              return (
                <motion.button
                  key={opt.id}
                  type='button'
                  onClick={() => toggleDepartureTime(opt.id)}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-colors',
                    on
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-7 place-items-center rounded-full transition-colors',
                      on
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className='size-3.5' />
                  </span>
                  <span className='text-[12px] font-bold text-foreground'>
                    {opt.label}
                  </span>
                  <span className='font-mono text-[9px] text-muted-foreground'>
                    {opt.range}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </FilterSection>

        {/* Fare brand — real data (Basic / Basic Economy / Economy Flex etc,
         * whatever slices[].fare_brand_name actually returns for this
         * search — never a hardcoded list). */}
        <FilterSection title='Fare type'>
          {fareBrands.length > 0 ? (
            <div className='space-y-1'>
              {fareBrands.map((f) => {
                const on = activeFareBrands.includes(f.name)
                return (
                  <label
                    key={f.name}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors',
                      on ? 'bg-primary/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <span
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded border text-[9px] font-bold transition-colors',
                          on
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40',
                        )}
                      >
                        {on && '✓'}
                      </span>
                      <input
                        type='checkbox'
                        checked={on}
                        onChange={() => toggleFareBrand(f.name)}
                        className='sr-only'
                      />
                      <span className='truncate text-[13px] text-foreground'>
                        {f.name}
                      </span>
                    </div>
                    <span className='shrink-0 font-mono text-[10px] text-muted-foreground'>
                      from {currencySymbol}
                      {f.minPrice}
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              Search to filter by fare type.
            </p>
          )}
        </FilterSection>

        {/* Max Price */}
        <FilterSection title='Max Price'>
          {priceBounds ? (
            <>
              <div className='flex items-center justify-between font-mono text-[11px]'>
                <span className='text-muted-foreground'>
                  {currencySymbol}
                  {priceBounds.min}
                </span>
                <span className='font-bold text-primary'>
                  up to {currencySymbol}
                  {priceValue}
                </span>
              </div>
              <input
                type='range'
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceValue}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className='mt-2 w-full accent-primary'
              />
            </>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              Search to filter by price.
            </p>
          )}
        </FilterSection>

        {/* Airlines */}
        <FilterSection title='Airlines'>
          {airlines.length > 0 ? (
            <div className='space-y-1'>
              {airlines.map((a) => {
                const on = activeAirlines.includes(a.name)
                return (
                  <label
                    key={a.name}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors',
                      on ? 'bg-primary/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <span
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded border text-[9px] font-bold transition-colors',
                          on
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40',
                        )}
                      >
                        {on && '✓'}
                      </span>
                      <input
                        type='checkbox'
                        checked={on}
                        onChange={() => toggleAirline(a.name)}
                        className='sr-only'
                      />
                      <span className='truncate text-[13px] text-foreground'>
                        {a.name}
                      </span>
                    </div>
                    <span className='shrink-0 font-mono text-[10px] text-muted-foreground'>
                      from {currencySymbol}
                      {a.minPrice}
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              Search to filter by airline.
            </p>
          )}
        </FilterSection>
      </div>
    </aside>
  )
}
