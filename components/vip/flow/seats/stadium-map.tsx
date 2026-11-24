'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Maximize2, ZoomIn } from 'lucide-react'
import type { PreparedPlan } from '@/features/matchday/seating-plan'
import { vipEventView } from '@/features/vip/clubs'
import type { VipEvent, VipListing } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import { listingBlocks } from '@/features/vip/plan'
import { cn } from '@/lib/utils'

/* "Stadium map" card (Figma 506:3745) with "VIP · Stadium map (intro)"
 * (537:4413, 14 steps): a ball drops onto the home crest, bounces to the
 * away crest and back, rises and vanishes; the crests close in behind a
 * glowing "VS"; then the stadium settles ("VIP · Map zone glow" 513:5929).
 *
 * Adapted to the backend (no invented positions):
 *   · the stadium is the event's real seating plan (svg_url, the same file
 *     the main Matchday seats page draws), shown once the intro ends;
 *   · the VIP blocks are the listings' category.seating_blocks (and
 *     seat_details.block): they glow gold, the rest of the stadium is dim;
 *   · one price pin per hospitality category ("By zone"), or the block
 *     names ("By block"), placed at the real blocks' position;
 *   · clicking a pin or a gold block filters the list to that category.
 * Without a usable plan (no svg_url, file missing, or no VIP block on it),
 * the Figma stadium stays and says so: nothing is placed by guesswork.
 *
 * The intro is drawn on Figma's 550 × 470 canvas, scaled to the card. */

const W = 550
const H = 470

/* The zoom: a slow, soft camera move (ease-out-expo-like). */
const ZOOM_EASE = { duration: 1.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }

/* Step times (s) for the 14 Figma steps. */
const T = [0, 0.5, 0.62, 1.0, 1.38, 1.5, 1.88, 2.26, 2.38, 2.7, 2.95, 3.3, 4.0, 4.4]
const DURATION = T[T.length - 1]
const times = T.map((t) => t / DURATION)

/** "VIP_Players-Zone_4" → "Players-Zone 4" (for labels only). */
const blockLabel = (b: string) => b.replace(/^VIP[_-]?/i, '').replace(/_/g, ' ').trim()

/** Scale of the 550px canvas inside the card. */
function useCanvasScale() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, scale }
}

interface Zone {
  /** Category name: the list's filter value. */
  category: string
  minPrice: number
  currency: string
  blocks: string[]
  /** Pin position on the 550 × 470 canvas. */
  x: number
  y: number
}

export function VipStadiumMap({
  event,
  listings,
  selected,
  focus,
  plan,
  planLoading,
  activeCategory,
  onPickCategory,
  className,
}: {
  event: VipEvent
  /** VIP tickets on sale (pins show their prices). */
  listings: VipListing[]
  /** The ticket already in the package, if any: tagged "Your seats". */
  selected: VipListing | undefined
  /** The ticket card being hovered: its blocks light up. */
  focus?: VipListing | null
  /** The match's seating plan, prepared once by the page (features/vip/plan). */
  plan: PreparedPlan | null
  planLoading: boolean
  /** The list's category filter ('all' or a category name). */
  activeCategory: string
  onPickCategory: (category: string) => void
  className?: string
}) {
  const reduce = useReducedMotion()
  const { ref, scale } = useCanvasScale()
  const [mode, setMode] = useState<'zone' | 'block'>('zone')
  const [introDone, setIntroDone] = useState(false)
  const done = introDone || !!reduce
  const play = !reduce
  const anim = (values: number[]) => (play ? values : values[values.length - 1])
  const tr = { duration: DURATION, times, ease: 'easeInOut' as const }

  /* ── The real plan ── */
  const prefix = 'vip' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const svgUrl = event.svg_url || null

  /* Fit of the plan's viewBox inside the canvas (preserveAspectRatio meet). */
  const fit = useMemo(() => {
    const n = (plan?.viewBox ?? '').split(/[\s,]+/).map(Number)
    if (n.length !== 4 || !n.every(Number.isFinite) || n[2] <= 0 || n[3] <= 0) return null
    const [vx, vy, vw, vh] = n
    const s = Math.min(W / vw, H / vh)
    return { vx, vy, s, ox: (W - vw * s) / 2, oy: (H - vh * s) / 2 }
  }, [plan])

  /* Hospitality zones: one per category, at the centre of its real blocks. */
  const { zones, vipBlocks, blockPins, vipBox } = useMemo(() => {
    const empty = {
      zones: [] as Zone[],
      vipBlocks: new Set<string>(),
      blockPins: [] as { key: string; x: number; y: number; category: string }[],
      vipBox: null as { x0: number; y0: number; x1: number; y1: number } | null,
    }
    if (!plan || !fit) return empty
    const boxByKey = new Map(plan.blocks.filter((b) => b.box).map((b) => [b.key, b.box!]))
    const byCat = new Map<string, Zone>()
    const vip = new Set<string>()
    const pins: { key: string; x: number; y: number; category: string }[] = []
    for (const l of listings) {
      const blocks = listingBlocks(l).filter((b) => boxByKey.has(b))
      if (!blocks.length) continue
      const name = l.category.category_name
      const z = byCat.get(name)
      const price = l.price_details.price_per_ticket
      if (z) {
        z.minPrice = Math.min(z.minPrice, price)
        z.blocks = [...new Set([...z.blocks, ...blocks])]
      } else {
        byCat.set(name, { category: name, minPrice: price, currency: l.price_details.currency, blocks, x: 0, y: 0 })
      }
      blocks.forEach((b) => vip.add(b))
    }
    const toCanvas = (x: number, y: number) => ({ x: fit.ox + (x - fit.vx) * fit.s, y: fit.oy + (y - fit.vy) * fit.s })
    let all: { x0: number; y0: number; x1: number; y1: number } | null = null
    for (const z of byCat.values()) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const b of z.blocks) {
        const box = boxByKey.get(b)!
        x0 = Math.min(x0, box.x); y0 = Math.min(y0, box.y)
        x1 = Math.max(x1, box.x + box.w); y1 = Math.max(y1, box.y + box.h)
        const c = toCanvas(box.x + box.w / 2, box.y + box.h / 2)
        pins.push({ key: b, x: c.x, y: c.y, category: z.category })
      }
      const c = toCanvas((x0 + x1) / 2, (y0 + y1) / 2)
      z.x = c.x
      z.y = c.y
      const a = toCanvas(x0, y0)
      const b = toCanvas(x1, y1)
      all = all
        ? { x0: Math.min(all.x0, a.x), y0: Math.min(all.y0, a.y), x1: Math.max(all.x1, b.x), y1: Math.max(all.y1, b.y) }
        : { x0: a.x, y0: a.y, x1: b.x, y1: b.y }
    }
    return { zones: [...byCat.values()], vipBlocks: vip, blockPins: pins, vipBox: all }
  }, [plan, fit, listings])

  const usable = !!plan && zones.length > 0
  const planState: 'loading' | 'ready' | 'none' = !svgUrl
    ? 'none'
    : planLoading
      ? 'loading'
      : usable
        ? 'ready'
        : 'none'
  const showPlan = done && planState === 'ready'

  /* "Zoom to VIP seats" (default): the plan is enlarged around the VIP
     blocks, which are often thin strips beside the pitch; "Whole stadium"
     shows the full plan. The pins follow the same transform. */
  /* A short guided tour, then the customer is in control:
       whole stadium → (1s) glide in to the VIP seats → hold ~4s → glide back
       to the whole stadium. The button switches between the two views at any
       time; pressing it ends the tour. */
  const [userZoom, setUserZoom] = useState<boolean | null>(null)
  const [autoZoom, setAutoZoom] = useState(false)
  const zoomed = userZoom ?? autoZoom
  useEffect(() => {
    if (!showPlan || userZoom !== null) return
    const zoomIn = window.setTimeout(() => setAutoZoom(true), 1000)
    const zoomOut = window.setTimeout(() => setAutoZoom(false), 1000 + ZOOM_EASE.duration * 1000 + 4000)
    return () => {
      window.clearTimeout(zoomIn)
      window.clearTimeout(zoomOut)
    }
  }, [showPlan, userZoom])
  const zoom = useMemo(() => {
    if (!zoomed || !vipBox) return { z: 1, tx: 0, ty: 0 }
    const bw = Math.max(vipBox.x1 - vipBox.x0, 1)
    const bh = Math.max(vipBox.y1 - vipBox.y0, 1)
    const z = Math.min(Math.max(Math.min(W / bw, H / bh) * 0.45, 1), 2.4)
    const cx = (vipBox.x0 + vipBox.x1) / 2
    const cy = (vipBox.y0 + vipBox.y1) / 2
    /* Centre the VIP area, but never pull the plan's edge into view. */
    const tx = Math.min(0, Math.max(W - W * z, W / 2 - z * cx))
    const ty = Math.min(0, Math.max(H - H * z, H / 2 - z * cy))
    return { z, tx, ty }
  }, [zoomed, vipBox])
  const at = useCallback(<P extends { x: number; y: number }>(p: P): P => ({ ...p, x: zoom.tx + zoom.z * p.x, y: zoom.ty + zoom.z * p.y }), [zoom])

  /* Pins never sit on top of each other (cheapest placed first). */
  const placedZones = useMemo(
    () => placeApart(zones.map((z) => at({ ...z, text: formatVipPrice(z.minPrice, z.currency) })), (z) => z.minPrice),
    [zones, at],
  )
  const placedBlocks = useMemo(
    () => placeApart(blockPins.map((p) => at({ ...p, text: blockLabel(p.key) })), (p) => p.y * 10_000 + p.x),
    [blockPins, at],
  )

  const litCategory =
    focus?.category.category_name ?? selected?.category.category_name ?? (activeCategory === 'all' ? null : activeCategory)
  const litBlocks = useMemo(() => {
    if (focus) return new Set(listingBlocks(focus))
    if (selected) return new Set(listingBlocks(selected))
    const z = zones.find((x) => x.category === litCategory)
    return new Set(z?.blocks ?? [])
  }, [focus, selected, zones, litCategory])

  /* One scoped stylesheet colours the plan: no re-render of its markup. */
  const css = useMemo(() => {
    if (!plan) return ''
    const { block: B, shape: S, label: L } = plan.cls
    const q = (v: string) => JSON.stringify(v)
    const rules = [
      `.${B} .${S}{fill:#34302a;stroke:#1b1916;stroke-width:1px;transition:fill .25s,opacity .25s}`,
      `.${B} .${L}{fill:#8f8778;pointer-events:none}`,
      `.${B}{opacity:.55}`,
    ]
    for (const k of vipBlocks) {
      rules.push(
        `.${B}[data-block=${q(k)}]{opacity:1;cursor:pointer}`,
        `.${B}[data-block=${q(k)}] .${S}{fill:rgba(212,178,106,.85);stroke:#f3d68f;stroke-width:1.5px;vector-effect:non-scaling-stroke}`,
        `.${B}[data-block=${q(k)}] .${L}{fill:#111}`,
      )
    }
    for (const k of litBlocks) {
      /* Static highlight (an animated filter on this large SVG repainted it
         every frame and made the page lag). */
      rules.push(`.${B}[data-block=${q(k)}] .${S}{fill:#f0d79b;stroke:#fff6dc;stroke-width:2px;vector-effect:non-scaling-stroke}`)
    }
    rules.push(`.${prefix}-plan svg{display:block;width:100%;height:100%}`)
    return rules.join('\n')
  }, [plan, vipBlocks, litBlocks, prefix])

  const html = useMemo(() => (plan ? { __html: plan.markup } : undefined), [plan])

  const onPlanClick = (e: React.MouseEvent) => {
    const g = e.target instanceof Element ? (e.target.closest('[data-block]') as HTMLElement | SVGElement | null) : null
    const key = g?.dataset.block
    if (!key || !vipBlocks.has(key)) return
    const z = zones.find((x) => x.blocks.includes(key))
    if (z) onPickCategory(z.category)
  }

  const home = event.team1.name
  const away = event.team2.name

  return (
    <section
      aria-labelledby='vip-map-title'
      className={cn('flex flex-col gap-4 rounded-[22px] border border-vip-line/8 bg-vip-tint/3 p-5', className)}
    >
      <div className='flex items-center justify-between gap-3'>
        <h2 id='vip-map-title' className='font-heading text-[18px] font-bold leading-[normal] text-vip-chalk'>
          Stadium map
        </h2>
        {/* "VIP · Map toggle" (513:4566) */}
        <div role='radiogroup' aria-label='Map labels' className='flex rounded-full bg-vip-line/5 p-[3px]'>
          {(['zone', 'block'] as const).map((m) => (
            <button
              key={m}
              type='button'
              role='radio'
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              disabled={!usable}
              className={cn(
                'rounded-full px-3.5 py-[7px] text-[12.5px] font-semibold leading-[normal] transition-colors disabled:opacity-50',
                mode === m
                  ? 'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111]'
                  : 'text-vip-mist hover:text-vip-chalk',
              )}
            >
              {m === 'zone' ? 'By zone' : 'By block'}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className='dark relative aspect-[550/470] w-full overflow-hidden rounded-2xl bg-[#0a0a09]'>
        {showPlan && vipBox && (
          <button
            type='button'
            onClick={() => setUserZoom(!zoomed)}
            aria-pressed={zoomed}
            className='absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-vip-gold/60 bg-[#0d0d0d]/95 px-3.5 py-2 text-[12.5px] font-semibold leading-[normal] text-vip-gold-text shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#1a1712]'
          >
            {zoomed ? (
              <Maximize2 aria-hidden className='size-3.5' strokeWidth={2.25} />
            ) : (
              <ZoomIn aria-hidden className='size-3.5' strokeWidth={2.25} />
            )}
            {zoomed ? 'Whole stadium' : 'Zoom to VIP seats'}
          </button>
        )}
        <div className='absolute left-0 top-0 origin-top-left' style={{ width: W, height: H, transform: `scale(${scale})` }}>
          {/* ── Figma stadium + intro (fades out when the real plan is in) ── */}
          <motion.div className='absolute inset-0' initial={false} animate={{ opacity: showPlan ? 0 : 1 }} transition={{ duration: 0.6 }}>
            <div className='absolute left-[25px] top-[25px] h-[420px] w-[500px] rounded-[190px] border border-vip-line/5 bg-[#292621]' />
            <div className='absolute left-[65px] top-[65px] h-[340px] w-[420px] rounded-[150px] border border-vip-line/5 bg-[#363026]' />
            <div className='absolute left-[105px] top-[104px] h-[262px] w-[340px] rounded-[110px] border border-vip-line/5 bg-[#453d2e]' />
            <div className='absolute left-[155px] top-[155px] h-[160px] w-[240px] overflow-hidden rounded-lg border border-vip-line/30 bg-[#122b1c]'>
              <div className='absolute left-[120px] top-0 h-full w-px bg-vip-line/30' />
              <div className='absolute left-[98px] top-[58px] size-11 rounded-full border border-vip-line/30' />
              <div className='absolute -left-px top-[40px] h-20 w-9 border border-vip-line/30' />
              <div className='absolute -right-px top-[40px] h-20 w-9 border border-vip-line/30' />
            </div>

            {/* Glow behind VS: 60 → 200px, transparent → 35% gold. */}
            <motion.div
              aria-hidden
              className='absolute left-[175px] top-[135px] size-[200px] rounded-full bg-vip-gold/35 blur-[40px]'
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{
                scale: anim([0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 1, 1, 1]),
                opacity: anim([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1]),
              }}
              transition={tr}
            />

            <Crest
              side='home'
              src={vipEventView(event).homeCrest ?? undefined}
              name={home}
              play={play}
              tr={tr}
              dx={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0]}
              scale={[1, 1, 1.19, 1, 1, 1, 1, 1, 1.19, 1, 1, 1, 0.69, 0.69]}
              rotate={[0, 0, 12, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0]}
            />
            <Crest
              side='away'
              src={vipEventView(event).awayCrest ?? undefined}
              name={away}
              play={play}
              tr={tr}
              dx={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -10, 0, 0]}
              scale={[1, 1, 1, 1, 1, 1.19, 1, 1, 1, 1, 1, 1, 0.69, 0.69]}
              rotate={[0, 0, 0, 0, 0, -12, 0, 0, 0, 0, 0, 0, 0, 0]}
            />

            {/* Ball: centre points from the 11 moving steps. */}
            {play && (
              <motion.div
                aria-hidden
                className='absolute left-0 top-0 size-[18px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#c7c7c2)] shadow-[0_5px_8px_rgba(0,0,0,0.55)]'
                initial={{ x: 204, y: -39 }}
                animate={{
                  x: [213, 213, 216, 275, 337, 334, 275, 213, 216, 275, 275.5, 275.5, 275.5, 275.5].map((c) => c - 9),
                  y: [-30, 193, 188, 85, 193, 188, 85, 193, 188, 165, 235.5, 235.5, 235.5, 235.5].map((c) => c - 9),
                  scale: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.17, 0.17, 0.17, 0.17],
                  opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                }}
                transition={tr}
              >
                <span className='absolute left-[6px] top-[5px] size-[6px] rotate-45 bg-[#1f1f1f]' />
              </motion.div>
            )}

            {/* VS: 18 → 66px and back. */}
            {play && (
              <motion.span
                aria-hidden
                className='absolute left-[242px] top-[201px] flex h-[69px] w-[66px] items-center justify-center bg-linear-to-b from-[#ffedbf] to-vip-gold bg-clip-text font-heading text-[52px] font-bold leading-none text-transparent [filter:drop-shadow(0_0_20px_rgba(212,178,106,0.8))]'
                initial={{ opacity: 0, scale: 0.27 }}
                animate={{
                  opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
                  scale: [0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 1, 0.27, 0.27],
                }}
                transition={tr}
                onAnimationComplete={() => setIntroDone(true)}
              >
                VS
              </motion.span>
            )}

            <motion.span
              aria-hidden
              className='absolute left-[175px] top-[285px] w-[200px] text-center font-mono text-[10px] font-medium leading-[normal] tracking-[2px] text-vip-fg'
              initial={{ opacity: 0 }}
              animate={{ opacity: anim([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.35, 0.35]) }}
              transition={tr}
            >
              <span className='block truncate'>{event.venue.venue_name.toUpperCase()}</span>
            </motion.span>

            {done && planState !== 'ready' && (
              <span className='absolute bottom-[18px] left-0 w-full text-center text-[12px] leading-[normal] text-vip-mist'>
                {planState === 'loading' ? 'Loading the seating plan…' : 'The seating plan isn’t available for this match.'}
              </span>
            )}
          </motion.div>

          {/* ── The real seating plan ── */}
          {plan && usable && (
            <motion.div
              className='absolute inset-0'
              initial={{ opacity: 0 }}
              animate={{ opacity: showPlan ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ pointerEvents: showPlan ? 'auto' : 'none' }}
            >
              <style>{css}</style>
              {/* translate + scale from the top-left corner, eased like a
                  camera move (same curve for the pins below). */}
              <motion.div
                className={cn('absolute inset-0', `${prefix}-plan`)}
                style={{ transformOrigin: '0 0', willChange: 'transform' }}
                initial={false}
                animate={{ x: zoom.tx, y: zoom.ty, scale: zoom.z }}
                transition={ZOOM_EASE}
                dangerouslySetInnerHTML={html}
                onClick={onPlanClick}
              />

              {/* Price pins (By zone) or block names (By block). */}
              {(mode === 'zone' ? placedZones : placedBlocks).map((p) => {
                const category = 'category' in p ? p.category : ''
                const lit = litCategory === category
                return (
                  <motion.button
                    key={'key' in p ? p.key : category}
                    type='button'
                    onClick={() => onPickCategory(category)}
                    tabIndex={showPlan ? 0 : -1}
                    aria-label={`${category}${'minPrice' in p ? `, from ${p.text}` : `, block ${p.text}`}. Show these tickets`}
                    className={cn(
                      'absolute flex h-[27px] -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold leading-[normal] transition-[background-color,color,box-shadow] hover:brightness-110',
                      lit
                        ? 'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111] shadow-[0_4px_16px_rgba(212,178,106,0.5)]'
                        : 'border border-vip-gold/55 bg-[#0d0d0d]/92 text-vip-gold-text',
                    )}
                    initial={false}
                    animate={{ left: p.x, top: p.y }}
                    transition={ZOOM_EASE}
                  >
                    {p.text}
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {selected && (
            <motion.div
              className='absolute left-[24px] top-[398px] flex w-[230px] flex-col gap-0.5 rounded-xl border border-vip-gold/70 bg-[#0f0f0d]/95 px-3 py-2'
              initial={{ opacity: 0, y: 8 }}
              animate={
                done
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: anim([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]),
                      y: anim([8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0]),
                    }
              }
              transition={done ? { duration: 0.35 } : tr}
            >
              <span className='font-mono text-[9.5px] font-medium leading-[normal] tracking-[1.33px] text-vip-gold-text'>
                YOUR SEATS
              </span>
              <span className='truncate text-[12.5px] font-semibold leading-[normal] text-vip-fg'>
                {selected.category.category_name}
                {selected.seat_details.block?.trim() ? ` · ${blockLabel(selected.seat_details.block)}` : ''}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <ul className='flex flex-wrap items-center gap-x-[18px] gap-y-2'>
        {[
          { label: selected ? 'Your seats' : 'Selected', dot: 'bg-vip-gold/95' },
          { label: 'VIP hospitality', dot: 'bg-vip-gold/45' },
          { label: 'Other areas', dot: 'bg-[#34302a]' },
        ].map((l) => (
          <li key={l.label} className='flex items-center gap-2 text-[12.5px] leading-[normal] text-vip-mist'>
            <span aria-hidden className={cn('size-[9px] rounded-full', l.dot)} />
            {l.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Keeps pins apart: places them in `order`, skipping any that would
 *  overlap one already placed (its zone stays clickable on the plan). */
function placeApart<P extends { x: number; y: number; text: string }>(pins: P[], order: (p: P) => number): P[] {
  const placed: P[] = []
  const width = (p: P) => p.text.length * 7 + 20
  for (const p of [...pins].sort((a, b) => order(a) - order(b))) {
    const hit = placed.some((q) => Math.abs(q.x - p.x) < (width(q) + width(p)) / 2 + 4 && Math.abs(q.y - p.y) < 31)
    if (!hit) placed.push(p)
  }
  return placed
}

function Crest({
  side,
  src,
  name,
  play,
  tr,
  dx,
  scale,
  rotate,
}: {
  side: 'home' | 'away'
  src: string | undefined
  name: string
  play: boolean
  tr: { duration: number; times: number[]; ease: 'easeInOut' }
  dx: number[]
  scale: number[]
  rotate: number[]
}) {
  const left = side === 'home' ? 181 : 305
  const opacity = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.22, 0.22]
  const last = (v: number[]) => v[v.length - 1]
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
  return (
    <motion.div
      aria-hidden
      className='absolute top-[203px] flex size-16 items-center justify-center [filter:drop-shadow(0_6px_10px_rgba(0,0,0,0.6))]'
      style={{ left }}
      initial={{ x: 0, scale: 1, rotate: 0, opacity: 1 }}
      animate={
        play
          ? { x: dx, scale, rotate, opacity }
          : { x: last(dx), scale: last(scale), rotate: last(rotate), opacity: last(opacity) }
      }
      transition={tr}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt='' width={64} height={64} className='size-16 object-contain' />
      ) : (
        <span className='flex size-16 items-center justify-center rounded-full border-2 border-vip-gold/80 bg-vip-sunken font-heading text-[16px] font-bold text-vip-gold-text'>
          {initials}
        </span>
      )}
    </motion.div>
  )
}
