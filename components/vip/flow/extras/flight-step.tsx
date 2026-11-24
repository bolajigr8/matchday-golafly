'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AirportInput } from '@/components/flights/airport-input'
import { BuilderFlightAncillaries } from '@/components/flights/builder-flight-ancillaries'
import { DatePicker } from '@/components/ui/date-picker'
import { VipButton } from '@/components/vip/flow/button'
import { VipChip, VipField, VipPanel, VipSubSteps } from '@/components/vip/flow/panel'
import { VipError, VipNote } from '@/components/vip/flow/state'
import { vipApi } from '@/features/vip/api'
import type { VipEventView } from '@/features/vip/clubs'
import type { VipCabinClass, VipFlightOffer, VipPackage } from '@/features/vip/contract'
import { vipAddDays, vipYmd } from '@/features/vip/format'
import { isVipMock } from '@/features/vip/mode'
import { getVipPrefs } from '@/features/vip/prefs'
import { vipFlowHref } from '@/features/vip/routes'
import {
  flightOfferOf,
  packageItem,
  packageTravellers,
  rememberFlightOffer,
  stepRequired,
  storedFlightServices,
} from '@/features/vip/package'
import { useVipAction } from '@/features/vip/use-package'
import { FlightCard } from '@/components/flights/flight-card'
import { VipRouteStrip } from './route-strip'

/* Extras → "Flights" (Figma 506:3902). Same steps as the main Matchday
   builder's flight wizard (app/builder/extras): Search → Results → Bags →
   Seats → Done, in the VIP design.
   The main flow's "Fare" step is not here: it re-searches the normal
   flight list for other fare brands, which are priced at the normal markup
   and may not be Business or First, so a VIP package cannot use them.
   Rules from the contract (§2.3): Business or First only; outbound from the
   day before the match up to match day; return from the day after up to 3
   days after; travellers = tickets. Choosing a different flight removes the
   hotel (its dates followed the old flight, or in flexible mode were
   picked without one). "Remove flight" (DELETE …/flight) takes the hotel
   with it too; in flexible mode the flight is optional. */

type Step = 'search' | 'results' | 'bags' | 'seats' | 'done'
const STEP_LABELS = ['SEARCH', 'RESULTS', 'BAGS', 'SEATS']
const STEP_INDEX: Record<Step, number> = { search: 0, results: 1, bags: 2, seats: 3, done: 4 }

const CABINS: { value: VipCabinClass; label: string }[] = [
  { value: 'any', label: 'Business or First' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
]

const dateTrigger = 'h-12 gap-2 px-4 text-[14.5px] font-normal'
const fieldLabel = 'font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'

const OFFERS_PAGE = 10

/** The VIP rule under each flight card: landing time before kick-off. */
function KickoffLine({ offer }: { offer: VipFlightOffer }) {
  const hours = offer.hospitality?.hours_before_kickoff
  if (typeof hours !== 'number' || hours <= 0) return null
  return (
    <p className='px-1 text-[12.5px] leading-[normal] text-vip-gold-text'>
      Lands {Math.floor(hours)}h before kick-off
    </p>
  )
}

export function VipFlightStep({
  pkg,
  match,
  onPackage,
}: {
  pkg: VipPackage
  match: VipEventView
  onPackage: (p: VipPackage) => void
}) {
  const travellers = packageTravellers(pkg)
  const current = flightOfferOf(pkg)
  const expired = !!pkg.steps.flight.expired
  const hasHotel = !!packageItem(pkg, 'stays')
  const matchDay = vipYmd(match.date)

  const [chosenStep, setStep] = useState<Step>(pkg.steps.flight.done && current ? 'done' : 'search')
  /* The flight can disappear underneath (a ticket change removes it). */
  const step: Step = chosenStep === 'done' && (!current || expired) ? 'search' : chosenStep
  /* Starts from the landing page's FLYING FROM and CABIN (features/vip/prefs.ts). */
  const [origin, setOrigin] = useState(() => current?.slices[0]?.origin.iata_code ?? getVipPrefs().origin)
  const [trip, setTrip] = useState<'round' | 'oneway'>(current && current.slices.length === 1 ? 'oneway' : 'round')
  const [depart, setDepart] = useState(vipAddDays(matchDay, -1))
  const [ret, setRet] = useState(vipAddDays(matchDay, 1))
  const [cabin, setCabin] = useState<VipCabinClass>(() => getVipPrefs().cabin ?? 'any')
  const [offers, setOffers] = useState<VipFlightOffer[] | null>(null)
  /* Results: 10 at a time (like the main builder's pages), one card open. */
  const [shownCount, setShownCount] = useState(OFFERS_PAGE)
  const [openOffer, setOpenOffer] = useState<string | null>(null)
  const [chosen, setChosen] = useState<VipFlightOffer | null>(null)
  const [confirmSwap, setConfirmSwap] = useState<VipFlightOffer | null>(null)
  const [originError, setOriginError] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { busy, error, setError, run } = useVipAction()
  const optional = !stepRequired(pkg, 'flight')

  const remove = async () => {
    const p = await run('remove', () => vipApi.removeFlight(pkg.id))
    if (p) {
      setConfirmRemove(false)
      setChosen(null)
      onPackage(p)
      setStep('search')
    }
  }

  const search = async () => {
    if (!/^[A-Za-z]{3}$/.test(origin)) {
      setError(null)
      return setOriginError(true)
    }
    setOriginError(false)
    const res = await run('search', () =>
      vipApi.searchFlights(pkg.id, {
        origin: origin.toUpperCase(),
        cabin_class: cabin,
        return: trip === 'round',
        departure_date: depart,
        ...(trip === 'round' ? { return_date: ret } : {}),
      }),
    )
    if (res) {
      setOffers(res)
      setShownCount(OFFERS_PAGE)
      setOpenOffer(null)
      setStep('results')
    }
  }

  const pick = (offer: VipFlightOffer) => {
    /* A different flight removes the hotel: warn first. */
    if (hasHotel && current?.id !== offer.id) return setConfirmSwap(offer)
    setConfirmSwap(null)
    setChosen(offer)
    setStep('bags')
  }

  const add = async () => {
    if (!chosen) return
    const services = storedFlightServices(chosen.id)
    const p = await run('add', () =>
      vipApi.addFlight(pkg.id, { offer_id: chosen.id, ...(services.length ? { services } : {}) }),
    )
    if (p) {
      rememberFlightOffer(p.id, chosen)
      onPackage(p)
      setStep('done')
    }
  }

  const subtitle = `Business and First Class into ${match.airport || match.city} · ${travellers} traveller${travellers === 1 ? '' : 's'}`

  return (
    <VipPanel
      id='vip-flights-title'
      title={optional ? 'Flight · Optional' : 'Flight'}
      subtitle={subtitle}
      aside={<VipSubSteps steps={STEP_LABELS} current={STEP_INDEX[step]} />}
    >
      {expired && (
        <VipError>Your flight price expired. Please choose your flight again.</VipError>
      )}

      {/* ── 1 · Search ── */}
      {step === 'search' && (
        <>
          {/* Contract: one passenger per match ticket. The number is changed
              by changing the ticket quantity, not here. */}
          <p className='text-[13px] leading-[1.45] text-vip-mist'>
            {travellers} passenger{travellers === 1 ? '' : 's'}, one per match ticket in your package.{' '}
            <Link
              href={vipFlowHref(match.club, match.eventId, 'seats')}
              className='font-semibold text-vip-gold-text underline underline-offset-2 hover:opacity-80'
            >
              Change the number of tickets
            </Link>
          </p>
          <VipRouteStrip from={origin ? origin.toUpperCase() : '···'} to={match.airport || '···'} />
          <div role='radiogroup' aria-label='Trip type' className='flex gap-2'>
            <VipChip active={trip === 'round'} onClick={() => setTrip('round')}>
              Round trip
            </VipChip>
            <VipChip active={trip === 'oneway'} onClick={() => setTrip('oneway')}>
              One way
            </VipChip>
          </div>
          <div className='flex flex-col gap-2.5 sm:flex-row sm:items-end'>
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <span className={fieldLabel}>FROM</span>
              {/* Same box as TO (VipField): 48px high, 16px padding, 14.5px text. */}
              <div className='flex h-12 items-center rounded-xl border border-vip-line/10 bg-vip-tint/3 px-4 transition-colors focus-within:border-vip-gold/60 [&_input]:text-[14.5px] [&_input]:font-normal [&_input]:text-vip-chalk'>
                <AirportInput
                  value={origin}
                  onChange={(code) => {
                    setOrigin(code)
                    setOriginError(false)
                  }}
                  label=''
                  placeholder='City or airport'
                  naked
                  geolocate
                  autoLocate
                  hideHints
                  dropdownClassName='vip-scope'
                />
              </div>
            </div>
            <VipField label='TO' className='flex-1'>
              {`${match.city}${match.airport ? ` (${match.airport})` : ''}`}
            </VipField>
          </div>
          {originError && <VipError>Choose the airport you are flying from.</VipError>}
          <div className='grid gap-2.5 sm:grid-cols-3'>
            <div className='flex min-w-0 flex-col gap-2'>
              <span className={fieldLabel}>DEPART</span>
              <div className='rounded-xl border border-vip-line/10 bg-vip-tint/3 transition-colors focus-within:border-vip-gold/60'>
                <DatePicker
                  tone='vip'
                  months={1}
                  value={depart}
                  min={vipAddDays(matchDay, -1)}
                  max={matchDay}
                  onChange={(iso) => iso && setDepart(iso)}
                  ariaLabel='Departure date'
                  triggerClassName={dateTrigger}
                  iconClassName='size-4'
                />
              </div>
            </div>
            <div className='flex min-w-0 flex-col gap-2' style={{ opacity: trip === 'oneway' ? 0.4 : 1 }}>
              <span className={fieldLabel}>RETURN</span>
              <div className='rounded-xl border border-vip-line/10 bg-vip-tint/3 transition-colors focus-within:border-vip-gold/60'>
                <DatePicker
                  tone='vip'
                  months={1}
                  value={trip === 'oneway' ? '' : ret}
                  min={vipAddDays(matchDay, 1)}
                  max={vipAddDays(matchDay, 3)}
                  onChange={(iso) => iso && setRet(iso)}
                  disabled={trip === 'oneway'}
                  placeholder='One way'
                  ariaLabel='Return date'
                  triggerClassName={dateTrigger}
                  iconClassName='size-4'
                />
              </div>
            </div>
            <VipField label='TRAVELLERS'>{`${travellers} adult${travellers === 1 ? '' : 's'}`}</VipField>
          </div>
          <div className='flex flex-col gap-2'>
            <span className={fieldLabel}>CLASS</span>
            <div
              role='radiogroup'
              aria-label='Cabin class'
              className='flex w-fit max-w-full flex-wrap rounded-[20px] border border-vip-line/10 bg-vip-tint/4 p-[3px] sm:rounded-full'
            >
              {CABINS.map((c) => (
                <button
                  key={c.value}
                  type='button'
                  role='radio'
                  aria-checked={cabin === c.value}
                  onClick={() => setCabin(c.value)}
                  className={
                    cabin === c.value
                      ? 'rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-4 py-2 text-[13px] font-semibold leading-[normal] text-[#111111]'
                      : 'rounded-full px-4 py-2 text-[13px] font-semibold leading-[normal] text-vip-mist transition-colors hover:text-vip-chalk'
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <p className='text-[12.5px] leading-[1.45] text-vip-mist'>
            Outbound from the day before the match up to match day, landing at least 4 hours before kick-off. Return
            up to 3 days after the match.
          </p>
          <div className='flex flex-wrap gap-3'>
            <VipButton className='w-fit' onClick={search} disabled={busy === 'search'}>
              {busy === 'search' ? 'Searching…' : 'Search flights'}
            </VipButton>
            {offers && (
              <VipButton variant='ghost' onClick={() => setStep('results')}>
                Back to results
              </VipButton>
            )}
            {current && !expired && (
              <VipButton variant='ghost' onClick={() => setStep('done')}>
                Keep my flight
              </VipButton>
            )}
          </div>
        </>
      )}

      {/* ── 2 · Results ── */}
      {step === 'results' && offers && (
        <div className='flex flex-col gap-3' aria-live='polite'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-[14px] font-semibold leading-[normal] text-vip-chalk'>
              {offers.length} flight{offers.length === 1 ? '' : 's'} found
            </p>
            <VipButton size='s' variant='ghost' onClick={() => setStep('search')}>
              Change search
            </VipButton>
          </div>
          {offers.length === 0 && (
            <VipNote>
              No Business or First Class flight fits this trip. Try another date or another airport near you.
            </VipNote>
          )}
          {offers.slice(0, shownCount).map((o, i) => (
            <div key={o.id} className='flex flex-col gap-2'>
              {/* The main Matchday builder's flight card (same information:
                  airline, times, stops, duration, bags, refund, itinerary
                  detail, price, fare), in VIP colours via .vip-scope. */}
              <div className='vip-scope'>
                <FlightCard
                  offer={o}
                  index={i % OFFERS_PAGE}
                  selected={current?.id === o.id}
                  expanded={openOffer === o.id}
                  onToggle={() => setOpenOffer((cur) => (cur === o.id ? null : o.id))}
                  onSelect={() => pick(o)}
                />
              </div>
              <KickoffLine offer={o} />
              {confirmSwap?.id === o.id && (
                <VipNote className='flex flex-col items-start gap-3'>
                  <span>
                    {current
                      ? 'Changing your flight removes the hotel in your package, because its dates follow your flight.'
                      : 'Adding a flight removes the hotel in your package, because the hotel dates then follow your flight.'}{' '}
                    You&apos;ll choose a hotel again next.
                  </span>
                  <span className='flex flex-wrap gap-2'>
                    <VipButton
                      size='s'
                      onClick={() => {
                        setConfirmSwap(null)
                        setChosen(o)
                        setStep('bags')
                      }}
                    >
                      Change my flight
                    </VipButton>
                    <VipButton size='s' variant='ghost' onClick={() => setConfirmSwap(null)}>
                      Keep my flight
                    </VipButton>
                  </span>
                </VipNote>
              )}
            </div>
          ))}
          {offers.length > shownCount && (
            <VipButton size='s' variant='ghost' className='w-fit self-center' onClick={() => setShownCount((n) => n + OFFERS_PAGE)}>
              Show more flights ({offers.length - shownCount} more)
            </VipButton>
          )}
        </div>
      )}

      {/* ── 3 · Bags  /  4 · Seats (the main flow's ancillaries) ── */}
      {(step === 'bags' || step === 'seats') && chosen && (
        <div className='flex flex-col gap-4'>
          <div className='vip-scope'>
            <FlightCard offer={chosen} index={0} selected onSelect={() => undefined} />
          </div>
          <KickoffLine offer={chosen} />
          {step === 'seats' && (
            <VipNote>
              Seat choice is a request, not a guarantee: your flight is booked once your match tickets are secured,
              and a seat that is free now can be taken by then.
            </VipNote>
          )}
          {/* The main site's bags/seats step asks the REAL backend about the
              offer (GET /flights/offers/{id}, /flights/seat-maps). Test-mode
              offers don't exist there (404), so in test mode it is not called. */}
          {isVipMock ? (
            <VipNote>
              Test mode: bags and seats load from the airline in live mode only. You can continue without them.
            </VipNote>
          ) : (
            /* The main builder's bags/seats panel, in VIP colours via
               .vip-scope (globals.css); the main builder keeps its lime. */
            <div className='vip-scope rounded-2xl bg-background p-1 text-foreground'>
              <BuilderFlightAncillaries
                offerId={chosen.id}
                forceTab={step === 'bags' ? 'bags' : 'seats'}
                hideFareSummary={step === 'seats'}
              />
            </div>
          )}
          <p className='text-[12.5px] leading-[1.45] text-vip-mist'>
            Bags and seats are optional. Your package shows the final flight price once it is added.
          </p>
          <div className='flex flex-wrap gap-3'>
            <VipButton variant='ghost' onClick={() => setStep(step === 'bags' ? 'results' : 'bags')}>
              Back
            </VipButton>
            {step === 'bags' ? (
              <VipButton arrow onClick={() => setStep('seats')}>
                Continue to seats
              </VipButton>
            ) : (
              <VipButton arrow={busy !== 'add'} onClick={add} disabled={busy === 'add'}>
                {busy === 'add' ? 'Adding…' : 'Add flight to my package'}
              </VipButton>
            )}
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && current && (
        <div className='flex flex-col gap-3'>
          <div className='vip-scope'>
            <FlightCard offer={current} index={0} selected onSelect={() => undefined} />
          </div>
          <KickoffLine offer={current} />
          <div className='flex flex-wrap gap-3'>
            <VipButton size='s' variant='ghost' onClick={() => setStep('search')}>
              Change flight
            </VipButton>
            <VipButton
              size='s'
              variant='ghost'
              onClick={() => {
                setChosen(current)
                setStep('bags')
              }}
            >
              Change bags or seats
            </VipButton>
            <VipButton size='s' variant='ghost' onClick={() => setConfirmRemove(true)} disabled={busy === 'remove'}>
              Remove flight
            </VipButton>
          </div>
          {confirmRemove && (
            <VipNote className='flex flex-col items-start gap-3'>
              <span>
                {hasHotel
                  ? 'Remove your flight? Your hotel is removed with it, because its dates follow your flight.'
                  : 'Remove your flight from the package?'}
                {!optional && ' You need a flight to check out, so you’ll choose another one next.'}
              </span>
              <span className='flex flex-wrap gap-2'>
                <VipButton size='s' onClick={remove} disabled={busy === 'remove'}>
                  {busy === 'remove' ? 'Removing…' : 'Remove flight'}
                </VipButton>
                <VipButton size='s' variant='ghost' onClick={() => setConfirmRemove(false)}>
                  Keep it
                </VipButton>
              </span>
            </VipNote>
          )}
        </div>
      )}

      <VipError>{error?.message}</VipError>
    </VipPanel>
  )
}
