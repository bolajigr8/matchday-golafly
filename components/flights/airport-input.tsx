// 'use client'

// import { useEffect, useRef, useState, useCallback } from 'react'
// import { createPortal } from 'react-dom'
// import { MapPin, Loader2, LocateFixed } from 'lucide-react'
// import { toast } from 'sonner'
// import { cn } from '@/lib/utils'
// import { usePlaceSuggestions } from '@/features/flights/hooks'
// import { getNearbyPlaces } from '@/features/flights/api'
// import { reverseGeocodeCountry } from '@/features/flights/geocode'
// import {
//   findNearestAirport,
//   airportToSuggestion,
// } from '@/features/flights/nearest-airport'
// import { haversineKm } from '@/lib/geo'
// import type { PlaceSuggestion } from '@/features/flights/types'

// /**
//  * Sanity bound on the name-based fallback lookup. Anything further than
//  * this from the person's actual coordinates is a same-name collision, not
//  * a nearby airport (e.g. reverse-geocoding lands on a locality whose name
//  * also matches a same-named place on another continent).
//  */
// const MAX_NEARBY_AIRPORT_KM = 1000

// interface AirportInputProps {
//   value: string
//   onChange: (iataCode: string) => void
//   label: string
//   placeholder?: string
//   /** Skip the outer container — use when the parent already provides the card/border */
//   naked?: boolean
//   /** Use on dark/translucent backgrounds */
//   dark?: boolean
//   /** Show the "use my location" pin button — only makes sense on an
//    *  origin/"From" field, never on a destination field. */
//   geolocate?: boolean
// }

// // Dropdown floor width on desktop — trigger fields (esp. in tight grid
// // layouts like the builder's search bars) are often narrower than this,
// // which was making airport name + code text feel cramped/truncated.
// const MIN_DROPDOWN_WIDTH = 320
// const VIEWPORT_MARGIN = 8

// export function AirportInput({
//   value,
//   onChange,
//   label,
//   placeholder,
//   naked = false,
//   dark = false,
//   geolocate = false,
// }: AirportInputProps) {
//   const [query, setQuery] = useState(value)
//   const [open, setOpen] = useState(false)
//   const [debounced, setDebounced] = useState(value)
//   const [subAirports, setSubAirports] = useState<PlaceSuggestion[] | null>(null)
//   const [confirmed, setConfirmed] = useState(true)
//   const [locating, setLocating] = useState(false)

//   const [mounted, setMounted] = useState(false)
//   const [coords, setCoords] = useState<{
//     top: number
//     left: number
//     width: number
//   } | null>(null)

//   const wrapperRef = useRef<HTMLDivElement>(null)
//   const panelRef = useRef<HTMLUListElement>(null)

//   useEffect(() => setMounted(true), [])

//   useEffect(() => {
//     setQuery(value)
//     setConfirmed(true)
//   }, [value])

//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(query), 300)
//     return () => clearTimeout(t)
//   }, [query])

//   useEffect(() => {
//     setSubAirports(null)
//   }, [debounced])

//   // The dropdown panel widens to a comfortable minimum (capped to the
//   // viewport) rather than exactly matching the trigger field's width,
//   // which in a multi-column builder search bar can be quite narrow —
//   // cramping airport name/code text. Stays anchored to the trigger's
//   // left edge, nudged left only if it would overflow the right side.
//   const updatePosition = useCallback(() => {
//     const el = wrapperRef.current
//     if (!el) return
//     const rect = el.getBoundingClientRect()
//     const viewportWidth = window.innerWidth

//     const width = Math.min(
//       Math.max(rect.width, MIN_DROPDOWN_WIDTH),
//       viewportWidth - VIEWPORT_MARGIN * 2,
//     )

//     let left = rect.left
//     if (left + width > viewportWidth - VIEWPORT_MARGIN) {
//       left = viewportWidth - VIEWPORT_MARGIN - width
//     }
//     left = Math.max(VIEWPORT_MARGIN, left)

//     setCoords({ top: rect.bottom + 4, left, width })
//   }, [])

//   useEffect(() => {
//     if (!open) return
//     updatePosition()
//     window.addEventListener('scroll', updatePosition, true)
//     window.addEventListener('resize', updatePosition)
//     return () => {
//       window.removeEventListener('scroll', updatePosition, true)
//       window.removeEventListener('resize', updatePosition)
//     }
//   }, [open, updatePosition])

//   useEffect(() => {
//     function onClickOutside(e: MouseEvent) {
//       const target = e.target as Node
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(target) &&
//         (!panelRef.current || !panelRef.current.contains(target))
//       ) {
//         setOpen(false)
//         if (!confirmed) setQuery(value)
//       }
//     }
//     document.addEventListener('mousedown', onClickOutside)
//     return () => document.removeEventListener('mousedown', onClickOutside)
//   }, [confirmed, value])

//   const { data, isFetching } = usePlaceSuggestions(debounced)
//   const fetchedSuggestions: PlaceSuggestion[] = data?.data ?? []
//   const suggestions = subAirports ?? fetchedSuggestions

//   function select(s: PlaceSuggestion) {
//     if (s.type === 'city' && s.airports && s.airports.length > 0) {
//       setSubAirports(s.airports)
//       return
//     }
//     const iata = s.iata_code ?? ''
//     if (!iata) return

//     const display = `${s.name} (${iata})`
//     setQuery(display)
//     setConfirmed(true)
//     onChange(iata)
//     setOpen(false)
//     setSubAirports(null)
//   }

//   function handleBlur() {
//     setTimeout(() => {
//       if (!confirmed) setQuery(value)
//     }, 150)
//   }

//   /**
//    * Turn a coordinate pair into a committed airport selection.
//    *
//    * Two lookups, in order:
//    *
//    *  1. The airports provider (api-ninjas, via our own /api/airports proxy),
//    *     which answers with a country's large scheduled airports; we pick the
//    *     geometrically nearest. This is the intended path — it is driven
//    *     entirely by coordinates, so it cannot pick the wrong continent.
//    *  2. Our own places API, as a fallback for a country the provider does
//    *     not list, or the provider being down. Distance-checked, because it
//    *     searches by NAME: reverse-geocoding a home in San José, Mendoza
//    *     yields the locality "San José", and that name's top match in our
//    *     places API is San Jose, California — an airport 10,000 km away that
//    *     was being committed silently.
//    *
//    * Ported from the travels project.
//    */
//   async function resolveCoordsToAirport(lat: number, lng: number) {
//     try {
//       const countryCode = await reverseGeocodeCountry(lat, lng)

//       if (countryCode) {
//         const nearest = await findNearestAirport(lat, lng, countryCode)
//         if (nearest) {
//           select(airportToSuggestion(nearest))
//           return
//         }
//       }

//       const res = await getNearbyPlaces(lat, lng)
//       const results = res.data ?? []
//       const candidate =
//         results.find((r) => r.type === 'airport' && r.iata_code) ??
//         results.find((r) => r.type === 'city' && r.airports?.length)
//           ?.airports?.[0]

//       // Only accept a name match we can actually place near the person. No
//       // coordinates means no way to tell a neighbouring city from a
//       // same-named one on another continent, so it does not get committed.
//       const plausible =
//         candidate?.iata_code &&
//         Number.isFinite(candidate.latitude) &&
//         Number.isFinite(candidate.longitude) &&
//         haversineKm(
//           { latitude: lat, longitude: lng },
//           {
//             latitude: candidate.latitude as number,
//             longitude: candidate.longitude as number,
//           },
//         ) <= MAX_NEARBY_AIRPORT_KM

//       if (!plausible) {
//         toast.error(
//           "Couldn't find an airport near you — try typing it instead.",
//         )
//         return
//       }
//       select(candidate!)
//     } catch {
//       toast.error('Could not look up nearby airports — try typing it instead.')
//     }
//   }

//   /**
//    * Real GPS, from an explicit tap on the pin.
//    *
//    * enableHighAccuracy is deliberately FALSE: we only need city/airport
//    * precision, not exact meters, and low-accuracy (network/Wi-Fi based)
//    * positioning is both faster and far more reliable than high-accuracy
//    * GPS on devices with no real GPS chip — which is most laptops/
//    * desktops. High accuracy causes a "could not get your location" error
//    * within 2-3 seconds even when a fix genuinely exists, because the
//    * browser gives up on a GPS-hardware fix it was never going to get.
//    *
//    * Ported from the travels project.
//    */
//   function requestPreciseLocation() {
//     if (typeof navigator === 'undefined' || !navigator.geolocation) {
//       toast.error('Location is not available on this device or browser.')
//       return
//     }
//     setLocating(true)
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         try {
//           await resolveCoordsToAirport(pos.coords.latitude, pos.coords.longitude)
//         } finally {
//           setLocating(false)
//         }
//       },
//       (err) => {
//         setLocating(false)
//         if (err.code === err.PERMISSION_DENIED) {
//           toast.error(
//             "Location is blocked for this site. Enable it in your browser's site settings, then try again.",
//           )
//           return
//         }
//         toast.error('Could not get your location — try typing it instead.')
//       },
//       { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
//     )
//   }

//   const inputEl = (
//     <div className='flex items-center gap-1.5'>
//       <input
//         type='text'
//         value={query}
//         onChange={(e) => {
//           setQuery(e.target.value)
//           setConfirmed(false)
//           setOpen(true)
//         }}
//         onFocus={() => setOpen(true)}
//         onBlur={handleBlur}
//         placeholder={placeholder ?? 'City or airport'}
//         style={dark ? { colorScheme: 'dark' } : undefined}
//         className={cn(
//           'w-full bg-transparent text-[13px] font-medium outline-none',
//           dark
//             ? 'text-white placeholder:text-white/30'
//             : 'text-foreground placeholder:text-muted-foreground',
//         )}
//       />
//       {geolocate && (
//         <button
//           type='button'
//           onClick={requestPreciseLocation}
//           disabled={locating}
//           title='Use my location'
//           className={cn(
//             'shrink-0 rounded-full p-1 transition-colors',
//             dark
//               ? 'text-white/50 hover:bg-white/10 hover:text-white'
//               : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
//             locating && 'pointer-events-none opacity-60',
//           )}
//         >
//           {locating ? (
//             <Loader2 className='h-3.5 w-3.5 animate-spin' />
//           ) : (
//             <LocateFixed className='h-3.5 w-3.5' />
//           )}
//         </button>
//       )}
//       {isFetching && (
//         <Loader2
//           className={cn(
//             'h-3 w-3 shrink-0 animate-spin',
//             dark ? 'text-white/50' : 'text-muted-foreground',
//           )}
//         />
//       )}
//     </div>
//   )

//   const dropdown = open && coords && suggestions.length > 0 && (
//     <ul
//       ref={panelRef}
//       style={{
//         position: 'fixed',
//         top: coords.top,
//         left: coords.left,
//         width: coords.width,
//       }}
//       className='z-[999] max-h-56 overflow-y-auto rounded-xl border border-border bg-background shadow-xl'
//     >
//       {suggestions.map((s) => (
//         <li key={s.id}>
//           <button
//             type='button'
//             onMouseDown={(e) => e.preventDefault()}
//             onClick={() => select(s)}
//             className='flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-primary/10'
//           >
//             <MapPin className='h-3.5 w-3.5 shrink-0 text-primary' />
//             <div className='min-w-0'>
//               <p className='truncate text-[13px] font-medium text-foreground'>
//                 {s.name}
//               </p>
//               <p className='font-mono text-[10px] text-muted-foreground'>
//                 {s.iata_code ?? s.type}
//                 {s.iata_country_code ? ` · ${s.iata_country_code}` : ''}
//               </p>
//             </div>
//           </button>
//         </li>
//       ))}
//     </ul>
//   )

//   return (
//     <div ref={wrapperRef} className='relative w-full'>
//       {naked ? (
//         inputEl
//       ) : (
//         <div
//           className={cn(
//             'flex flex-col justify-center rounded-xl border px-4 py-2.5',
//             dark ? 'border-white/10 bg-white/5' : 'border-border bg-muted',
//           )}
//         >
//           {inputEl}
//           {label && (
//             <span
//               className={cn(
//                 'font-mono text-[9px] tracking-wider',
//                 dark ? 'text-white/40' : 'text-muted-foreground',
//               )}
//             >
//               {label}
//             </span>
//           )}
//         </div>
//       )}
//       {mounted && dropdown ? createPortal(dropdown, document.body) : null}
//     </div>
//   )
// }

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Loader2, LocateFixed, X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { usePlaceSuggestions } from '@/features/flights/hooks'
import { getNearbyPlaces } from '@/features/flights/api'
import { reverseGeocodeCountry } from '@/features/flights/geocode'
import {
  findNearestAirport,
  airportToSuggestion,
} from '@/features/flights/nearest-airport'
import { haversineKm } from '@/lib/geo'
import type { PlaceSuggestion } from '@/features/flights/types'
import {
  getRecentAirports,
  addRecentAirport,
  type RecentAirport,
} from '@/features/flights/recent-airports'
import { POPULAR_DESTINATIONS } from '@/features/flights/popular-destinations'

/**
 * Sanity bound on the name-based fallback lookup. Anything further than
 * this from the person's actual coordinates is a same-name collision, not
 * a nearby airport (e.g. reverse-geocoding lands on a locality whose name
 * also matches a same-named place on another continent).
 */
const MAX_NEARBY_AIRPORT_KM = 1000

interface AirportInputProps {
  value: string
  onChange: (iataCode: string) => void
  label: string
  placeholder?: string
  /** Skip the outer container — use when the parent already provides the card/border */
  naked?: boolean
  /** Use on dark/translucent backgrounds */
  dark?: boolean
  /** Show the "use my location" pin button — only makes sense on an
   *  origin/"From" field, never on a destination field. */
  geolocate?: boolean
  /** Attempt to fill this field from the browser's geolocation as soon as
   *  it mounts, with no click required. Only fires once, and only while
   *  the field is still empty. If the browser has no permission yet, this
   *  triggers the native permission prompt; if that's denied, unavailable,
   *  or the lookup fails, `autoLocateFailed` is reported via the inline
   *  hint below the field instead of an intrusive toast — the field is
   *  never left with no way forward. */
  autoLocate?: boolean
  /** Extra classes on the suggestions list (it is portalled to <body>, so
   *  a page's scoped colours don't reach it), e.g. 'vip-scope'. */
  dropdownClassName?: string
  /** Hide the inline "Getting your location…" / "couldn't detect" hints
   *  under a naked field, so it keeps a fixed height (auto-detection still
   *  runs; the pin button stays). */
  hideHints?: boolean
}

// Dropdown floor width on desktop — trigger fields (esp. in tight grid
// layouts like the builder's search bars) are often narrower than this,
// which was making airport name + code text feel cramped/truncated.
const MIN_DROPDOWN_WIDTH = 320
const VIEWPORT_MARGIN = 8

export function AirportInput({
  value,
  onChange,
  label,
  placeholder,
  naked = false,
  dark = false,
  geolocate = false,
  autoLocate = false,
  dropdownClassName,
  hideHints = false,
}: AirportInputProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [debounced, setDebounced] = useState(value)
  const [subAirports, setSubAirports] = useState<PlaceSuggestion[] | null>(null)
  const [confirmed, setConfirmed] = useState(true)
  const [locating, setLocating] = useState(false)
  const [autoLocateFailed, setAutoLocateFailed] = useState(false)
  const autoLocateRan = useRef(false)
  /** The human label for whatever `value` currently holds — set directly
   *  from the suggestion the person picked, so "From" reads "Washington
   *  (DCA)" / "Ronald Reagan Washington National Airport" instead of
   *  collapsing to the bare code the form actually stores. Cleared
   *  whenever `value` changes to something this label wasn't set for
   *  (e.g. a restored search or a swap), in which case the field falls
   *  back to showing the code — no separate lookup-by-code round trip. */
  const [labelled, setLabelled] = useState<{
    iata: string
    primary: string
    secondary: string | null
  } | null>(null)
  const [recents, setRecents] = useState<RecentAirport[]>([])
  useEffect(() => {
    setRecents(getRecentAirports())
  }, [])
  // BUG FIX: the auto-locate effect (on mount) and an explicit tap on the
  // pin button both resolve coordinates independently. If the silent
  // auto-locate attempt is still in flight when the visible one finishes
  // (or vice versa), whichever one loses the race used to still show its
  // own toast/state even though the field had already been filled in
  // correctly by the other — producing exactly the "error toast, but it
  // got the right location anyway" behaviour. This counter makes every
  // resolveCoordsToAirport() call check, right before it would show an
  // error (or on success), whether a *newer* attempt has since started;
  // if so, it's stale and bails out silently instead of surfacing
  // anything to the person.
  const locateRequestId = useRef(0)

  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (labelled && labelled.iata === value) return
    setQuery(value)
    setConfirmed(true)
    if (!value) setLabelled(null)
  }, [value, labelled])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setSubAirports(null)
  }, [debounced])

  // The dropdown panel widens to a comfortable minimum (capped to the
  // viewport) rather than exactly matching the trigger field's width,
  // which in a multi-column builder search bar can be quite narrow —
  // cramping airport name/code text. Stays anchored to the trigger's
  // left edge, nudged left only if it would overflow the right side.
  const updatePosition = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportWidth = window.innerWidth

    const width = Math.min(
      Math.max(rect.width, MIN_DROPDOWN_WIDTH),
      viewportWidth - VIEWPORT_MARGIN * 2,
    )

    let left = rect.left
    if (left + width > viewportWidth - VIEWPORT_MARGIN) {
      left = viewportWidth - VIEWPORT_MARGIN - width
    }
    left = Math.max(VIEWPORT_MARGIN, left)

    setCoords({ top: rect.bottom + 4, left, width })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        (!panelRef.current || !panelRef.current.contains(target))
      ) {
        setOpen(false)
        if (!confirmed) setQuery(value)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [confirmed, value])

  const { data, isFetching } = usePlaceSuggestions(debounced)
  const fetchedSuggestions: PlaceSuggestion[] = data?.data ?? []
  const suggestions = subAirports ?? fetchedSuggestions

  function select(s: PlaceSuggestion) {
    if (s.type === 'city' && s.airports && s.airports.length > 0) {
      setSubAirports(s.airports)
      return
    }
    const iata = s.iata_code ?? ''
    if (!iata) return

    const primary = s.city_name ? `${s.city_name} (${iata})` : `${s.name} (${iata})`
    const secondary = s.city_name && s.city_name !== s.name ? s.name : null

    setLabelled({ iata, primary, secondary })
    setQuery(primary)
    setConfirmed(true)
    onChange(iata)
    setOpen(false)
    setSubAirports(null)

    addRecentAirport({ iataCode: iata, primary, secondary })
    setRecents(getRecentAirports())
  }

  function selectPopular(d: (typeof POPULAR_DESTINATIONS)[number]) {
    setLabelled({ iata: d.iataCode, primary: `${d.city} (${d.iataCode})`, secondary: null })
    setQuery(`${d.city} (${d.iataCode})`)
    setConfirmed(true)
    onChange(d.iataCode)
    setOpen(false)
  }

  function selectRecent(r: RecentAirport) {
    setLabelled({ iata: r.iataCode, primary: r.primary, secondary: r.secondary })
    setQuery(r.primary)
    setConfirmed(true)
    onChange(r.iataCode)
    setOpen(false)
  }

  function clearValue() {
    setLabelled(null)
    setQuery('')
    setConfirmed(false)
    onChange('')
    setOpen(true)
  }

  function handleBlur() {
    setTimeout(() => {
      if (!confirmed) setQuery(value)
    }, 150)
  }

  /**
   * What the input actually shows. Derived rather than synced: while the
   * person is typing, `query` wins; once a value is committed and we have
   * a label for it (set at the moment of picking, see `select` above),
   * the label wins and the code-only `value` never flashes on screen.
   */
  const hasLabel = confirmed && !!value && labelled?.iata === value
  const displayValue = hasLabel ? labelled.primary : query
  const secondaryLine = hasLabel ? labelled.secondary : null

  /**
   * Turn a coordinate pair into a committed airport selection.
   *
   * Two lookups, in order:
   *
   *  1. The airports provider (api-ninjas, via our own /api/airports proxy),
   *     which answers with a country's large scheduled airports; we pick the
   *     geometrically nearest. This is the intended path — it is driven
   *     entirely by coordinates, so it cannot pick the wrong continent.
   *  2. Our own places API, as a fallback for a country the provider does
   *     not list, or the provider being down. Distance-checked, because it
   *     searches by NAME: reverse-geocoding a home in San José, Mendoza
   *     yields the locality "San José", and that name's top match in our
   *     places API is San Jose, California — an airport 10,000 km away that
   *     was being committed silently.
   *
   * Ported from the travels project.
   */
  async function resolveCoordsToAirport(lat: number, lng: number, requestId: number) {
    const isStale = () => locateRequestId.current !== requestId
    try {
      const countryCode = await reverseGeocodeCountry(lat, lng)
      if (isStale()) return

      if (countryCode) {
        const nearest = await findNearestAirport(lat, lng, countryCode)
        if (isStale()) return
        if (nearest) {
          select(airportToSuggestion(nearest))
          return
        }
      }

      const res = await getNearbyPlaces(lat, lng)
      if (isStale()) return
      const results = res.data ?? []
      const candidate =
        results.find((r) => r.type === 'airport' && r.iata_code) ??
        results.find((r) => r.type === 'city' && r.airports?.length)
          ?.airports?.[0]

      // Only accept a name match we can actually place near the person. No
      // coordinates means no way to tell a neighbouring city from a
      // same-named one on another continent, so it does not get committed.
      const plausible =
        candidate?.iata_code &&
        Number.isFinite(candidate.latitude) &&
        Number.isFinite(candidate.longitude) &&
        haversineKm(
          { latitude: lat, longitude: lng },
          {
            latitude: candidate.latitude as number,
            longitude: candidate.longitude as number,
          },
        ) <= MAX_NEARBY_AIRPORT_KM

      if (!plausible) {
        if (!isStale()) {
          toast.error(
            "Couldn't find an airport near you — try typing it instead.",
          )
        }
        return
      }
      select(candidate!)
    } catch {
      if (!isStale()) {
        toast.error('Could not look up nearby airports — try typing it instead.')
      }
    }
  }

  /**
   * Real GPS, from an explicit tap on the pin.
   *
   * enableHighAccuracy is deliberately FALSE: we only need city/airport
   * precision, not exact meters, and low-accuracy (network/Wi-Fi based)
   * positioning is both faster and far more reliable than high-accuracy
   * GPS on devices with no real GPS chip — which is most laptops/
   * desktops. High accuracy causes a "could not get your location" error
   * within 2-3 seconds even when a fix genuinely exists, because the
   * browser gives up on a GPS-hardware fix it was never going to get.
   *
   * Ported from the travels project.
   *
   * Bug fix (investigated): reported as "I grant permission, nothing
   * happens, I tap the pin, I immediately get a 'could not get your
   * location' error — but then my real location fills in anyway a moment
   * later." Root cause: `getCurrentPosition`'s `timeout` counts from the
   * moment it's called, which INCLUDES the time spent waiting on the
   * browser's native permission prompt (confirmed browser behaviour, not
   * a bug in this file) — so the old 8s timeout was often already mostly
   * or fully spent just on the user reading and answering that prompt,
   * before network-based positioning even started. The silent auto-locate
   * on mount (below) would time out and fail quietly (by design, no
   * toast) right around when the user finally granted permission, leaving
   * the field empty ("nothing happens"). Tapping the pin then started a
   * fresh request — with permission now already granted this one usually
   * resolves fast, but on a slow/first-fix network position it could
   * ALSO brush against the same tight 8s window and error, even though
   * the browser's location subsystem — now warmed up from the first
   * attempt — often produced a real fix moments after our own timeout
   * gave up on it.
   *
   * Fix: a realistic timeout (20s — generous enough to cover a slow
   * permission decision plus a cold network-position fix) for both this
   * and the silent auto-locate below, and the manual path's error message
   * now distinguishes a genuine timeout from an outright failure: a
   * timeout gets an honest "still working on it" message instead of a
   * flat dead-end, since — as this bug showed — a timeout here doesn't
   * necessarily mean location acquisition has actually failed, just that
   * it hasn't finished yet.
   */
  function requestPreciseLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Location is not available on this device or browser.')
      return
    }
    // Defense in depth: the pin button is already `disabled` while
    // `locating` is true, which should make this unreachable via a normal
    // click — but a request already in flight (e.g. the silent auto-locate
    // on mount) racing a second one is exactly the failure mode above, so
    // this guards against it directly rather than relying solely on the
    // button's disabled state to prevent overlap.
    if (locating) {
      toast('Still getting your location — hang tight a moment.')
      return
    }
    const requestId = ++locateRequestId.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await resolveCoordsToAirport(
            pos.coords.latitude,
            pos.coords.longitude,
            requestId,
          )
        } finally {
          if (locateRequestId.current === requestId) setLocating(false)
        }
      },
      (err) => {
        if (locateRequestId.current !== requestId) return
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Location is blocked for this site. Enable it in your browser's site settings, then try again.",
          )
          return
        }
        if (err.code === err.TIMEOUT) {
          toast(
            "Still working on getting your location — give it a few more seconds, or type it in below.",
          )
          return
        }
        toast.error('Could not get your location — try typing it instead.')
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60_000 },
    )
  }

  /**
   * Fill the "From" field automatically as soon as it mounts empty — no
   * click required. This still shows the browser's native permission
   * dialog (unavoidable, and the right thing — we should always ask
   * before reading someone's location); it just skips our pin button as
   * the trigger. Runs once. If permission is denied, geolocation isn't
   * supported, or the browser can't get a fix, we don't pop a toast (it
   * would disappear before most people notice) — instead `autoLocateFailed`
   * flips on and the inline hint below the field takes over, pointing the
   * user at the pin button or the text field itself.
   *
   * timeout matches the manual path above (20s) for the same reason — see
   * the bug-fix comment on requestPreciseLocation. This is the request
   * most likely to actually hit that window, since it's the one racing
   * the user's own read-and-decide time on the permission prompt.
   */
  useEffect(() => {
    if (!autoLocate || autoLocateRan.current || value) return
    autoLocateRan.current = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setAutoLocateFailed(true)
      return
    }

    const requestId = ++locateRequestId.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await resolveCoordsToAirport(
            pos.coords.latitude,
            pos.coords.longitude,
            requestId,
          )
        } finally {
          if (locateRequestId.current === requestId) setLocating(false)
        }
      },
      () => {
        if (locateRequestId.current !== requestId) return
        setLocating(false)
        setAutoLocateFailed(true)
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60_000 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate, value])

  const inputEl = (
    <div className='min-w-0'>
      <div className='flex items-center gap-1.5'>
        <input
          type='text'
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            setConfirmed(false)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder ?? 'City or airport'}
          style={dark ? { colorScheme: 'dark' } : undefined}
          className={cn(
            'w-full min-w-0 truncate bg-transparent text-[13px] font-medium outline-none',
            dark
              ? 'text-white placeholder:text-white/30'
              : 'text-foreground placeholder:text-muted-foreground',
          )}
        />
        {hasLabel && (
          <button
            type='button'
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearValue}
            aria-label='Clear'
            className={cn(
              'shrink-0 rounded-full p-0.5 transition-colors',
              dark
                ? 'text-white/50 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <X className='h-3 w-3' />
          </button>
        )}
        {geolocate && (
          <button
            type='button'
            onClick={requestPreciseLocation}
            disabled={locating}
            title='Use my location'
            className={cn(
              'shrink-0 rounded-full p-1 transition-colors',
              dark
                ? 'text-white/50 hover:bg-white/10 hover:text-white'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
              locating && 'pointer-events-none opacity-60',
            )}
          >
            {locating ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <LocateFixed className='h-3.5 w-3.5' />
            )}
          </button>
        )}
        {isFetching && (
          <Loader2
            className={cn(
              'h-3 w-3 shrink-0 animate-spin',
              dark ? 'text-white/50' : 'text-muted-foreground',
            )}
          />
        )}
      </div>
      {secondaryLine && (
        <p
          className={cn(
            'truncate text-[10.5px]',
            dark ? 'text-white/40' : 'text-muted-foreground',
          )}
        >
          {secondaryLine}
        </p>
      )}
    </div>
  )

  const showEmptyState = open && query.trim().length === 0
  const dropdown = open && coords && (showEmptyState || suggestions.length > 0) && (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
      }}
      className={cn(
        'z-[999] max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-xl',
        dropdownClassName,
      )}
    >
      {showEmptyState ? (
        <div className='py-1'>
          {recents.length > 0 && (
            <div className='px-2 py-1.5'>
              <p className='px-2 pb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                Recent
              </p>
              {recents.map((r) => (
                <button
                  key={r.iataCode}
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectRecent(r)}
                  className='flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-primary/10'
                >
                  <Clock className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate text-[13px] font-medium text-foreground'>
                      {r.primary}
                    </p>
                    {r.secondary && (
                      <p className='truncate font-mono text-[10px] text-muted-foreground'>
                        {r.secondary}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className='border-t border-border px-2 py-1.5'>
            <p className='px-2 pb-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
              Popular destinations
            </p>
            <div className='grid grid-cols-2 gap-1 px-1'>
              {POPULAR_DESTINATIONS.map((d) => (
                <button
                  key={d.iataCode}
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPopular(d)}
                  className='flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-primary/10'
                >
                  <span>{d.countryFlag}</span>
                  {d.city}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul>
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type='button'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className='flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-primary/10'
              >
                <MapPin className='h-3.5 w-3.5 shrink-0 text-primary' />
                <div className='min-w-0'>
                  <p className='truncate text-[13px] font-medium text-foreground'>
                    {s.city_name ?? s.name}
                  </p>
                  <p className='font-mono text-[10px] text-muted-foreground'>
                    {s.city_name ? s.name : (s.iata_code ?? s.type)}
                    {s.iata_country_code ? ` · ${s.iata_country_code}` : ''}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div ref={wrapperRef} className='relative w-full'>
      {naked ? (
        <>
          {inputEl}
          {!hideHints && autoLocate && locating && !value && (
            <span
              className={cn(
                'mt-1 flex items-center gap-1 text-[11px] leading-snug',
                dark ? 'text-white/50' : 'text-muted-foreground',
              )}
            >
              <Loader2 className='h-3 w-3 shrink-0 animate-spin' />
              Getting your location…
            </span>
          )}
          {!hideHints && autoLocate && autoLocateFailed && !value && (
            <span
              className={cn(
                'mt-1 block text-[11px] leading-snug',
                dark ? 'text-white/50' : 'text-muted-foreground',
              )}
            >
              We couldn&apos;t detect your location automatically — tap{' '}
              <LocateFixed className='inline h-3 w-3 -translate-y-px' /> to
              allow access, or just type your departure city.
            </span>
          )}
        </>
      ) : (
        <div
          className={cn(
            'flex flex-col justify-center rounded-xl border px-4 py-2.5',
            dark ? 'border-white/10 bg-white/5' : 'border-border bg-muted',
          )}
        >
          {inputEl}
          {label && (
            <span
              className={cn(
                'font-mono text-[9px] tracking-wider',
                dark ? 'text-white/40' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          )}
          {autoLocate && locating && !value && (
            <span
              className={cn(
                'mt-1 flex items-center gap-1 text-[11px] leading-snug',
                dark ? 'text-white/50' : 'text-muted-foreground',
              )}
            >
              <Loader2 className='h-3 w-3 shrink-0 animate-spin' />
              Getting your location…
            </span>
          )}
          {autoLocate && autoLocateFailed && !value && (
            <span
              className={cn(
                'mt-1 block text-[11px] leading-snug',
                dark ? 'text-white/50' : 'text-muted-foreground',
              )}
            >
              We couldn&apos;t detect your location automatically — tap{' '}
              <LocateFixed className='inline h-3 w-3 -translate-y-px' /> to
              allow access, or just type your departure city.
            </span>
          )}
        </div>
      )}
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  )
}
