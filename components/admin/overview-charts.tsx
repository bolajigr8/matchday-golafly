'use client'

import type { SeriesPoint } from '@/features/admin/overview'
import { currencySymbol } from '@/lib/money'

/* Hand-rolled SVG rather than a charting dependency — matchday has none, and
   two static forms do not justify introducing one. Geometry mirrors
   design/gen-overview-card.mjs, which is the approved card's source.

   Shared rules, both charts:
   · Y always starts at zero.
   · Bars carry a 4px rounded top and a square baseline — the rounding marks
     where the DATA ends, the flat end sits on zero.
   · A 2px surface gap separates stacked segments, so each boundary is a real
     edge rather than a colour change.
   · Numerals are tabular; text wears an ink token, never the series colour.
   · Money is labelled with its SYMBOL (€12k), never the code (EUR 12k). */

/** One colour per stream, assigned in NAV ORDER — never by revenue rank.
 *  Rank moves week to week, and colour that follows it repaints the whole
 *  dashboard every time a stream has a good month. The sidebar's group dots
 *  use the same three tokens; keep them in step. */
export const STREAM_COLOR = {
  tickets: 'var(--chart-1)',
  camps: 'var(--chart-2)',
  travel: 'var(--chart-3)',
} as const

/** "Nice" axis maximum at or above the tallest bar, so the top gridline is a
 *  round number instead of whatever the data happened to reach. */
function niceMax(value: number): number {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    const candidate = step * magnitude
    if (candidate >= value) return candidate
  }
  return 10 * magnitude
}

const round = (v: number) => Number(v.toFixed(2))

/** A bar segment. `roundTop` only on the topmost of a stack, because a
 *  rounded join mid-stack reads as two separate bars. */
function segPath(
  x: number,
  w: number,
  yBottom: number,
  yTop: number,
  roundTop: boolean,
): string {
  const h = yBottom - yTop
  if (h <= 0.4) return '' // a sub-pixel sliver is noise, not data
  if (!roundTop) {
    return `M${x} ${yBottom} L${x} ${yTop} L${x + w} ${yTop} L${x + w} ${yBottom} Z`
  }
  const r = Math.min(4, h / 2, w / 2)
  return (
    `M${x} ${yBottom} L${x} ${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} ` +
    `L${x + w - r} ${yTop} Q${x + w} ${yTop} ${x + w} ${yTop + r} L${x + w} ${yBottom} Z`
  )
}

/* ── Stacked revenue ────────────────────────────────────────────────────────
   Buckets may be days or weeks — /v1/overview's `weekly_chart` is currently
   daily despite its name — so nothing here assumes a period. The caller
   passes the caption, which is derived from the data in
   features/admin/overview.ts. */

const VW = 620
const CH = 300
const BASE = 268
const TOP = 22
const GX = 42
const PLOT = VW - GX - 10
const BW = 26
const SEG_GAP = 2

export function StackedRevenueBars({
  points: weeks,
  currency,
  caption,
}: {
  points: SeriesPoint[]
  currency: string
  /** Human phrase describing the buckets, e.g. "Current week, by day". */
  caption: string
}) {
  if (weeks.length === 0) return null

  const gw = PLOT / weeks.length
  const max = niceMax(Math.max(...weeks.map((w) => w.total)))
  const scale = (v: number) => BASE - (v / max) * (BASE - TOP)
  const symbol = currencySymbol(currency)

  /* Five gridlines including zero, at round fractions of the nice maximum. */
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)

  /* Streams stack bottom-to-top in nav order. A stream whose value is null is
     not part of this chart, so the stack is as many bands as are measured —
     the chart is honest about its own coverage rather than reserving an empty
     slot for a stream it cannot measure. */
  const bands = [
    { key: 'tickets' as const, color: STREAM_COLOR.tickets },
    { key: 'camps' as const, color: STREAM_COLOR.camps },
    { key: 'travel' as const, color: STREAM_COLOR.travel },
  ]

  const compact = (v: number) =>
    v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))

  return (
    <svg
      viewBox={`0 0 ${VW} ${CH}`}
      width='100%'
      height={CH}
      preserveAspectRatio='xMidYMid meet'
      role='img'
      aria-label={`Gross revenue by stream, in ${currency}. ${caption}. Stacked.`}
    >
      {ticks.map((v) => {
        const y = round(scale(v))
        return (
          <g key={v}>
            <line
              x1={GX}
              x2={round(GX + PLOT)}
              y1={y}
              y2={y}
              stroke='var(--edge)'
              strokeWidth='1'
            />
            <text
              x={GX - 8}
              y={round(y + 3.5)}
              textAnchor='end'
              className='fill-[var(--muted-foreground)] font-mono text-[8.5px]'
            >
              {compact(v)}
            </text>
          </g>
        )
      })}

      {weeks.map((week, i) => {
        const cx = GX + gw * i + gw / 2
        const x = round(cx - BW / 2)

        const measured = bands.filter((b) => week[b.key] !== null)
        let cum = 0
        const stack = measured.map((b) => {
          const value = (week[b.key] as number) ?? 0
          const from = cum
          cum += value
          return { color: b.color, from, to: cum }
        })

        return (
          <g key={week.date || week.label}>
            {stack.map((part, si) => {
              const isTop = si === stack.length - 1
              /* The gap is borrowed from the segment BELOW, by pulling its
                 top edge down, so the stack total stays anchored to the real
                 value at the data end. */
              const yTop = scale(part.to) + (isTop ? 0 : SEG_GAP)
              const d = segPath(
                x,
                BW,
                round(scale(part.from)),
                round(yTop),
                isTop,
              )
              return d ? <path key={si} d={d} fill={part.color} /> : null
            })}

            {/* Selective direct label — the most recent bucket only. A number
                on every bar is the classic stacked-chart mistake. */}
            {i === weeks.length - 1 && week.total > 0 && (
              <text
                x={round(cx)}
                y={round(scale(week.total) - 7)}
                textAnchor='middle'
                className='fill-[var(--foreground)] font-mono text-[10px] font-bold'
              >
                {symbol}
                {compact(week.total)}
              </text>
            )}

            <text
              x={round(cx)}
              y={BASE + 15}
              textAnchor='middle'
              className='fill-[var(--muted-foreground)] font-mono text-[8.5px]'
            >
              {week.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Sparkline ──────────────────────────────────────────────────────────── */

/** Mini bars, not a line: the page's primary chart is bars, and at 34px tall
 *  a line and an area are indistinguishable. Same form = one less thing to
 *  decode. Renders nothing when the stream is unmeasured — an empty axis
 *  would imply a measurement of zero. */
export function Sparkline({
  values,
  color,
}: {
  values: number[] | null
  color: string
}) {
  if (!values || values.length < 2) return null

  const W = 104
  const H = 34
  const baseline = H - 2
  const top = 3
  const bw = 9
  const gap = (W - values.length * bw) / (values.length - 1)
  const max = Math.max(...values, 1)
  const scale = (v: number) => baseline - (v / max) * (baseline - top)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role='img'
      aria-label={`Recent gross, ${values.length} buckets`}
    >
      {values.map((v, i) => {
        const x = round(i * (bw + gap))
        const y = round(scale(v))
        const r = Math.min(1.5, (baseline - y) / 2, bw / 2)
        /* The final bar is the current bucket — full strength; the run up to
           it is stepped back, so the tile reads "where we are now, and how we
           got here" rather than N equal claims. */
        const fill =
          i === values.length - 1
            ? color
            : `color-mix(in oklch, ${color} 42%, transparent)`
        return (
          <path
            key={i}
            d={`M${x} ${baseline} L${x} ${round(y + r)} Q${x} ${y} ${round(x + r)} ${y} L${round(
              x + bw - r,
            )} ${y} Q${round(x + bw)} ${y} ${round(x + bw)} ${round(y + r)} L${round(
              x + bw,
            )} ${baseline} Z`}
            fill={fill}
          />
        )
      })}
    </svg>
  )
}
