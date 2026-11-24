'use client'

import Link from 'next/link'
import { FreeEsimNote } from '@/components/free-esim/free-esim-note'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Wifi,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepProgress } from '@/components/checkout/step-progress'
import { MiniStepProgress } from '@/components/checkout/mini-step-progress'
import {
  FlightCard,
  FlightCardSkeleton,
} from '@/components/flights/flight-card'
import { ItineraryDetail } from '@/components/flights/itinerary-detail'
import { SearchStripField } from '@/components/flights/search-strip-field'
import { BuilderFlightSearch } from '@/components/flights/builder-flight-search'
import { BuilderFlightAncillaries } from '@/components/flights/builder-flight-ancillaries'
import { BuilderHotelStep } from '@/components/builder/hotels'
import { EsimFaqSection } from '@/components/esim/faq-section'
import { useSearchFlights } from '@/features/flights/hooks'
import {
  offerFlightKey,
  offerToSearchPassengers,
  buildFareCards,
  fareKey,
} from '@/features/flights/fare-brands'
import type { FlightOffer } from '@/features/flights/types'
import { todayISO, type FlightSearchValues } from '@/features/flights/schema'
import { useFlightsStore } from '@/store/flights'
import {
  useEnabledEsimProviders,
  useDebounce,
  useGlobalEsimPackages,
  useLocalEsimPackages,
} from '@/features/esim/hooks'
import { esimProviderLabel, type EsimPackage } from '@/features/esim/types'
import { esimCountryLabel, resolveEsimCountryCode } from '@/lib/esim-countries'
import { useMatchDestination } from '@/features/builder/use-match-destination'
import { useCart, type CartItemType } from '@/features/cart/context'
import {
  addEsimToCartApi,
  addFlightToCartApi,
  cartApiError,
  getCartApi,
} from '@/features/cart/api'
import { cartCurrencyConflict } from '@/features/cart/currency'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { useCurrencyStore } from '@/store/currency'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  useBuilderMatch,
  useBuilderMatchId,
} from '@/features/builder/use-builder-match'
import { builderStepHref } from '@/features/builder/enter'
import { Pagination } from '@/components/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { InfoTip } from '@/components/ui/tooltip'
import { FlightFiltersSidebar } from '@/components/flights/filters-sidebar'
import {
  ALL_DEPARTURE_TIME_IDS,
  getDepartureTimeBucket,
} from '@/features/flights/departure-time'
import { offerDisplayPrice } from '@/features/flights/price'
import { FlightSalePrice } from '@/components/flights/flight-sale-price'
import { esimDisplayPrice } from '@/features/esim/price'
import {
  serverIdOf,
  summaryLinesForItem,
} from '@/features/price-breakdown/helpers'
import { useSummaryWithMatchPromo } from '@/features/promo/use-promo-summary'
import { BlackFridayCheckoutGift } from '@/components/promo/black-friday'
import {
  GOLAFLY_FEE_LABEL,
  GOLAFLY_FEE_TIP,
  ItemPriceLines,
} from '@/components/price/price-rows'
const RESULTS_PER_PAGE = 6

interface TicketLine {
  name: string
  detail: string
  price: number
  qty: number
}

type SelectedFlight = { source: 'live'; offer: FlightOffer } | null

function fallbackTripDates() {
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const start = new Date()
  start.setDate(start.getDate() + 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 2)
  return { start: toISO(start), end: toISO(end) }
}

export function ExtrasClient() {
  const match = useBuilderMatch()
  const matchId = useBuilderMatchId()
  const router = useRouter()
  const {
    items,
    addItem,
    removeType,
    removeTypeAndServer,
    cartCurrency,
    priceSummary,
  } = useCart()
  // `cartCurrency` is the server cart's authoritative currency
  // (CartSummary.currency); falls back to the buyer's current picker
  // selection only before the cart has been fetched at least once.
  // Used for the ticket line and the combined running total below —
  // NOT for flight/hotel/eSIM lines, each of which has its own real
  // currency field that must be read and shown as-is (doc: "never
  // assume, read it and display it").
  const selectedCurrency = useCurrencyStore((s) => s.currency)
  const ticketCurrency = cartCurrency ?? selectedCurrency

  // For live fixtures, match.venueCity is already the parsed city name from
  // the API (e.g. "Lincoln") — use the direct lookup to avoid the brittle
  // "Venue Name, City" string-split. Fall back to the string-split path for
  // mock fixtures where venueCity is undefined.
  //
  // Bug fix: this used to pass `match.date`, which for a live fixture is
  // an already display-formatted string (e.g. "3 Apr 2027, 15:00" — see
  // BuilderMatch.date). getMatchTripDefaults[FromCity] re-parses whatever
  // string it's given with `new Date(...)` to compute the suggested
  // flight/hotel dates, and a formatted display string isn't guaranteed to
  // parse back correctly — this is what caused the departure date default
  // to silently come out a year off for live matches. `match.dateISO` is
  // the untouched ISO string from the API and is what date arithmetic
  // should always be based on; mock fixtures have no `dateISO`, so they
  // correctly fall back to `match.date` (unchanged from before).
  const matchDateForTripDefaults = match.dateISO ?? match.date
  // Table lookup first, then a live airport/country lookup for cities the
  // table doesn't know (see features/builder/use-match-destination.ts).
  const { tripDefaults, resolving: destinationResolving } = useMatchDestination(
    match,
    matchDateForTripDefaults,
  )
  const fallbackDates = fallbackTripDates()

  const ticketItem = items.find((i) => i.type === 'tickets')
  const ticketLine: TicketLine | null = ticketItem
    ? {
        name: ticketItem.name,
        detail: ticketItem.detail,
        price: ticketItem.price,
        qty: ticketItem.qty,
      }
    : null

  // Flight results paging/expanding (these lived beside the old hotel state).
  const [flightPage, setFlightPage] = useState(1)
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null)
  const [searchTakingLong, setSearchTakingLong] = useState(false)

  /* ═══════════════════════════ HOTELS ═══════════════════════════ */
  // The hotel step (components/builder/hotels) puts the chosen room in the
  // cart itself; this page only reads that cart line for its summary.
  const hotelItem = items.find((i) => i.type === 'hotel')
  const hotelPrice = hotelItem?.price ?? 0
  const hotelCurrency =
    typeof hotelItem?.checkoutPayload?.currency === 'string'
      ? hotelItem.checkoutPayload.currency
      : ticketCurrency
  const hotelDefaults = destinationResolving
    ? null
    : {
        city: tripDefaults?.destination.city ?? '',
        checkin: tripDefaults?.hotelCheckin ?? fallbackDates.start,
        checkout: tripDefaults?.hotelCheckout ?? fallbackDates.end,
      }

  /* ═══════════════════════════ FLIGHTS ═══════════════════════════ */
  // Mirrors Travels' /flights -> /flights/select -> /flights/bags ->
  // /flights/seats flow, but as one page's worth of steps instead of
  // separate routes — the wizard only ever moves state forward/back,
  // it never unmounts the page, so bag/seat picks (which persist to
  // sessionStorage keyed by offer id in features/flights/ancillaries.ts)
  // and the chosen offer survive going back to "Change search".
  const FLIGHT_WIZARD_STEPS = [
    'Search',
    'Results',
    'Fare',
    'Bags',
    'Seats',
  ] as const
  type FlightWizardStep =
    | 'search'
    | 'results'
    | 'fare'
    | 'bags'
    | 'seats'
    | 'done'
  const [flightStep, setFlightStep] = useState<FlightWizardStep>('search')
  const [showFareDetails, setShowFareDetails] = useState(false)
  const flightStepNumber: Record<FlightWizardStep, number> = {
    search: 1,
    results: 2,
    fare: 3,
    bags: 4,
    seats: 5,
    done: 5,
  }
  const flightsStore = useFlightsStore()
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight>(null)
  // const selectedOfferId =
  //   selectedFlight?.source === 'live' ? selectedFlight.offer.id : null
  const [flightAncillaryTotal, setFlightAncillaryTotal] = useState(0)
  const [isConfirmingFlight, setIsConfirmingFlight] = useState(false)
  const flightsInitRan = useRef(false)

  // Bug-proofing: /builder/extras is reused for every match, and navigating
  // from one match's extras page to a different match's (soft, client-side
  // navigation — e.g. back to /matches, buy a different ticket, land back
  // here) does NOT remount this component. Without this, a flight already
  // selected/searched for the PREVIOUS match would still be sitting in
  // `selectedFlight`/`flightStep` when the page re-renders for the new
  // match — the same class of stale-match-state bug as the destination
  // cache issue, just one step further down the flow. This clears that
  // in-progress flight selection back to a clean "search" step whenever the
  // match actually changes (never fires on first mount for a given match).
  const prevFlightMatchIdRef = useRef(matchId)
  useEffect(() => {
    if (
      prevFlightMatchIdRef.current !== null &&
      prevFlightMatchIdRef.current !== matchId
    ) {
      setFlightStep('search')
      setSelectedFlight(null)
      setFlightPage(1)
      setFlightAncillaryTotal(0)
      setShowFareDetails(false)
      searchedFlightKeyRef.current = null
    }
    prevFlightMatchIdRef.current = matchId
  }, [matchId])

  const {
    mutate: search,
    data: searchData,
    isPending: isSearching,
    isError: searchError,
  } = useSearchFlights()

  // Sibling fare-brand search — re-queries the same route/date/passengers
  // once a flight is picked, so the Fare step can offer Economy/Comfort/
  // Premium etc for that exact physical flight. Ported from Travels'
  // /flights/select page. Keyed off the flight's identity (carrier +
  // flight number + departure time per leg), not the offer id, so
  // switching between fare cards for the SAME flight doesn't re-fire it —
  // only landing on a genuinely different flight does.
  const {
    mutate: searchSiblings,
    data: siblingsResult,
    isPending: loadingSiblings,
    isError: siblingsFailed,
  } = useSearchFlights()
  const searchedFlightKeyRef = useRef<string | null>(null)
  const currentFlightKey =
    selectedFlight?.source === 'live'
      ? offerFlightKey(selectedFlight.offer)
      : null
  useEffect(() => {
    if (flightStep !== 'fare' || selectedFlight?.source !== 'live') return
    const offer = selectedFlight.offer
    const flightKey = offerFlightKey(offer)
    if (searchedFlightKeyRef.current === flightKey) return
    searchedFlightKeyRef.current = flightKey
    searchSiblings({
      data: {
        slices: offer.slices.map((sl) => ({
          origin: sl.origin.iata_code,
          destination: sl.destination.iata_code,
          departure_date: sl.departure_date,
        })),
        passengers: offerToSearchPassengers(offer),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightStep, currentFlightKey])

  const fareCards = useMemo(() => {
    if (selectedFlight?.source !== 'live') return []
    return buildFareCards(
      selectedFlight.offer,
      siblingsResult?.data?.offers ?? [],
    )
  }, [selectedFlight, siblingsResult])
  const awaitingFares = loadingSiblings || (!siblingsResult && !siblingsFailed)

  // Live flight search legitimately takes a while — it's a synchronous
  // multi-airline query, not a bug or a stuck retry loop. Set an
  // expectation instead of leaving the skeleton looking stuck.
  useEffect(() => {
    if (!isSearching) {
      setSearchTakingLong(false)
      return
    }
    const t = setTimeout(() => setSearchTakingLong(true), 6000)
    return () => clearTimeout(t)
  }, [isSearching])

  const offers: FlightOffer[] = searchData?.data?.offers ?? []
  const hasSearched = !!searchData || searchError
  const showLiveSearchFailed =
    !isSearching && (searchError || (hasSearched && offers.length === 0))

  // ── Flight filters — ported from Travels' /flights search page ──────
  function stopCount(offer: FlightOffer): string {
    const stops = (offer.slices[0]?.segments.length ?? 1) - 1
    if (stops === 0) return 'Direct'
    if (stops === 1) return '1 Stop'
    return '2+ Stops'
  }
  function offerAirline(offer: FlightOffer): string | undefined {
    return offer.slices[0]?.segments[0]?.marketing_carrier?.name
  }
  function offerFareBrand(offer: FlightOffer): string | undefined {
    return offer.slices[0]?.fare_brand_name ?? undefined
  }
  function offerDepartureTime(offer: FlightOffer): string {
    return getDepartureTimeBucket(offer.slices[0]?.segments[0]?.departing_at)
  }

  const [showFlightFilters, setShowFlightFilters] = useState(false)
  const [selectedStops, setSelectedStops] = useState<string[]>([
    'Direct',
    '1 Stop',
    '2+ Stops',
  ])
  const [activeAirlines, setActiveAirlines] = useState<string[]>([])
  const [activeFareBrands, setActiveFareBrands] = useState<string[]>([])
  const [selectedDepartureTimes, setSelectedDepartureTimes] = useState<
    string[]
  >(ALL_DEPARTURE_TIME_IDS)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)

  const toggleStop = (s: string) =>
    setSelectedStops((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  const toggleAirline = (a: string) =>
    setActiveAirlines((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    )
  const toggleFareBrand = (f: string) =>
    setActiveFareBrands((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    )
  const toggleDepartureTime = (id: string) =>
    setSelectedDepartureTimes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  function resetFlightFilters() {
    setSelectedStops(['Direct', '1 Stop', '2+ Stops'])
    setActiveAirlines([])
    setActiveFareBrands([])
    setSelectedDepartureTimes(ALL_DEPARTURE_TIME_IDS)
    setMaxPrice(null)
  }

  const flightAirlines = useMemo(() => {
    const minByName = new Map<string, number>()
    for (const o of offers) {
      const name = offerAirline(o)
      if (!name) continue
      const price = offerDisplayPrice(o).amount
      minByName.set(name, Math.min(minByName.get(name) ?? Infinity, price))
    }
    return [...minByName.entries()]
      .map(([name, minPrice]) => ({ name, minPrice: Math.round(minPrice) }))
      .sort((a, b) => a.minPrice - b.minPrice)
  }, [offers])

  const flightFareBrands = useMemo(() => {
    const minByName = new Map<string, number>()
    for (const o of offers) {
      const name = offerFareBrand(o)
      if (!name) continue
      const price = offerDisplayPrice(o).amount
      minByName.set(name, Math.min(minByName.get(name) ?? Infinity, price))
    }
    return [...minByName.entries()]
      .map(([name, minPrice]) => ({ name, minPrice: Math.round(minPrice) }))
      .sort((a, b) => a.minPrice - b.minPrice)
  }, [offers])

  const flightPriceBounds = useMemo(() => {
    if (offers.length === 0) return undefined
    const prices = offers.map((o) => offerDisplayPrice(o).amount)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [offers])

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (selectedStops.length > 0 && !selectedStops.includes(stopCount(o)))
        return false
      if (
        activeAirlines.length > 0 &&
        !activeAirlines.includes(offerAirline(o) ?? '')
      )
        return false
      if (
        activeFareBrands.length > 0 &&
        !activeFareBrands.includes(offerFareBrand(o) ?? '')
      )
        return false
      if (
        selectedDepartureTimes.length > 0 &&
        !selectedDepartureTimes.includes(offerDepartureTime(o))
      )
        return false
      if (maxPrice !== null && offerDisplayPrice(o).amount > maxPrice)
        return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    offers,
    selectedStops,
    activeAirlines,
    activeFareBrands,
    selectedDepartureTimes,
    maxPrice,
  ])

  // Reset to page 1 whenever the active filter set changes, and reset the
  // filters themselves whenever a brand new search result comes in (a
  // filter chosen against the last search shouldn't silently hide every
  // result of the next one).
  const lastSearchDataRef = useRef(searchData)
  useEffect(() => {
    if (searchData !== lastSearchDataRef.current) {
      lastSearchDataRef.current = searchData
      resetFlightFilters()
    }
    setFlightPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchData,
    selectedStops.join(','),
    activeAirlines.join(','),
    activeFareBrands.join(','),
    selectedDepartureTimes.join(','),
    maxPrice,
  ])

  const today = todayISO()

  // Bug fix: `flightsStore.searchParams` persists to localStorage forever,
  // with no awareness of which match it was searched for. Without this
  // guard, a stale destination/adults/dates combo left over from a
  // DIFFERENT match (e.g. a previous Munich search) would silently win
  // over the current match's real destination (e.g. Lincoln → EMA) — which
  // is exactly the "picks Munich instead of Lincoln" bug. `lastMatchId`
  // records which match the persisted values actually belong to; anything
  // that doesn't match the match currently open here is treated as stale
  // and ignored in favour of fresh, match-derived defaults.
  const isFreshFlightSearchForMatch = flightsStore.lastMatchId !== matchId

  // Destination: auto-fill from match city's airport (tripDefaults), or keep
  // whatever the user already set in the store THIS match session. Never
  // default to a random/stale airport left over from a different match.
  const resolvedDestination = isFreshFlightSearchForMatch
    ? (tripDefaults?.destination.airportCode ?? '')
    : flightsStore.searchParams.destination ||
      tripDefaults?.destination.airportCode ||
      ''

  // Departure date: pre-filled from the match ticket's suggested travel date
  // (one day before kickoff) the first time this match's extras page is
  // opened, so the buyer isn't asked to re-derive a date they already
  // committed to when buying the ticket. Once they've actually run a search
  // for this match, their own chosen date (if still in the future) wins on
  // later visits instead of being silently reset.
  //
  // Return date: pre-filled the same way, one day after kickoff (mirrors
  // the departure default) — per product request, so a matchday buyer isn't
  // left to guess a return date the ticket itself already implies. Once
  // they've searched for this match themselves, their own return date wins
  // on later visits, exactly like departure above.
  //
  // Past-date guard: if the store has a date from a previous session that is
  // now in the past, clear it so the API never receives a stale date.
  const storedDeparture = flightsStore.searchParams.departure_date || ''
  const departureDate = isFreshFlightSearchForMatch
    ? (tripDefaults?.flightDeparture ?? '')
    : storedDeparture >= today
      ? storedDeparture
      : ''

  const storedReturn = flightsStore.searchParams.return_date || ''
  const returnDate = isFreshFlightSearchForMatch
    ? (tripDefaults?.flightReturn ?? '')
    : storedReturn && departureDate && storedReturn >= departureDate
      ? storedReturn
      : ''

  // Adults: defaults to the number of tickets already in the cart for this
  // match — booking 3 match tickets means travelling as 3 adults, so the
  // flight search should start from that same headcount instead of always
  // assuming a solo traveller. Respects a manual change once the user has
  // actually searched for this match.
  const resolvedAdults = isFreshFlightSearchForMatch
    ? ticketLine?.qty || 1
    : flightsStore.searchParams.adults

  const currentSearchValues: FlightSearchValues = {
    origin: flightsStore.searchParams.origin || '',
    destination: resolvedDestination,
    departure_date: departureDate,
    return_date: returnDate,
    adults: resolvedAdults,
    children_ages: flightsStore.searchParams.children_ages,
    infants: flightsStore.searchParams.infants,
    cabin_class: flightsStore.searchParams.cabin_class,
  }

  function dispatchSearch(values: FlightSearchValues) {
    const passengers = [
      ...Array.from({ length: values.adults }, () => ({
        type: 'adult' as const,
      })),
      ...values.children_ages.map((age) => ({ type: 'child' as const, age })),
      ...Array.from({ length: values.infants }, () => ({
        type: 'infant_without_seat' as const,
      })),
    ]
    search({
      data: {
        slices: [
          {
            origin: values.origin.toUpperCase(),
            destination: values.destination.toUpperCase(),
            departure_date: values.departure_date,
          },
          ...(values.return_date
            ? [
                {
                  origin: values.destination.toUpperCase(),
                  destination: values.origin.toUpperCase(),
                  departure_date: values.return_date,
                },
              ]
            : []),
        ],
        passengers,
        cabin_class: values.cabin_class,
      },
    })
  }

  function runSearch(values: FlightSearchValues) {
    flightsStore.setSearchParams(values)
    flightsStore.setLastMatchId(matchId)
    setSelectedFlight(null)
    setFlightPage(1)
    dispatchSearch(values)
    setFlightStep('results')
  }

  /** Back to the search step. Deliberately does NOT clear selectedFlight,
   *  offers, or bag/seat picks — "Change search" lets you tweak dates or
   *  passengers without losing what you already chose, matching Travels'
   *  collapsed search-band behaviour. */
  function changeFlightSearch() {
    setFlightStep('search')
  }

  function changeFlight() {
    setSelectedFlight(null)
    setFlightAncillaryTotal(0)
    setFlightStep('results')
  }

  // No auto-search on mount. The user must fill in their travel dates and
  // click Search explicitly. Pre-selecting dates and auto-running a search
  // before the user has chosen anything is confusing — they may want different
  // dates than the match-day defaults, or may not want flights at all.
  // The destination IS pre-filled from the match city's airport (above), but
  // dates and the search itself are user-initiated.
  //
  // (flightsInitRan ref kept for safety — prevents any accidental double-fire
  // if a future refactor re-adds an effect here)
  useEffect(() => {
    if (flightsInitRan.current) return
    flightsInitRan.current = true
    // Intentionally empty — no auto-search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectLive(offer: FlightOffer) {
    setFlightAncillaryTotal(0)
    setSelectedFlight({ source: 'live', offer })
    setFlightStep('fare')
  }

  // Wired to the "Done with flight" button. Runs the actual cart sync
  // (syncFlightToCart) BEFORE advancing to the 'done' step, so the
  // confirmation checkmark UI only ever appears once the flight has
  // genuinely been added — not optimistically before we know the server
  // call succeeded. On failure the user stays on the seats step with an
  // error toast (already shown inside syncFlightToCart) and can retry.
  async function handleDoneWithFlight() {
    if (selectedFlight?.source !== 'live' || isConfirmingFlight) return
    setIsConfirmingFlight(true)
    const ok = await syncFlightToCart(selectedFlight.offer)
    setIsConfirmingFlight(false)
    if (ok) setFlightStep('done')
  }

  // Keep this page in sync when the flight is removed from the cart
  // somewhere else — e.g. via the trash icon in the navbar cart drawer
  // while still on this page. Without this, the confirmed-flight card
  // kept showing as selected after it was gone from the cart.
  //
  // Gated on flightStep === 'done' on purpose: `selectedFlight` is set the
  // moment a fare is picked (steps fare/bags/seats), well BEFORE the
  // flight is actually added to the cart (that only happens on "Done with
  // flight"). Checking for a missing cart item at those earlier steps
  // would always look "removed" and wrongly wipe a selection the user is
  // still in the middle of making. 'done' is the only step where a cart
  // item is guaranteed to exist for the selected flight.
  //
  // Not racy with replacing a flight: changeFlight() moves flightStep off
  // 'done' before a new one can be confirmed, so the remove-then-add
  // inside syncFlightToCart never runs while this guard is active.
  useEffect(() => {
    if (flightStep !== 'done' || selectedFlight?.source !== 'live') return
    const stillInCart = items.some(
      (i) => i.key === `flight:${selectedFlight.offer.id}`,
    )
    if (stillInCart) return
    setSelectedFlight(null)
    setFlightAncillaryTotal(0)
    setFlightStep('results')
  }, [items, flightStep, selectedFlight])

  const flightBasePrice = selectedFlight
    ? parseFloat(selectedFlight.offer.total_amount)
    : 0
  const flightPrice = flightBasePrice + flightAncillaryTotal
  // What the flight DISPLAYS while choosing: the provider fare (+ chosen
  // bags/seats). `flightBasePrice`/`flightPrice` above stay the CHARGED
  // figures the cart and totals use.
  const flightShown = selectedFlight
    ? offerDisplayPrice(selectedFlight.offer)
    : null
  const flightShownTotal = (flightShown?.amount ?? 0) + flightAncillaryTotal

  // `selectedFlight` is set the moment a fare is picked (fare → bags →
  // seats), but the flight is only ADDED TO THE CART when "Done with
  // flight" runs syncFlightToCart. The order summary, the total and the
  // item count must follow the cart, not the in-progress selection —
  // otherwise a flight the buyer is still choosing shows up on the right
  // as if it had already been added. `summaryFlight` is the selected
  // flight only once it really is a cart item, so the summary appears at
  // the same moment the navbar cart badge does, and disappears with it if
  // the item is removed from the cart drawer.
  const summaryFlight =
    selectedFlight?.source === 'live' &&
    items.some((i) => i.key === `flight:${selectedFlight.offer.id}`)
      ? selectedFlight
      : null
  const summaryFlightPrice = summaryFlight ? flightPrice : 0

  const route = `${currentSearchValues.origin.toUpperCase()}→${currentSearchValues.destination.toUpperCase()}`
  const flightName = selectedFlight
    ? `${selectedFlight.offer.slices[0].segments[0].marketing_carrier.name} · ${route}`
    : ''
  const flightDetail = selectedFlight
    ? selectedFlight.offer.slices.length > 1
      ? 'Round trip · Live fare'
      : 'Live fare'
    : ''

  /* ═══════════════════════════ eSIM ═══════════════════════════ */
  const ESIM_WIZARD_STEPS = ['Search', 'Results', 'Confirm'] as const
  type EsimWizardStep = 'search' | 'results' | 'done'
  const [esimStep, setEsimStep] = useState<EsimWizardStep>('search')
  const esimStepNumber: Record<EsimWizardStep, number> = {
    search: 1,
    results: 2,
    done: 3,
  }
  const [esimTab, setEsimTab] = useState<'local' | 'global'>('local')
  const [esimSearchQuery, setEsimSearchQuery] = useState('')
  const [selectedEsim, setSelectedEsim] = useState<EsimPackage | null>(null)
  // Tracks which specific plan card is mid-confirm, so only that card shows
  // a spinner (there can be several plans rendered at once).
  const [confirmingEsimId, setConfirmingEsimId] = useState<string | null>(null)
  const [autoActivate, setAutoActivate] = useState(true)

  // Wired to a plan card's "Add" button. Runs the actual cart sync
  // (syncEsimToCart) BEFORE marking the plan selected/advancing to the
  // 'done' step — same reasoning as handleDoneWithFlight above: the
  // "Added" badge and confirmation screen should only appear once the
  // server call has actually succeeded, not optimistically before that.
  async function handleAddEsim(plan: EsimPackage) {
    if (confirmingEsimId) return
    setConfirmingEsimId(plan.package_id)
    const ok = await syncEsimToCart(plan)
    setConfirmingEsimId(null)
    if (ok) {
      setSelectedEsim(plan)
      setEsimStep('done')
    }
  }

  // Bug fix: auto-activate used to only ever get captured once, at
  // checkout time — syncBuilderToCart ran after this toggle, so whatever
  // it showed then is what got sent. Now that the eSIM is added to the
  // cart immediately when "Add" is clicked, toggling this AFTERWARDS
  // (on the 'done' confirmation screen) needs its own update path, or the
  // cart item would silently keep whatever value was set at Add-time.
  // This mirrors later toggles into the already-added cart item's local
  // detail/checkoutPayload — no server call needed, since
  // CartApiEsimPayload has no auto-activate field at all; it's purely a
  // local flag consumed by the single-card Pay screen.
  const autoActivateSyncedRef = useRef(autoActivate)
  useEffect(() => {
    if (!(esimStep === 'done' && selectedEsim)) return
    if (autoActivateSyncedRef.current === autoActivate) return
    autoActivateSyncedRef.current = autoActivate

    const existing = items.find(
      (i) => i.key === `esim:${selectedEsim.package_id}`,
    )
    if (!existing) return
    addItem(
      {
        ...existing,
        detail: `${selectedEsim.data} · ${selectedEsim.validity_days} days · ${selectedEsim.country}${autoActivate ? ' · Auto-activate' : ''}`,
        checkoutPayload: { ...existing.checkoutPayload, autoActivate },
      },
      { silent: true },
    )
  }, [autoActivate, esimStep, selectedEsim, items, addItem])

  // Keep this page in sync when the eSIM is removed from the cart
  // somewhere else (e.g. the navbar cart drawer's trash icon) — otherwise
  // the plan card kept showing "Added" and the confirmation screen stayed
  // up after the item was gone from the cart.
  //
  // Unlike the flight equivalent, no step gate is needed: selectedEsim is
  // only ever set inside handleAddEsim AFTER syncEsimToCart has succeeded,
  // so a non-null selectedEsim always means a matching cart item should
  // exist. Also safe alongside swapping plans: syncEsimToCart removes the
  // old item first, this briefly clears the old selection, and
  // handleAddEsim then sets the new plan as selected once its add lands.
  useEffect(() => {
    if (!selectedEsim) return
    const stillInCart = items.some(
      (i) => i.key === `esim:${selectedEsim.package_id}`,
    )
    if (stillInCart) return
    setSelectedEsim(null)
    setEsimStep('results')
  }, [items, selectedEsim])
  const { data: providersData } = useEnabledEsimProviders()
  const activeProvider = providersData?.data?.find(
    (provider) => provider.enabled,
  )

  const esimCountry = tripDefaults?.destination.countryCode ?? ''

  // Debounced so resolving a country and re-querying doesn't happen on
  // every keystroke — only once the user pauses.
  const debouncedEsimSearch = useDebounce(esimSearchQuery, 300)

  // Bug fix (v2): the previous fix for "typing 'Spain' in Global finds
  // nothing" fetched every page of the global catalogue and substring-
  // filtered across all of it. That worked but was the wrong layer to fix
  // it at — modeled on the travels project's working eSIM search, the
  // backend's `type=global` packages endpoint has NO country filter at
  // all (confirmed against both projects' API layers), so it was never
  // going to reliably answer "plans for Spain" no matter how many pages
  // got fetched. Travels solves this by never asking the global endpoint
  // for a country at all: typing/selecting a country always queries the
  // `type=local&country=XX` endpoint instead, which the backend genuinely
  // supports. Same fix here — resolve the typed text to an ISO code via
  // the same country table + resolver travels uses, and if it resolves,
  // fetch that country's *local* plans directly instead of trying to
  // filter the global list. Free text that ISN'T a recognized country
  // (an operator name, say) still falls back to filtering whatever the
  // Global tab's own browse page already has loaded.
  const searchedCountryCode =
    esimTab === 'global' ? resolveEsimCountryCode(debouncedEsimSearch) : null
  const isGlobalCountrySearch = !!searchedCountryCode

  const {
    data: localData,
    isLoading: isLoadingLocal,
    isError: isLocalEsimError,
    refetch: refetchLocalEsim,
  } = useLocalEsimPackages(esimTab === 'local' ? esimCountry : undefined)
  const {
    data: globalData,
    isLoading: isLoadingGlobal,
    isError: isGlobalEsimError,
    refetch: refetchGlobalEsim,
  } = useGlobalEsimPackages(esimTab === 'global' && !isGlobalCountrySearch, {
    page: 1,
  })
  // A country typed into the Global tab's search box — queried against the
  // local endpoint directly (see the bug-fix comment above), completely
  // independent of the trip's own destination-country query above.
  const {
    data: searchedCountryData,
    isLoading: isLoadingSearchedCountry,
    isError: isSearchedCountryEsimError,
    refetch: refetchSearchedCountryEsim,
  } = useLocalEsimPackages(searchedCountryCode ?? undefined)

  const esimPackages: EsimPackage[] =
    esimTab === 'local'
      ? (localData?.data?.data ?? [])
      : isGlobalCountrySearch
        ? (searchedCountryData?.data?.data ?? [])
        : (globalData?.data?.data ?? [])
  // Once a recognized country has been resolved, its `local` fetch is
  // already scoped to exactly that country server-side — no further
  // client-side text filtering needed (or possible, since the package
  // objects don't necessarily echo the country name back verbatim).
  // Unrecognized free text (an operator name, etc.) still filters
  // whatever the Global browse page already has loaded, same as before.
  const filteredEsimPackages =
    esimTab === 'global' && debouncedEsimSearch.trim() && !isGlobalCountrySearch
      ? esimPackages.filter((p) =>
          `${p.country} ${p.title} ${p.operator ?? ''}`
            .toLowerCase()
            .includes(debouncedEsimSearch.trim().toLowerCase()),
        )
      : esimPackages
  const isLoadingEsim =
    esimTab === 'local'
      ? isLoadingLocal
      : isGlobalCountrySearch
        ? isLoadingSearchedCountry
        : isLoadingGlobal
  // Bug: neither eSIM query ever surfaced its error state — a failed fetch
  // (the intermittent "global multi-country search sometimes fails" report)
  // just left the results area blank with no explanation and no way to
  // retry, so it looked like the search silently did nothing. Now it shows
  // an explicit error message with a retry button, same as the hotel search
  // above.
  const isEsimError =
    esimTab === 'local'
      ? isLocalEsimError
      : isGlobalCountrySearch
        ? isSearchedCountryEsimError
        : isGlobalEsimError
  const refetchEsim =
    esimTab === 'local'
      ? refetchLocalEsim
      : isGlobalCountrySearch
        ? refetchSearchedCountryEsim
        : refetchGlobalEsim

  /* ── Totals ── */
  const ticketTotal = ticketLine ? ticketLine.price * ticketLine.qty : 0
  const esimPrice = selectedEsim?.price ?? 0
  const total = ticketTotal + hotelPrice + summaryFlightPrice + esimPrice
  // The line items above can genuinely be in different currencies while
  // the buyer is still selecting (flights especially — their currency
  // comes from the airline/market, not the picker, so it isn't
  // guaranteed to match). Summing raw numbers across currencies would
  // be a wrong number, not just a mislabeled one, so the grand total is
  // only shown once every present item actually agrees on a currency —
  // which the backend's own cartCurrencyConflict check will otherwise
  // enforce by the time anything is actually added to the cart.
  const summaryCurrencies = [
    ticketLine ? ticketCurrency : null,
    summaryFlight ? summaryFlight.offer.total_currency : null,
    hotelItem ? hotelCurrency : null,
    selectedEsim ? selectedEsim.currency : null,
  ].filter((c): c is string => Boolean(c))
  const summaryCurrencyMismatch = new Set(summaryCurrencies).size > 1
  const summaryCurrency = summaryCurrencies[0] ?? ticketCurrency
  // Breakdown for the "Your Cart" panel. Used only when the server's
  // summary covers EXACTLY the item types shown here — an item still being
  // chosen (not yet on the server cart) would otherwise be missing from the
  // fee/total. Otherwise the panel shows what it always showed.
  const sidebarTypes = [
    ticketLine ? 'matchday' : null,
    summaryFlight ? 'flight' : null,
    hotelItem ? 'stays' : null,
    selectedEsim ? 'esim' : null,
  ].filter((t): t is string => t !== null)
  const summaryTypes = new Set(priceSummary?.lines.map((l) => l.item_type))
  const sidebarSummary =
    priceSummary &&
    !summaryCurrencyMismatch &&
    sidebarTypes.length > 0 &&
    summaryTypes.size === sidebarTypes.length &&
    sidebarTypes.every((t) => summaryTypes.has(t))
      ? priceSummary
      : null
  // Same saving the seat card shows: off the match ticket price, fees unchanged.
  const pricedSummary = useSummaryWithMatchPromo(sidebarSummary)
  // An item's own lines (ticket price, third-party fee, extras…) from that
  // summary. While there are none, the panel shows the item's single price
  // exactly as it always did.
  const itemIdFor = (type: CartItemType) =>
    serverIdOf(items.find((i) => i.type === type) ?? {})
  const hasLines = (type: CartItemType) =>
    summaryLinesForItem(sidebarSummary, itemIdFor(type)).length > 0
  const itemCount =
    (ticketLine ? 1 : 0) +
    (hotelItem ? 1 : 0) +
    (summaryFlight ? 1 : 0) +
    (selectedEsim ? 1 : 0)

  const checkoutHref = builderStepHref('/builder/pay', matchId)

  // Called the moment the user clicks "Done with flight" — i.e. the exact
  // point they've actually confirmed a flight (fare + bags + seats), not
  // deferred until they later click "Go to checkout". This is what makes
  // the navbar cart badge/drawer update right away instead of only after
  // checkout is clicked.
  //
  // Takes the offer explicitly rather than reading `selectedFlight` from
  // component state, even though it's the same value at the moment this
  // is called — keeps this function correct regardless of when it's
  // invoked from, with no risk of acting on a stale selection.
  async function syncFlightToCart(offer: FlightOffer): Promise<boolean> {
    const extrasHref = builderStepHref('/builder/extras', matchId)

    // Bug fix: replacing a previously-confirmed flight with a new one used
    // to only clear the OLD flight from the local cart view — its
    // server-side cart item was never deleted, so switching flights more
    // than once before checkout could leave stale, still-payable flight
    // items sitting in the server cart. removeTypeAndServer deletes the
    // old one first.
    await removeTypeAndServer('flight')

    // Pull whatever bags/seats the ancillaries step stored for this exact
    // offer id and shape them for the backend's contract:
    // { id: ase_..., quantity, passenger_id?, segment_id? }
    const services = (() => {
      try {
        const raw = sessionStorage.getItem(`flight-ancillaries:${offer.id}`)
        const state = (raw ? JSON.parse(raw) : { bags: {}, seats: {} }) as {
          bags?: Record<string, { serviceId: string; passengerId: string }>
          seats?: Record<
            string,
            { serviceId: string; passengerId: string; segmentId: string }
          >
        }
        return [
          ...Object.values(state.bags ?? {}).map((bag) => ({
            id: bag.serviceId,
            quantity: 1,
            passenger_id: bag.passengerId,
          })),
          ...Object.values(state.seats ?? {}).map((seat) => ({
            id: seat.serviceId,
            quantity: 1,
            passenger_id: seat.passengerId,
            segment_id: seat.segmentId,
          })),
        ]
      } catch {
        return []
      }
    })()

    const flightPayload: Record<string, unknown> = {
      offerId: offer.id,
      services,
    }

    try {
      const cart = await getCartApi()
      const currencyError = cartCurrencyConflict(
        cart.data,
        offer.total_currency,
      )
      if (currencyError) {
        toast.error(currencyError)
        return false
      }

      // Bug fix: services (bags + seats) were computed above but never
      // actually sent to the backend — only offer_id was posted, so
      // /api/v1/cart/flights priced the bare fare and the extras total
      // silently disappeared at checkout. Send them now, per backend's
      // POST /api/v1/cart/flights contract (services[].id/quantity/
      // passenger_id/segment_id). Omit the key entirely when there are
      // no extras, rather than posting an empty array.
      const response = await addFlightToCartApi({
        offer_id: offer.id,
        ...(services.length > 0 ? { services } : {}),
      })
      const serverItem = response.data.items.find(
        (item) => item.type === 'flight',
      )
      if (!serverItem) {
        toast.error('The flight was not added to the server cart.')
        return false
      }
      flightPayload.serverId = serverItem.id
    } catch (err) {
      toast.error(cartApiError(err))
      return false
    }

    const route = `${currentSearchValues.origin.toUpperCase()}→${currentSearchValues.destination.toUpperCase()}`
    // silent: true — the extras page's own "Done with flight" checkmark
    // screen already confirms the add; auto-opening the cart drawer on
    // top of that for every product added mid-flow was jarring rather
    // than helpful (per feedback), so this now updates the badge/drawer
    // contents without popping it open, same as the hotel sync below.
    addItem(
      {
        key: `flight:${offer.id}`,
        type: 'flight',
        name: `${offer.slices[0].segments[0].marketing_carrier.name} · ${route}`,
        detail:
          offer.slices.length > 1 ? 'Round trip · Live fare' : 'Live fare',
        price: parseFloat(offer.total_amount) + flightAncillaryTotal,
        href: extrasHref,
        checkoutPayload: flightPayload,
      },
      { silent: true },
    )
    return true
  }

  // Called the moment the user clicks "Add" on an eSIM plan — same
  // immediate-sync reasoning as syncFlightToCart above. Takes the plan
  // directly rather than reading `selectedEsim` from state, so the caller
  // can call this BEFORE setSelectedEsim — avoiding a stale-state read (a
  // just-called setState isn't guaranteed to have committed yet) and
  // letting the "Added" badge only appear once the add has actually
  // succeeded, not optimistically before we know that.
  async function syncEsimToCart(plan: EsimPackage): Promise<boolean> {
    const extrasHref = builderStepHref('/builder/extras', matchId)

    // Same bug fix as the flight function above: delete any previously-
    // confirmed eSIM's server-side cart item before adding this one, so
    // switching plans can't leave stale duplicates in the server cart.
    await removeTypeAndServer('esim')

    const esimPayload: Record<string, unknown> = {
      packageId: plan.package_id,
      esimType: esimTab,
      country: plan.country_code,
      // Fix: this was missing, so the auto-activate toggle chosen here was
      // silently lost by the time the customer reached the single-card
      // checkout page (it always reset to "off" there).
      autoActivate,
    }

    try {
      // Same guard as the flight branch above — without this, an eSIM
      // priced in a different currency to what's already in the cart (or
      // to the flight just added above) could get pushed straight to the
      // server with no warning, or fail with a raw API error instead of a
      // clear one.
      const cart = await getCartApi()
      const currencyError = cartCurrencyConflict(cart.data, plan.currency)
      if (currencyError) {
        toast.error(currencyError)
        return false
      }

      const response = await addEsimToCartApi({
        package_id: plan.package_id,
        type: esimTab,
        country: esimTab === 'global' ? undefined : plan.country_code,
        quantity: 1,
      })
      const serverItem = response.data.items.find(
        (item) => item.type === 'esim',
      )
      if (!serverItem) {
        toast.error('The eSIM was not added to the server cart.')
        return false
      }
      esimPayload.serverId = serverItem.id
    } catch (err) {
      // Bug: this used to fall through to addItem() below even on
      // failure, so a rejected server add still showed up in the local
      // cart as if it had succeeded — it would then either vanish
      // unexplained at pay-time cleanup or, worse, be included in a total
      // the buyer never actually has to pay. Bail out instead.
      toast.error(cartApiError(err))
      return false
    }

    // silent: true — same reasoning as the flight sync above: the plan
    // card's own "Added" state (and the 'done' confirmation screen) is
    // feedback enough; the drawer popping open on top of it is unwanted.
    addItem(
      {
        key: `esim:${plan.package_id}`,
        type: 'esim',
        name: `Golafly eSIM — ${plan.title}`,
        detail: `${plan.data} · ${plan.validity_days} days · ${plan.country}${autoActivate ? ' · Auto-activate' : ''}`,
        price: plan.price,
        href: extrasHref,
        checkoutPayload: esimPayload,
      },
      { silent: true },
    )
    return true
  }

  async function goToCheckout() {
    // Flight, hotel and eSIM are each put in the cart the moment they are
    // confirmed in their own step, so there is nothing left to sync here.
    router.push(checkoutHref)
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45 },
  })

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-10 sm:py-12'>
        <StepProgress currentStep={2} />

        <motion.div className='mb-6 mt-6 sm:mb-8 sm:mt-8' {...fadeUp(0.06)}>
          <p className='mb-1 font-mono text-[10px] tracking-[2px] text-brand-text'>
            Step 2 of 4
          </p>
          <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-[22px]'>
            Build Your Bundle
          </h1>
          <p className='mt-1 text-[13px] text-muted-foreground'>
            Select your flight, baggage, seats, hotel room, and eSIM before the
            final shared checkout.
          </p>
          {tripDefaults ? (
            /* Destination known — give a hint about suggested match-day dates */
            <div className='mt-3 flex items-start gap-2 rounded-xl border border-dashed border-brand-text/30 bg-primary/5 px-4 py-3'>
              <AlertCircle className='mt-0.5 size-4 shrink-0 text-brand-text' />
              <p className='text-[11px] leading-snug text-muted-foreground'>
                Destination, departure and return dates are pre-filled from your
                match —{' '}
                <span className='text-foreground'>
                  1 day before and 1 day after kickoff.
                </span>{' '}
                Change any of them, then tap Search.
              </p>
            </div>
          ) : (
            /* Destination unknown — ask them to fill in everything */
            <div className='mt-3 flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3'>
              <AlertCircle className='mt-0.5 size-4 shrink-0 text-brand-text' />
              <p className='text-[11px] leading-snug text-muted-foreground'>
                Enter your departure city, destination, and travel dates below,
                then tap Search to find flights.
              </p>
            </div>
          )}
          <FreeEsimNote venueCountry={match.venueCountry} className='mt-3' />
        </motion.div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]'>
          <div className='space-y-10'>
            {/* Top action bar — mirrors the bottom one so users don't have to scroll to checkout */}
            <motion.div
              className='flex flex-col gap-3 sm:flex-row sm:items-center'
              {...fadeUp(0.08)}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={builderStepHref('/builder/seats', matchId)}
                  className='block rounded-full border border-brand-text/35 px-6 py-2.5 text-center text-[13px] font-bold text-brand-text transition-all hover:bg-primary/10'
                >
                  Back to Seats
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type='button'
                  onClick={() => void goToCheckout()}
                  className='block w-full rounded-full bg-primary px-6 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
                >
                  Continue to checkout
                </button>
              </motion.div>
            </motion.div>

            <motion.section {...fadeUp(0.12)}>
              <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h2 className='text-[15px] font-bold text-foreground'>
                  Flights
                </h2>
                <MiniStepProgress
                  steps={FLIGHT_WIZARD_STEPS}
                  currentStep={flightStepNumber[flightStep]}
                />
              </div>

              {flightStep === 'search' && (
                <BuilderFlightSearch
                  // Bug-proofing: this route (/builder/extras) is reused for
                  // every match — navigating from one match's extras page to
                  // a different match's WITHOUT a full page reload does not
                  // remount this component tree on its own. Without a key,
                  // react-hook-form would keep the PREVIOUS match's
                  // destination/dates baked into its internal state forever
                  // (defaultValues are only read once, at mount), which is
                  // the same class of bug as the localStorage staleness
                  // fixed via `lastMatchId` above. Keying on matchId forces
                  // a clean remount — and therefore a fresh read of
                  // `currentSearchValues` — every time the match changes, no
                  // matter how the user navigated here.
                  key={matchId ?? 'no-match'}
                  defaults={currentSearchValues}
                  onSearch={runSearch}
                  isSearching={isSearching}
                />
              )}

              {flightStep === 'results' && (
                <div className='space-y-3'>
                  <button
                    type='button'
                    onClick={changeFlightSearch}
                    className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                  >
                    <ChevronLeft className='size-3.5' />
                    Change search
                  </button>

                  {!isSearching && offers.length > 0 && (
                    <button
                      type='button'
                      onClick={() => setShowFlightFilters((v) => !v)}
                      className='flex items-center gap-1.5 self-start font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                    >
                      <SlidersHorizontal className='size-3.5' />
                      {showFlightFilters ? 'Hide filters' : 'Filters'}
                      {(activeAirlines.length > 0 ||
                        activeFareBrands.length > 0 ||
                        maxPrice !== null ||
                        selectedStops.length < 3 ||
                        selectedDepartureTimes.length < 4) && (
                        <span className='rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground'>
                          Active
                        </span>
                      )}
                    </button>
                  )}

                  {showFlightFilters && !isSearching && offers.length > 0 && (
                    <FlightFiltersSidebar
                      selectedStops={selectedStops}
                      toggleStop={toggleStop}
                      airlines={flightAirlines}
                      activeAirlines={activeAirlines}
                      toggleAirline={toggleAirline}
                      fareBrands={flightFareBrands}
                      activeFareBrands={activeFareBrands}
                      toggleFareBrand={toggleFareBrand}
                      selectedDepartureTimes={selectedDepartureTimes}
                      toggleDepartureTime={toggleDepartureTime}
                      priceBounds={flightPriceBounds}
                      maxPrice={maxPrice}
                      onMaxPriceChange={setMaxPrice}
                      onReset={resetFlightFilters}
                    />
                  )}

                  {isSearching && (
                    <div className='space-y-3'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <FlightCardSkeleton key={i} />
                      ))}
                      <p className='text-center text-[11px] text-muted-foreground'>
                        {searchTakingLong
                          ? 'Still searching — live airline results can take up to 20–30 seconds, especially for busier routes.'
                          : 'Searching live flights…'}
                      </p>
                    </div>
                  )}

                  {!isSearching && offers.length > 0 && (
                    <div className='space-y-3'>
                      {filteredOffers.length === 0 ? (
                        <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center'>
                          <p className='text-[12px] text-muted-foreground'>
                            No flights match your filters.
                          </p>
                          <button
                            type='button'
                            onClick={resetFlightFilters}
                            className='rounded-full border border-brand-text/35 px-4 py-1.5 text-[11px] font-bold text-brand-text hover:bg-primary/10'
                          >
                            Reset filters
                          </button>
                        </div>
                      ) : (
                        <>
                          {filteredOffers
                            .slice(
                              (flightPage - 1) * RESULTS_PER_PAGE,
                              flightPage * RESULTS_PER_PAGE,
                            )
                            .map((offer, i) => (
                              <FlightCard
                                key={offer.id}
                                offer={offer}
                                index={i}
                                expanded={expandedOfferId === offer.id}
                                onToggle={() =>
                                  setExpandedOfferId((prev) =>
                                    prev === offer.id ? null : offer.id,
                                  )
                                }
                                onSelect={() => selectLive(offer)}
                              />
                            ))}
                          {filteredOffers.length > RESULTS_PER_PAGE && (
                            <Pagination
                              page={flightPage}
                              totalPages={Math.ceil(
                                filteredOffers.length / RESULTS_PER_PAGE,
                              )}
                              onPage={setFlightPage}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {showLiveSearchFailed && (
                    <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-6 text-center'>
                      <AlertCircle className='size-5 text-destructive' />
                      <p className='text-[12px] text-muted-foreground'>
                        {searchError
                          ? "Couldn't reach flight search."
                          : `No flights found for ${route}.`}{' '}
                        Try different dates or airports above.
                      </p>
                      <button
                        type='button'
                        onClick={() => runSearch(currentSearchValues)}
                        className='rounded-full border border-brand-text/35 px-4 py-1.5 text-[11px] font-bold text-brand-text hover:bg-primary/10'
                      >
                        Search again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {flightStep === 'fare' && selectedFlight?.source === 'live' && (
                <div className='space-y-4'>
                  <button
                    type='button'
                    onClick={() => setFlightStep('results')}
                    className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                  >
                    <ChevronLeft className='size-3.5' />
                    Back to results
                  </button>
                  <div className='overflow-hidden rounded-2xl border border-brand-text/20 bg-card'>
                    <div className='p-5'>
                      <div className='mb-3 flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-heading text-base font-bold text-foreground'>
                            {flightName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {flightDetail}
                          </p>
                        </div>
                        <p className='shrink-0 text-lg font-black text-foreground'>
                          {formatMatchdayMoney(
                            flightShown?.amount ?? flightBasePrice,
                            flightShown?.currency ??
                              selectedFlight.offer.total_currency,
                          )}
                        </p>
                      </div>
                      <div className='grid grid-cols-1 gap-2 text-[12px] text-muted-foreground sm:grid-cols-2'>
                        {selectedFlight.offer.slices.map((slice, i) => {
                          const first = slice.segments[0]
                          const last = slice.segments[slice.segments.length - 1]
                          if (!first || !last) return null
                          return (
                            <div
                              key={i}
                              className='rounded-xl border border-border p-3'
                            >
                              <p className='font-bold text-foreground'>
                                {first.origin.iata_code} →{' '}
                                {last.destination.iata_code}
                              </p>
                              <p>
                                {new Date(first.departing_at).toLocaleString(
                                  'en-GB',
                                  {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      <button
                        type='button'
                        onClick={() => setShowFareDetails((v) => !v)}
                        className='mt-3 flex items-center gap-1 font-mono text-[10.5px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                      >
                        {showFareDetails ? 'Hide details' : 'Show details'}
                        <ChevronDown
                          className={cn(
                            'size-3.5 transition-transform',
                            showFareDetails && 'rotate-180',
                          )}
                        />
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {showFareDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className='overflow-hidden border-t border-border'
                        >
                          <ItineraryDetail offer={selectedFlight.offer} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <p className='mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                      Choose your fare
                    </p>
                    {awaitingFares ? (
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className='h-40 animate-pulse rounded-2xl border border-border bg-card'
                          />
                        ))}
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                        {fareCards.map((card) => {
                          const isCurrent =
                            card.offer.id === selectedFlight.offer.id ||
                            (fareKey(card.offer) ===
                              fareKey(selectedFlight.offer) &&
                              parseFloat(card.offer.total_amount) ===
                                flightBasePrice)
                          return (
                            <button
                              key={card.offer.id}
                              type='button'
                              onClick={() => {
                                if (isCurrent) return
                                setFlightAncillaryTotal(0)
                                setSelectedFlight({
                                  source: 'live',
                                  offer: card.offer,
                                })
                              }}
                              className={cn(
                                'flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors',
                                isCurrent
                                  ? 'border-brand-text bg-primary/5 shadow-[0_0_0_1px_var(--brand-glow)]'
                                  : 'border-border bg-card hover:border-brand-text/40',
                              )}
                            >
                              <div className='flex items-center justify-between gap-2'>
                                <p className='text-[13px] font-bold text-foreground'>
                                  {card.brandName}
                                </p>
                                {isCurrent && (
                                  <Check className='size-3.5 shrink-0 text-brand-text' />
                                )}
                              </div>
                              <FlightSalePrice
                                offer={card.offer}
                                amountClassName='font-heading text-lg font-black text-foreground'
                                className='items-start'
                              />
                              <ul className='space-y-1 font-mono text-[10px] text-muted-foreground'>
                                <li
                                  className={cn(
                                    card.carryOnIncluded && 'text-status-good',
                                  )}
                                >
                                  {card.carryOnIncluded
                                    ? '✓ Carry-on included'
                                    : '✕ No carry-on'}
                                </li>
                                <li
                                  className={cn(
                                    card.checkedBagIncluded &&
                                      'text-status-good',
                                  )}
                                >
                                  {card.checkedBagIncluded
                                    ? '✓ Checked bag included'
                                    : '✕ No checked bag'}
                                </li>
                                <li
                                  className={cn(
                                    card.refundable && 'text-status-good',
                                  )}
                                >
                                  {card.refundable
                                    ? '✓ Refundable'
                                    : '✕ Non-refundable'}
                                </li>
                                <li
                                  className={cn(
                                    card.changeable && 'text-status-good',
                                  )}
                                >
                                  {card.changeable
                                    ? '✓ Changes allowed'
                                    : '✕ No changes'}
                                </li>
                              </ul>
                            </button>
                          )
                        })}
                        {siblingsFailed && fareCards.length <= 1 && (
                          <p className='col-span-full font-mono text-[10px] text-muted-foreground'>
                            Couldn&apos;t load other fare options — continuing
                            with the fare you selected.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type='button'
                    onClick={() => setFlightStep('bags')}
                    className='flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] sm:w-auto'
                  >
                    Continue to bags
                    <ChevronRight className='size-4' />
                  </button>
                </div>
              )}

              {flightStep === 'bags' && selectedFlight?.source === 'live' && (
                <div className='space-y-4'>
                  <button
                    type='button'
                    onClick={() => setFlightStep('fare')}
                    className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                  >
                    <ChevronLeft className='size-3.5' />
                    Back
                  </button>
                  <BuilderFlightAncillaries
                    offerId={selectedFlight.offer.id}
                    onTotalChange={setFlightAncillaryTotal}
                    forceTab='bags'
                  />
                  <button
                    type='button'
                    onClick={() => setFlightStep('seats')}
                    className='flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] sm:w-auto'
                  >
                    Continue to seats
                    <ChevronRight className='size-4' />
                  </button>
                </div>
              )}

              {flightStep === 'seats' && selectedFlight?.source === 'live' && (
                <div className='space-y-4'>
                  <button
                    type='button'
                    onClick={() => setFlightStep('bags')}
                    className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                  >
                    <ChevronLeft className='size-3.5' />
                    Back
                  </button>
                  <BuilderFlightAncillaries
                    offerId={selectedFlight.offer.id}
                    onTotalChange={setFlightAncillaryTotal}
                    forceTab='seats'
                    hideFareSummary
                  />
                  <button
                    type='button'
                    onClick={handleDoneWithFlight}
                    disabled={isConfirmingFlight}
                    className='flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] disabled:opacity-60 sm:w-auto'
                  >
                    {isConfirmingFlight ? (
                      <>
                        <Loader2 className='size-4 animate-spin' />
                        Adding to cart…
                      </>
                    ) : (
                      <>
                        Done with flight
                        <Check className='size-4' />
                      </>
                    )}
                  </button>
                </div>
              )}

              {flightStep === 'done' && selectedFlight && (
                <div className='flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-text/25 bg-primary/5 p-4 sm:flex-row sm:items-center'>
                  <div className='flex items-center gap-2'>
                    <Check className='size-4 shrink-0 text-brand-text' />
                    <div>
                      <p className='text-[13px] font-bold text-foreground'>
                        {flightName}
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        {flightDetail} ·{' '}
                        {formatMatchdayMoney(
                          flightShownTotal,
                          flightShown?.currency ??
                            selectedFlight.offer.total_currency,
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={changeFlight}
                    className='shrink-0 rounded-full border border-brand-text/35 px-4 py-1.5 font-mono text-[11px] font-bold text-brand-text hover:bg-primary/10'
                  >
                    Change flight
                  </button>
                </div>
              )}
            </motion.section>

            {/* {selectedOfferId && (
              <motion.div {...fadeUp(0.2)}>
                <BuilderFlightAncillaries
                  offerId={selectedOfferId}
                  onTotalChange={setFlightAncillaryTotal}
                />
              </motion.div>
            )} */}

            <motion.div {...fadeUp(0.22)}>
              <BuilderHotelStep
                key={matchId ?? 'no-match'}
                matchId={matchId}
                defaults={hotelDefaults}
                resolving={destinationResolving}
              />
            </motion.div>

            <motion.section {...fadeUp(0.3)}>
              <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h2 className='text-[15px] font-bold text-foreground'>
                  eSIM — Stay Connected
                </h2>
                <div className='flex flex-wrap items-center gap-3'>
                  <MiniStepProgress
                    steps={ESIM_WIZARD_STEPS}
                    currentStep={esimStepNumber[esimStep]}
                  />
                  <button
                    onClick={() => {
                      setSelectedEsim(null)
                      setEsimStep('search')
                    }}
                    className='shrink-0 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Skip eSIM
                  </button>
                </div>
              </div>
              <p className='mb-4 text-[11px] text-muted-foreground'>
                Activate before you land · No physical SIM
              </p>

              {esimStep === 'search' && (
                <div className='space-y-4'>
                  <div className='flex overflow-hidden rounded-lg border border-border bg-muted'>
                    {(['local', 'global'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setEsimTab(tab)}
                        className={cn(
                          'flex-1 px-3 py-2 font-mono text-[10px] font-bold transition-all',
                          esimTab === tab
                            ? 'bg-primary text-primary-foreground shadow-[0_0_8px_var(--brand-glow)]'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {tab === 'local'
                          ? `Local${tripDefaults ? ` · ${tripDefaults.destination.city}` : ''}`
                          : 'Global (multi-country)'}
                      </button>
                    ))}
                  </div>

                  {esimTab === 'global' && (
                    <div className='space-y-1'>
                      <SearchStripField label='Country or region'>
                        <div className='flex items-center gap-1.5'>
                          <input
                            type='text'
                            value={esimSearchQuery}
                            onChange={(e) => setEsimSearchQuery(e.target.value)}
                            placeholder='Search by country — e.g. Spain'
                            className='w-full bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground'
                          />
                          <Search className='size-3.5 shrink-0 text-muted-foreground' />
                        </div>
                      </SearchStripField>
                      {isGlobalCountrySearch && (
                        <p className='px-1 text-[11px] text-muted-foreground'>
                          Showing local plans for{' '}
                          <span className='font-bold text-foreground'>
                            {esimCountryLabel(searchedCountryCode!)}
                          </span>
                          .
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type='button'
                    onClick={() => setEsimStep('results')}
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)] sm:w-auto'
                  >
                    <Search className='h-4 w-4 shrink-0' />
                    Search plans
                  </button>
                </div>
              )}

              {esimStep === 'results' && (
                <div className='space-y-4'>
                  <button
                    type='button'
                    onClick={() => setEsimStep('search')}
                    className='flex items-center gap-1 font-mono text-[11px] font-bold text-brand-text transition-colors hover:text-brand-text/80'
                  >
                    <ChevronLeft className='size-3.5' />
                    Change search
                  </button>

                  {isLoadingEsim && (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className='h-32 animate-pulse rounded-xl border border-border bg-card'
                        />
                      ))}
                    </div>
                  )}

                  {!isLoadingEsim && isEsimError && (
                    <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 py-8 text-center'>
                      <AlertCircle className='size-5 text-destructive' />
                      <p className='text-sm text-muted-foreground'>
                        We couldn&apos;t load{' '}
                        {esimTab === 'local' ? 'local' : 'global'} eSIM plans
                        right now.
                      </p>
                      <button
                        type='button'
                        onClick={() => void refetchEsim()}
                        className='rounded-full border border-border px-4 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-brand-text/50 hover:text-brand-text'
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!isLoadingEsim &&
                    !isEsimError &&
                    esimTab === 'local' &&
                    !esimCountry && (
                      <div className='rounded-xl border border-dashed border-border py-8 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          No destination resolved for this match — try the
                          Global tab.
                        </p>
                      </div>
                    )}

                  {!isLoadingEsim &&
                    !isEsimError &&
                    esimTab === 'global' &&
                    isGlobalCountrySearch &&
                    filteredEsimPackages.length === 0 && (
                      <div className='rounded-xl border border-dashed border-border py-8 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          No eSIM plans available for{' '}
                          {esimCountryLabel(searchedCountryCode!)} right now.
                        </p>
                      </div>
                    )}

                  {!isLoadingEsim &&
                    !isEsimError &&
                    esimTab === 'global' &&
                    !isGlobalCountrySearch &&
                    esimSearchQuery.trim() &&
                    filteredEsimPackages.length === 0 &&
                    esimPackages.length > 0 && (
                      <div className='rounded-xl border border-dashed border-border py-8 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          No plans match &quot;{esimSearchQuery}&quot;. Try a
                          different country name.
                        </p>
                      </div>
                    )}

                  {!isLoadingEsim &&
                    !isEsimError &&
                    filteredEsimPackages.length > 0 && (
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                        {filteredEsimPackages.slice(0, 6).map((plan, i) => {
                          const isSelected =
                            selectedEsim?.package_id === plan.package_id
                          const planShown = esimDisplayPrice(plan)
                          const perDay =
                            plan.validity_days > 0
                              ? planShown.amount / plan.validity_days
                              : null
                          const speed = plan.speed || '5G'
                          return (
                            <motion.div
                              key={plan.package_id}
                              className={cn(
                                'overflow-hidden rounded-2xl border bg-card transition-colors',
                                isSelected
                                  ? 'border-brand-text shadow-[0_0_0_1px_var(--brand-glow)]'
                                  : 'border-border',
                              )}
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.05 + i * 0.07,
                                duration: 0.4,
                              }}
                            >
                              {plan.country_image ? (
                                <div className='relative h-28 overflow-hidden'>
                                  {/* Supplier catalogue photo. next/image needs a remote host allowlist, so this stays a plain image. */}
                                  <img
                                    src={plan.country_image}
                                    alt={plan.country}
                                    className='size-full object-cover'
                                  />
                                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent' />
                                  <p className='absolute bottom-2 left-3 text-sm font-bold text-white'>
                                    {plan.country}
                                  </p>
                                </div>
                              ) : null}
                              <div className='space-y-3 p-4'>
                                <div className='flex items-start justify-between gap-2'>
                                  <p className='text-[13px] font-bold text-foreground'>
                                    {plan.title}
                                  </p>
                                  <span className='shrink-0 rounded-md bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground'>
                                    {speed}
                                  </span>
                                </div>
                                <p className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                                  <Globe className='size-3 shrink-0' />
                                  {plan.country}
                                  {plan.operator ? ` · ${plan.operator}` : ''}
                                </p>
                                <div className='grid grid-cols-3 border-y border-border/60'>
                                  <div className='py-2 text-center'>
                                    <p className='text-sm font-bold'>
                                      {plan.unlimited ? 'Unlimited' : plan.data}
                                    </p>
                                    <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                                      Data
                                    </p>
                                  </div>
                                  <div className='py-2 text-center'>
                                    <p className='text-sm font-bold'>
                                      {plan.validity_days} Days
                                    </p>
                                    <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                                      Validity
                                    </p>
                                  </div>
                                  <div className='py-2 text-center'>
                                    <p className='text-sm font-bold'>{speed}</p>
                                    <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                                      Speed
                                    </p>
                                  </div>
                                </div>
                                <div className='flex flex-wrap gap-1.5'>
                                  {[
                                    { icon: Wifi, label: speed },
                                    { icon: Wifi, label: 'Hotspot' },
                                    { icon: Zap, label: 'Instant' },
                                  ].map(({ icon: Icon, label }) => (
                                    <span
                                      key={label}
                                      className='inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-[9px] text-muted-foreground'
                                    >
                                      <Icon className='size-3' />
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                <div className='flex items-end justify-between gap-3'>
                                  <div>
                                    <p className='text-lg font-black text-foreground'>
                                      {formatMatchdayMoney(
                                        planShown.amount,
                                        planShown.currency,
                                      )}
                                    </p>
                                    {perDay !== null && (
                                      <p className='font-mono text-[10px] text-muted-foreground'>
                                        {formatMatchdayMoney(
                                          perDay,
                                          planShown.currency,
                                        )}
                                        /day
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type='button'
                                    onClick={() => {
                                      if (isSelected) {
                                        // Bug fix: this used to only clear
                                        // local UI state. Now that "Add"
                                        // syncs straight to the cart, toggling
                                        // off must remove it from the cart
                                        // too — otherwise the eSIM would stay
                                        // in the cart even though the card no
                                        // longer shows it as added.
                                        void removeTypeAndServer('esim')
                                        setSelectedEsim(null)
                                      } else {
                                        void handleAddEsim(plan)
                                      }
                                    }}
                                    disabled={
                                      confirmingEsimId === plan.package_id
                                    }
                                    className={cn(
                                      'rounded-full border px-4 py-1.5 text-[11px] font-bold disabled:opacity-60',
                                      isSelected
                                        ? 'border-brand-text bg-primary/15 text-brand-text'
                                        : 'border-brand-text/30 text-brand-text',
                                    )}
                                  >
                                    {confirmingEsimId === plan.package_id ? (
                                      <Loader2 className='size-3.5 animate-spin' />
                                    ) : isSelected ? (
                                      'Added'
                                    ) : (
                                      'Add'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                  <div className='mt-2'>
                    <EsimFaqSection />
                  </div>
                </div>
              )}

              {esimStep === 'done' && selectedEsim && (
                <div className='space-y-4'>
                  <div className='flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-text/25 bg-primary/5 p-4 sm:flex-row sm:items-center'>
                    <div className='flex items-center gap-2'>
                      <Check className='size-4 shrink-0 text-brand-text' />
                      <div>
                        <p className='text-[13px] font-bold text-foreground'>
                          {selectedEsim.title} eSIM
                        </p>
                        <p className='text-[11px] text-muted-foreground'>
                          {selectedEsim.data} · {selectedEsim.validity_days}{' '}
                          days ·{' '}
                          {formatMatchdayMoney(
                            esimDisplayPrice(selectedEsim).amount,
                            esimDisplayPrice(selectedEsim).currency,
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => setEsimStep('results')}
                      className='shrink-0 rounded-full border border-brand-text/35 px-4 py-1.5 font-mono text-[11px] font-bold text-brand-text hover:bg-primary/10'
                    >
                      Change plan
                    </button>
                  </div>

                  <motion.div
                    className='flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3'
                    {...fadeUp(0.05)}
                  >
                    <div>
                      <p className='text-[13px] font-medium text-foreground'>
                        Auto-activate on arrival
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        eSIM activates automatically when you land
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoActivate((p) => !p)}
                      className={cn(
                        'relative h-6 w-10 rounded-full transition-colors',
                        autoActivate ? 'bg-primary' : 'bg-muted',
                      )}
                    >
                      <motion.span
                        className='absolute top-0.5 size-5 rounded-full bg-white shadow-sm'
                        animate={{
                          left: autoActivate ? 'calc(100% - 22px)' : '2px',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 28,
                        }}
                      />
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.section>


            <motion.div
              className='flex flex-col gap-3 pt-2 sm:flex-row sm:items-center'
              {...fadeUp(0.45)}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={builderStepHref('/builder/seats', matchId)}
                  className='block rounded-full border border-brand-text/35 px-6 py-2.5 text-center text-[13px] font-bold text-brand-text transition-all hover:bg-primary/10'
                >
                  Back to Seats
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type='button'
                  onClick={() => void goToCheckout()}
                  className='block w-full rounded-full bg-primary px-6 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
                >
                  Continue to checkout
                </button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className='lg:sticky lg:top-6 lg:self-start'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className='space-y-3 rounded-xl border border-border bg-card p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-[13px] font-bold text-foreground'>
                  Your Cart
                </h3>
                <motion.span
                  key={itemCount}
                  className='flex size-[22px] items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground'
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {itemCount}
                </motion.span>
              </div>

              {ticketLine ? (
                <div className='border-b border-border pb-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-[12px] font-medium text-foreground'>
                      {ticketLine.qty} × Tickets
                    </p>
                    {!hasLines('tickets') && (
                      <p className='text-[12px] font-bold text-brand-text'>
                        {formatMatchdayMoney(ticketTotal, ticketCurrency)}
                      </p>
                    )}
                  </div>
                  <p className='text-[10px] text-muted-foreground'>
                    {ticketLine.detail}
                  </p>
                  <ItemPriceLines
                    summary={sidebarSummary}
                    itemId={itemIdFor('tickets')}
                  />
                </div>
              ) : (
                <div className='border-b border-border pb-3'>
                  <p className='text-[12px] text-muted-foreground'>
                    No seats selected —{' '}
                    <Link
                      href={builderStepHref('/builder/seats', matchId)}
                      className='text-brand-text underline underline-offset-2'
                    >
                      pick seats first
                    </Link>
                  </p>
                </div>
              )}

              <AnimatePresence>
                {summaryFlight && (
                  <motion.div
                    className='border-b border-border pb-3'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='flex items-center justify-between'>
                      <p className='text-[12px] font-medium text-foreground'>
                        {flightName}
                      </p>
                      {!hasLines('flight') && (
                        <p className='text-[12px] font-bold text-brand-text'>
                          +
                          {formatMatchdayMoney(
                            flightPrice,
                            summaryFlight.offer.total_currency,
                          )}
                        </p>
                      )}
                    </div>
                    <p className='text-[10px] text-muted-foreground'>
                      {flightDetail}
                    </p>
                    <ItemPriceLines
                      summary={sidebarSummary}
                      itemId={itemIdFor('flight')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {hotelItem && (
                  <motion.div
                    className='border-b border-border pb-3'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-[12px] font-medium text-foreground'>
                        {hotelItem.name}
                      </p>
                      {!hasLines('hotel') && (
                        <p className='shrink-0 text-[12px] font-bold text-brand-text'>
                          +{formatMatchdayMoney(hotelPrice, hotelCurrency)}
                        </p>
                      )}
                    </div>
                    <p className='break-words text-[10px] text-muted-foreground'>
                      {hotelItem.detail}
                    </p>
                    <ItemPriceLines
                      summary={sidebarSummary}
                      itemId={itemIdFor('hotel')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedEsim && (
                  <motion.div
                    className='border-b border-border pb-3'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='flex items-center justify-between'>
                      <p className='text-[12px] font-medium text-foreground'>
                        {selectedEsim.title} eSIM
                      </p>
                      {!hasLines('esim') && (
                        <p className='text-[12px] font-bold text-brand-text'>
                          +
                          {formatMatchdayMoney(
                            selectedEsim.price,
                            selectedEsim.currency,
                          )}
                        </p>
                      )}
                    </div>
                    <p className='text-[10px] text-muted-foreground'>
                      {selectedEsim.data} · {selectedEsim.validity_days} days
                    </p>
                    <ItemPriceLines
                      summary={sidebarSummary}
                      itemId={itemIdFor('esim')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className='border-t border-border pt-3'>
                {sidebarSummary &&
                  sidebarSummary.complete &&
                  sidebarSummary.golafly_booking_fee &&
                  sidebarSummary.golafly_booking_fee.amount_minor > 0 && (
                    <div className='mb-2 flex items-center justify-between text-[12px]'>
                      <span className='flex items-center gap-1.5 text-muted-foreground'>
                        {GOLAFLY_FEE_LABEL}
                        <InfoTip label='golafly booking fee'>{GOLAFLY_FEE_TIP}</InfoTip>
                      </span>
                      <span translate='no' className='notranslate font-bold text-foreground'>
                        {formatMatchdayMoney(
                          sidebarSummary.golafly_booking_fee.amount,
                          sidebarSummary.currency,
                        )}
                      </span>
                    </div>
                  )}
                {pricedSummary?.discount && (
                  <div className='mb-2 flex items-center justify-between text-[12px]'>
                    <span className='font-medium text-brand-text'>
                      {pricedSummary.discount.code}
                    </span>
                    <span translate='no' className='notranslate font-bold text-brand-text'>
                      −
                      {formatMatchdayMoney(
                        pricedSummary.discount.amount,
                        pricedSummary.currency,
                      )}
                    </span>
                  </div>
                )}
                {ticketLine ? (
                  <BlackFridayCheckoutGift className='mb-2 text-[12px]' />
                ) : null}
                <div className='flex items-center justify-between gap-3'>
                  <span className='font-mono text-[10px] tracking-wide text-muted-foreground'>
                    Total
                  </span>
                  <motion.span
                    key={pricedSummary ? pricedSummary.total.amount : total}
                    className='text-[20px] font-bold leading-none text-foreground'
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {summaryCurrencyMismatch ? (
                      <span className='text-[12px] font-semibold text-destructive'>
                        Mixed currencies
                      </span>
                    ) : (
                      formatMatchdayMoney(
                        pricedSummary ? pricedSummary.total.amount : total,
                        pricedSummary ? pricedSummary.currency : summaryCurrency,
                      )
                    )}
                  </motion.span>
                </div>
                {summaryCurrencyMismatch && (
                  <p className='mt-0.5 text-[10px] text-destructive'>
                    Your selections aren&apos;t all in the same currency — the
                    cart will block adding one of them until this is resolved.
                  </p>
                )}
                <p className='mt-0.5 text-[9px] text-muted-foreground'>
                  {sidebarSummary
                    ? 'Secure checkout'
                    : 'All fees included · Secure checkout'}
                </p>
              </div>


              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type='button'
                  onClick={() => void goToCheckout()}
                  className='block w-full rounded-full bg-primary px-4 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_var(--brand-glow)] transition-all hover:shadow-[0_0_20px_var(--brand-glow)]'
                >
                  Go to checkout
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
