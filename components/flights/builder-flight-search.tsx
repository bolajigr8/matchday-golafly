'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Search, ArrowLeftRight, ChevronDown, Loader2 } from 'lucide-react'
import {
  flightSearchSchema,
  todayISO,
  type FlightSearchValues,
} from '@/features/flights/schema'
import { AirportInput } from '@/components/flights/airport-input'
import {
  FlightPassengersPicker,
  type FlightPassengersValue,
} from '@/components/flights/passengers-picker'
import { DatePicker } from '../ui/date-picker'
import { SearchStripField } from '@/components/flights/search-strip-field'
import { cn } from '@/lib/utils'

interface BuilderFlightSearchProps {
  defaults: Partial<FlightSearchValues>
  onSearch: (values: FlightSearchValues) => void
  isSearching?: boolean
}

/* Compact flight search for the builder Extras step. Mirrors the travel
   FlightSearchBar (same schema + AirportInput) but fits the golafly card grid.
   Drives the live search; the backup list filters on the submitted values. */
export function BuilderFlightSearch({
  defaults,
  onSearch,
  isSearching,
}: BuilderFlightSearchProps) {
  // Default to round trip — most match-day travellers fly back after the
  // game, so round trip is the more useful starting point. One way is
  // still one tap away for anyone who genuinely wants it.
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>(
    'round_trip',
  )

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<FlightSearchValues>({
    // onSubmit: validate only when the user explicitly clicks Search — never
    // show errors for empty dates/airports on first render before they've
    // touched the form. This matches the matches-page filter UX.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      // No hardcoded airport or date defaults — the parent (ExtrasClient) passes
      // destination from the match city's airport via `defaults`, and dates stay
      // empty so the user picks their own ideal travel dates before searching.
      origin: '',
      destination: '',
      departure_date: '',
      return_date: '',
      adults: 1,
      children_ages: [],
      infants: 0,
      cabin_class: 'economy',
      ...defaults,
    },
  })

  // Bug fix: this used to read the departure date with `getValues()`, a
  // one-off snapshot taken at render time. Since the form runs in
  // mode:'onSubmit' (no re-render on plain field changes), the Return
  // date picker's minimum-selectable-day never updated after the user
  // changed Depart — the calendar could show, and let you pick, a return
  // date before your new departure date, which then only got caught (with
  // a confusing error) at submit time. `watch` subscribes to the field so
  // this recomputes on every change, matching how the plain Travels
  // FlightSearchBar already does it.
  const departureDate = watch('departure_date')

  function swap() {
    const { origin, destination } = getValues()
    setValue('origin', destination, { shouldValidate: true })
    setValue('destination', origin, { shouldValidate: true })
  }

  function submit(values: FlightSearchValues) {
    // Bug fix: `return_date` is optional in the shared flightSearchSchema
    // (one-way searches never have one), so a round-trip search with no
    // return date picked used to sail straight through validation and
    // silently search as if it were one-way. Round trip is the default
    // trip type here, so this hit anyone who searched without touching the
    // return date at all. Enforce it explicitly for round trip instead of
    // relying on the (deliberately shared) schema to catch it.
    if (tripType === 'round_trip' && !values.return_date) {
      setError('return_date', {
        type: 'manual',
        message: 'Pick a return date, or switch to One way',
      })
      return
    }
    onSearch({
      ...values,
      return_date: tripType === 'round_trip' ? values.return_date : '',
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className='mb-4 space-y-2'>
      {/* Trip type */}
      <div className='flex gap-1.5'>
        {(['one_way', 'round_trip'] as const).map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => {
              setTripType(t)
              // Switching to one-way makes the return-date field irrelevant
              // (it's disabled below) — clear any "pick a return date"
              // error left over from a previous round-trip submit attempt
              // so it doesn't sit there pointing at a now-hidden field.
              if (t === 'one_way') clearErrors('return_date')
            }}
            className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold transition-colors ${
              tripType === t
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-muted text-muted-foreground'
            }`}
          >
            {t === 'one_way' ? 'One way' : 'Round trip'}
          </button>
        ))}
      </div>

      {/* From / swap / To */}
      <div className='flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-stretch'>
        <div className='min-w-0 flex-1'>
          <Controller
            control={control}
            name='origin'
            render={({ field }) => (
              <SearchStripField label='From' error={errors.origin?.message}>
                <AirportInput
                  value={field.value}
                  onChange={field.onChange}
                  label=''
                  placeholder='City or airport'
                  naked
                  geolocate
                  autoLocate
                />
              </SearchStripField>
            )}
          />
        </div>

        <motion.button
          type='button'
          onClick={swap}
          className='hidden shrink-0 place-items-center self-stretch rounded-xl border border-border bg-muted px-3 py-2 text-muted-foreground lg:grid'
          whileHover={{ rotate: 180, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          aria-label='Swap airports'
        >
          <ArrowLeftRight className='h-4 w-4' />
        </motion.button>

        <div className='min-w-0 flex-1'>
          <Controller
            control={control}
            name='destination'
            render={({ field }) => (
              <SearchStripField label='To' error={errors.destination?.message}>
                <AirportInput
                  value={field.value}
                  onChange={field.onChange}
                  label=''
                  placeholder='City or airport'
                  naked
                />
              </SearchStripField>
            )}
          />
        </div>
      </div>

      {/* Depart / Return — one joined box with a divider, same as Travels.
          Always side-by-side, even on the narrowest phone: two full-width
          stacked date boxes reads far worse on mobile than two compact
          halves of one box does. */}
      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-xl border border-border bg-muted',
          (errors.departure_date || errors.return_date) && 'border-destructive',
        )}
      >
        <div className='min-w-0 flex-1 px-3.5 py-2'>
          <span className='font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>
            Depart
          </span>
          <Controller
            control={control}
            name='departure_date'
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                min={todayISO()}
                placeholder='Pick date'
                months={2}
              />
            )}
          />
        </div>

        <div className='w-px shrink-0 bg-border' />

        <div
          className={cn(
            'min-w-0 flex-1 px-3.5 py-2',
            tripType === 'one_way' && 'pointer-events-none opacity-40',
          )}
        >
          <span className='font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>
            Return
          </span>
          <Controller
            control={control}
            name='return_date'
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ''}
                onChange={field.onChange}
                min={departureDate || todayISO()}
                placeholder='Pick date'
                months={2}
                disabled={tripType === 'one_way'}
              />
            )}
          />
        </div>
      </div>
      {(errors.departure_date || errors.return_date) && (
        <span className='-mt-1 block font-mono text-[9px] text-destructive'>
          {errors.departure_date?.message ?? errors.return_date?.message}
        </span>
      )}

      {/* Passengers / Class */}
      <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch'>
        <SearchStripField label='Passengers'>
          <Controller
            control={control}
            name='adults'
            render={({ field: adultsField }) => (
              <Controller
                control={control}
                name='children_ages'
                render={({ field: childrenField }) => (
                  <Controller
                    control={control}
                    name='infants'
                    render={({ field: infantsField }) => {
                      const paxValue: FlightPassengersValue = {
                        adults: adultsField.value,
                        childrenAges: childrenField.value,
                        infants: infantsField.value,
                      }
                      return (
                        <FlightPassengersPicker
                          value={paxValue}
                          onChange={(v) => {
                            adultsField.onChange(v.adults)
                            childrenField.onChange(v.childrenAges)
                            infantsField.onChange(v.infants)
                          }}
                        />
                      )
                    }}
                  />
                )}
              />
            )}
          />
          {(errors.adults || errors.infants) && (
            <span className='mt-0.5 block font-mono text-[9px] text-destructive'>
              {errors.adults?.message ?? errors.infants?.message}
            </span>
          )}
        </SearchStripField>

        <SearchStripField label='Class'>
          <Controller
            control={control}
            name='cabin_class'
            render={({ field }) => (
              <div className='relative'>
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className='w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[13px] font-medium text-foreground outline-none [&>option]:bg-card [&>option]:text-foreground'
                >
                  <option value='economy'>Economy</option>
                  <option value='premium_economy'>Premium Economy</option>
                  <option value='business'>Business</option>
                  <option value='first'>First</option>
                </select>
                <ChevronDown className='pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
              </div>
            )}
          />
        </SearchStripField>
      </div>

      <motion.button
        type='submit'
        disabled={isSearching}
        className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] disabled:opacity-60'
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSearching ? (
          <Loader2 className='h-4 w-4 shrink-0 animate-spin' />
        ) : (
          <Search className='h-4 w-4 shrink-0' />
        )}
        {isSearching ? 'Searching…' : 'Search Flights'}
      </motion.button>
    </form>
  )
}
