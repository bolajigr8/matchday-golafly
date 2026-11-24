'use client'

import { PromoTag, useCardPromo } from '@/components/promo/promo-price'
import { PillarBadge } from '@/components/brand/pillar-badge'
import { matchPath } from '@/lib/slug'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isMatchdayLive } from '@/features/matchday/config'
import {
  CLUBS,
  markFlyerMissing,
  useFlyers,
  type Club,
} from '@/features/matchday/flyers'
import { useMatchdayEvents, useMatchdayTeams } from '@/features/matchday/hooks'
import { buildMatchesSearchUrl, pickTeam } from '@/features/matchday/resolve'
import { useMatchesSearchNavigate } from '@/features/matchday/use-matches-search'
import type { MatchdayEvent } from '@/features/matchday/types'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { MatchSearch } from '@/components/shared/match-search'
import { FIXTURES_ANCHOR, useLandingScope } from '@/features/landing/scope'
import { seatsHref } from '@/features/builder/enter'
import { mainUrl } from '@/lib/sites'
import {
  TeamCrest,
  eventDateParts,
  ticketMoney,
} from '@/components/tickets/primitives'
import { HOME_EVENTS_PAGE_SIZE } from './popular-matches-section'
import { compareEventDates, eventTime } from '@/features/matchday/format'
import { eventFromPrice } from '@/features/price-breakdown/helpers'

/* Home hero, direction "H2": a light, search-first page (xl layout below).

   ┌──────────────────────────────┬─────────────────────────────┐
   │ ● {LEAGUE} TICKETS …         │ FEATURED            All →   │
   │ YOUR ENTIRE                  │ ┌──────────┐ ┌────────────┐ │
   │ [MATCHDAY]                   │ │          │ │  match 2   │ │
   │ IN ONE PLACE                 │ │ match 1  │ └────────────┘ │
   │ subtitle                     │ │  (big)   │ ┌────────────┐ │
   │ [ search ····· date · Find ] │ │          │ │  match 3   │ │
   │ Trending (chips)             │ └──────────┘ └────────────┘ │
   │ ✓ guarantee ✓ sellers ✓ 24/7 │                             │
   └──────────────────────────────┴─────────────────────────────┘

   The mosaic shows three real upcoming fixtures, all from the GET /events
   page the home already loads for Popular matches and Upcoming fixtures
   (same query key, so no request of its own). Fixtures of a club we have
   a flyer for come first, on that flyer; the rest are the next bookable
   events (venue photo or the home club's squad photo; a crest-on-ink tile
   when there is no image). No per-club /events calls here: this is the
   xl LCP element and must not queue behind them. When the API is off
   (isMatchdayLive() false) or nothing comes back, the empty slots become
   static club tiles built from /public/flyers that link to that club's
   fixtures.

   Which flyers exist comes from useFlyers (one GET /api/flyers listing,
   read from the folder at build time). A club with no local file simply
   has no flyer.

   The two-column split only starts at xl. The inline search needs a
   ~620px column to show its placeholder in full, which a half-width
   column at lg doesn't give it. Below xl the copy and search run the full
   width and the tiles sit under them in one row: a snap row on phones
   (1¼ tiles visible), 3 across from md. */

const TILE_COUNT = 3

/** Same filters (so the same react-query key) as the home "Popular
 *  matches" All tab and "Upcoming fixtures": one GET /events serves all
 *  three. */
const HOME_EVENTS_FILTERS = { per_page: HOME_EVENTS_PAGE_SIZE }

/** Clubs used for the static tiles, in order of preference. These are
 *  `file` keys from CLUBS; a club whose image is missing (or fails to
 *  load) drops out and the next one takes its place. */
const STATIC_CLUBS = [
  'realmadrid',
  'barcelona',
  'mancity',
  'liverpool',
  'arsenal',
  'bayern',
  'chelsea',
]

/** Claims already made elsewhere on the site (ticket header, about, FAQ). */
const TRUST = ['150% order guarantee', 'Verified sellers', '24/7 support']

export function HeroSection() {
  // On a landing page (features/landing/scope.tsx) the search stays on the
  // page and covers one competition; null on the main site.
  const scope = useLandingScope()
  const mainSearch = useMatchesSearchNavigate()
  const onSearch = scope ? scope.search : mainSearch

  return (
    // overflow-x-clip (not overflow-hidden): the search suggestions list may
    // drop below the section on desktop and must not be cut off.
    <section
      aria-labelledby='home-hero-title'
      className='relative isolate overflow-x-clip bg-background'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute inset-0 bg-grid-fine grid-fade' />
        <div className='absolute top-[6%] -right-56 hidden size-[640px] rounded-full bg-primary/15 blur-[120px] lg:block dark:bg-primary/10' />
      </div>

      {/* At xl the copy column is (1216 − 48) × 1.2 / 2.2 ≈ 637px, which
          leaves the inline search's query field ~200px of text room. */}
      <div className='page-container grid items-center gap-10 pt-10 pb-14 sm:pt-14 sm:pb-20 lg:gap-12 xl:grid-cols-[1.2fr_1fr] xl:pt-20 xl:pb-24'>
        {/* ── Copy + search ── */}
        <div className='min-w-0'>
          {/* Static copy: a fetched count here would change the line count
              on phones and shift the search box. StatsBand shows the count. */}
          {scope ? (
            <p className='flex items-start gap-2.5 font-mono text-[11px] uppercase leading-[1.5] tracking-[0.22em] text-foreground/70'>
              <span
                aria-hidden
                className='mt-[0.45em] size-1.5 shrink-0 rounded-full bg-primary ring-1 ring-brand-edge dark:ring-0'
              />
              <span>{`${scope.site.name} tickets`}</span>
            </p>
          ) : (
            <PillarBadge pillar='live' />
          )}

          <h1
            id='home-hero-title'
            className='mt-5 font-heading text-[clamp(40px,6vw,80px)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-foreground xl:text-[clamp(56px,5.6vw,80px)]'
          >
            <span className='block'>{scope ? scope.site.name : 'Your entire'}</span>
            <span className='block'>
              <span className='hl-neon'>{scope ? 'Matches' : 'Matchday'}</span>
            </span>
            <span className='block'>in one place</span>
          </h1>

          <p className='mt-6 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            {scope ? `Verified ${scope.site.name} tickets` : 'Verified tickets for the biggest games'}
            , plus flights, stays and eSIM, all booked in one checkout.
          </p>

          <MatchSearch layout='inline' onSearch={onSearch} className='mt-8' />

          <ul className='mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-foreground/75'>
            {TRUST.map((label) => (
              <li key={label} className='inline-flex items-center gap-2'>
                <span
                  aria-hidden
                  className='flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'
                >
                  <Check className='size-3' strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Featured matches ── */}
        <FeaturedMosaic />
      </div>
    </section>
  )
}

/* ── Mosaic ─────────────────────────────────────────────────────────── */

type EventTileData = {
  kind: 'event'
  key: string
  event: MatchdayEvent
  image: string | null
  /** Set when `image` is one of our flyers (a load error marks it missing). */
  flyer?: string
}

type ClubTileData = {
  kind: 'club'
  key: string
  club: string
  teamId?: number
  image: string
  href: string
}

type TileData = EventTileData | ClubTileData

/** Bookable (priced) fixtures first, then the soonest. */
function rankEvents(a: MatchdayEvent, b: MatchdayEvent) {
  return (
    Number(b.min_price?.price != null) - Number(a.min_price?.price != null) ||
    compareEventDates(a.date, b.date)
  )
}

/** Grid / snap-row slot. Portrait in the phone and tablet row; square at
 *  lg so the full-width row stays short enough to sit near the fold. The
 *  first tile spans both rows of the xl mosaic. */
function slotClass(index: number) {
  return cn(
    'relative aspect-[4/5] w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[calc((100%_-_1.5rem)/3)] lg:aspect-square',
    'xl:aspect-auto xl:w-auto xl:min-h-0',
    index === 0 && 'xl:row-span-2',
  )
}

/* `sizes` for the flyer covers. Flyers are 16:9 but the tiles are portrait
   or square and object-cover fills them by height, so each value is the
   width the image needs to cover its tile (tile height × 16/9), not the
   tile's own width. Otherwise the browser would pick a file that is too
   small and the cover would look soft.
     < 640   78% of the row, 4:5 → about 162vw
     sm      46%, 4:5           → about 96vw
     md      a third, 4:5       → about 70vw
     lg      a third, square    → about 56vw
     xl      mosaic 500px tall: big tile 500px high (≈890px wide cover),
             small tiles ≈244px high (≈440px) */
const FLYER_SIZES_ROW =
  '(min-width: 1024px) 56vw, (min-width: 768px) 70vw, (min-width: 640px) 96vw, 162vw'
const FLYER_SIZES_BIG = `(min-width: 1280px) 890px, ${FLYER_SIZES_ROW}`
const FLYER_SIZES_SMALL = `(min-width: 1280px) 440px, ${FLYER_SIZES_ROW}`

function FeaturedMosaic() {
  const live = isMatchdayLive()
  const reduce = useReducedMotion()
  // `srcFor` changes whenever the set of available flyers changes (it is
  // memoized on the underlying map in flyers.ts), so it is a valid dep.
  const { ready: flyersReady, srcFor } = useFlyers(live)
  const teamsQuery = useMatchdayTeams()
  const slugs = useCatalogueSlugs()
  const scope = useLandingScope()
  // Landing: the same request the page already made for this competition.
  const homeEvents = useMatchdayEvents(
    scope ? (scope.eventFilters ?? {}) : HOME_EVENTS_FILTERS,
    { enabled: live && (!scope || !!scope.eventFilters) },
  )
  const clubFiles: readonly string[] = scope ? scope.site.clubs : STATIC_CLUBS
  const upsert = useLiveMatchCache((s) => s.upsert)
  // Fixed for the life of the page: keeps render pure.
  const [now] = React.useState(() => Date.now())

  const teams = teamsQuery.data
  const homeEventList = homeEvents.data?.events

  /** team_id → flyer src, for every club that has a local image and
   *  resolves to a team. */
  const flyerByTeam = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const c of CLUBS) {
      const src = srcFor(c.file)
      if (!src) continue
      const t = pickTeam(teams, c.name)
      if (t && !m.has(t.team_id)) m.set(t.team_id, src)
    }
    return m
  }, [teams, srcFor])

  const eventTiles = React.useMemo<EventTileData[]>(() => {
    if (!live) return []
    const pool = (homeEventList ?? [])
      .filter((e) => !e.postponed && eventTime(e.date) > now)
      .sort(rankEvents)
    const out: EventTileData[] = []
    const used = new Set<number>()
    const usedFlyers = new Set<string>()

    // Flyer clubs first, each flyer at most once.
    for (const e of pool) {
      if (out.length >= TILE_COUNT) break
      const flyer = [
        flyerByTeam.get(e.team1.id),
        flyerByTeam.get(e.team2.id),
      ].find((f): f is string => !!f && !usedFlyers.has(f))
      if (!flyer) continue
      used.add(e.id)
      usedFlyers.add(flyer)
      out.push({
        kind: 'event',
        key: `flyer-${e.id}`,
        event: e,
        image: flyer,
        flyer,
      })
    }

    for (const e of pool) {
      if (out.length >= TILE_COUNT) break
      if (used.has(e.id)) continue
      used.add(e.id)
      out.push({
        kind: 'event',
        key: `event-${e.id}`,
        event: e,
        // tour.image is the competition logo, not a photo, so it is not
        // used as a cover; team.image is the club's squad photo.
        image: e.venue.venue_image || e.team1.image || e.team2.image || null,
      })
    }
    return out
  }, [live, homeEventList, flyerByTeam, now])

  const clubTiles = React.useMemo<ClubTileData[]>(() => {
    const usedFlyers = new Set(eventTiles.map((t) => t.flyer).filter(Boolean))
    return clubFiles.map((file) => CLUBS.find((c) => c.file === file))
      .map((c) => (c ? { club: c, src: srcFor(c.file) } : null))
      .filter(
        (x): x is { club: Club; src: string } =>
          !!x && !!x.src && !usedFlyers.has(x.src),
      )
      .map(({ club, src }): ClubTileData => {
        const team = pickTeam(teams, club.name)
        return {
          kind: 'club',
          key: `club-${src}`,
          club: club.name,
          teamId: team?.team_id,
          image: src,
          // The club's own page (readable URL) when it's in the catalogue.
          // On a landing page that page is on the main site.
          href: scope
            ? team
              ? scope.teamHref({ team_id: team.team_id, name: team.name })
              : mainUrl(buildMatchesSearchUrl({ q: club.name }))
            : team
              ? slugs.teamPath(team.team_id, team.name)
              : buildMatchesSearchUrl({ q: club.name }),
        }
      })
  }, [eventTiles, srcFor, teams, slugs, scope, clubFiles])

  // Wait until the flyer picks are known (events, teams and the flyer
  // listing) before showing anything, so tiles never swap from fallback
  // events to flyers in front of the visitor. A failed GET /teams only
  // means no flyer picks. The flyer listing is one same-origin request
  // to /api/flyers and takes no API connection.
  const settled =
    !live ||
    (!homeEvents.isLoading && (!!teams || teamsQuery.isError) && flyersReady)
  const tiles: TileData[] | null = settled
    ? [...eventTiles, ...clubTiles].slice(0, TILE_COUNT)
    : null

  if (tiles && tiles.length === 0) return null

  return (
    <div className='min-w-0'>
      <div className='mb-2 flex items-center justify-between gap-4 xl:mb-4'>
        <h2 className='inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/70'>
          <span aria-hidden className='h-px w-5 bg-foreground/30' />
          Featured
        </h2>
        <Link
          href={scope ? `#${FIXTURES_ANCHOR}` : '/matches'}
          className='group inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
        >
          All fixtures
          <ArrowRight
            aria-hidden
            className='size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5'
          />
        </Link>
      </div>

      <ul
        aria-busy={!tiles}
        aria-label='Featured matches'
        className={cn(
          '-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-2 scrollbar-hide',
          'sm:-mx-6 sm:scroll-px-6 sm:px-6',
          'xl:mx-0 xl:grid xl:h-[500px] xl:grid-cols-[1.2fr_1fr] xl:grid-rows-2 xl:overflow-visible xl:p-0',
        )}
      >
        {tiles
          ? tiles.map((tile, i) => (
              <motion.li
                key={tile.key}
                className={slotClass(i)}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {tile.kind === 'event' ? (
                  <EventTile tile={tile} big={i === 0} onOpen={upsert} />
                ) : (
                  <ClubTile tile={tile} big={i === 0} />
                )}
              </motion.li>
            ))
          : Array.from({ length: TILE_COUNT }, (_, i) => (
              <li
                key={i}
                aria-hidden
                className={cn(
                  slotClass(i),
                  'rounded-[20px] bg-muted motion-safe:animate-pulse',
                )}
              />
            ))}
      </ul>
    </div>
  )
}

/* ── Tiles ──────────────────────────────────────────────────────────── */

const tileLink =
  'group relative block size-full overflow-hidden rounded-[20px] bg-band-ink text-white ring-1 ring-black/5 transition duration-200 hover:shadow-[var(--lift-3)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:ring-white/10'

const tileImage =
  'absolute inset-0 size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]'

function TileChrome({ chip, big }: { chip: string; big: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t',
          // Full height on both: the meta line sits well up the tile and
          // must stay legible over white kits. Small tiles carry the same
          // text block in less height, so their scrim stays darker.
          big
            ? 'h-full from-black/90 via-black/60 to-transparent'
            : 'h-full from-black/90 via-black/65 to-black/15',
        )}
      />
      <span
        className={cn(
          'absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] uppercase leading-none tracking-[0.14em] text-white backdrop-blur-md sm:top-4 sm:left-4',
          big && 'xl:top-5 xl:left-5',
        )}
      >
        {chip}
      </span>
    </>
  )
}

function tileBody(big: boolean) {
  return cn('absolute inset-x-0 bottom-0 p-4 sm:p-5', big && 'xl:p-6')
}

function tileTitle(big: boolean) {
  return cn(
    'mt-2 font-heading font-bold leading-[1.04] tracking-[-0.02em] text-balance text-white',
    'text-[22px] md:text-[20px] lg:text-[22px]',
    big ? 'xl:text-[30px]' : 'xl:text-[19px]',
  )
}

const tileMeta =
  'truncate font-mono text-[11px] uppercase tracking-[0.14em] text-white/90'

function TilePill({
  children,
  big,
}: {
  children: React.ReactNode
  big: boolean
}) {
  return (
    <span
      className={cn(
        'mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground',
        big && 'xl:mt-5 xl:h-10 xl:px-5 xl:text-[14px]',
      )}
    >
      {children}
      <ArrowRight
        aria-hidden
        className='size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5'
      />
    </span>
  )
}

/** Cover image for a tile. Our flyers (/public/flyers, 1200×675 PNGs of
 *  about 1.3 MB each) go through next/image, so the browser gets a resized
 *  WebP. FTN CDN photos stay a plain <img>, as they do everywhere
 *  else in the app. All three hero tiles are on the first screen from
 *  tablet width up, and the browser may pick any of them as the page's
 *  largest paint (Next logged the 2nd and 3rd as LCP while they were lazy).
 *  So all load eagerly; the biggest also asks for high priority. */
function TileImage({
  src,
  local,
  big,
  onError,
}: {
  src: string
  /** True for one of our own /public assets. */
  local: boolean
  big: boolean
  onError: () => void
}) {
  const loading = 'eager'
  const fetchPriority = big ? 'high' : undefined

  if (local) {
    return (
      <Image
        src={src}
        alt=''
        fill
        sizes={big ? FLYER_SIZES_BIG : FLYER_SIZES_SMALL}
        loading={loading}
        fetchPriority={fetchPriority}
        draggable={false}
        onError={onError}
        className={tileImage}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=''
      loading={loading}
      fetchPriority={fetchPriority}
      decoding='async'
      draggable={false}
      onError={onError}
      className={tileImage}
    />
  )
}

/** Crest-on-ink cover for a tile without a usable photo. */
function InkCover({ crests }: { crests: { id?: number; name: string }[] }) {
  return (
    <div aria-hidden className='absolute inset-0 bg-band-ink'>
      <div
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(120% 70% at 85% 0%, color-mix(in oklch, var(--brand) 24%, transparent), transparent 62%)',
        }}
      />
      <div className='absolute inset-x-0 top-0 bottom-[46%] flex items-center justify-center gap-3'>
        {crests.map((c, i) => (
          <React.Fragment key={`${c.name}-${i}`}>
            {i > 0 && (
              <span className='font-mono text-[11px] uppercase tracking-[0.2em] text-white/50'>
                vs
              </span>
            )}
            <TeamCrest
              teamId={c.id}
              name={c.name}
              className='size-14 lg:size-16'
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function EventTile({
  tile,
  big,
  onOpen,
}: {
  tile: EventTileData
  big: boolean
  onOpen: (event: MatchdayEvent) => void
}) {
  const { event, image, flyer } = tile
  const scope = useLandingScope()
  const [broken, setBroken] = React.useState(false)
  const p = eventDateParts(event.date)
  const price = eventFromPrice(event.min_price)
  const city = event.venue.venue_city_name || event.venue.venue_country_name
  // Match promo (Admin → Match Promo): tag + crossed-out price on the pill.
  const deal = useCardPromo(price)

  return (
    <Link
      href={scope ? seatsHref(String(event.id)) : matchPath(event)}
      onClick={(e) => {
        if (scope) {
          // Quantity dialog, then the Seats step, on this same hostname.
          e.preventDefault()
          scope.openMatch(event, 'hero')
        } else onOpen(event)
      }}
      className={tileLink}
    >
      {image && !broken ? (
        <TileImage
          src={image}
          local={!!flyer}
          big={big}
          onError={() => {
            // A broken flyer drops out of the featured picks entirely.
            if (flyer) markFlyerMissing(flyer)
            setBroken(true)
          }}
        />
      ) : (
        <InkCover
          crests={[
            { id: event.team1.id, name: event.team1.name },
            { id: event.team2.id, name: event.team2.name },
          ]}
        />
      )}
      <TileChrome chip={event.tour.name} big={big} />

      <div className={tileBody(big)}>
        {deal && (
          <div className='mb-2'>
            <PromoTag deal={deal} />
          </div>
        )}
        <p className={tileMeta}>
          {p.weekday} {p.day} {p.month} · {p.time}
          {city && (
            <span
              className={big ? undefined : 'xl:hidden'}
            >{` · ${city}`}</span>
          )}
        </p>
        <h3 className={tileTitle(big)}>
          <span className='block'>{event.team1.name}</span>
          <span className='block'>
            <span className='mr-1.5 font-mono text-[0.5em] font-medium uppercase tracking-[0.12em] text-white/80'>
              vs
            </span>
            {event.team2.name}
          </span>
        </h3>
        {price != null ? (
          <TilePill big={big}>
            <span className='font-normal opacity-80'>From</span>
            {deal && (
              <s className='font-normal opacity-70 decoration-[1.5px]'>
                <span className='sr-only'>was </span>
                {ticketMoney(price, event.min_price.currency_code)}
              </s>
            )}
            {deal && <span className='sr-only'>now </span>}
            {ticketMoney(deal ? deal.price : price, event.min_price.currency_code)}
          </TilePill>
        ) : (
          <TilePill big={big}>See tickets</TilePill>
        )}
      </div>
    </Link>
  )
}

function ClubTile({ tile, big }: { tile: ClubTileData; big: boolean }) {
  const [broken, setBroken] = React.useState(false)

  return (
    <Link href={tile.href} className={tileLink}>
      {!broken ? (
        <TileImage
          src={tile.image}
          local
          big={big}
          onError={() => {
            markFlyerMissing(tile.image)
            setBroken(true)
          }}
        />
      ) : (
        <InkCover crests={[{ id: tile.teamId, name: tile.club }]} />
      )}
      <TileChrome chip='Featured club' big={big} />

      <div className={tileBody(big)}>
        <p className={tileMeta}>Upcoming fixtures</p>
        <h3 className={tileTitle(big)}>{tile.club}</h3>
        <TilePill big={big}>See matches</TilePill>
      </div>
    </Link>
  )
}
