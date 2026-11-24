'use client'

// Duffel hotels inside the match builder (/builder/extras). Same steps as
// the ETG flow (search → results → hotel → done), using the travels app's
// Duffel calls: place suggestions, one search (then paging/sorting by its
// search id), rooms & rates for one result, and a price-held quote that
// goes into the cart. Duffel has no citizenship field (that contract is ETG
// only).

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, ChevronDown, Loader2, MapPin, Search, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { SearchStripField } from '@/components/flights/search-strip-field'
import { GuestsRoomsPicker } from '@/components/stays/guests-rooms-picker'
import { HotelImage } from '@/components/stays/hotel-image'
import { HotelGallery } from '@/components/stays/hotel-gallery'
import { HotelMap } from '@/components/stays/hotel-map'
import { HotelCardSkeleton } from '@/components/stays/stays-skeleton'
import {
  useCreateDuffelQuote,
  useDuffelLocationSuggestions,
  useDuffelRatesForSearchResult,
  useDuffelSearchResultsPage,
  useSearchDuffelStays,
} from '@/features/duffel-stays/hooks'
import { extractDuffelErrorMessage, isRateTooCloseToExpiry } from '@/features/duffel-stays/status'
import type {
  DuffelLocationSuggestion,
  DuffelQuote,
  DuffelRate,
  DuffelRoom,
  DuffelSearchGuestInput,
  DuffelSearchResultItem,
  DuffelSearchSort,
} from '@/features/duffel-stays/types'
import { useDebounce } from '@/features/esim/hooks'
import { validateStayDates, todayISO } from '@/features/stays/date-validation'
import { normalizeRoomGuests } from '@/features/stays/utils'
import { duffelStayCartPayload } from '@/features/cart/stays-payload'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { useStaysStore } from '@/store/stays'
import { useCurrencyStore } from '@/store/currency'
import { DestinationField, type DestinationOption } from './destination-field'
import { FilterChips, HotelPageSkeleton, SearchProblem } from './etg-hotel-step'
import {
  RESULTS_PER_PAGE,
  Stars,
  StepBackLink,
  SummaryTile,
  guestsLabel,
  nightsBetween,
  shortDate,
  useAddHotelToCart,
  type HotelDefaults,
  type HotelStep,
} from './shared'

const SORTS: { id: DuffelSearchSort; label: string }[] = [
  { id: 'price_asc', label: 'Lowest price' },
  { id: 'review_score_desc', label: 'Best reviewed' },
  { id: 'rating_desc', label: 'Top rated' },
]

/** Search radius around the place, as in travels. */
function radiusFor(source: DuffelLocationSuggestion['source']) {
  return source === 'airport' ? 12 : 8
}

function money(amount: string | number | null | undefined, currency: string | null | undefined) {
  const n = typeof amount === 'number' ? amount : Number.parseFloat(amount ?? '')
  return Number.isFinite(n) && currency ? formatMatchdayMoney(n, currency) : '—'
}

function bedsLabel(beds: DuffelRoom['beds']): string | null {
  if (!beds?.length) return null
  return beds.map((b) => `${b.count} ${b.type} bed${b.count === 1 ? '' : 's'}`).join(' · ')
}

interface RateOption {
  key: string
  room: DuffelRoom
  rate: DuffelRate
}

export function DuffelHotelStep({
  matchId,
  defaults,
  resolving,
  step,
  setStep,
}: {
  matchId: string | null
  defaults: HotelDefaults | null
  resolving: boolean
  step: HotelStep
  setStep: (step: HotelStep) => void
}) {
  // Dates and guests live in the shared hotel store, so switching supplier
  // keeps what the guest typed. Duffel takes one flat guest list + rooms.
  const store = useStaysStore()
  const { searchParams, hasHydrated } = store
  const guests = useMemo(() => normalizeRoomGuests(searchParams.guests), [searchParams.guests])
  const duffelGuests: DuffelSearchGuestInput[] = useMemo(
    () =>
      guests.flatMap((room) => [
        ...Array.from({ length: room.adults }, () => ({ type: 'adult' as const })),
        ...room.children.map((age) => ({ type: 'child' as const, age })),
      ]),
    [guests],
  )
  const currency = useCurrencyStore((s) => s.currency)

  /* ── Seed from the match once ─────────────────────────────────────── */
  // Remounted for every match (keyed by match id): seed once per match.
  // Filled from the match when its city/dates arrive, unless already edited.
  const ready = hasHydrated && !resolving && !!defaults
  const seedKey = defaults ? `${defaults.city}|${defaults.checkin}|${defaults.checkout}` : ''
  const [query, setQuery] = useState('')
  const [picked, setPlace] = useState<DuffelLocationSuggestion | null>(null)
  const [seededKey, setSeededKey] = useState('')
  const [edited, setEdited] = useState(false)
  const [keepSaved, setKeepSaved] = useState(false)
  if (ready && seedKey !== seededKey && !edited) {
    const keep = !seededKey && store.lastMatchId === matchId && !!searchParams.checkin
    setSeededKey(seedKey)
    setKeepSaved(keep)
    setQuery(defaults?.city ?? '')
    setPlace(null)
  }
  useEffect(() => {
    if (!seededKey || keepSaved || !defaults) return
    store.setSearchParams({ checkin: defaults.checkin, checkout: defaults.checkout })
    // Only when a new seed is applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seededKey, keepSaved])

  const debounced = useDebounce(query, 300)
  const suggestions = useDuffelLocationSuggestions(debounced, { limit: 8 })
  const placeList = useMemo(() => suggestions.data?.data ?? [], [suggestions.data])
  const options: DestinationOption[] = placeList.map((p) => ({
    id: p.id,
    label: p.label,
    sub: p.source === 'airport' ? 'Airport' : p.country_name,
  }))
  // The match's own city: taken automatically only when Duffel offers it as
  // a city. Never an airport by default: hotels around an outlying airport
  // are not "near the match", so then the guest picks the area.
  const typedMatchCity =
    !!defaults?.city && query.trim().toLowerCase() === defaults.city.trim().toLowerCase()
  const place: DuffelLocationSuggestion | null =
    picked ?? (typedMatchCity ? (placeList.find((p) => p.source === 'city') ?? null) : null)

  /* ── Search, then page/sort by search id ──────────────────────────── */
  const search = useSearchDuffelStays()
  const [searchId, setSearchId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<DuffelSearchSort>('price_asc')
  const [minStars, setMinStars] = useState<string[]>([])
  const paged = useDuffelSearchResultsPage(searchId, { page, sort, perPage: RESULTS_PER_PAGE }, page > 1 || sort !== 'price_asc')
  const source = page > 1 || sort !== 'price_asc' ? paged.data : (search.data ?? paged.data)
  const results: DuffelSearchResultItem[] = source?.data ?? []
  const meta = source?.meta
  const expired = paged.error?.response?.status === 410
  const shown = minStars.length
    ? results.filter((r) => minStars.includes(String(Math.round(r.accommodation.rating ?? 0))))
    : results

  const dates = validateStayDates(searchParams.checkin, searchParams.checkout)
  const [triedSearch, setTriedSearch] = useState(false)

  function runSearch() {
    setTriedSearch(true)
    if (!place || !dates.valid) return
    setPage(1)
    setSort('price_asc')
    setMinStars([])
    setSearchId(null)
    setPlace(place)
    store.setLastMatchId(matchId)
    search.mutate(
      {
        checkInDate: searchParams.checkin,
        checkOutDate: searchParams.checkout,
        rooms: guests.length,
        guests: duffelGuests,
        location: {
          radius: radiusFor(place.source),
          geographicCoordinates: place.geographic_coordinates,
        },
        perPage: RESULTS_PER_PAGE,
        sort: 'price_asc',
      },
      { onSuccess: (res) => setSearchId(res.meta?.search_id ?? null) },
    )
    setStep('results')
  }

  // Prices come back in the customer's currency: search again on a switch.
  const [lastCurrency, setLastCurrency] = useState(currency)
  if (lastCurrency !== currency) {
    setLastCurrency(currency)
    if (searchId && step !== 'search') queueMicrotask(runSearch)
  }

  /* ── One hotel: rooms & rates ─────────────────────────────────────── */
  const [result, setResult] = useState<DuffelSearchResultItem | null>(null)
  const rates = useDuffelRatesForSearchResult()
  const accommodation = rates.data?.data?.id === result?.id ? rates.data?.data.accommodation : undefined
  const [onlyRefundable, setOnlyRefundable] = useState(false)
  const [board, setBoard] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [ratePage, setRatePage] = useState(1)
  const [showAllPolicies, setShowAllPolicies] = useState(false)

  const allOptions: RateOption[] = useMemo(
    () =>
      accommodation?.rooms.flatMap((room, ri) => room.rates.map((rate) => ({ key: `${ri}-${rate.id}`, room, rate }))) ?? [],
    [accommodation],
  )
  const boards = useMemo(
    () => [...new Set(allOptions.map((o) => o.rate.board_type).filter((b): b is string => !!b))],
    [allOptions],
  )
  const filteredOptions = allOptions.filter(
    (o) => (!onlyRefundable || o.rate.refundable) && (!board || o.rate.board_type === board),
  )
  const RATES_PER_PAGE = 6
  const selected = allOptions.find((o) => o.key === selectedKey) ?? filteredOptions[0] ?? null

  function openResult(r: DuffelSearchResultItem) {
    setResult(r)
    setSelectedKey(null)
    setBoard(null)
    setOnlyRefundable(false)
    setRatePage(1)
    setReserveError(null)
    rates.mutate(r.id)
    setStep('hotel')
  }

  /* ── Reserve: hold the price (quote), then the cart ───────────────── */
  const quote = useCreateDuffelQuote()
  const addHotelToCart = useAddHotelToCart(matchId)
  const [adding, setAdding] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [priceChange, setPriceChange] = useState<{ quote: DuffelQuote; option: RateOption; was: number } | null>(null)

  function reserve() {
    if (!selected || !accommodation || !result) return
    setReserveError(null)
    // Checkout refuses a rate with under 30 minutes left (409): don't
    // put one in the cart that can no longer be paid.
    if (isRateTooCloseToExpiry(selected.rate.expires_at)) {
      setReserveError('This price is about to expire. Please search again to get a fresh price.')
      return
    }
    quote.mutate(selected.rate.id, {
      onSuccess: (res) => {
        const q = res.data
        const was = Number.parseFloat(selected.rate.total_amount)
        const now = Number.parseFloat(q.total_amount)
        // Duffel can re-price when the price is held. Higher: the guest
        // confirms first. Lower: added, with a note.
        if (Number.isFinite(was) && Number.isFinite(now) && now > was + 0.005) {
          setPriceChange({ quote: q, option: selected, was })
          return
        }
        if (Number.isFinite(was) && Number.isFinite(now) && now < was - 0.005) {
          toast.success(`Good news: the price went down to ${money(now, q.total_currency)}.`)
        }
        void addQuote(q, selected)
      },
      onError: (err) => {
        const message = extractDuffelErrorMessage(err.response?.data, 'We couldn’t hold this price. Please try again.')
        setReserveError(message)
        toast.error(message)
      },
    })
  }

  async function addQuote(q: DuffelQuote, option: RateOption) {
    if (!accommodation) return
    setAdding(true)
    const ok = await addHotelToCart(
      duffelStayCartPayload({
        quote: q,
        accommodation,
        occupancy: duffelGuests,
        rateExpiresAt: option.rate.expires_at,
        roomName: option.room.name,
      }),
      {
        provider: 'duffel',
        name: accommodation.name,
        roomName: option.room.name,
        image: accommodation.photos?.[0]?.url ?? null,
        checkin: q.check_in_date,
        checkout: q.check_out_date,
        occupancy: guests,
        price: Number.parseFloat(q.total_amount) || 0,
        currency: q.total_currency,
        quoteId: q.id,
        hotelId: accommodation.id,
      },
    )
    setAdding(false)
    if (ok) {
      setPriceChange(null)
      setStep('done')
    }
  }
  const busy = quote.isPending || adding
  const nights = nightsBetween(searchParams.checkin, searchParams.checkout)

  /* ═══════════════════════════ Render ═══════════════════════════ */

  if (step === 'search') {
    return (
      <div className='space-y-3'>
        <div className='flex flex-wrap items-stretch gap-2'>
          <DestinationField
            value={query}
            onType={(t) => {
              setQuery(t)
              setEdited(true)
              setPlace(null)
            }}
            options={options}
            loading={suggestions.isFetching}
            selectedId={place?.id ?? null}
            onPick={(o) => {
              const p = placeList.find((x) => x.id === o.id)
              if (p) {
                setPlace(p)
                setQuery(p.label)
              }
            }}
            error={triedSearch && !place ? 'Choose the area to stay in from the list' : null}
          />
          <SearchStripField label='Check-in' className='basis-[130px]'>
            <DatePicker
              value={searchParams.checkin}
              onChange={(iso) => {
                setEdited(true)
                store.setSearchParams({ checkin: iso })
              }}
              min={todayISO()}
              placeholder='Date'
              ariaLabel='Check-in date'
            />
          </SearchStripField>
          <SearchStripField label='Check-out' className='basis-[130px]'>
            <DatePicker
              value={searchParams.checkout}
              onChange={(iso) => {
                setEdited(true)
                store.setSearchParams({ checkout: iso })
              }}
              min={searchParams.checkin || todayISO()}
              placeholder='Date'
              ariaLabel='Check-out date'
            />
          </SearchStripField>
          <SearchStripField label='Guests & rooms' className='basis-[170px]'>
            <GuestsRoomsPicker
              value={guests}
              onChange={(g) => {
                setEdited(true)
                store.setSearchParams({ guests: g })
              }}
            />
          </SearchStripField>
        </div>
        {!dates.valid && searchParams.checkin && searchParams.checkout && (
          <p className='flex items-center gap-1.5 font-mono text-[10px] text-destructive'>
            <AlertCircle className='size-3' /> {dates.error}
          </p>
        )}
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={runSearch}
            disabled={!hasHydrated || !dates.valid}
            className='flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] disabled:opacity-50'
          >
            <Search className='size-4' />
            Search hotels
          </button>
        </div>
      </div>
    )
  }

  if (step === 'results') {
    const loading = search.isPending || (paged.isFetching && !results.length)
    return (
      <div className='space-y-3'>
        <StepBackLink onClick={() => setStep('search')}>Change search</StepBackLink>
        <p className='font-mono text-[10px] text-muted-foreground'>
          {place?.label} · {shortDate(searchParams.checkin)} → {shortDate(searchParams.checkout)} · {guestsLabel(guests)}
        </p>

        {loading && (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
            <p className='text-center text-[11px] text-muted-foreground'>Searching hotels… this can take a few seconds.</p>
          </div>
        )}

        {!loading && (search.isError || expired) && (
          <SearchProblem
            message={
              expired
                ? 'These results have expired (prices are held for about 45 minutes). Please search again.'
                : extractDuffelErrorMessage(search.error?.response?.data, 'Hotel search is unavailable right now.')
            }
            onRetry={runSearch}
          />
        )}

        {!loading && !search.isError && !expired && meta && results.length === 0 && (
          <SearchProblem message='No hotels found for these dates. Try other dates or another place.' />
        )}

        {!loading && results.length > 0 && (
          <>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-[12px] text-muted-foreground'>
                <span className='font-bold text-foreground'>{meta?.total ?? results.length}</span> hotels
              </p>
              <div role='radiogroup' aria-label='Sort hotels' className='flex flex-wrap gap-1.5'>
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type='button'
                    role='radio'
                    aria-checked={sort === s.id}
                    onClick={() => {
                      setSort(s.id)
                      setPage(1)
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1 font-mono text-[11px] transition-colors',
                      sort === s.id ? 'border-primary bg-primary/10 font-bold text-brand-text' : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <FilterChips
              label='Stars (this page)'
              options={[5, 4, 3, 2].map((n) => ({ key: String(n), label: `${n}★` }))}
              active={minStars}
              onToggle={(k) => setMinStars((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))}
            />
            {shown.length === 0 ? (
              <SearchProblem message='No hotels on this page match your filter.' />
            ) : (
              <div className={cn('space-y-3', paged.isFetching && 'opacity-60')}>
                {shown.map((r, i) => (
                  <DuffelResultCard key={r.id} item={r} index={i} onOpen={() => openResult(r)} />
                ))}
              </div>
            )}
            {(meta?.last_page ?? 1) > 1 && (
              <Pagination page={page} totalPages={meta?.last_page ?? 1} onPage={setPage} />
            )}
          </>
        )}
      </div>
    )
  }

  if (step === 'hotel' && result) {
    const summary = result.accommodation
    const name = accommodation?.name ?? summary.name
    const address = accommodation?.location?.address ?? summary.location.address
    const coords = accommodation?.location?.geographic_coordinates ?? summary.location.geographic_coordinates
    const photos = (accommodation?.photos ?? summary.photos).map((p) => p.url).slice(0, 5)
    const status = rates.error?.response?.status

    return (
      <div className='space-y-4'>
        <StepBackLink onClick={() => setStep('results')}>Back to results</StepBackLink>
        <div>
          <Stars count={accommodation?.rating ?? summary.rating} />
          <h3 className='mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl'>{name}</h3>
          <p className='mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground'>
            <MapPin className='size-3.5 shrink-0' /> {[address.line_one, address.city_name].filter(Boolean).join(', ')}
          </p>
          {(accommodation?.review_score ?? summary.review_score) != null && (
            <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
              Guest score {(accommodation?.review_score ?? summary.review_score)?.toFixed(1)}
              {(accommodation?.review_count ?? summary.review_count) ? ` · ${accommodation?.review_count ?? summary.review_count} reviews` : ''}
            </p>
          )}
        </div>

        {rates.isPending && <HotelPageSkeleton />}

        {!rates.isPending && rates.isError && (
          <SearchProblem
            message={
              status === 422
                ? 'This search result has expired (prices are held for about 45 minutes). Please search again.'
                : extractDuffelErrorMessage(rates.error?.response?.data, 'We couldn’t load this hotel’s rooms.')
            }
            onRetry={status === 422 ? runSearch : () => rates.mutate(result.id)}
          />
        )}

        {accommodation && (
          <>
            <HotelGallery images={photos} hotelName={name} />
            <div className='grid gap-6 xl:grid-cols-[1fr_300px]'>
              <div className='min-w-0 space-y-7'>
                {accommodation.description && (
                  <section>
                    <h4 className='mb-2 font-heading text-base font-bold text-foreground'>Overview</h4>
                    <p className='whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground'>{accommodation.description}</p>
                  </section>
                )}
                {!!accommodation.amenities?.length && (
                  <section>
                    <h4 className='mb-2 font-heading text-base font-bold text-foreground'>Amenities</h4>
                    <div className='flex flex-wrap gap-1.5'>
                      {accommodation.amenities.map((a) => (
                        <span key={a.type} className='rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground'>
                          {a.description}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section id='builder-duffel-rates'>
                  <h4 className='mb-3 font-heading text-base font-bold text-foreground'>Choose your room</h4>
                  {(boards.length > 1 || allOptions.some((o) => o.rate.refundable)) && (
                    <div className='mb-3 flex flex-wrap items-center gap-1.5'>
                      {boards.length > 1 &&
                        boards.map((b) => (
                          <button
                            key={b}
                            type='button'
                            aria-pressed={board === b}
                            onClick={() => {
                              setBoard((v) => (v === b ? null : b))
                              setRatePage(1)
                            }}
                            className={cn(
                              'rounded-full border px-3 py-1 font-mono text-[11px] capitalize',
                              board === b ? 'border-primary bg-primary/10 font-bold text-brand-text' : 'border-border text-muted-foreground',
                            )}
                          >
                            {b.replace(/_/g, ' ')}
                          </button>
                        ))}
                      <button
                        type='button'
                        aria-pressed={onlyRefundable}
                        onClick={() => {
                          setOnlyRefundable((v) => !v)
                          setRatePage(1)
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 font-mono text-[11px]',
                          onlyRefundable ? 'border-primary bg-primary/10 font-bold text-brand-text' : 'border-border text-muted-foreground',
                        )}
                      >
                        Free cancellation
                      </button>
                    </div>
                  )}
                  {filteredOptions.length === 0 ? (
                    <SearchProblem
                      message={allOptions.length ? 'No rooms match these filters.' : 'No bookable rooms for these dates. Try other dates.'}
                    />
                  ) : (
                    <div className='space-y-2'>
                      {filteredOptions.slice((ratePage - 1) * RATES_PER_PAGE, ratePage * RATES_PER_PAGE).map((o) => {
                        const on = selected?.key === o.key
                        const beds = bedsLabel(o.room.beds)
                        const atHotel = Number.parseFloat(o.rate.due_at_accommodation_amount ?? '') || 0
                        return (
                          <button
                            key={o.key}
                            type='button'
                            onClick={() => {
                              setSelectedKey(o.key)
                              setReserveError(null)
                              setPriceChange(null)
                            }}
                            aria-pressed={on}
                            className={cn(
                              'flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all sm:flex-row sm:items-start sm:justify-between',
                              on ? 'border-primary bg-primary/5 shadow-[0_0_14px_var(--brand-glow)]' : 'border-border bg-card hover:border-primary/30',
                            )}
                          >
                            <div className='flex min-w-0 flex-1 items-start gap-3'>
                              <span
                                className={cn(
                                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                                )}
                              >
                                {on && <Check className='size-3' strokeWidth={3} />}
                              </span>
                              <div className='min-w-0'>
                                <p className='break-words font-heading text-[14px] font-bold text-foreground'>
                                  {o.room.name}
                                  {o.rate.name ? ` · ${o.rate.name}` : ''}
                                </p>
                                {beds && <p className='text-[12px] text-muted-foreground'>{beds}</p>}
                                <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                                  {o.rate.board_type && (
                                    <span className='rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] capitalize text-muted-foreground'>
                                      {o.rate.board_type.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 font-mono text-[10px]',
                                      o.rate.refundable ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500',
                                    )}
                                  >
                                    {o.rate.refundable ? 'Free cancellation' : 'Non-refundable'}
                                  </span>
                                  {atHotel > 0 && (
                                    <span className='font-mono text-[10px] text-muted-foreground'>
                                      + {money(atHotel, o.rate.due_at_accommodation_currency ?? o.rate.total_currency)} at the hotel
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className='shrink-0 border-t border-border pt-2 sm:border-0 sm:pt-0 sm:text-right'>
                              <p className='font-heading text-lg font-bold text-brand-text'>{money(o.rate.total_amount, o.rate.total_currency)}</p>
                              <p className='font-mono text-[10px] text-muted-foreground'>
                                total · {nights} night{nights === 1 ? '' : 's'}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {filteredOptions.length > RATES_PER_PAGE && (
                    <Pagination
                      page={ratePage}
                      totalPages={Math.ceil(filteredOptions.length / RATES_PER_PAGE)}
                      onPage={(p) => {
                        setRatePage(p)
                        document.getElementById('builder-duffel-rates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    />
                  )}
                </section>

                {selected && (selected.rate.conditions.length > 0 || selected.rate.cancellation_timeline.length > 0) && (
                  <section>
                    <h4 className='mb-2 font-heading text-base font-bold text-foreground'>Policies for this room</h4>
                    <div className='space-y-2'>
                      {selected.rate.refundable && selected.rate.cancellation_timeline.length > 0 && (
                        <div className='rounded-xl border border-border bg-card p-4'>
                          <p className='mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Cancellation</p>
                          {selected.rate.cancellation_timeline.map((t, i) => (
                            <p key={`${t.before}-${i}`} className='flex flex-wrap justify-between gap-2 text-[12px] text-muted-foreground'>
                              <span>Before {new Date(t.before).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              <span className='font-medium text-foreground'>Refund {money(t.refund_amount, t.refund_currency)}</span>
                            </p>
                          ))}
                        </div>
                      )}
                      {(showAllPolicies ? selected.rate.conditions : selected.rate.conditions.slice(0, 3)).map((c, i) => (
                        <div key={`${c.title}-${i}`} className='rounded-xl border border-border bg-card p-4'>
                          <p className='mb-1 text-[12px] font-bold text-foreground'>{c.title}</p>
                          <p className='whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground'>{c.description}</p>
                        </div>
                      ))}
                      {selected.rate.conditions.length > 3 && (
                        <button
                          type='button'
                          onClick={() => setShowAllPolicies((v) => !v)}
                          className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text hover:underline'
                        >
                          {showAllPolicies ? 'Show less' : `Show ${selected.rate.conditions.length - 3} more`}
                          <ChevronDown className={cn('size-3 transition-transform', showAllPolicies && 'rotate-180')} />
                        </button>
                      )}
                    </div>
                  </section>
                )}

                {coords && (
                  <section>
                    <h4 className='mb-3 font-heading text-base font-bold text-foreground'>Location</h4>
                    <HotelMap
                      latitude={coords.latitude}
                      longitude={coords.longitude}
                      name={name}
                      address={[address.line_one, address.city_name].filter(Boolean).join(', ')}
                    />
                    {accommodation.check_in_information?.check_in_after_time && (
                      <p className='mt-2 font-mono text-[10px] text-muted-foreground'>
                        Check-in from {accommodation.check_in_information.check_in_after_time}
                        {accommodation.check_in_information.check_out_before_time
                          ? ` · Check-out by ${accommodation.check_in_information.check_out_before_time}`
                          : ''}
                      </p>
                    )}
                  </section>
                )}
              </div>

              <aside className='xl:sticky xl:top-24 xl:self-start'>
                <div className='space-y-3 rounded-2xl border border-border bg-card p-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <SummaryTile label='Check-in'>{shortDate(searchParams.checkin)}</SummaryTile>
                    <SummaryTile label='Check-out'>{shortDate(searchParams.checkout)}</SummaryTile>
                  </div>
                  <SummaryTile label='Guests & rooms'>{guestsLabel(guests)}</SummaryTile>
                  {selected && (
                    <>
                      <div className='border-t border-border pt-3'>
                        <p className='break-words text-[13px] font-bold text-foreground'>{selected.room.name}</p>
                        {selected.rate.board_type && (
                          <p className='text-[11px] capitalize text-muted-foreground'>{selected.rate.board_type.replace(/_/g, ' ')}</p>
                        )}
                      </div>
                      <div className='flex items-start justify-between gap-3 border-t border-border pt-3'>
                        <div>
                          <p className='text-[13px] font-bold text-foreground'>Total</p>
                          <p className='font-mono text-[9px] text-muted-foreground'>
                            {Number.parseFloat(selected.rate.due_at_accommodation_amount ?? '') > 0
                              ? `${money(selected.rate.due_at_accommodation_amount, selected.rate.due_at_accommodation_currency ?? selected.rate.total_currency)} payable at the property (not included)`
                              : 'Includes taxes & fees'}
                          </p>
                        </div>
                        <p className='shrink-0 font-heading text-xl font-bold text-brand-text'>
                          {money(selected.rate.total_amount, selected.rate.total_currency)}
                        </p>
                      </div>
                      <p className={cn('text-[11px]', selected.rate.refundable ? 'text-emerald-500' : 'text-destructive')}>
                        {selected.rate.refundable ? 'Free cancellation (see the policy)' : 'This rate is non-refundable'}
                      </p>
                    </>
                  )}
                  {reserveError && (
                    <p className='flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive'>
                      <AlertCircle className='mt-0.5 size-3.5 shrink-0' /> {reserveError}
                    </p>
                  )}
                  {priceChange && (
                    <div className='space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3'>
                      <p className='flex items-center gap-1.5 text-[12px] font-bold text-foreground'>
                        <TrendingUp className='size-4 text-amber-500' /> The price has changed
                      </p>
                      <div className='flex items-center gap-2 text-[12px]'>
                        <span className='text-muted-foreground line-through'>{money(priceChange.was, priceChange.quote.total_currency)}</span>
                        <ArrowRight className='size-3.5 text-muted-foreground' />
                        <span className='font-bold text-brand-text'>{money(priceChange.quote.total_amount, priceChange.quote.total_currency)}</span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <button
                          type='button'
                          disabled={adding}
                          onClick={() => void addQuote(priceChange.quote, priceChange.option)}
                          className='flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-bold text-primary-foreground disabled:opacity-60'
                        >
                          {adding && <Loader2 className='size-3.5 animate-spin' />}
                          Add with new price
                        </button>
                        <button
                          type='button'
                          onClick={() => setPriceChange(null)}
                          className='rounded-full border border-border px-4 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground'
                        >
                          Choose another room
                        </button>
                      </div>
                    </div>
                  )}
                  {!priceChange && (
                  <motion.button
                    type='button'
                    whileTap={{ scale: 0.98 }}
                    onClick={reserve}
                    disabled={!selected || busy}
                    className='flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-bold text-primary-foreground shadow-[0_0_14px_var(--brand-glow)] transition-all hover:shadow-[0_0_24px_var(--brand-glow)] disabled:opacity-60'
                  >
                    {busy ? <Loader2 className='size-4 animate-spin' /> : <Check className='size-4' />}
                    {quote.isPending ? 'Holding the price…' : adding ? 'Adding to cart…' : 'Reserve this room'}
                  </motion.button>
                  )}
                  <p className='text-center text-[10px] text-muted-foreground'>
                    We hold this price while you finish checking out. The room is booked after payment.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}

function DuffelResultCard({ item, index, onOpen }: { item: DuffelSearchResultItem; index: number; onOpen: () => void }) {
  const a = item.accommodation
  return (
    <motion.div
      className='group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md'
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.3 }}
    >
      <div className='flex flex-col sm:flex-row'>
        <div className='relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:min-h-[150px] sm:w-52'>
          <HotelImage
            hotelImageUrl={a.photos?.[0]?.url}
            alt={a.name}
            fill
            sizes='(max-width: 640px) 100vw, 208px'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
        </div>
        <div className='flex min-w-0 flex-1 flex-col justify-between gap-3 p-4'>
          <div className='min-w-0'>
            <Stars count={a.rating} />
            <h4 className='mt-1 font-heading text-[15px] font-bold text-foreground'>{a.name}</h4>
            <p className='mt-1 flex items-start gap-1 text-[12px] text-muted-foreground'>
              <MapPin className='mt-0.5 size-3 shrink-0' />
              {[a.location.address.line_one, a.location.address.city_name].filter(Boolean).join(', ')}
            </p>
            {a.review_score != null && (
              <p className='mt-1 font-mono text-[10px] text-muted-foreground'>
                Guest score {a.review_score.toFixed(1)}
                {a.review_count ? ` · ${a.review_count} reviews` : ''}
              </p>
            )}
          </div>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>From</p>
              <p className='font-heading text-lg font-bold text-brand-text'>
                {money(item.cheapest_rate_total_amount, item.cheapest_rate_currency)}
              </p>
              <p className='font-mono text-[9px] text-muted-foreground'>total stay</p>
            </div>
            <button
              type='button'
              onClick={onOpen}
              className='flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_10px_var(--brand-glow)] transition-all hover:shadow-[0_0_18px_var(--brand-glow)]'
            >
              View rooms <ArrowRight className='size-3.5' />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
