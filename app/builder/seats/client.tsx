'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  SlidersHorizontal,
  Ticket,
  Users,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StadiumMap } from '@/components/seats/stadium-map'
import { SeatingPlanMap, type PlanInfo } from '@/components/seats/seating-plan-map'
import { usePlanThumb } from '@/components/seats/use-seating-plan'
import { useTeamHue } from '@/components/seats/use-team-hue'
import { SeatsFaq, SeatsRemarks, SimilarMatches } from '@/components/seats/seats-info-sections'
import { ListingCard } from '@/components/seats/listing-card'
import { TICKET_LISTINGS, type TicketListing } from '@/store/matchday'
import {
  useBuilderMatch,
  useBuilderMatchId,
} from '@/features/builder/use-builder-match'
import { builderStepHref, seatsHref } from '@/features/builder/enter'
import { TicketHeader } from '@/components/seats/ticket-header'
import { useLiveMatchCache } from '@/store/live-match-cache'
import {
  useTicketQuantity,
  quantityFromParams,
  quantityLabel,
  type QuantityChoice,
} from '@/store/ticket-quantity'
import { useCart } from '@/features/cart/context'
import { trackAddToCart } from '@/lib/analytics'
import { addMatchDayToCartApi, cartApiError } from '@/features/cart/api'
import { useMatchdayListings } from '@/features/matchday/hooks'
import { isMatchdayLive } from '@/features/matchday/config'
import { FreeEsimNote } from '@/components/free-esim/free-esim-note'
import { formatMatchdayMoney } from '@/features/matchday/format'
import {
  buildCategories,
  blockPrices,
  blockPricesFromListings,
  themeCategoryColors,
  listingInBlock,
  toSeatListing,
  type SeatListing,
} from '@/features/matchday/seats'

/* Buying needs a chosen category. With this false (one-click buying),
   Buy selects that listing's category for the buyer (map zone highlights,
   list narrows to it), marks the listing as the selected one, adds it to
   the cart and moves on to Extras — no separate Confirm press. Set to true
   to bring the Confirm step back. */
const REQUIRE_CATEGORY_CONFIRMATION = false
const PAGE_SIZE = 30

type Sort = 'price-asc' | 'price-desc' | 'qty'
type MapTab = 'zone' | 'block'

function mockToSeat(l: TicketListing): SeatListing {
  let h = 0
  for (const ch of l.cat) h = (h * 31 + ch.charCodeAt(0)) | 0
  return {
    id: l.id,
    isReal: false,
    categoryId: Math.abs(h) % 100000,
    categoryName: l.cat,
    categoryBlocks: [],
    blocks: l.block ? [l.block] : [],
    row: l.row ?? '',
    priceEach: l.priceEach,
    shownPrice: l.priceEach,
    fromPrice: l.priceEach,
    currency: null,
    qtyOptions: Array.from({ length: l.maxQty }, (_, j) => j + 1),
    available: l.maxQty,
    delivery: null,
    view: null,
    seatsTogether: null,
    singlesOnly: false,
    fansSide: null,
    instantDownload: null,
    notes: l.chips ?? [],
    homeEnd: false,
    hospitality: false,
  }
}

export function SeatsClient() {
  const match = useBuilderMatch()
  const matchId = useBuilderMatchId()
  const router = useRouter()
  const { addItem, removeTypeAndServer } = useCart()

  const [catId, setCatId] = useState<number | null>(null)
  const [block, setBlock] = useState<string | null>(null)
  // Quantity comes from the "How many tickets?" dialog shown before this
  // page (features/builder/enter.ts) and lives in the URL (?qty=2&together=1),
  // so it survives refresh and the buyer never picks it here. The pill in
  // the filter bar reopens the same dialog to change it.
  const searchParams = useSearchParams()
  const quantity = quantityFromParams(searchParams)
  const wantQty = quantity.qty
  const openQuantity = useTicketQuantity((s) => s.open)
  const [sort, setSort] = useState<Sort>('price-asc')
  const [mapTab, setMapTab] = useState<MapTab>('zone')
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  // Real seating plan: undefined while loading, null when there is none or
  // it can't be used (then the schematic oval is shown instead).
  const [planInfo, setPlanInfo] = useState<PlanInfo | null | undefined>(undefined)
  const onPlan = useCallback((info: PlanInfo | null) => setPlanInfo(info), [])
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const listingsRef = useRef<HTMLElement | null>(null)

  const live = isMatchdayLive()
  const eventId = live ? Number(match.id) || null : null
  const q = useMatchdayListings(eventId ? { event_id: eventId } : null, {
    enabled: live && eventId !== null,
  })
  const meta = q.data?.meta

  const listings: SeatListing[] = useMemo(() => {
    if (!live) return TICKET_LISTINGS.map(mockToSeat)
    return (q.data?.listings ?? [])
      .filter((l) => l.activated === 1 && l.price_details.price_per_ticket > 0)
      .map(toSeatListing)
      .filter((l) => l.qtyOptions.length > 0)
  }, [live, q.data])

  // Map colours themed on the home club (crest colour), shaded by price —
  // see themeCategoryColors in features/matchday/seats.ts.
  const cachedCrest = useLiveMatchCache((s) =>
    matchId ? s.events[matchId]?.team1.image : undefined,
  )
  const homeCrest = meta?.event?.team1?.image ?? cachedCrest ?? null
  const teamHue = useTeamHue(live ? homeCrest : null)
  const categories = useMemo(
    () => themeCategoryColors(buildCategories(listings, meta?.categories), teamHue),
    [listings, meta?.categories, teamHue],
  )
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )
  const currency = meta?.currency ?? listings[0]?.currency ?? null
  // "From" figure (ticket + third-party fee, no Golafly fee) — headers.
  const globalMin = listings.length
    ? Math.min(...listings.map((l) => l.fromPrice))
    : 0
  // The cheapest CHARGED price: only used to flag the "Lowest price" card.
  const lowestCharged = listings.length
    ? Math.min(...listings.map((l) => l.priceEach))
    : 0
  const blocks = useMemo(() => blockPrices(meta?.blocks), [meta?.blocks])
  // Price per block for the plan's bubbles — from the listings, not
  // meta.blocks (whose prices can disagree with the listings).
  const planBlocksByCat = planInfo?.blocksByCat
  const blockPriceMap = useMemo(
    () => blockPricesFromListings(listings, planBlocksByCat ?? new Map()),
    [listings, planBlocksByCat],
  )

  const getQty = (l: SeatListing) => {
    if (qtys[l.id] !== undefined && l.qtyOptions.includes(qtys[l.id]))
      return qtys[l.id]
    if (wantQty !== null && l.qtyOptions.includes(wantQty)) return wantQty
    if (wantQty !== null && quantity.qtyPlus) {
      const atLeast = l.qtyOptions.find((n) => n >= wantQty)
      if (atLeast !== undefined) return atLeast
    }
    return l.qtyOptions[0] ?? 1
  }

  const fitsQuantity = (l: SeatListing) => {
    if (wantQty === null) return true
    return quantity.qtyPlus
      ? l.qtyOptions.some((n) => n >= wantQty)
      : l.qtyOptions.includes(wantQty)
  }
  // "Seated together" is decided purely from backend fields on each
  // listing: `is_singles` / "Single Seats Only" → never together, and
  // `seats_together` ("Up To 4 Seats Together", "2 Seats Together") → the
  // largest group the seller guarantees side by side. A listing qualifies
  // only if that cap covers the number of tickets asked for.
  const seatsGroup = (l: SeatListing) => {
    if (l.singlesOnly) return false
    const cap = Number(l.seatsTogether?.match(/(\d+)\s*seats?\s*together/i)?.[1] ?? NaN)
    if (!Number.isFinite(cap)) return false
    return wantQty === null ? cap > 1 : cap >= wantQty
  }

  function changeQuantity() {
    if (!matchId) return
    openQuantity({
      matchId,
      title: `${match.home} vs ${match.away}`,
      initial: quantity,
      onContinue: (c: QuantityChoice) => {
        setQtys({})
        setPendingId(null)
        setVisible(PAGE_SIZE)
        router.replace(seatsHref(matchId, c), { scroll: false })
      },
    })
  }

  const filtered = useMemo(() => {
    const out = listings.filter((l) => {
      if (catId !== null && l.categoryId !== catId) return false
      if (block && !listingInBlock(l, block, planBlocksByCat?.get(l.categoryId))) return false
      if (!fitsQuantity(l)) return false
      if (quantity.seatedTogether && !seatsGroup(l)) return false
      return true
    })
    out.sort((a, b) =>
      sort === 'price-desc'
        ? b.priceEach - a.priceEach
        : sort === 'qty'
          ? b.available - a.available || a.priceEach - b.priceEach
          : a.priceEach - b.priceEach,
    )
    return out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, catId, block, wantQty, quantity.qtyPlus, quantity.seatedTogether, sort, planBlocksByCat])

  const hasFilters = catId !== null || block !== null
  const hospitality = categories.filter((c) => c.tier === 'hospitality')

  function reset() {
    setCatId(null)
    setBlock(null)
    setPendingId(null)
    setVisible(PAGE_SIZE)
  }
  function selectCategory(id: number | null) {
    setCatId(id)
    setBlock(null)
    setPendingId(null)
    setVisible(PAGE_SIZE)
  }

  async function addToCart(l: SeatListing) {
    const qty = getQty(l)
    if (!l.qtyOptions.includes(qty)) {
      toast.error('Please choose how many tickets you want.')
      return
    }
    setBuyingId(l.id)
    try {
      await removeTypeAndServer('tickets')
      const blockText = l.blocks.join(', ')
      const payload: Record<string, unknown> = l.isReal
        ? {
            isReal: true,
            matchId: match.id,
            eventId: l.eventId,
            listingId: l.listingId,
            quantity: qty,
            pricePerTicket: l.priceEach,
            currency: l.currency,
            categoryName: l.categoryName,
            block: blockText,
            row: l.row,
          }
        : {
            matchId: match.id,
            listingId: l.id,
            category: l.categoryName,
            block: blockText,
            row: l.row,
          }

      if (l.isReal && l.eventId && l.listingId) {
        try {
          const res = await addMatchDayToCartApi({
            event_id: String(l.eventId),
            listing_id: String(l.listingId),
            quantity: qty,
            event_name: `${match.home} vs ${match.away}`,
            home_team: match.home,
            away_team: match.away,
            category_name: l.categoryName,
            block: blockText,
            row: l.row,
            image: match.image,
            match_id: match.id,
          })
          const serverItem = res.data.items.find((i) => i.type === 'matchday')
          if (serverItem) payload.serverId = serverItem.id
        } catch (err) {
          toast.error(cartApiError(err))
          return
        }
      }

      const detail = [
        l.categoryName,
        blockText && `Block ${blockText}`,
        l.row && `Row ${l.row}`,
        `Qty ${qty}`,
      ]
        .filter(Boolean)
        .join(' · ')
      addItem(
        {
          key: `tickets:${match.id}`,
          type: 'tickets' as const,
          name: `${match.home} vs ${match.away}`,
          detail,
          price: l.priceEach,
          qty,
          image: match.image,
          href: builderStepHref('/builder/seats', matchId),
          checkoutPayload: payload,
        },
        { silent: true },
      )
      // Ad platforms: tickets are in the cart (only runs on landing sites
      // unless NEXT_PUBLIC_TRACK_MAIN_EVENTS=true; see lib/analytics.ts).
      trackAddToCart({
        value: l.priceEach * qty,
        currency: l.currency ?? currency ?? 'EUR',
        items: [
          {
            id: String(match.id),
            name: `${match.home} vs ${match.away}`,
            category: l.categoryName,
            price: l.priceEach,
            quantity: qty,
          },
        ],
      })
      toast.success('Tickets added to your cart')
      router.push(builderStepHref('/builder/extras', matchId))
    } finally {
      setBuyingId(null)
    }
  }

  function onBuy(l: SeatListing) {
    if (buyingId) return
    // No category chosen yet: choose this listing's category for the buyer
    // and ask them to confirm before anything reaches the cart.
    if (REQUIRE_CATEGORY_CONFIRMATION && catId !== l.categoryId) {
      setCatId(l.categoryId)
      setBlock(null)
      setPendingId(l.id)
      toast(`${l.categoryName} selected`, {
        description: 'Check the details, then press Confirm to continue.',
      })
      requestAnimationFrame(() =>
        cardRefs.current[l.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        }),
      )
      return
    }
    // One click: confirm this listing as the selected one (highlighted
    // while it's added) and go straight on.
    if (catId !== l.categoryId) {
      setCatId(l.categoryId)
      setBlock(null)
    }
    setPendingId(l.id)
    void addToCart(l)
  }

  const t1 = meta?.event?.team1
  const t2 = meta?.event?.team2
  const cached = useLiveMatchCache((s) => (matchId ? s.events[matchId] : undefined))
  const svgUrl = live ? (meta?.event?.svg_url ?? cached?.svg_url ?? null) : null
  const hasPlan = !!svgUrl && planInfo !== null
  // Mini map on each listing card, highlighting where the seats are.
  const planThumb = usePlanThumb(hasPlan ? svgUrl : null)
  const thumbFor = (l: (typeof listings)[number]) => {
    if (!planThumb) return undefined
    const keys = (
      l.blocks.length
        ? l.blocks
        : l.categoryBlocks.length
          ? l.categoryBlocks
          : (planBlocksByCat?.get(l.categoryId) ?? [])
    ).map((b) => b.trim().toUpperCase())
    const outline = [...new Set(keys)].map((k) => planThumb.outlines.get(k) ?? '').join('')
    return {
      src: planThumb.src,
      viewBox: planThumb.viewBox,
      outline,
      color: catById.get(l.categoryId)?.color ?? '#2563eb',
    }
  }
  // Categories with tickets that the plan doesn't draw (VIP packages, bars,
  // off-site hospitality…): listed under the map so they stay selectable.
  const offMap = useMemo(() => {
    if (!planInfo) return []
    return categories.filter((c) => {
      if (!c.listingCount || planInfo.blocksByCat.has(c.id)) return false
      return !listings.some(
        (l) =>
          l.categoryId === c.id &&
          [...l.blocks, ...l.categoryBlocks].some((b) => planInfo.blockKeys.has(b.trim().toUpperCase())),
      )
    })
  }, [planInfo, categories, listings])
  const shown = filtered.slice(0, visible)

  const mapPanel = (
    <div className='rounded-2xl border border-border bg-card p-3 sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='text-sm font-bold text-foreground'>Stadium map</h2>
        <div
          role='tablist'
          className='flex overflow-hidden rounded-lg border border-border text-xs font-semibold'
        >
          {(
            [
              ['zone', 'By zone'],
              ['block', 'By block'],
            ] as [MapTab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              role='tab'
              aria-selected={mapTab === k}
              onClick={() => setMapTab(k)}
              className={cn(
                'px-3 py-1.5 transition-colors',
                mapTab === k
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasPlan && svgUrl && (
        <>
          <SeatingPlanMap
            svgUrl={svgUrl}
            mode={mapTab}
            categories={categories}
            blockPrices={blockPriceMap}
            activeCatId={catId}
            activeBlock={block}
            onSelectCategory={selectCategory}
            onSelectBlock={(b) => {
              // A block can hold listings of more than one category, so the
              // block alone is the filter.
              setCatId(null)
              setBlock(b)
              setPendingId(null)
              setVisible(PAGE_SIZE)
            }}
            onPlan={onPlan}
            currency={currency}
          />
          <p className='mt-2 text-center text-[11px] text-muted-foreground'>
            {mapTab === 'zone'
              ? 'Tap a block to see every ticket in its area.'
              : 'Tap a block to see the tickets in that block.'}{' '}
            Prices are the cheapest ticket per block;{' '}
            <span className='inline-block size-2 rounded-full bg-green-600 align-middle' /> lowest
            price.
          </p>
        </>
      )}

      {!hasPlan && mapTab === 'zone' && (
        <>
          <StadiumMap
            categories={categories.filter((c) => c.listingCount > 0)}
            activeId={catId}
            onSelect={selectCategory}
            currency={currency}
          />
          <p className='mt-2 text-center text-[11px] text-muted-foreground'>
            Schematic layout built from the available categories. Tap a zone to
            filter. Exact blocks are shown on each listing.
          </p>
        </>
      )}

      {!hasPlan && mapTab === 'block' && (
        <div className='max-h-[360px] space-y-3 overflow-y-auto pr-1'>
          {blocks.length === 0 && (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              No block data for this fixture.
            </p>
          )}
          {categories.map((c) => {
            const bs = blocks.filter((b) => b.category_id === c.id)
            if (!bs.length) return null
            return (
              <div key={c.id}>
                <p className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground'>
                  <span
                    className='size-2.5 rounded-sm'
                    style={{ background: c.color }}
                  />
                  {c.name}
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {bs.map((b) => (
                    <button
                      key={b.block}
                      type='button'
                      aria-pressed={block === b.block}
                      onClick={() => {
                        setCatId(c.id)
                        setBlock(block === b.block ? null : b.block)
                        setVisible(PAGE_SIZE)
                      }}
                      className={cn(
                        'rounded-lg border px-2 py-1 text-left text-[11px] leading-tight transition-colors',
                        block === b.block
                          ? 'border-primary bg-primary/15 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                      )}
                    >
                      <b className='block text-foreground'>{b.block}</b>
                      {formatMatchdayMoney(
                        typeof b.price_from === 'number'
                          ? b.price_from
                          : b.min_price,
                        currency ?? 'EUR',
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend: every category with its colour and cheapest price */}
      <div className='mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2'>
        {categories.map((c) => (
          <button
            key={c.id}
            type='button'
            aria-pressed={catId === c.id}
            disabled={c.listingCount === 0}
            onClick={() => selectCategory(catId === c.id ? null : c.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
              c.listingCount === 0 && 'cursor-default opacity-50',
              catId === c.id
                ? 'bg-primary/15 ring-1 ring-primary/50'
                : c.listingCount > 0 && 'hover:bg-muted',
            )}
          >
            <span
              className='size-3 shrink-0 rounded-sm'
              style={{ background: c.color }}
            />
            <span className='min-w-0 flex-1 truncate text-foreground'>
              {c.name}
            </span>
            <span className='shrink-0 text-muted-foreground'>
              {c.listingCount > 0 && Number.isFinite(c.minPrice)
                ? formatMatchdayMoney(c.minPrice, currency ?? 'EUR')
                : 'No tickets'}
            </span>
          </button>
        ))}
      </div>
      {hasPlan && offMap.length > 0 && (
        <div className='mt-3 rounded-lg border border-dashed border-border p-2.5'>
          <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
            Not shown on the plan
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {offMap.map((c) => (
              <button
                key={c.id}
                type='button'
                aria-pressed={catId === c.id}
                onClick={() => selectCategory(catId === c.id ? null : c.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                  catId === c.id
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                )}
              >
                <span className='size-2 rounded-sm' style={{ background: c.color }} />
                <span className='text-foreground'>{c.name}</span>
                {formatMatchdayMoney(c.minPrice, currency ?? 'EUR')}
              </button>
            ))}
          </div>
        </div>
      )}
      {!hasPlan && hospitality.length > 0 && (
        <p className='mt-2 text-[11px] text-muted-foreground'>
          Hospitality categories are not drawn on the map — select them from the
          list above.
        </p>
      )}
    </div>
  )

  return (
    <div className='min-h-screen bg-background'>
      <div className='page-container py-8 sm:py-10'>
        <TicketHeader
          home={match.home}
          away={match.away}
          homeCrest={t1?.image ?? cached?.team1.image}
          awayCrest={t2?.image ?? cached?.team2.image}
          homeId={cached?.team1.id ?? t1?.id}
          awayId={cached?.team2.id ?? t2?.id}
          competition={match.competition ?? cached?.tour.name}
          competitionId={cached?.tour.id}
          dateISO={match.dateISO}
          dateLabel={match.date}
          venueName={cached?.venue.venue_name ?? match.venue.split(',')[0]}
          city={match.venueCity}
          country={match.venueCountry}
          // The cheapest ticket actually listed, so the header "From" always
          // matches a real listing (meta.min_price can include other fees).
          minPrice={
            listings.length
              ? globalMin
              : (meta?.min_price_from ?? meta?.min_price ?? match.priceFrom)
          }
          currency={meta?.currency ?? match.priceCurrency ?? null}
          onFromClick={() =>
            listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        />

        <FreeEsimNote venueCountry={match.venueCountry} className='mt-4' />

        {/* Filters */}
        <div className='mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4'>
          <div className='flex flex-wrap items-center gap-x-5 gap-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={changeQuantity}
                aria-label={`${quantityLabel(quantity)} — change quantity`}
                className='inline-flex h-9 items-center gap-2 rounded-full bg-ticket px-4 text-[13px] font-semibold text-ticket-foreground transition-opacity hover:opacity-90'
              >
                <Ticket className='size-3.5' />
                {quantityLabel(quantity)}
                <ChevronDown className='size-3.5 opacity-80' />
              </button>
              {quantity.seatedTogether && (
                <span className='inline-flex h-9 items-center gap-1.5 rounded-full bg-ticket-soft px-3 text-[12.5px] font-semibold text-ticket-soft-foreground'>
                  <Users className='size-3.5' /> Seated together
                </span>
              )}
            </div>
            <label className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
              Category
              <select
                value={catId ?? ''}
                onChange={(e) =>
                  selectCategory(e.target.value ? Number(e.target.value) : null)
                }
                className='h-8 max-w-[220px] rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary'
              >
                <option value=''>All areas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='flex items-center gap-2 text-xs font-semibold text-muted-foreground sm:ml-auto'>
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className='h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary'
              >
                <option value='price-asc'>Lowest price</option>
                <option value='price-desc'>Highest price</option>
                <option value='qty'>Most tickets</option>
              </select>
            </label>
          </div>
        </div>

        {/* Mobile: the map is always shown, above the listings */}
        <div className='mt-4 lg:hidden'>{mapPanel}</div>

        <div className='mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start'>
          {/* Listings */}
          <section
            ref={listingsRef}
            aria-label='Ticket listings'
            className='min-w-0 scroll-mt-24'
          >
            <div className='mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
              <span className='font-semibold text-foreground'>
                {filtered.length} listing{filtered.length === 1 ? '' : 's'}{' '}
                found
              </span>
              {hasFilters && (
                <button
                  onClick={reset}
                  className='inline-flex items-center gap-1 font-semibold text-brand-text underline underline-offset-2'
                >
                  <X className='size-3' /> Clear filters
                </button>
              )}
              {meta && (
                <span>
                  From{' '}
                  <b className='text-foreground'>
                    {formatMatchdayMoney(
                      meta.min_price_from ?? meta.min_price,
                      currency ?? 'EUR',
                    )}
                  </b>
                </span>
              )}
              {live && (
                <button
                  onClick={() => q.refetch()}
                  disabled={q.isFetching}
                  className='ml-auto inline-flex items-center gap-1 font-semibold text-brand-text disabled:opacity-60'
                >
                  <RefreshCw
                    className={cn('size-3', q.isFetching && 'animate-spin')}
                  />{' '}
                  Refresh
                  {q.dataUpdatedAt ? (
                    <span className='font-normal text-muted-foreground'>
                      ·{' '}
                      {new Date(q.dataUpdatedAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : null}
                </button>
              )}
            </div>

            {live && q.isLoading && (
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-16 text-center'>
                <Loader2 className='size-5 animate-spin text-brand-text' />
                <p className='text-sm text-muted-foreground'>
                  Loading live ticket inventory…
                </p>
              </div>
            )}

            {live && !q.isLoading && q.isError && (
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-14 text-center'>
                <AlertTriangle className='size-5 text-amber-500' />
                <p className='text-sm font-semibold text-foreground'>
                  Live ticket inventory isn&apos;t available right now
                </p>
                <p className='max-w-xs text-xs text-muted-foreground'>
                  {q.error?.message ??
                    'The ticketing service could not be reached.'}
                </p>
                <button
                  onClick={() => q.refetch()}
                  className='mt-1 text-xs font-semibold text-brand-text underline underline-offset-2'
                >
                  Try again
                </button>
              </div>
            )}

            {(!live || (!q.isLoading && !q.isError)) && (
              <>
                {listings.length === 0 && (
                  <p className='rounded-2xl border border-border bg-card py-14 text-center text-sm text-muted-foreground'>
                    No tickets are listed for this fixture yet.
                  </p>
                )}
                {listings.length > 0 && filtered.length === 0 && (
                  <div className='rounded-2xl border border-border bg-card py-14 text-center'>
                    <SlidersHorizontal className='mx-auto mb-2 size-5 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>
                      {hasFilters
                        ? 'No listings match your filters.'
                        : `No listings can seat ${quantityLabel(quantity).toLowerCase()}${quantity.seatedTogether ? ' together' : ''}.`}
                    </p>
                    <div className='mt-2 flex justify-center gap-4'>
                      {hasFilters && (
                        <button
                          onClick={reset}
                          className='text-xs font-semibold text-brand-text underline underline-offset-2'
                        >
                          Reset filters
                        </button>
                      )}
                      {wantQty !== null && (
                        <button
                          onClick={changeQuantity}
                          className='text-xs font-semibold text-brand-text underline underline-offset-2'
                        >
                          Change quantity
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className='space-y-3'>
                  {shown.map((l) => (
                    <ListingCard
                      key={l.id}
                      ref={(el) => {
                        cardRefs.current[l.id] = el
                      }}
                      listing={l}
                      category={catById.get(l.categoryId)}
                      qty={getQty(l)}
                      onQty={(n) => setQtys((p) => ({ ...p, [l.id]: n }))}
                      isLowest={l.priceEach === lowestCharged}
                      selected={pendingId === l.id}
                      confirming={
                        REQUIRE_CATEGORY_CONFIRMATION &&
                        pendingId === l.id &&
                        catId === l.categoryId
                      }
                      busy={buyingId === l.id}
                      onBuy={() => onBuy(l)}
                      homeTeam={match.home}
                      thumb={thumbFor(l)}
                    />
                  ))}
                </div>
                {filtered.length > shown.length && (
                  <div className='mt-5 flex justify-center'>
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className='rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50'
                    >
                      Show {Math.min(PAGE_SIZE, filtered.length - shown.length)}{' '}
                      more ({filtered.length - shown.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Map (desktop) */}
          <aside className='hidden lg:sticky lg:top-24 lg:block'>
            {mapPanel}
          </aside>
        </div>

        <SeatsFaq
          home={match.home}
          away={match.away}
          dateISO={match.dateISO}
          venueName={cached?.venue.venue_name ?? match.venue.split(',')[0]}
          city={match.venueCity}
          listings={listings}
          categories={categories}
          currency={currency}
        />
        {live && (
          <SimilarMatches
            eventId={eventId}
            homeId={cached?.team1.id ?? t1?.id}
            awayId={cached?.team2.id ?? t2?.id}
            tourId={cached?.tour.id ?? meta?.event?.tour?.id}
            tourName={match.competition ?? cached?.tour.name}
          />
        )}
        <SeatsRemarks listings={listings} />
      </div>
    </div>
  )
}
