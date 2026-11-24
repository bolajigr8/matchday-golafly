'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { prepareSeatingPlan, type PreparedPlan } from '@/features/matchday/seating-plan'
import { readableInk, type BlockPrice, type CategoryInfo } from '@/features/matchday/seats'
import { MapViewport } from './map-viewport'
import { useSeatingPlanSvg } from './use-seating-plan'

/* The fixture's real seating plan (the supplier SVG from event.svg_url),
 * like footballticket.net's map:
 *   • every block coloured by its category (the SVG's own data-category);
 *   • a price bubble on each block with tickets — the cheapest listing in
 *     that block, computed from the listings, with a green dot on the
 *     cheapest block of all;
 *   • "zone" mode: a click filters to that block's category;
 *     "block" mode: a click filters to that one block;
 *   • Reset, hover tooltip, zoom / pan / fullscreen (map-viewport.tsx).
 * The SVG goes through /api/seating-plan (CDN has no CORS) and
 * features/matchday/seating-plan.ts (removes the supplier's logo, sanitises,
 * namespaces ids/classes). If the plan can't be used, onPlan(null) tells the
 * page to fall back to the schematic oval (stadium-map.tsx). */

export interface PlanInfo {
  /** Category id → block keys the plan assigns to it. */
  blocksByCat: Map<number, string[]>
  /** Every block key on the plan. */
  blockKeys: Set<string>
}

type Mode = 'zone' | 'block'

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

/** Attribute value for a CSS selector. */
const q = (v: string | number) => JSON.stringify(String(v))

export function SeatingPlanMap({
  svgUrl,
  mode,
  categories,
  blockPrices,
  activeCatId,
  activeBlock,
  onSelectCategory,
  onSelectBlock,
  onPlan,
  currency,
}: {
  svgUrl: string
  mode: Mode
  categories: CategoryInfo[]
  /** From blockPricesFromListings() — upper-case block key → cheapest + count. */
  blockPrices: Map<string, BlockPrice>
  activeCatId: number | null
  activeBlock: string | null
  onSelectCategory: (id: number | null) => void
  onSelectBlock: (block: string | null, catId: number | null) => void
  /** Plan info once parsed, or null when there is no usable plan. */
  onPlan: (info: PlanInfo | null) => void
  currency: string | null
}) {
  // One prefix per rendered copy: the seats page renders this map twice
  // (mobile + desktop, one hidden). Shared ids would make the hidden copy's
  // gradients win, so each copy namespaces its own.
  const prefix = 'sp' + useId().replace(/[^a-zA-Z0-9]/g, '')

  const svg = useSeatingPlanSvg(svgUrl)

  const plan: PreparedPlan | null = useMemo(
    () => (svg.data ? prepareSeatingPlan(svg.data, prefix) : null),
    [svg.data, prefix],
  )

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const info: PlanInfo | null = useMemo(() => {
    if (!plan) return null
    const blocksByCat = new Map<number, string[]>()
    for (const b of plan.blocks) {
      if (b.categoryId === null) continue
      blocksByCat.set(b.categoryId, [...(blocksByCat.get(b.categoryId) ?? []), b.key])
    }
    if (!blocksByCat.size) return null // no category data in the SVG → unusable
    return { blocksByCat, blockKeys: new Set(plan.blocks.map((b) => b.key)) }
  }, [plan])

  // Unusable = failed fetch, unparsable SVG, no categories in it, or none of
  // this fixture's categories appear on it.
  const usable =
    !!info &&
    (categories.length === 0 || categories.some((c) => info.blocksByCat.has(c.id)))
  useEffect(() => {
    if (svg.isError) onPlan(null)
    else if (svg.data !== undefined) onPlan(usable ? info : null)
  }, [svg.isError, svg.data, usable, info, onPlan])

  const [hoverKey, setHoverKey] = useState<string | null>(null)

  /* Colours + selection state as one scoped stylesheet: no React re-render of
     the (large) SVG markup is ever needed. */
  const css = useMemo(() => {
    if (!plan) return ''
    const { block: B, shape: S, label: L } = plan.cls
    const rules: string[] = [
      `.${B} .${S}{fill:var(--plan-idle);stroke:var(--plan-line);transition:opacity .2s,fill-opacity .2s}`,
      `.${B} .${L}{fill:var(--plan-idle-ink);pointer-events:none}`,
      `.${B}{transition:opacity .2s}`,
    ]
    for (const c of categories) {
      if (c.listingCount === 0) continue
      const sel = `.${B}[data-cat=${q(c.id)}]`
      rules.push(`${sel} .${S}{fill:${c.color}}`, `${sel} .${L}{fill:${readableInk(c.color)}}`)
      if (mode === 'zone') rules.push(`${sel}{cursor:pointer}`, `${sel}:hover .${S}{fill-opacity:.8}`)
    }
    if (mode === 'block') {
      for (const key of blockPrices.keys()) {
        const sel = `.${B}[data-block=${q(key)}]`
        rules.push(`${sel}{cursor:pointer}`, `${sel}:hover .${S}{fill-opacity:.8}`)
      }
    }
    if (activeBlock) {
      rules.push(
        `.${B}:not([data-block=${q(activeBlock.toUpperCase())}]){opacity:.28}`,
        `.${B}[data-block=${q(activeBlock.toUpperCase())}] .${S}{stroke:var(--plan-active);stroke-width:4px}`,
      )
    } else if (activeCatId !== null) {
      rules.push(`.${B}:not([data-cat=${q(activeCatId)}]){opacity:.28}`)
    }
    // Size: as wide as the column allows, but never taller than the screen
    // (the whole stadium stays visible while scrolling the listings).
    const [, , w, h] = plan.viewBox.split(/[\s,]+/).map(Number)
    const ratio = w > 0 && h > 0 ? w / h : 4 / 3
    rules.push(
      `.${B}-frame{width:min(100%,calc((100dvh - 15rem) * ${ratio.toFixed(4)}))}`,
      `[data-full="true"] .${B}-frame{width:min(100%,calc((100dvh - 7rem) * ${ratio.toFixed(4)}))}`,
    )
    return rules.join('\n')
  }, [plan, categories, mode, blockPrices, activeBlock, activeCatId])

  const html = useMemo(() => (plan ? { __html: plan.markup } : undefined), [plan])
  const [vbX, vbY, vbW, vbH] = useMemo(() => {
    const n = (plan?.viewBox ?? '0 0 4 3').split(/[\s,]+/).map(Number)
    return n.length === 4 && n.every(Number.isFinite) ? n : [0, 0, 4, 3]
  }, [plan])

  /* Measure the rendered map width so bubble text can be a fixed on-screen
     size. Layout width ignores the zoom transform, so zooming in still
     enlarges bubbles together with the map. */
  const [frameW, setFrameW] = useState(0)
  const roRef = useRef<ResizeObserver | null>(null)
  const frameRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    roRef.current = null
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setFrameW(Math.round(entry.contentRect.width)))
    ro.observe(el)
    roRef.current = ro
  }, [])
  useEffect(() => () => roRef.current?.disconnect(), [])

  const cheapest = useMemo(() => {
    let min = Infinity
    for (const p of blockPrices.values()) min = Math.min(min, p.minPrice)
    return min
  }, [blockPrices])

  /* Price bubbles: ~11.5px text on screen whatever the map's size or the
     supplier canvas (was a fixed fraction of the canvas, so stadiums drawn
     on large canvases got unreadable "€27" specks). */
  const bubbles = useMemo(() => {
    if (!plan) return []
    const BUBBLE_TEXT_PX = 11.5
    const fs = frameW > 0 ? (BUBBLE_TEXT_PX * vbW) / frameW : vbW / 60
    const candidates = plan.blocks.flatMap((b) => {
      const price = blockPrices.get(b.key)
      if (!price || !b.box) return []
      const text = shortPrice(price.minPrice, currency)
      const isLow = price.minPrice === cheapest
      const w = text.length * fs * 0.62 + fs * (isLow ? 1.9 : 1.1)
      const h = fs * 1.55
      // (no "must fit inside the block" rule: like FTN, a bubble may sit over
      // a small block; the overlap check below keeps bubbles apart)
      // keep the whole bubble inside the plan, even for edge blocks
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
      return [{
        key: b.key,
        cat: b.categoryId,
        x: clamp(b.box.x + b.box.w / 2, vbX + w / 2 + fs * 0.2, vbX + vbW - w / 2 - fs * 0.2),
        y: clamp(b.box.y + b.box.h / 2, vbY + h / 2 + fs * 0.2, vbY + vbH - h / 2 - fs * 0.2),
        w,
        h,
        fs,
        text,
        isLow,
        price: price.minPrice,
      }]
    })
    // Never let bubbles sit on top of each other (rows of narrow boxes
    // produced "€2,733 33 33 33…"): place the cheapest first and skip any
    // bubble that would overlap one already placed. Its price stays
    // available on hover and when zoomed into the block.
    const gap = fs * 0.25
    const placed: typeof candidates = []
    for (const c of [...candidates].sort((a, b) => a.price - b.price)) {
      const hit = placed.some(
        (p) => Math.abs(p.x - c.x) < (p.w + c.w) / 2 + gap && Math.abs(p.y - c.y) < (p.h + c.h) / 2 + gap,
      )
      if (!hit) placed.push(c)
    }
    return placed
  }, [plan, blockPrices, currency, cheapest, vbX, vbY, vbW, vbH, frameW])

  const blockOf = (target: EventTarget | null) =>
    target instanceof Element ? (target.closest('[data-block]') as HTMLElement | SVGElement | null) : null

  function onClick(e: React.MouseEvent) {
    const g = blockOf(e.target)
    if (!g) return
    const key = g.dataset.block ?? ''
    const cat = g.dataset.cat ? Number(g.dataset.cat) : null
    if (mode === 'zone') {
      if (cat === null || !catById.get(cat)?.listingCount) return
      onSelectCategory(activeCatId === cat ? null : cat)
    } else {
      if (!blockPrices.has(key)) return
      onSelectBlock(activeBlock?.toUpperCase() === key ? null : key, cat)
    }
  }

  const hoverPrice = hoverKey ? blockPrices.get(hoverKey) : undefined
  const hoverCatId = hoverKey ? plan?.blocks.find((b) => b.key === hoverKey)?.categoryId ?? null : null
  const hoverCat = hoverCatId !== null ? catById.get(hoverCatId) : undefined
  const money = (n: number) => formatMatchdayMoney(n, currency ?? 'EUR')
  const filtered = activeCatId !== null || activeBlock !== null

  if (svg.isLoading || (!plan && !svg.isError && svg.data === undefined)) {
    return (
      <div className='flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted/40'>
        <Loader2 className='size-5 animate-spin text-brand-text' />
        <p className='text-xs text-muted-foreground'>Loading the stadium plan…</p>
      </div>
    )
  }
  if (!plan || !usable) return null // the page shows the fallback map

  return (
    <MapViewport
      className='[--plan-active:#111827] [--plan-idle-ink:#52525b] [--plan-idle:#d4d4d8] [--plan-line:#ffffff] dark:[--plan-active:#ffffff] dark:[--plan-idle-ink:#a1a1aa] dark:[--plan-idle:#3f3f46] dark:[--plan-line:#18181b]'
      overlay={
        <>
          {filtered && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onSelectCategory(null)
              }}
              className='absolute left-2 top-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm hover:border-primary/50'
            >
              <RotateCcw className='size-3.5' /> Reset
            </button>
          )}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-md backdrop-blur transition-opacity',
              hoverKey ? 'opacity-100' : 'opacity-0',
            )}
          >
            {hoverKey && (
              <div className='flex items-center justify-between gap-3'>
                <span className='flex min-w-0 items-center gap-2 font-semibold text-foreground'>
                  {hoverCat && (
                    <span className='size-2.5 shrink-0 rounded-sm' style={{ background: hoverCat.color }} />
                  )}
                  <span className='truncate'>
                    Block {hoverKey}
                    {hoverCat ? ` · ${hoverCat.name}` : ''}
                  </span>
                </span>
                <span className='shrink-0 text-muted-foreground'>
                  {hoverPrice ? (
                    <>
                      from <b className='text-foreground'>{money(hoverPrice.minPrice)}</b> ·{' '}
                      {hoverPrice.count} listing{hoverPrice.count === 1 ? '' : 's'}
                    </>
                  ) : (
                    'No tickets listed'
                  )}
                </span>
              </div>
            )}
          </div>
        </>
      }
    >
      <div
        ref={frameRef}
        className={cn('relative mx-auto', `${plan.cls.block}-frame`)}
        style={{ aspectRatio: `${vbW} / ${vbH}` }}
        role='group'
        aria-label={
          mode === 'zone'
            ? 'Stadium seating plan. Select a block to filter listings by its category.'
            : 'Stadium seating plan. Select a block to see its listings.'
        }
      >
        <style>{css}</style>
        <div
          className='absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full'
          onClick={onClick}
          onMouseOver={(e) => setHoverKey(blockOf(e.target)?.dataset.block ?? null)}
          onMouseLeave={() => setHoverKey(null)}
          dangerouslySetInnerHTML={html}
        />
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio='xMidYMid meet'
          className='pointer-events-none absolute inset-0 h-full w-full'
          aria-hidden
        >
          {bubbles.map((b) => {
            const active = activeBlock?.toUpperCase() === b.key
            const dim = activeBlock
              ? !active
              : activeCatId !== null && b.cat !== activeCatId
            return (
              <g key={b.key} opacity={dim ? 0.25 : 1}>
                <rect
                  x={b.x - b.w / 2}
                  y={b.y - b.h / 2}
                  width={b.w}
                  height={b.h}
                  rx={b.h / 2}
                  fill={active ? '#111827' : '#ffffff'}
                  stroke='rgba(0,0,0,.25)'
                  strokeWidth={b.fs * 0.08}
                />
                {b.isLow && (
                  <circle cx={b.x - b.w / 2 + b.fs * 0.75} cy={b.y} r={b.fs * 0.3} fill='#16a34a' />
                )}
                <text
                  x={b.isLow ? b.x + b.fs * 0.35 : b.x}
                  y={b.y}
                  dominantBaseline='central'
                  textAnchor='middle'
                  fontSize={b.fs}
                  fontWeight={800}
                  fill={active ? '#ffffff' : '#111827'}
                >
                  {b.text}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </MapViewport>
  )
}
