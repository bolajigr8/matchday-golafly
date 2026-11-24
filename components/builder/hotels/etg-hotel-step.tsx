'use client'

// ETG hotels inside the match builder (/builder/extras). The travels Stays
// flow (search → results → hotel page → reserve) as steps on one page.
// Citizenship of the main guest is chosen next to Guests and sent as
// `residency` on both searches and on add-to-cart (Citizenship, room name
// and failed hotel API contract v1.0, section 2).

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { SearchStripField } from '@/components/flights/search-strip-field'
import { GuestsRoomsPicker } from '@/components/stays/guests-rooms-picker'
import { CitizenshipPicker, CITIZENSHIP_SHORT_LABEL } from '@/components/stays/citizenship-picker'
import { HotelImage } from '@/components/stays/hotel-image'
import { HotelGallery } from '@/components/stays/hotel-gallery'
import { HotelMap } from '@/components/stays/hotel-map'
import { HotelPoliciesSection } from '@/components/stays/hotel-policies'
import { HotelMetapolicySection } from '@/components/stays/hotel-metapolicy'
import { StaysRoomPicker } from '@/components/stays/room-picker'
import { RoomName } from '@/components/stays/room-name'
import { StayCancellationPolicy } from '@/components/stays/cancellation-policy'
import { HotelCardSkeleton } from '@/components/stays/stays-skeleton'
import {
  usePrebookStay,
  useSearchStayByHotelId,
  useSearchStaysByRegion,
  useStayRegions,
} from '@/features/stays/hooks'
import { normalizeResidency, residencyErrorOf } from '@/features/stays/residency'
import { parseStayError } from '@/features/stays/errors'
import { validateStayDates, todayISO } from '@/features/stays/date-validation'
import { normalizeRoomGuests } from '@/features/stays/utils'
import { collateGalleryImages } from '@/features/stays/stay-images'
import { getPropertyFeeTotal } from '@/features/stays/fees'
import { stayDisplayPrice } from '@/features/stays/price'
import type { PrebookRate, StayHotelDetail, StayHotelListItem, StayRoom } from '@/features/stays/types'
import { etgStayCartPayload } from '@/features/cart/stays-payload'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { useStaysStore } from '@/store/stays'
import { useCurrencyStore } from '@/store/currency'
import { DestinationField, type DestinationOption } from './destination-field'
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

/** ETG's own request currency: it must stay EUR. The customer's currency
 *  goes in the X-Currency header (lib/axios.ts), and prices come back in it. */
const ETG_REQUEST_CURRENCY = 'EUR'

export function EtgHotelStep({
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
  const store = useStaysStore()
  const { searchParams, hasHydrated } = store
  const guests = useMemo(() => normalizeRoomGuests(searchParams.guests), [searchParams.guests])
  const residency = normalizeResidency(searchParams.residency)
  const currency = useCurrencyStore((s) => s.currency)

  /* ── Seed dates and city from the match (once per match) ─────────── */
  // The box is remounted for every match (keyed by match id), so this runs
  // once per match. A search saved for another match is not reused.
  // The match's city and dates arrive a moment after the page; they fill the
  // form when they do, unless the guest has already started editing it.
  const ready = hasHydrated && !resolving && !!defaults
  const seedKey = defaults ? `${defaults.city}|${defaults.checkin}|${defaults.checkout}` : ''
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<DestinationOption | null>(null)
  const [seededKey, setSeededKey] = useState('')
  const [edited, setEdited] = useState(false)
  const [keepSaved, setKeepSaved] = useState(false)
  if (ready && seedKey !== seededKey && !edited) {
    // First time for this match: a search the guest already ran for THIS
    // match is kept; anything saved for another match is not.
    const keep = !seededKey && store.lastMatchId === matchId && !!searchParams.checkin
    setSeededKey(seedKey)
    setKeepSaved(keep)
    if (keep && searchParams.regionId) {
      setRegion({ id: String(searchParams.regionId), label: searchParams.regionName })
      setQuery(searchParams.regionName)
    } else if (!keep) {
      setRegion(null)
      setQuery(defaults?.city ?? '')
    }
  }
  useEffect(() => {
    if (!seededKey || keepSaved || !defaults) return
    store.setSearchParams({
      checkin: defaults.checkin,
      checkout: defaults.checkout,
      regionId: null,
      regionName: '',
    })
    store.resetBooking()
    // Only when a new seed is applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seededKey, keepSaved])

  /* ── Places ───────────────────────────────────────────────────────── */
  const { data: regionData, isFetching: loadingRegions } = useStayRegions(query)
  const regionOptions: DestinationOption[] = useMemo(
    () =>
      (regionData?.data ?? []).map((r) => ({
        id: String(r.region_id),
        label: r.name_en,
        sub: [r.type, r.country_name_en].filter(Boolean).join(' · '),
      })),
    [regionData],
  )
  // The match's own city: take the supplier's first place for it, so the
  // guest only has to tap Search. Typing anything else clears it.
  const typedMatchCity =
    !!defaults?.city && query.trim().toLowerCase() === defaults.city.trim().toLowerCase()
  const place: DestinationOption | null = region ?? (typedMatchCity ? (regionOptions[0] ?? null) : null)

  /* ── Search results ───────────────────────────────────────────────── */
  const search = useSearchStaysByRegion()
  const hotels: StayHotelListItem[] = useMemo(() => search.data?.data?.hotels ?? [], [search.data])
  const searchResidencyError = residencyErrorOf(search.error)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [stars, setStars] = useState<number[]>([])
  const [kinds, setKinds] = useState<string[]>([])
  const kindOptions = useMemo(
    () => [...new Set(hotels.map((h) => h.kind).filter((k): k is string => !!k))].sort(),
    [hotels],
  )
  const filtered = useMemo(
    () =>
      hotels.filter(
        (h) =>
          (stars.length === 0 || stars.includes(Math.round(h.star_rating ?? 0))) &&
          (kinds.length === 0 || kinds.includes(h.kind ?? '')),
      ),
    [hotels, stars, kinds],
  )

  const dates = validateStayDates(searchParams.checkin, searchParams.checkout)
  const [triedSearch, setTriedSearch] = useState(false)

  function runSearch() {
    setTriedSearch(true)
    if (!place || !dates.valid || !residency) return
    setPage(1)
    setStars([])
    setKinds([])
    setRegion(place)
    store.setSearchParams({ regionId: Number(place.id), regionName: place.label })
    store.setLastMatchId(matchId)
    search.mutate({
      checkin: searchParams.checkin,
      checkout: searchParams.checkout,
      residency,
      language: 'en',
      guests,
      region_id: Number(place.id),
      currency: ETG_REQUEST_CURRENCY,
    })
    setStep('results')
  }

  /* ── Hotel page ───────────────────────────────────────────────────── */
  const [hotel, setHotel] = useState<StayHotelListItem | null>(null)
  const detail = useSearchStayByHotelId()
  const hotelDetail: StayHotelDetail | null =
    detail.data?.data && hotel && detail.data.data.hotel_code === hotel.hotel_code ? detail.data.data : null
  const [roomHash, setRoomHash] = useState<string | null>(null)
  const [roomPage, setRoomPage] = useState(1)

  function fetchHotel(h: StayHotelListItem) {
    detail.mutate(
      {
        checkin: searchParams.checkin,
        checkout: searchParams.checkout,
        hid: h.hotel_code,
        residency,
        language: 'en',
        currency: ETG_REQUEST_CURRENCY,
        guests,
        filter: { star_rating: [1, 2, 3, 4, 5] },
      },
      {
        onSuccess: (res) => setRoomHash(res.data?.rooms?.[0]?.book_hash ?? null),
      },
    )
  }

  function openHotel(h: StayHotelListItem) {
    setHotel(h)
    setRoomHash(null)
    setRoomPage(1)
    setReserveError(null)
    setPriceChange(null)
    fetchHotel(h)
    setStep('hotel')
  }

  /* ── Reserve: price check (prebook), then the cart ────────────────── */
  const prebook = usePrebookStay()
  const addHotelToCart = useAddHotelToCart(matchId)
  const [adding, setAdding] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [priceChange, setPriceChange] = useState<{ was: StayRoom; rate: PrebookRate } | null>(null)

  const rooms = hotelDetail?.rooms ?? []
  const activeRoom = rooms.find((r) => r.book_hash === roomHash) ?? rooms[0] ?? null
  const nights = nightsBetween(searchParams.checkin, searchParams.checkout)

  async function addRate(rate: PrebookRate) {
    if (!hotel || !hotelDetail) return
    setAdding(true)
    const ok = await addHotelToCart(
      etgStayCartPayload({
        hotelCode: hotelDetail.hotel_code,
        hotelName: hotelDetail.name ?? hotel.name ?? 'Hotel',
        hotelImage: hotelDetail.image || hotel.image,
        hotelAddress: hotelDetail.address ?? hotel.address,
        rate,
        checkin: searchParams.checkin,
        checkout: searchParams.checkout,
        occupancy: guests,
        residency,
        genderRequired: hotelDetail.is_gender_specification_required,
      }),
      {
        provider: 'etg',
        name: hotelDetail.name ?? hotel.name ?? 'Hotel',
        roomName: rate.room_name,
        image: hotel.image,
        checkin: searchParams.checkin,
        checkout: searchParams.checkout,
        occupancy: guests,
        price: rate.total_price,
        currency: rate.currency,
        bookHash: rate.book_hash,
        hotelId: String(hotelDetail.hotel_code),
        residency,
      },
    )
    setAdding(false)
    if (!ok) return
    store.setSelectedHotel(hotelDetail)
    store.setPrebookedRate(rate)
    setPriceChange(null)
    setStep('done')
  }

  function reserve() {
    if (!activeRoom) return
    setReserveError(null)
    setPriceChange(null)
    store.setSelectedRoom(activeRoom)
    // The exact guests array sent to /search-hp, unchanged.
    prebook.mutate(
      { hash: activeRoom.book_hash, guests },
      {
        onSuccess: (res) => {
          const rate = res.data.hotels?.[0]?.rates?.[0]
          if (!rate) {
            setReserveError('This room is no longer available. Please choose another room.')
            return
          }
          store.setPriceChanged(res.data.price_changed)
          if (res.data.price_changed) {
            setPriceChange({ was: activeRoom, rate })
            return
          }
          void addRate(rate)
        },
        onError: (err) => {
          const parsed = parseStayError(err)
          if (parsed.slug === 'invalid_rate_hash') {
            setReserveError('This room is no longer available with the details we have. Please choose another room.')
          } else if (parsed.fieldErrors) {
            console.error('[builder/hotel] prebook 422: the guests payload was rejected', parsed.fieldErrors)
            setReserveError('Something went wrong preparing this room. Please try again.')
          } else {
            setReserveError(parsed.message)
          }
        },
      },
    )
  }

  function runSearchSilently() {
    if (!place || !dates.valid) return
    search.mutate({
      checkin: searchParams.checkin,
      checkout: searchParams.checkout,
      residency,
      language: 'en',
      guests,
      region_id: Number(place.id),
      currency: ETG_REQUEST_CURRENCY,
    })
  }

  /* Prices depend on citizenship and currency: a change means a new search
     (contract 2.7.5). Results and an open hotel are fetched again; a held
     price from before is dropped (setResidency already clears it). */
  const lastKey = useRef(`${residency}|${currency}`)
  useEffect(() => {
    const key = `${residency}|${currency}`
    if (lastKey.current === key) return
    lastKey.current = key
    setPriceChange(null)
    if (step === 'results' && (search.data || search.isError) && place) runSearchSilently()
    if (step === 'hotel' && hotel) fetchHotel(hotel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residency, currency])


  const busy = prebook.isPending || adding

  /* ═══════════════════════════ Render ═══════════════════════════ */

  if (step === 'search') {
    return (
      <div className='space-y-3'>
        <div className='flex flex-wrap items-stretch gap-2'>
          <DestinationField
            value={query}
            onType={(text) => {
              setQuery(text)
              setEdited(true)
              setRegion(null)
            }}
            options={regionOptions}
            loading={loadingRegions}
            selectedId={place?.id ?? null}
            onPick={(o) => {
              setRegion(o)
              setQuery(o.label)
            }}
            error={triedSearch && !place ? 'Choose a place from the list' : null}
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
          <CitizenshipPicker
            variant='strip'
            label={CITIZENSHIP_SHORT_LABEL}
            align='end'
            error={searchResidencyError}
            className='min-w-0 flex-1 basis-[200px]'
          />
        </div>
        {!dates.valid && searchParams.checkin && searchParams.checkout && (
          <p className='flex items-center gap-1.5 font-mono text-[10px] text-destructive'>
            <AlertCircle className='size-3' /> {dates.error}
          </p>
        )}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-[11px] text-muted-foreground'>
            Prices depend on the main guest&apos;s citizenship: choose the passport of the person checking in.
          </p>
          <button
            type='button'
            onClick={runSearch}
            disabled={!hasHydrated || !dates.valid || !residency}
            className='flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] disabled:opacity-50'
          >
            <Search className='size-4' />
            Search hotels
          </button>
        </div>
      </div>
    )
  }

  if (step === 'results') {
    return (
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <StepBackLink onClick={() => setStep('search')}>Change search</StepBackLink>
          <CitizenshipPicker variant='inline' align='end' error={searchResidencyError} />
        </div>
        <p className='font-mono text-[10px] text-muted-foreground'>
          {searchParams.regionName} · {shortDate(searchParams.checkin)} → {shortDate(searchParams.checkout)} ·{' '}
          {guestsLabel(guests)}
        </p>

        {search.isPending && (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
            <p className='text-center text-[11px] text-muted-foreground'>Searching hotels…</p>
          </div>
        )}

        {!search.isPending && search.isError && (
          <SearchProblem
            message={
              searchResidencyError
                ? 'Choose the main guest’s citizenship above, then search again.'
                : 'Hotel search is unavailable right now. Please try again in a moment.'
            }
            onRetry={searchResidencyError ? undefined : runSearchSilently}
          />
        )}

        {!search.isPending && !search.isError && search.data && hotels.length === 0 && (
          <SearchProblem message='No hotels found for these dates. Try other dates or another place.' />
        )}

        {!search.isPending && hotels.length > 0 && (
          <>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-[12px] text-muted-foreground'>
                <span className='font-bold text-foreground'>{filtered.length}</span> of {hotels.length} hotels
              </p>
              <button
                type='button'
                onClick={() => setShowFilters((v) => !v)}
                className='flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-text'
              >
                <SlidersHorizontal className='size-3.5' />
                {showFilters ? 'Hide filters' : 'Filters'}
                {(stars.length > 0 || kinds.length > 0) && (
                  <span className='rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground'>Active</span>
                )}
              </button>
            </div>
            {showFilters && (
              <div className='space-y-3 rounded-xl border border-border bg-card p-4'>
                <FilterChips
                  label='Stars'
                  options={[5, 4, 3, 2, 1].map((n) => ({ key: String(n), label: `${n}★` }))}
                  active={stars.map(String)}
                  onToggle={(k) => {
                    const n = Number(k)
                    setPage(1)
                    setStars((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
                  }}
                />
                {kindOptions.length > 1 && (
                  <FilterChips
                    label='Type'
                    options={kindOptions.map((k) => ({ key: k, label: k.replace(/_/g, ' ') }))}
                    active={kinds}
                    onToggle={(k) => {
                      setPage(1)
                      setKinds((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))
                    }}
                  />
                )}
              </div>
            )}
            {filtered.length === 0 ? (
              <SearchProblem message='No hotels match your filters.' />
            ) : (
              <div className='space-y-3'>
                {filtered.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE).map((h, i) => (
                  <EtgHotelCard key={h.hotel_id} hotel={h} index={i} onOpen={() => openHotel(h)} />
                ))}
              </div>
            )}
            {filtered.length > RESULTS_PER_PAGE && (
              <Pagination
                page={page}
                totalPages={Math.ceil(filtered.length / RESULTS_PER_PAGE)}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>
    )
  }

  if (step === 'hotel' && hotel) {
    const name = hotelDetail?.name ?? hotel.name ?? 'Hotel'
    const roomImages = rooms.flatMap((r) => r.images ?? [])
    const gallery = collateGalleryImages(roomImages.length ? roomImages : (hotelDetail?.image ?? hotel.image), 5, '1024x768')
    const price = activeRoom ? stayDisplayPrice(activeRoom) : null
    const propertyFee = getPropertyFeeTotal(activeRoom)

    return (
      <div className='space-y-4'>
        <StepBackLink onClick={() => setStep('results')}>Back to results</StepBackLink>

        <div>
          <Stars count={hotelDetail?.star_rating ?? hotel.star_rating} />
          <h3 className='mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl'>{name}</h3>
          {(hotelDetail?.address ?? hotel.address) && (
            <p className='mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground'>
              <MapPin className='size-3.5 shrink-0' /> {hotelDetail?.address ?? hotel.address}
            </p>
          )}
        </div>

        {detail.isPending && <HotelPageSkeleton />}

        {!detail.isPending && detail.isError && (
          residencyErrorOf(detail.error) ? (
            <div className='rounded-2xl border border-border bg-card p-5'>
              <p className='font-bold text-foreground'>Check the citizenship</p>
              <p className='mt-1 text-[12px] text-muted-foreground'>
                Choose the main guest&apos;s citizenship to see this hotel&apos;s rooms and prices.
              </p>
              <CitizenshipPicker preselect={false} error={residencyErrorOf(detail.error)} className='mt-3 max-w-sm' />
            </div>
          ) : (
            <SearchProblem
              message={parseStayError(detail.error).message || 'We couldn’t load this hotel’s rooms.'}
              onRetry={() => fetchHotel(hotel)}
            />
          )
        )}

        {hotelDetail && (
          <>
            <HotelGallery images={gallery} hotelName={name} />
            <div className='grid gap-6 xl:grid-cols-[1fr_300px]'>
              <div className='min-w-0 space-y-7'>
                {hotelDetail.description_struct?.length > 0 && (
                  <section>
                    <h4 className='mb-2 font-heading text-base font-bold text-foreground'>Overview</h4>
                    {hotelDetail.description_struct.map((block) => (
                      <div key={block.title} className='mb-3'>
                        <p className='mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                          {block.title}
                        </p>
                        {block.paragraphs.map((p, i) => (
                          <p key={i} className='text-[13px] leading-relaxed text-muted-foreground'>
                            {p}
                          </p>
                        ))}
                      </div>
                    ))}
                  </section>
                )}
                {(hotelDetail.phone || hotelDetail.email) && (
                  <div className='flex flex-wrap gap-4'>
                    {hotelDetail.phone && (
                      <a href={`tel:${hotelDetail.phone}`} className='flex items-center gap-1.5 font-mono text-[12px] text-brand-text hover:underline'>
                        <Phone className='size-3.5' /> {hotelDetail.phone}
                      </a>
                    )}
                    {hotelDetail.email && (
                      <a href={`mailto:${hotelDetail.email}`} className='flex items-center gap-1.5 font-mono text-[12px] text-brand-text hover:underline'>
                        <Mail className='size-3.5' /> {hotelDetail.email}
                      </a>
                    )}
                  </div>
                )}
                <HotelMetapolicySection metapolicy={hotelDetail.metapolicy_struct} extraInfo={hotelDetail.metapolicy_extra_info} />
                <HotelPoliciesSection policies={hotelDetail.policy_struct} />
                <section id='builder-hotel-rooms'>
                  <h4 className='mb-3 font-heading text-base font-bold text-foreground'>Choose your room</h4>
                  {rooms.length === 0 ? (
                    <SearchProblem message='No rooms are available at this hotel for your dates and guests.' />
                  ) : (
                    <StaysRoomPicker
                      rooms={rooms}
                      selectedRoomId={activeRoom?.book_hash ?? null}
                      onSelect={(hash) => {
                        setRoomHash(hash)
                        setPriceChange(null)
                        setReserveError(null)
                      }}
                      roomPage={roomPage}
                      onPageChange={(p) => {
                        setRoomPage(p)
                        document.getElementById('builder-hotel-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    />
                  )}
                </section>
                {(hotelDetail.latitude != null && hotelDetail.longitude != null) || hotelDetail.address ? (
                  <section>
                    <h4 className='mb-3 font-heading text-base font-bold text-foreground'>Location</h4>
                    <HotelMap
                      latitude={hotelDetail.latitude ?? NaN}
                      longitude={hotelDetail.longitude ?? NaN}
                      name={name}
                      address={hotelDetail.address ?? ''}
                    />
                    {hotelDetail.check_in_time && (
                      <p className='mt-2 font-mono text-[10px] text-muted-foreground'>
                        Check-in {hotelDetail.check_in_time}
                        {hotelDetail.check_out_time ? ` · Check-out ${hotelDetail.check_out_time}` : ''}
                      </p>
                    )}
                  </section>
                ) : null}
              </div>

              <aside className='xl:sticky xl:top-24 xl:self-start'>
                <div className='space-y-3 rounded-2xl border border-border bg-card p-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <SummaryTile label='Check-in'>{shortDate(searchParams.checkin)}</SummaryTile>
                    <SummaryTile label='Check-out'>{shortDate(searchParams.checkout)}</SummaryTile>
                  </div>
                  <SummaryTile label='Guests & rooms'>{guestsLabel(guests)}</SummaryTile>
                  {/* Changing it fetches this hotel again: old prices are never reused. */}
                  <CitizenshipPicker preselect={false} align='end' className='[&>button]:w-full' />
                  {activeRoom && price && (
                    <>
                      <div className='border-t border-border pt-3'>
                        <RoomName room={activeRoom} titleClassName='text-[13px] font-bold text-foreground' />
                        <p className='mt-0.5 text-[11px] capitalize text-muted-foreground'>{activeRoom.meal_type?.replace(/-/g, ' ')}</p>
                      </div>
                      <div className='flex justify-between text-[12px] text-muted-foreground'>
                        <span>{formatMatchdayMoney(price.perNight, price.currency)} / night</span>
                        <span>
                          {nights} night{nights === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className='flex items-start justify-between gap-3 border-t border-border pt-3'>
                        <div>
                          <p className='text-[13px] font-bold text-foreground'>Total</p>
                          <p className='font-mono text-[9px] text-muted-foreground'>
                            {propertyFee
                              ? `${formatMatchdayMoney(propertyFee.amount, propertyFee.currency)} payable at the property (not included)`
                              : 'Includes taxes & fees'}
                          </p>
                        </div>
                        <p className='shrink-0 font-heading text-xl font-bold text-brand-text'>
                          {formatMatchdayMoney(price.total, price.currency)}
                        </p>
                      </div>
                    </>
                  )}

                  {priceChange && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3'
                    >
                      <p className='flex items-center gap-1.5 text-[12px] font-bold text-foreground'>
                        <TrendingUp className='size-4 text-amber-500' /> The price has changed
                      </p>
                      <div className='flex items-center gap-2 text-[12px]'>
                        <span className='text-muted-foreground line-through'>
                          {formatMatchdayMoney(stayDisplayPrice(priceChange.was).total, stayDisplayPrice(priceChange.was).currency)}
                        </span>
                        <ArrowRight className='size-3.5 text-muted-foreground' />
                        <span className='font-bold text-brand-text'>
                          {formatMatchdayMoney(stayDisplayPrice(priceChange.rate).total, stayDisplayPrice(priceChange.rate).currency)}
                        </span>
                      </div>
                      <StayCancellationPolicy rate={priceChange.rate} />
                      <div className='flex flex-wrap gap-2'>
                        <button
                          type='button'
                          disabled={adding}
                          onClick={() => void addRate(priceChange.rate)}
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
                    </motion.div>
                  )}

                  {reserveError && (
                    <p className='flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive'>
                      <AlertCircle className='mt-0.5 size-3.5 shrink-0' /> {reserveError}
                    </p>
                  )}

                  {!priceChange && (
                    <button
                      type='button'
                      onClick={reserve}
                      disabled={!activeRoom || busy}
                      className='flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-bold text-primary-foreground shadow-[0_0_14px_var(--brand-glow)] transition-all hover:shadow-[0_0_24px_var(--brand-glow)] disabled:opacity-60'
                    >
                      {busy ? <Loader2 className='size-4 animate-spin' /> : <Check className='size-4' />}
                      {prebook.isPending ? 'Checking the price…' : adding ? 'Adding to cart…' : 'Reserve this room'}
                    </button>
                  )}
                  <p className='text-center text-[10px] text-muted-foreground'>
                    We check the room&apos;s price with the hotel before it goes in your cart.
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

/* ── Pieces ─────────────────────────────────────────────────────────── */

function EtgHotelCard({ hotel, index, onOpen }: { hotel: StayHotelListItem; index: number; onOpen: () => void }) {
  const kind = hotel.kind ? hotel.kind.replace(/_/g, ' ') : 'Hotel'
  const name =
    hotel.name ??
    hotel.hotel_id
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
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
            hotelImageUrl={hotel.image}
            cdnSize='640x480'
            alt={name}
            fill
            sizes='(max-width: 640px) 100vw, 208px'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
          <span className='absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-white backdrop-blur'>
            {kind}
          </span>
        </div>
        <div className='flex min-w-0 flex-1 flex-col justify-between gap-3 p-4'>
          <div className='min-w-0'>
            <Stars count={hotel.star_rating} />
            <h4 className='mt-1 font-heading text-[15px] font-bold text-foreground'>{name}</h4>
            {hotel.address && (
              <p className='mt-1 flex items-start gap-1 text-[12px] text-muted-foreground'>
                <MapPin className='mt-0.5 size-3 shrink-0' /> {hotel.address}
              </p>
            )}
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='font-mono text-[10px] text-muted-foreground'>Prices on the next step</span>
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

export function FilterChips({
  label,
  options,
  active,
  onToggle,
}: {
  label: string
  options: { key: string; label: string }[]
  active: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div>
      <p className='mb-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {options.map((o) => {
          const on = active.includes(o.key)
          return (
            <button
              key={o.key}
              type='button'
              aria-pressed={on}
              onClick={() => onToggle(o.key)}
              className={cn(
                'rounded-full border px-3 py-1 font-mono text-[11px] capitalize transition-colors',
                on ? 'border-primary bg-primary/10 font-bold text-brand-text' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SearchProblem({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center'>
      <p className='text-[12px] text-muted-foreground'>{message}</p>
      {onRetry && (
        <button
          type='button'
          onClick={onRetry}
          className='flex items-center gap-1.5 rounded-full border border-brand-text/35 px-4 py-1.5 text-[11px] font-bold text-brand-text hover:bg-primary/10'
        >
          <RefreshCcw className='size-3' /> Try again
        </button>
      )}
    </div>
  )
}

export function HotelPageSkeleton() {
  return (
    <div className='space-y-4' aria-hidden>
      <div className='h-56 animate-pulse rounded-2xl bg-muted sm:h-72' />
      <div className='grid gap-4 xl:grid-cols-[1fr_300px]'>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='h-24 animate-pulse rounded-xl bg-muted' />
          ))}
        </div>
        <div className='h-64 animate-pulse rounded-2xl bg-muted' />
      </div>
      <p className='text-center text-[11px] text-muted-foreground'>Loading rooms and prices…</p>
    </div>
  )
}
