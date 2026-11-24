'use client'

// features/matchday/flyers.ts
//
// Our own club images in /public/flyers — the source of truth for:
//   • the /matches hero carousel (HERO_CLUBS, one slide per club), and
//   • the "Popular Clubs — Follow your team" grid (CLUBS).
//
// HOW IT WORKS
//   • Each club has a `file` name. If /public/flyers/<file>.png (or .jpg,
//     .jpeg, .webp, .avif) exists, that image is used everywhere.
//   • `apiImage: true` clubs keep using the live API image until their
//     local file is added; then they switch to the local one automatically.
//   • Every other club is hidden until its local file is added.
//   • Which files exist is read from the folder at build time
//     (app/api/flyers/route.ts), so adding an image only needs a deploy.
//
// TO ADD A CLUB: save its image in /public/flyers using the `file` name
// below. If the club isn't in this list yet, add a row too (`name` must be
// the club's name as the ticket API knows it; aliases like "Man City" are
// handled by the same matching the search uses).

import { useEffect, useMemo, useSyncExternalStore } from 'react'

export interface Club {
  /** Image file name in /public/flyers, without the extension. */
  file: string
  /** Club name as the API knows it. */
  name: string
  /** Fallback badge (shown only if an API image also fails). */
  abbr: string
  color: string
  bg: string
  /** Use the live API image until our own file exists. */
  apiImage?: boolean
}

/** In display order for the "Follow your team" grid. */
export const CLUBS: Club[] = [
  {
    file: 'realmadrid',
    name: 'Real Madrid',
    abbr: 'RM',
    color: '#FEBE10',
    bg: '#FFFFFF',
  },
  {
    file: 'barcelona',
    name: 'FC Barcelona',
    abbr: 'FCB',
    color: '#A50044',
    bg: '#004D98',
  },
  {
    file: 'bayern',
    name: 'Bayern Munich',
    abbr: 'FCB',
    color: '#FFFFFF',
    bg: '#DC052D',
  },
  {
    file: 'psg',
    name: 'Paris Saint-Germain',
    abbr: 'PSG',
    color: '#FFFFFF',
    bg: '#004170',
    apiImage: true,
  },
  {
    file: 'liverpool',
    name: 'Liverpool FC',
    abbr: 'LFC',
    color: '#F6EB61',
    bg: '#C8102E',
  },
  {
    file: 'mancity',
    name: 'Manchester City',
    abbr: 'MCI',
    color: '#FFFFFF',
    bg: '#6CABDD',
  },
  {
    file: 'manutd',
    name: 'Manchester United',
    abbr: 'MUN',
    color: '#FBE122',
    bg: '#DA291C',
    apiImage: true,
  },
  {
    file: 'arsenal',
    name: 'Arsenal',
    abbr: 'ARS',
    color: '#FFFFFF',
    bg: '#EF0107',
  },
  {
    file: 'chelsea',
    name: 'Chelsea',
    abbr: 'CHE',
    color: '#FFFFFF',
    bg: '#034694',
  },
  {
    file: 'atleticomadrid',
    name: 'Atlético Madrid',
    abbr: 'ATM',
    color: '#FFFFFF',
    bg: '#CE3524',
    apiImage: true,
  },
  {
    file: 'intermilan',
    name: 'Inter Milan',
    abbr: 'INT',
    color: '#0068A8',
    bg: '#000000',
    apiImage: true,
  },
  {
    file: 'acmilan',
    name: 'AC Milan',
    abbr: 'ACM',
    color: '#FFFFFF',
    bg: '#FB090B',
    apiImage: true,
  },
  {
    file: 'tottenham',
    name: 'Tottenham Hotspur',
    abbr: 'TOT',
    color: '#FFFFFF',
    bg: '#132257',
    apiImage: true,
  },
  {
    file: 'napoli',
    name: 'Napoli',
    abbr: 'NAP',
    color: '#FFFFFF',
    bg: '#12A0D7',
    apiImage: true,
  },
  {
    file: 'benfica',
    name: 'Benfica',
    abbr: 'SLB',
    color: '#FFFFFF',
    bg: '#E83030',
    apiImage: true,
  },
  {
    file: 'dortmund',
    name: 'Borussia Dortmund',
    abbr: 'BVB',
    color: '#000000',
    bg: '#FDE100',
  },
  {
    file: 'juventus',
    name: 'Juventus',
    abbr: 'JUV',
    color: '#FFFFFF',
    bg: '#000000',
  },
  { file: 'ajax', name: 'Ajax', abbr: 'AJX', color: '#FFFFFF', bg: '#D2122E' },
  {
    file: 'psv',
    name: 'PSV Eindhoven',
    abbr: 'PSV',
    color: '#FFFFFF',
    bg: '#ED1C24',
  },
  {
    file: 'everton',
    name: 'Everton',
    abbr: 'EVE',
    color: '#FFFFFF',
    bg: '#003399',
  },
  {
    file: 'westham',
    name: 'West Ham United',
    abbr: 'WHU',
    color: '#1BB1E7',
    bg: '#7A263A',
  },
  {
    file: 'astonvilla',
    name: 'Aston Villa',
    abbr: 'AVL',
    color: '#95BFE5',
    bg: '#670E36',
  },
  {
    file: 'galatasaray',
    name: 'Galatasaray',
    abbr: 'GS',
    color: '#FDB912',
    bg: '#A90432',
  },
  {
    file: 'fenerbahce',
    name: 'Fenerbahce',
    abbr: 'FB',
    color: '#FFED00',
    bg: '#002D72',
  },
  // Ready for later — hidden until their image is added.
  {
    file: 'newcastle',
    name: 'Newcastle United',
    abbr: 'NEW',
    color: '#FFFFFF',
    bg: '#241F20',
  },
  {
    file: 'roma',
    name: 'AS Roma',
    abbr: 'ROM',
    color: '#F0BC42',
    bg: '#8E1F2F',
  },
  {
    file: 'porto',
    name: 'FC Porto',
    abbr: 'FCP',
    color: '#FFFFFF',
    bg: '#003893',
  },
  {
    file: 'leverkusen',
    name: 'Bayer Leverkusen',
    abbr: 'B04',
    color: '#000000',
    bg: '#E32221',
  },
  {
    file: 'celtic',
    name: 'Celtic',
    abbr: 'CEL',
    color: '#FFFFFF',
    bg: '#018749',
  },
  {
    file: 'rangers',
    name: 'Rangers',
    abbr: 'RFC',
    color: '#FFFFFF',
    bg: '#1B458F',
  },
  {
    file: 'sevilla',
    name: 'Sevilla',
    abbr: 'SEV',
    color: '#D7182A',
    bg: '#FFFFFF',
  },
  {
    file: 'betis',
    name: 'Real Betis',
    abbr: 'BET',
    color: '#FFFFFF',
    bg: '#00954C',
  },
  {
    file: 'lazio',
    name: 'Lazio',
    abbr: 'LAZ',
    color: '#FFFFFF',
    bg: '#87D8F7',
  },
  {
    file: 'marseille',
    name: 'Marseille',
    abbr: 'OM',
    color: '#FFFFFF',
    bg: '#2FAEE0',
  },
  {
    file: 'sporting',
    name: 'Sporting CP',
    abbr: 'SCP',
    color: '#FFFFFF',
    bg: '#008057',
  },
  {
    file: 'athleticbilbao',
    name: 'Athletic Bilbao',
    abbr: 'ATH',
    color: '#FFFFFF',
    bg: '#EE2523',
  },
]

/** The /matches hero carousel: one slide per club, if its image exists. */
export const HERO_CLUBS = [
  'chelsea',
  'arsenal',
  'barcelona',
  'bayern',
  'mancity',
  'realmadrid',
  'liverpool',
  'manutd',
] as const

/* ── Which files exist ────────────────────────────────────────────── */

/** file name (no extension) → public path, or null while loading. */
let files: ReadonlyMap<string, string> | null = null
let requested = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function load() {
  if (requested) return
  requested = true
  fetch('/api/flyers')
    .then((r) => (r.ok ? r.json() : { files: [] }))
    .catch(() => ({ files: [] }))
    .then((data: { files?: string[] }) => {
      const map = new Map<string, string>()
      for (const f of data.files ?? []) {
        const base = f.replace(/\.[^.]+$/, '').toLowerCase()
        if (!map.has(base)) map.set(base, `/flyers/${f}`)
      }
      files = map
      emit()
    })
}

/** An image that exists but fails to render is dropped like a missing one. */
export function markFlyerMissing(src: string) {
  if (!files) return
  const next = new Map(files)
  for (const [k, v] of next) if (v === src) next.delete(k)
  files = next
  emit()
}

/** `ready` once the folder listing is in; `srcFor(file)` → path or null.
 *  The returned object (and `srcFor`) is stable until the set of available
 *  images changes, so it is safe to use as a hook dependency. */
export function useFlyers(enabled = true) {
  useEffect(() => {
    if (enabled) load()
  }, [enabled])
  const map = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => files,
    () => null,
  )
  return useMemo(
    () => ({
      ready: map !== null,
      srcFor: (file: string) => map?.get(file) ?? null,
      /** Changes whenever the set of available images changes. */
      version: map,
    }),
    [map],
  )
}
