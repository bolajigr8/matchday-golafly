'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { MapViewport } from './map-viewport'
import type { CategoryInfo, Tier, Side } from '@/features/matchday/seats'
import { formatMatchdayMoney } from '@/features/matchday/format'

/* Oval stadium bowl: the pitch, then three curved rings (lower / club /
   upper), each cut into sections. Every section is always drawn, so it reads
   as a stadium even when a fixture only has two or three categories; the
   categories that come from the API are coloured in and labelled.
   Geometry is schematic (the API sends no coordinates) — a category is placed
   by what its NAME says: lower/club/upper tier, short/long/central side.
   Long sides run top & bottom, short ends left & right.
   Labels are white with a dark halo so they read on any zone colour in both
   light and dark mode.
   This is now the FALLBACK map: fixtures with a real seating plan use
   seating-plan-map.tsx. Zoom / pan / fullscreen live in map-viewport.tsx. */

const CX = 200
const CY = 150
const N = 32 // sections per ring
type RingName = 'lower' | 'club' | 'upper'
const RINGS: Record<RingName, { ri: [number, number]; ro: [number, number] }> = {
  lower: { ri: [96, 62], ro: [134, 95] },
  club: { ri: [134, 95], ro: [145, 104] },
  upper: { ri: [145, 104], ro: [188, 140] },
}

interface Section {
  key: string
  ring: RingName
  part: 'end' | 'long' | 'central'
  index: number
  d: string
  mid: number // mid angle (rad)
}

const pt = (r: [number, number], a: number) => [CX + r[0] * Math.cos(a), CY + r[1] * Math.sin(a)]
function arcPoints(r: [number, number], a0: number, a1: number, steps = 3) {
  const out: number[][] = []
  for (let i = 0; i <= steps; i++) out.push(pt(r, a0 + ((a1 - a0) * i) / steps))
  return out
}
const toPath = (p: number[][]) => 'M ' + p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ') + ' Z'

function build(): Section[] {
  const out: Section[] = []
  const gap = 0.012
  ;(Object.keys(RINGS) as RingName[]).forEach((ring) => {
    const { ri, ro } = RINGS[ring]
    for (let k = 0; k < N; k++) {
      const a0 = (k / N) * Math.PI * 2 + gap
      const a1 = ((k + 1) / N) * Math.PI * 2 - gap
      const mid = (a0 + a1) / 2
      const c = Math.abs(Math.cos(mid))
      const part: Section['part'] = c > 0.85 ? 'end' : c < 0.3 ? 'central' : 'long'
      const poly = [...arcPoints(ro, a0, a1), ...arcPoints(ri, a1, a0)]
      out.push({ key: `${ring}-${k}`, ring, part, index: k, d: toPath(poly), mid })
    }
  })
  return out
}
const SECTIONS = build()

function sectionMatches(tier: Tier, side: Side, s: Section): boolean {
  if (s.ring !== tier) return false
  if (side === 'all') return true
  if (side === 'short') return s.part === 'end'
  if (side === 'central') return s.ring === 'club' ? false : s.part === 'central'
  // long: everything that is not an end (club has no central split)
  return s.ring === 'club' ? s.part !== 'end' : s.part === 'long'
}

/** category id -> section keys */
export function assignZones(cats: CategoryInfo[]): Map<number, string[]> {
  const m = new Map<number, string[]>()
  const used = new Set<string>()
  const take = (id: number, tier: Tier, side: Side) => {
    const keys = SECTIONS.filter((s) => sectionMatches(tier, side, s)).map((s) => s.key)
    m.set(id, keys)
    keys.forEach((k) => used.add(k))
    return keys
  }
  for (const c of cats) if (c.tier !== 'hospitality' && c.tier !== 'other') take(c.id, c.tier, c.side)
  // Categories whose name doesn't say which tier: first free tier for that side
  for (const c of cats) {
    if (c.tier !== 'other') continue
    const side: Side = c.side
    for (const tier of ['lower', 'upper', 'club'] as const) {
      const keys = SECTIONS.filter((s) => sectionMatches(tier, side, s)).map((s) => s.key)
      if (keys.length && keys.every((k) => !used.has(k))) {
        take(c.id, tier, side)
        break
      }
    }
  }
  return m
}

/** Contiguous runs of section indices within one ring (wrap-aware). */
function runs(indices: number[]): number[][] {
  if (!indices.length) return []
  const set = new Set(indices)
  if (set.size === N) return [Array.from({ length: N }, (_, i) => i)]
  const starts = indices.filter((i) => !set.has((i - 1 + N) % N))
  return starts.map((s) => {
    const r = [s]
    while (set.has((r[r.length - 1] + 1) % N)) r.push((r[r.length - 1] + 1) % N)
    return r
  })
}

function lines(name: string): string[] {
  const w = name.split(' ')
  return w.length <= 1 ? [name] : [w.slice(0, -1).join(' '), w[w.length - 1]]
}

interface Label { key: string; x: number; y: number; rot: number; text: string[]; catId: number }

function shortPrice(n: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency ?? 'EUR',
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol',
    }).format(n)
  } catch {
    return String(Math.round(n))
  }
}

const CHAR_W = 4.8
const LINE_H = 9.6

/** One label per contiguous run of a category's sections: its name and its
 *  cheapest price (both from the API). Picks the richest layout that fits the
 *  run's arc length and the ring thickness; otherwise the legend carries it. */
function buildLabels(cats: CategoryInfo[], zones: Map<number, string[]>, currency: string | null): Label[] {
  const out: Label[] = []
  for (const c of cats) {
    const keys = zones.get(c.id) ?? []
    const byRing = new Map<RingName, number[]>()
    for (const k of keys) {
      const [ring, idx] = k.split('-')
      byRing.set(ring as RingName, [...(byRing.get(ring as RingName) ?? []), Number(idx)])
    }
    const price = shortPrice(c.minPrice, currency)
    const nameLines = lines(c.shortName)
    const options: string[][] = [
      [...nameLines, price],
      [nameLines.join(' '), price],
      [price],
    ]
    byRing.forEach((idxs, ring) => {
      const { ri, ro } = RINGS[ring]
      const rm: [number, number] = [(ri[0] + ro[0]) / 2, (ri[1] + ro[1]) / 2]
      for (const run of runs(idxs)) {
        const midIdx = run[Math.floor(run.length / 2)]
        const a = SECTIONS.find((s) => s.key === `${ring}-${midIdx}`)!.mid
        // radial thickness of the ring at this angle
        const thick = Math.hypot((ro[0] - ri[0]) * Math.cos(a), (ro[1] - ri[1]) * Math.sin(a))
        const arcLen = run.length * ((2 * Math.PI) / N) * Math.sqrt((rm[0] ** 2 + rm[1] ** 2) / 2)
        const text = options.find(
          (o) => o.length * LINE_H <= thick - 2 && Math.max(...o.map((t) => t.length)) * CHAR_W + 6 <= arcLen,
        )
        if (!text) continue
        const [x, y] = pt(rm, a)
        let rot = (Math.atan2(rm[1] * Math.cos(a), -rm[0] * Math.sin(a)) * 180) / Math.PI
        if (rot > 90) rot -= 180
        if (rot < -90) rot += 180
        out.push({ key: `${c.id}-${ring}-${midIdx}`, x, y, rot, text, catId: c.id })
      }
    })
  }
  return out
}

export function StadiumMap({
  categories,
  activeId,
  onSelect,
  currency,
}: {
  categories: CategoryInfo[]
  activeId: number | null
  onSelect: (id: number | null) => void
  currency: string | null
}) {
  const [hover, setHover] = useState<number | null>(null)
  const zones = useMemo(() => assignZones(categories), [categories])
  const byKey = useMemo(() => {
    const m = new Map<string, CategoryInfo>()
    for (const c of categories) for (const k of zones.get(c.id) ?? []) m.set(k, c)
    return m
  }, [categories, zones])
  const labels = useMemo(() => buildLabels(categories, zones, currency), [categories, zones, currency])
  const hovered = categories.find((c) => c.id === hover)
  const money = (n: number) => formatMatchdayMoney(n, currency ?? 'EUR')

  const toggle = (id: number) => onSelect(activeId === id ? null : id)

  return (
    <MapViewport
      overlay={
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-md backdrop-blur transition-opacity',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          {hovered && (
            <div className='flex items-center justify-between gap-3'>
              <span className='flex min-w-0 items-center gap-2 font-semibold text-foreground'>
                <span className='size-2.5 shrink-0 rounded-sm' style={{ background: hovered.color }} />
                <span className='truncate'>{hovered.name}</span>
              </span>
              <span className='shrink-0 text-muted-foreground'>
                from <b className='text-foreground'>{money(hovered.minPrice)}</b> · {hovered.listingCount}
              </span>
            </div>
          )}
        </div>
      }
    >
      <svg
        viewBox='0 0 400 300'
        role='group'
        aria-label='Stadium map. Select a zone to filter listings by category.'
        className='block h-auto w-full'
      >
        <defs>
          <clipPath id='pitch-clip'>
            <rect x='124' y='108' width='152' height='84' rx='5' />
          </clipPath>
        </defs>

        {/* outer wall */}
        <ellipse cx={CX} cy={CY} rx='194' ry='146' className='fill-none stroke-border' strokeWidth='1.5' />

        {/* every section, so the bowl is always complete */}
        {SECTIONS.map((s) => {
          const cat = byKey.get(s.key)
          if (cat) return null
          return (
            <path
              key={s.key}
              d={s.d}
              className={cn(
                'stroke-background',
                s.ring === 'upper' ? 'fill-border/45' : s.ring === 'club' ? 'fill-border/70' : 'fill-border/60',
              )}
              strokeWidth='0.8'
            />
          )
        })}

        {/* pitch */}
        <rect x='120' y='104' width='160' height='92' rx='7' className='fill-emerald-700 dark:fill-emerald-900' />
        <g clipPath='url(#pitch-clip)'>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={124 + i * 19} y='108' width='19' height='84' className={i % 2 ? 'fill-white/[0.06]' : 'fill-transparent'} />
          ))}
        </g>
        <g fill='none' stroke='rgba(255,255,255,.75)' strokeWidth='1'>
          <rect x='124' y='108' width='152' height='84' rx='5' />
          <line x1={CX} y1='108' x2={CX} y2='192' />
          <circle cx={CX} cy={CY} r='13' />
          <rect x='124' y='132' width='20' height='36' />
          <rect x='256' y='132' width='20' height='36' />
          <rect x='124' y='142' width='8' height='16' />
          <rect x='268' y='142' width='8' height='16' />
        </g>

        {/* category sections */}
        {SECTIONS.map((s) => {
          const cat = byKey.get(s.key)
          if (!cat) return null
          const active = activeId === cat.id
          const dim = activeId !== null && !active
          return (
            <path
              key={s.key}
              d={s.d}
              fill={cat.color}
              stroke={active ? '#fff' : 'rgba(0,0,0,.35)'}
              strokeWidth={active ? 1.8 : 0.8}
              opacity={dim ? 0.28 : hover === cat.id ? 1 : 0.92}
              className='cursor-pointer transition-opacity'
              role='button'
              tabIndex={0}
              aria-label={`${cat.name}, from ${money(cat.minPrice)}`}
              aria-pressed={active}
              onClick={() => toggle(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(cat.id)
                }
              }}
              onMouseEnter={() => setHover(cat.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(cat.id)}
              onBlur={() => setHover(null)}
            />
          )
        })}

        {/* labels (never intercept clicks) */}
        {labels.map((l) => {
          const dim = activeId !== null && activeId !== l.catId
          return (
            <text
              key={l.key}
              x={l.x}
              y={l.y}
              transform={`rotate(${l.rot.toFixed(1)} ${l.x.toFixed(1)} ${l.y.toFixed(1)})`}
              textAnchor='middle'
              fontSize='8'
              fontWeight={800}
              fill='#fff'
              stroke='rgba(0,0,0,.7)'
              strokeWidth='2.4'
              paintOrder='stroke'
              strokeLinejoin='round'
              opacity={dim ? 0.5 : 1}
              style={{ pointerEvents: 'none' }}
            >
              {l.text.map((t, i) => (
                <tspan
                  key={i}
                  x={l.x}
                  dy={i === 0 ? `${(-(l.text.length - 1) * LINE_H) / 2 + 3}px` : `${LINE_H}px`}
                  fontWeight={i === l.text.length - 1 ? 900 : 700}
                >
                  {t}
                </tspan>
              ))}
            </text>
          )
        })}
      </svg>
    </MapViewport>
  )
}
