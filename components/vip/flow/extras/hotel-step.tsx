'use client'

import { useEffect, useState } from 'react'
import { Check, MapPin, Star } from 'lucide-react'
import {
  guessResidencyFromBrowser,
  normalizeResidency,
  useStayCountries,
} from '@/features/stays/residency'
import { useStaysStore } from '@/store/stays'
import { DatePicker } from '@/components/ui/date-picker'
import { VipButton } from '@/components/vip/flow/button'
import { VipPanel, VipSubSteps } from '@/components/vip/flow/panel'
import { VipQuantity } from '@/components/vip/flow/quantity'
import { VipError, VipNote } from '@/components/vip/flow/state'
import { vipApi } from '@/features/vip/api'
import type { VipEventView } from '@/features/vip/clubs'
import type { VipHotelOption, VipPackage } from '@/features/vip/contract'
import {
  formatVipPrice,
  formatVipShortDate,
  vipAddDays,
  vipDaysBetween,
  vipHotelCheckInWindow,
  vipYmd,
} from '@/features/vip/format'
import {
  normalizeHotelInfo,
  normalizeHotelLock,
  normalizeHotelRates,
  type VipHotelInfo,
  type VipHotelLock,
  type VipHotelRate,
} from '@/features/vip/normalize'
import { flightOfferOf, packageItem, packageTravellers, stepRequired } from '@/features/vip/package'
import { VipApiError } from '@/features/vip/errors'
import { useVipAction } from '@/features/vip/use-package'
import { BackLink, nightly, VipHotelAbout, VipHotelCard, VipHotelGallery, VipRoomPicker, VipStars } from './hotel-parts'

/* Extras → "Hotel" (Figma 506:4047 + "VIP · Hotel choice" 513:5507), on the
   backend's hotel flow (contract §2.4): Search → Results → Hotel → Done.
   Results, the hotel page and its room picker follow the travels project's
   stays screens (copied into hotel-parts.tsx, VIP colours), inline in this
   box like the flight step.
   Choosing a room locks its price; the package adds it from the lock.
   Dates (contract of 17 Nov, 2.4):
     • return flight: check-in = the day the outbound lands; nights are
       optional, capped at the return flight's day (left out = stay until
       the return flight);
     • one-way flight: check-in from the flight, nights 1 to 7 required;
     • no flight (flexible mode only): the customer picks check-in (the
       later of today and two days before the match, up to match day) and
       1 to 7 nights.
   The stay must always include the match night. Hotels are 4 or 5 star in
   the club's city. Two hotel suppliers behave differently (a price on the
   card, or "See prices"); the customer never sees which one it is. */

type Step = 'search' | 'results' | 'hotel' | 'done'
const STEP_LABELS = ['SEARCH', 'RESULTS', 'HOTEL']
const STEP_INDEX: Record<Step, number> = { search: 0, results: 1, hotel: 2, done: 3 }
const PAGE = 10
const fieldLabel = 'font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'

/* Messages that mean "the search memory lapsed: search again" (§4), incl.
   the 409 when an admin switches the hotel supplier mid-way. */
const SEARCH_AGAIN =
  /search (has )?expired|search again|open the hotel again|search for hotels first|hotel not found|rate not found|options changed|dates don.t match/i

interface Stay {
  checkin: string
  checkout: string
  nights: number
}

/** What the flight fixes for the hotel: check-in (the day the outbound
 *  lands) and, with a return flight, its departure day. null without a
 *  flight (or before its offer is known on this device). */
function flightWindow(pkg: VipPackage): { checkin: string; returnDay: string | null } | null {
  const offer = flightOfferOf(pkg)
  const out = offer?.slices[0]
  const landed = out?.segments[out.segments.length - 1]?.arriving_at?.slice(0, 10)
  if (!offer || !landed) return null
  const back = offer.slices[1]
  const returnDay = back ? ((back.segments[0]?.departing_at ?? back.departure_date)?.slice(0, 10) ?? null) : null
  return { checkin: landed, returnDay }
}

/** The fewest nights that still include the match night. */
const minNightsFrom = (checkin: string, matchDay: string) => Math.max(1, vipDaysBetween(checkin, matchDay) + 1)


export function VipHotelStep({
  pkg,
  match,
  onPackage,
}: {
  pkg: VipPackage
  match: VipEventView
  onPackage: (p: VipPackage) => void
}) {
  const travellers = packageTravellers(pkg)
  const maxRooms = Math.min(travellers, 9)
  const hotel = packageItem(pkg, 'stays')
  /* The backend says when the hotel waits for a flight (package mode). */
  const blocked = pkg.steps.hotel.blocked
  const expired = !!pkg.steps.hotel.expired
  const optional = !stepRequired(pkg, 'hotel')
  const matchDay = vipYmd(match.date)
  const hasFlightLine = !!packageItem(pkg, 'flight')
  const fw = flightWindow(pkg)
  /* Which date form to show. */
  const kind: 'return' | 'oneway' | 'free' = !hasFlightLine ? 'free' : fw?.returnDay ? 'return' : 'oneway'
  const checkInWindow = kind === 'free' ? vipHotelCheckInWindow(matchDay) : null

  const [chosenStep, setStep] = useState<Step>(pkg.steps.hotel.done && hotel ? 'done' : 'search')
  /* The hotel can disappear underneath (a new flight removes it). */
  const step: Step = chosenStep === 'done' && (!hotel || expired) ? 'search' : chosenStep
  const [rooms, setRooms] = useState(1)
  /* Without a flight: the check-in the customer picks (default: the day
     before the match, kept inside the allowed window). */
  const [checkIn, setCheckIn] = useState(() => {
    const d = pkg.hotel_dates?.check_in ?? vipAddDays(matchDay, -1)
    return checkInWindow ? (d < checkInWindow.min ? checkInWindow.min : d > checkInWindow.max ? checkInWindow.max : d) : d
  })
  const checkin = kind === 'free' ? checkIn : (fw?.checkin ?? '')
  const minNights = checkin ? minNightsFrom(checkin, matchDay) : 1
  /* With a return flight the most is "until the return flight". */
  const fullNights = kind === 'return' && fw?.returnDay && checkin ? vipDaysBetween(checkin, fw.returnDay) : null
  const maxNights = fullNights !== null ? Math.max(minNights, fullNights) : 7
  const [nightsChoice, setNights] = useState<number | null>(pkg.hotel_dates?.nights ?? null)
  /* Nothing chosen yet: until the return flight, else 2 nights (or the
     fewest that include the match night). */
  const nights = Math.min(maxNights, Math.max(minNights, nightsChoice ?? fullNights ?? Math.max(2, minNights)))
  /* Citizenship of the main guest (Citizenship, room name and failed hotel
     API contract 2.6): from GET /stays/countries, the same list and the same
     session-wide choice as the match builder's hotel step. Pre-selected from
     the browser only while visible and changeable. */
  const { data: countries, isLoading: countriesLoading, isError: countriesFailed, refetch: refetchCountries } =
    useStayCountries()
  const residency = useStaysStore((s) => s.searchParams.residency)
  const residencyConfirmed = useStaysStore((s) => s.residencyConfirmed)
  const storeHydrated = useStaysStore((s) => s.hasHydrated)
  const setResidency = useStaysStore((s) => s.setResidency)
  const residencyKnown = !!countries?.some((c) => c.code === normalizeResidency(residency))
  useEffect(() => {
    if (!storeHydrated || !countries?.length || residencyConfirmed) return
    const guess = guessResidencyFromBrowser(countries)
    if (guess && guess !== residency) setResidency(guess, { auto: true })
  }, [storeHydrated, countries, residencyConfirmed, residency, setResidency])
  const [options, setOptions] = useState<VipHotelOption[] | null>(null)
  const [open, setOpen] = useState<VipHotelOption | null>(null)
  const [rates, setRates] = useState<VipHotelRate[] | null>(null)
  const [info, setInfo] = useState<VipHotelInfo | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const [searched, setSearched] = useState<{ rooms: number; stay: Stay | null } | null>(null)
  const [changed, setChanged] = useState<{ rate: VipHotelRate; lock: VipHotelLock } | null>(null)
  const [missingCountry, setMissingCountry] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { busy, error, setError, run } = useVipAction()
  /* errors.residency from a 422: shown under the picker (contract 2.4). */
  const residencyError = error?.fieldErrors?.residency?.[0] ?? null

  const search = async () => {
    if (!residencyKnown) return setMissingCountry(true)
    setMissingCountry(false)
    setChanged(null)
    /* With a return flight, "until the return flight" sends no nights:
       the backend then checks out on the return flight's day. */
    const sendNights = kind !== 'return' || fullNights === null || nights < fullNights
    const res = await run('search', () =>
      vipApi.searchHotels(pkg.id, {
        rooms,
        // This endpoint does not accept spaces: always send the trimmed code.
        residency: normalizeResidency(residency),
        ...(sendNights ? { nights } : {}),
        ...(kind === 'free' ? { check_in: checkIn } : {}),
      }),
    )
    if (res) {
      setOptions(res)
      setShown(PAGE)
      setSearched({ rooms, stay: checkin ? { checkin, checkout: vipAddDays(checkin, nights), nights } : null })
      setStep('results')
    }
  }

  const openHotel = async (h: VipHotelOption) => {
    setOpen(h)
    setRates(null)
    setInfo(null)
    setSelected(null)
    setChanged(null)
    setStep('hotel')
    document.getElementById('vip-hotel-title')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const raw = await run('rates', () => vipApi.getHotelRates(pkg.id, h.option_id))
    if (raw) {
      setRates(normalizeHotelRates(raw))
      setInfo(normalizeHotelInfo(raw))
    }
  }

  const addFromLock = async (lockId: string) => {
    const p = await run('add', () => vipApi.addHotel(pkg.id, lockId))
    if (p) {
      onPackage(p)
      setChanged(null)
      setStep('done')
    }
  }

  const choose = async (rate: VipHotelRate) => {
    setChanged(null)
    const raw = await run(`lock-${rate.rateId}`, () => vipApi.lockHotel(pkg.id, rate.rateId))
    const lock = raw ? normalizeHotelLock(raw) : null
    if (!raw) return
    if (!lock) return setError(new VipApiError("This hotel rate isn't available. Please choose another.", 0))
    /* The supplier changed the price: show the new one and ask first. */
    if (lock.priceChanged) return setChanged({ rate, lock })
    await addFromLock(lock.lockId)
  }

  const remove = async () => {
    const p = await run('remove', () => vipApi.removeHotel(pkg.id))
    if (p) {
      setConfirmRemove(false)
      onPackage(p)
      setStep('search')
    }
  }

  const searchAgain = !!error && SEARCH_AGAIN.test(error.message)
  const searchedRooms = searched?.rooms ?? rooms
  /* The searched stay; the backend's own dates win once it sends them. */
  const hd = pkg.hotel_dates
  const dates: Stay | null =
    step !== 'done' && searched?.stay
      ? searched.stay
      : hd
        ? { checkin: hd.check_in, checkout: hd.check_out, nights: hd.nights }
        : (searched?.stay ?? null)
  /* The first (cheapest) room is picked until the customer picks one. */
  const active = rates?.find((r) => r.rateId === selected) ?? rates?.[0] ?? null
  const activeNightly = active ? nightly(active, dates?.nights ?? null) : null
  /* Hotel photos first, then any the rates answer adds (no repeats). */
  const gallery = open ? [...new Set([...(open.photos ?? []), ...(info?.photos ?? [])])] : []

  const title = optional ? 'Hotel · Optional' : 'Hotel'
  if (blocked) {
    return (
      <VipPanel id='vip-hotel-title' title={title} subtitle={`4 or 5 star hotels in ${match.city}`}>
        <VipNote>Choose your flight first: the hotel dates follow it.</VipNote>
      </VipPanel>
    )
  }
  if (kind === 'free' && !checkInWindow) {
    return (
      <VipPanel id='vip-hotel-title' title={title} subtitle={`4 or 5 star hotels in ${match.city}`}>
        <VipNote>It&apos;s too late to book a hotel for this match.</VipNote>
      </VipPanel>
    )
  }

  return (
    <VipPanel
      id='vip-hotel-title'
      title={title}
      subtitle={`4 or 5 star hotels in ${match.city} · ${kind === 'free' ? 'choose your dates' : 'dates follow your flight'}`}
      aside={<VipSubSteps steps={STEP_LABELS} current={STEP_INDEX[step]} />}
    >
      {expired && <VipError>Your hotel price expired. Please choose your hotel again.</VipError>}

      {/* ── 1 · Search ── */}
      {step === 'search' && (
        <>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='flex flex-col gap-2'>
              <span className={fieldLabel}>ROOMS</span>
              <VipQuantity value={rooms} min={1} max={maxRooms} onChange={setRooms} label='Rooms' />
            </div>
            {kind === 'free' && checkInWindow && (
              <div className='flex flex-col gap-2'>
                <span className={fieldLabel}>CHECK-IN</span>
                <div className='rounded-xl border border-vip-line/10 bg-vip-tint/3 transition-colors focus-within:border-vip-gold/60'>
                  <DatePicker
                    tone='vip'
                    months={1}
                    value={checkIn}
                    min={checkInWindow.min}
                    max={checkInWindow.max}
                    onChange={(iso) => iso && setCheckIn(iso)}
                    ariaLabel='Check-in date'
                    triggerClassName='h-12 gap-2 px-4 text-[14.5px] font-normal'
                    iconClassName='size-4'
                  />
                </div>
              </div>
            )}
            {(kind !== 'return' || maxNights > minNights) && (
              <div className='flex flex-col gap-2'>
                <span className={fieldLabel}>NIGHTS</span>
                <VipQuantity value={nights} min={minNights} max={maxNights} onChange={setNights} label='Nights' />
              </div>
            )}
            <label className='flex flex-col gap-2'>
              <span className={fieldLabel}>MAIN GUEST&apos;S CITIZENSHIP</span>
              <select
                value={residencyKnown ? normalizeResidency(residency) : ''}
                disabled={countriesLoading || !countries?.length}
                aria-invalid={missingCountry || !!residencyError}
                onChange={(e) => {
                  setResidency(e.target.value)
                  setMissingCountry(false)
                  if (residencyError) setError(null)
                }}
                className='h-12 rounded-xl border border-vip-line/10 bg-vip-tint/3 px-3 text-[14.5px] leading-[normal] text-vip-chalk outline-none focus:border-vip-gold/60 disabled:opacity-60 aria-[invalid=true]:border-red-500/70 [&>option]:bg-vip-panel'
              >
                <option value=''>{countriesLoading ? 'Loading countries…' : 'Choose a country'}</option>
                {(countries ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {residencyError && <span className='text-[12.5px] leading-[1.4] text-red-600 dark:text-red-300'>{residencyError}</span>}
            </label>
          </div>
          {countriesFailed && !countries?.length && (
            <VipError>
              We couldn&apos;t load the list of countries.{' '}
              <button type='button' onClick={() => void refetchCountries()} className='underline underline-offset-2'>
                Try again
              </button>
            </VipError>
          )}
          {missingCountry && <VipError>Choose the main guest&apos;s citizenship.</VipError>}
          <p className='text-[12.5px] leading-[1.45] text-vip-mist'>
            Prices can depend on nationality: choose the passport of the person checking in.
          </p>
          <p className='text-[12.5px] leading-[1.45] text-vip-mist'>
            {kind === 'free'
              ? 'Choose your check-in date and how many nights to stay (up to 7). Your stay must include the night of the match.'
              : kind === 'oneway'
                ? 'Check-in is the day your flight lands. Your flight is one way, so choose how many nights to stay (up to 7), including the night of the match.'
                : 'Check-in is the day your flight lands. Stay until your return flight, or choose fewer nights (the night of the match is always included).'}{' '}
            At most one room per traveller.
          </p>
          {checkin && (
            <p className='text-[13px] font-medium leading-[normal] text-vip-chalk'>
              {formatVipShortDate(checkin)} – {formatVipShortDate(vipAddDays(checkin, nights))} · {nights} night
              {nights === 1 ? '' : 's'}
            </p>
          )}
          <div className='flex flex-wrap gap-3'>
            <VipButton className='w-fit' onClick={search} disabled={busy === 'search'}>
              {busy === 'search' ? 'Searching…' : 'Search hotels'}
            </VipButton>
            {hotel && !expired && (
              <VipButton variant='ghost' onClick={() => setStep('done')}>
                Keep my hotel
              </VipButton>
            )}
          </div>
        </>
      )}

      {/* ── 2 · Results (travels StaysHotelCard list) ── */}
      {step === 'results' && options && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-[14px] font-semibold leading-[normal] text-vip-chalk' aria-live='polite'>
              {options.length} hotel{options.length === 1 ? '' : 's'} found
              {dates && (
                <span className='font-normal text-vip-mist'>
                  {' '}
                  · {formatVipShortDate(dates.checkin)} – {formatVipShortDate(dates.checkout)}
                </span>
              )}
            </p>
            <VipButton size='s' variant='ghost' onClick={() => setStep('search')}>
              Change search
            </VipButton>
          </div>
          {options.length === 0 && <VipNote>No 4 or 5 star hotel is free for these dates. Try fewer rooms.</VipNote>}
          {options.slice(0, shown).map((h, i) => (
            <VipHotelCard key={h.option_id} hotel={h} index={i % PAGE} onOpen={() => openHotel(h)} />
          ))}
          {options.length > shown && (
            <VipButton variant='ghost' className='self-center' onClick={() => setShown((n) => n + PAGE)}>
              Show more hotels ({options.length - shown})
            </VipButton>
          )}
        </div>
      )}

      {/* ── 3 · Hotel (travels hotel page: gallery, about, rooms, summary) ── */}
      {step === 'hotel' && open && (
        <div className='flex flex-col gap-4'>
          <BackLink onClick={() => setStep('results')}>Back to results</BackLink>
          <div className='flex flex-col gap-1'>
            <VipStars count={open.stars} />
            <h3 className='font-heading text-[22px] font-bold leading-[normal] text-vip-chalk sm:text-[26px]'>{open.name}</h3>
            {open.address && (
              <p className='flex items-start gap-1 text-[12.5px] leading-[1.4] text-vip-mist'>
                <MapPin aria-hidden className='mt-px size-3.5 shrink-0' /> {open.address}
              </p>
            )}
          </div>
          <VipHotelGallery images={gallery} name={open.name} />

          <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_272px]'>
            <div className='flex min-w-0 flex-col gap-6'>
              {info && <VipHotelAbout info={info} name={open.name} address={open.address} />}
              <section id='vip-hotel-rooms' className='flex flex-col gap-3'>
                <h4 className='font-heading text-[16px] font-bold leading-[normal] text-vip-chalk'>Choose your room</h4>
                {busy === 'rates' && (
                  <div aria-hidden className='flex flex-col gap-3'>
                    <div className='h-28 animate-pulse rounded-2xl bg-vip-line/4' />
                    <div className='h-28 animate-pulse rounded-2xl bg-vip-line/4' />
                  </div>
                )}
                {rates?.length === 0 && <VipNote>No rooms are left at this hotel for your dates. Choose another hotel.</VipNote>}
                {rates && rates.length > 0 && (
                  <VipRoomPicker
                    rates={rates}
                    selected={active?.rateId ?? null}
                    onSelect={(id) => {
                      setSelected(id)
                      setChanged(null)
                    }}
                    nights={dates?.nights ?? null}
                  />
                )}
              </section>
            </div>

            {/* Side summary (travels hotel page aside). */}
            <aside className='xl:sticky xl:top-[100px] xl:self-start'>
              <div className='flex flex-col gap-4 rounded-2xl border border-vip-line/10 bg-vip-card p-5'>
                {dates && (
                  <div className='grid grid-cols-2 gap-2'>
                    <SummaryBox label='Check-in' value={formatVipShortDate(dates.checkin)} />
                    <SummaryBox label='Check-out' value={formatVipShortDate(dates.checkout)} />
                  </div>
                )}
                <SummaryBox
                  label='Guests & rooms'
                  value={`${travellers} guest${travellers === 1 ? '' : 's'} · ${searchedRooms} room${searchedRooms === 1 ? '' : 's'}`}
                />
                {active && (
                  <>
                    {activeNightly && dates && (
                      <div className='flex justify-between gap-3 border-t border-vip-line/10 pt-4 text-[13px] leading-[normal] text-vip-mist'>
                        <span>{formatVipPrice(activeNightly.amount, activeNightly.currency)} / night</span>
                        <span className='text-vip-chalk'>
                          {dates.nights} night{dates.nights === 1 ? '' : 's'}
                        </span>
                      </div>
                    )}
                    <div className='flex items-start justify-between gap-4 border-t border-vip-line/10 pt-3'>
                      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                        <span className='font-heading text-[14px] font-bold leading-[normal] text-vip-chalk'>Total</span>
                        <span className='font-mono text-[10px] leading-snug text-vip-mist'>
                          {active.payAtProperty
                            ? `Plus ${formatVipPrice(active.payAtProperty.amount, active.payAtProperty.currency)} paid at the hotel`
                            : 'Confirmed when you reserve'}
                        </span>
                      </span>
                      <span className='shrink-0 font-heading text-[22px] font-bold leading-[normal] text-vip-gold-text'>
                        {active.price ? formatVipPrice(active.price.amount, active.price.currency) : '—'}
                      </span>
                    </div>
                    {active.refundable === true ? (
                      <p className='flex items-start gap-1.5 text-[11.5px] leading-[1.4] text-emerald-600 dark:text-emerald-400'>
                        <Check aria-hidden className='mt-px size-3.5 shrink-0' />
                        {active.freeCancellationBefore
                          ? `Free cancellation before ${active.freeCancellationBefore}`
                          : 'Refundable booking'}
                      </p>
                    ) : active.refundable === false ? (
                      <p className='text-[11.5px] leading-[1.4] text-red-600 dark:text-red-400'>This room is not cancellable</p>
                    ) : null}
                  </>
                )}
                <VipButton className='w-full' onClick={() => active && choose(active)} disabled={!active || !!busy}>
                  {busy === 'add' || (active && busy === `lock-${active.rateId}`) ? (
                    'Reserving…'
                  ) : (
                    <span className='inline-flex items-center gap-2'>
                      <Star aria-hidden className='size-4 fill-current' strokeWidth={1} /> Reserve
                    </span>
                  )}
                </VipButton>
                {changed && active && changed.rate.rateId === active.rateId && (
                  <VipNote className='flex flex-col items-start gap-3'>
                    <span>
                      The hotel changed the price of this room
                      {changed.lock.price ? ` to ${formatVipPrice(changed.lock.price.amount, changed.lock.price.currency)}` : ''}
                      . Reserve it at the new price?
                    </span>
                    <span className='flex flex-wrap gap-2'>
                      <VipButton size='s' onClick={() => addFromLock(changed.lock.lockId)} disabled={busy === 'add'}>
                        {busy === 'add' ? 'Reserving…' : 'Yes, new price'}
                      </VipButton>
                      <VipButton size='s' variant='ghost' onClick={() => setChanged(null)}>
                        Choose another room
                      </VipButton>
                    </span>
                  </VipNote>
                )}
                <p className='text-[11.5px] leading-[1.45] text-vip-mist'>
                  The room price is held for a short time once you reserve it. Your package shows the price you pay.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && hotel && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col overflow-hidden rounded-2xl border border-vip-gold/70 bg-vip-gold/7 sm:flex-row'>
            {hotel.hotelImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hotel.hotelImage} alt='' className='h-36 w-full object-cover sm:h-auto sm:w-44' />
            )}
            <div className='flex flex-col gap-1.5 px-[18px] py-4'>
              <span className='flex items-center gap-1.5 font-mono text-[10.5px] uppercase leading-[normal] tracking-[1.26px] text-vip-gold-text'>
                <Check aria-hidden className='size-3.5' strokeWidth={2.5} /> Hotel added
              </span>
              <span className='font-heading text-[17px] font-bold leading-[normal] text-vip-chalk'>{hotel.hotelName}</span>
              {hotel.hotelAddress && (
                <span className='flex items-start gap-1 text-[12.5px] leading-[1.4] text-vip-mist'>
                  <MapPin aria-hidden className='mt-px size-3 shrink-0' /> {hotel.hotelAddress}
                </span>
              )}
              <span className='text-[13px] leading-[normal] text-vip-mist'>
                {[
                  hotel.roomName,
                  hotel.rooms ? `${hotel.rooms} room${hotel.rooms === 1 ? '' : 's'}` : null,
                  hotel.checkin && hotel.checkout
                    ? `${formatVipShortDate(hotel.checkin)} – ${formatVipShortDate(hotel.checkout)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
          <div className='flex flex-wrap gap-3'>
            <VipButton size='s' variant='ghost' className='w-fit' onClick={() => setStep('search')}>
              Change hotel
            </VipButton>
            <VipButton size='s' variant='ghost' className='w-fit' onClick={() => setConfirmRemove(true)} disabled={busy === 'remove'}>
              Remove hotel
            </VipButton>
          </div>
          {confirmRemove && (
            <VipNote className='flex flex-col items-start gap-3'>
              <span>
                Remove the hotel from your package?
                {optional ? ' Your flight and ticket stay.' : ' You need a hotel to check out, so you’ll choose another one next.'}
              </span>
              <span className='flex flex-wrap gap-2'>
                <VipButton size='s' onClick={remove} disabled={busy === 'remove'}>
                  {busy === 'remove' ? 'Removing…' : 'Remove hotel'}
                </VipButton>
                <VipButton size='s' variant='ghost' onClick={() => setConfirmRemove(false)}>
                  Keep it
                </VipButton>
              </span>
            </VipNote>
          )}
        </div>
      )}

      {/* A citizenship refusal is already shown under the picker. */}
      {error && !(residencyError && step === 'search') && (
        <div className='flex flex-col items-start gap-2'>
          <VipError>{error.message}</VipError>
          {searchAgain && step !== 'search' && (
            <VipButton size='s' variant='ghost' onClick={search} disabled={busy === 'search'}>
              {busy === 'search' ? 'Searching…' : 'Search again'}
            </VipButton>
          )}
        </div>
      )}
    </VipPanel>
  )
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-vip-line/10 bg-vip-tint/3 p-3'>
      <p className='font-mono text-[9px] uppercase leading-[normal] tracking-[0.12em] text-vip-mist'>{label}</p>
      <p className='mt-1 text-[12.5px] font-medium leading-[normal] text-vip-chalk'>{value}</p>
    </div>
  )
}
