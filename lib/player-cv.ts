import { jsPDF } from 'jspdf'
import type { ApiPlayer as RawPlayer } from '@/services/players'
import {
  groupAverage,
  isEvaluated,
  summary as evaluationSummary,
} from '@/features/scout/evaluation'

/* THE PLAYER CV — the Golafly Player Dossier, built in the browser.
 *
 * This is golafly.com's lib/player-cv.ts, copied as-is so a CV downloaded
 * from matchday (player dashboard, admin, scout portal) is the same document
 * the golafly.com profile page produces. Keep the two files in step: change
 * the drawing code there first, then copy it here.
 *
 * The only matchday-specific parts are at the bottom: toDossierPlayer(),
 * which maps the raw API record into the shape the dossier reads (the same
 * mapping golafly's profile page does in normalizePlayer), and the scout
 * evaluation, which feeds the dossier's Scout Rating ring, Golafly Index and
 * recommendation — so a CV always reflects the latest evaluation. */

type ApiPlayer = DossierPlayer

// ============================================================================
// Golafly Player Dossier — redesigned to match the new 4-page mockup
// (cover / profile / performance / achievements+contact).
//
// Implementation notes for future maintainers:
//
// - jsPDF only ships Helvetica/Times/Courier natively. The mockup uses a
//   custom sans-serif; Helvetica is the closest built-in match. If a brand
//   .ttf becomes available, register it with doc.addFont(...) and swap the
//   "helvetica" family names below for it — everything else stays the same.
//
// - The cover page's "Signature Stats" cards (Aerial Duels Won / Pass
//   Accuracy / Duels Won) are NOT part of the existing data model. Rather
//   than invent numbers, they're modelled as optional fields on ApiPlayer
//   (see services/players.ts) and the section is only drawn when at least
//   one of them is present — see renderSignatureStats().
//
// - The QR code on the last page is a static placeholder. Real QR
//   generation needs a library (e.g. `qrcode`); the wiring is written but
//   commented out in renderCtaBand() — flip it on once that package is
//   installed and you have a canonical profile URL to encode.
//
// - jsPDF's GState opacity needs BOTH `opacity` (fill alpha) and
//   `stroke-opacity` (stroke alpha) set explicitly — omitting the latter
//   silently leaves stroked lines fully opaque. See withOpacity().
// ============================================================================

type RGB = [number, number, number]

// ─── Brand palette ──────────────────────────────────────────────────────────
const LIME: RGB = [183, 255, 0] // cover-page accent
const GREEN: RGB = [86, 163, 58] // light-page accent (numbers, bars, radar)
const INK: RGB = [13, 16, 12] // cover page background
const MUTED_D: RGB = [150, 158, 140] // muted text on dark bg
const LINE_D: RGB = [45, 52, 40] // border on dark cards
const CARD_D: RGB = [21, 25, 19] // card fill on dark bg
const TRACK_D: RGB = [40, 46, 34] // progress-track fill on dark bg

const BG: RGB = [247, 249, 243] // light page background
const HEAD: RGB = [22, 26, 18] // heading text on light bg
const MUTED: RGB = [133, 141, 124]
const LINE: RGB = [224, 229, 214]
const WHITE: RGB = [255, 255, 255]
const TRACK: RGB = [231, 235, 222]
const PANEL: RGB = [251, 252, 248]
const BLACK_PANEL: RGB = [12, 12, 12]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const TOTAL_PAGES = 4

// Matches the profile page + registration so the CV is never empty.
const DEFAULT_ATTRIBUTES = [
  'Pace',
  'Defending',
  'Passing',
  'Crossing',
  'Dribbling',
  'Vision',
  'Positioning',
  'Tackling',
  'Shooting',
  'Stamina',
]

// ─── Image loading ──────────────────────────────────────────────────────────

type LoadedImage = {
  dataUrl: string
  fmt: 'PNG' | 'JPEG'
  w: number
  h: number
}

/** Fetch an image and return a data URL + natural dimensions. Cross-origin
 *  images are routed through our own /api/image-proxy so the browser can read
 *  their bytes even when the remote host omits CORS headers. */
async function loadImage(url: string): Promise<LoadedImage | null> {
  const sameOrigin =
    url.startsWith('/') ||
    (typeof window !== 'undefined' && url.startsWith(window.location.origin))
  const fetchUrl = sameOrigin
    ? url
    : `/api/image-proxy?url=${encodeURIComponent(url)}`
  try {
    const res = await fetch(fetchUrl, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
    const fmt = /image\/jpe?g/.test(blob.type) ? 'JPEG' : 'PNG'
    const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image()
      img.onload = () =>
        resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
      img.onerror = () => resolve({ w: 1, h: 1 })
      img.src = dataUrl
    })
    return { dataUrl, fmt, w, h }
  } catch {
    return null
  }
}

// ─── Small data helpers ─────────────────────────────────────────────────────

function ageFromDob(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function fmtDate(dob?: string): string {
  if (!dob) return '—'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return dob
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Low-level drawing helpers ──────────────────────────────────────────────

/** jsPDF's GState needs both fill ("opacity") and stroke ("stroke-opacity")
 *  alpha set explicitly — omitting the latter leaves strokes fully opaque. */
function withOpacity(doc: jsPDF, op: number, fn: () => void): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const G = (doc as any).GState
  doc.setGState(new G({ opacity: op, 'stroke-opacity': op }))
  fn()
  doc.setGState(new G({ opacity: 1, 'stroke-opacity': 1 }))
}

function caps(text?: string | number | null): string {
  return String(text ?? '').toUpperCase()
}

/** Letter-spaced caps for SHORT, length-bounded eyebrow text only (headers,
 *  pill labels, band copy). Spacing is applied within each word (NBSP) but a
 *  normal breakable double-space is kept between words — a single space
 *  would just read as another letter-gap once every letter is spaced out.
 *  Never use this for variable-length, data-driven labels that must fit a
 *  fixed column — use capLabel()/fitTrackedLine() instead, which wrap or
 *  truncate safely. */
function tracked(text: string): string {
  return caps(text)
    .split(' ')
    .map((w) => w.split('').join('\u00a0'))
    .join('  ')
}

function textWidth(
  doc: jsPDF,
  txt: string,
  size: number,
  style: 'normal' | 'bold' = 'normal',
): number {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  return doc.getTextWidth(txt)
}

/** Word- and hyphen-aware wrap: returns lines fitting maxWidth at the given
 *  size/style. Single tokens longer than maxWidth (e.g. a long hyphenated
 *  surname) are split on their hyphens as a last resort. */
function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  size: number,
  style: 'normal' | 'bold' = 'normal',
): string[] {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  const pushToken = (tok: string) => {
    const trial = cur ? cur + ' ' + tok : tok
    if (doc.getTextWidth(trial) <= maxWidth || !cur) {
      cur = trial
    } else {
      lines.push(cur)
      cur = tok
    }
  }
  const pushWord = (w: string) => {
    if (doc.getTextWidth(w) > maxWidth && w.includes('-')) {
      const parts = w.split('-')
      parts.forEach((p, i) => pushToken(i < parts.length - 1 ? p + '-' : p))
      return
    }
    pushToken(w)
  }
  words.forEach(pushWord)
  if (cur) lines.push(cur)
  return lines
}

/** Shrinks font size until every wrapped line of `text` fits within
 *  maxWidth (down to minSize). Used for the big hero name on the cover. */
function fitBlock(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  style: 'normal' | 'bold' = 'bold',
): { size: number; lines: string[] } {
  let size = startSize
  while (size > minSize) {
    const lines = wrapText(doc, text, maxWidth, size, style)
    const widest = Math.max(...lines.map((l) => doc.getTextWidth(l)))
    if (widest <= maxWidth) return { size, lines }
    size -= 1
  }
  return { size: minSize, lines: wrapText(doc, text, maxWidth, minSize, style) }
}

/** Truncates a single line with an ellipsis so it never exceeds maxW. */
function fitSingleLine(
  doc: jsPDF,
  text: string,
  maxW: number,
  size: number,
  style: 'normal' | 'bold' = 'normal',
): string {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  let t = String(text)
  if (doc.getTextWidth(t) <= maxW) return t
  while (t.length > 1 && doc.getTextWidth(t + '…') > maxW) t = t.slice(0, -1)
  return t + '…'
}

/** Like fitSingleLine, but truncates against the *tracked* (letter-spaced)
 *  rendering width, since tracking expands a string well beyond its plain
 *  width. Used for the header eyebrow lines. */
function fitTrackedLine(
  doc: jsPDF,
  text: string,
  maxW: number,
  size: number,
): string {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(size)
  let t = String(text)
  if (doc.getTextWidth(tracked(t)) <= maxW) return tracked(t)
  while (t.length > 1 && doc.getTextWidth(tracked(t) + '…') > maxW)
    t = t.slice(0, -1)
  return tracked(t) + '…'
}

/** Draws a small-caps label that safely wraps to at most 2 lines within
 *  maxWidth, shrinking font size slightly if still too wide. */
function capLabel(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  color: RGB,
  lineGap?: number,
): number {
  const lg = lineGap ?? size * 0.42
  let s = size
  let lines: string[] = []
  for (;;) {
    lines = wrapText(doc, caps(text), maxWidth, s, 'normal').slice(0, 2)
    const widest = Math.max(...lines.map((l) => textWidth(doc, l, s, 'normal')))
    if (widest <= maxWidth || s <= 5.4) break
    s -= 0.3
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(s)
  doc.setTextColor(...color)
  lines.forEach((l, i) => doc.text(l, x, y + i * lg))
  return lines.length
}

function roundRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'F' | 'D' | 'FD',
  fill?: RGB,
  stroke?: RGB,
): void {
  if (fill) doc.setFillColor(...fill)
  if (stroke) doc.setDrawColor(...stroke)
  doc.roundedRect(x, y, w, h, r, r, style)
}

interface PillOpts {
  size?: number
  h?: number
  textColor: RGB
  fill?: RGB | null
  stroke?: RGB | null
  style?: 'normal' | 'bold'
}

function pill(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  opts: PillOpts,
): number {
  const {
    size = 7.2,
    h = 6.6,
    textColor,
    fill,
    stroke,
    style = 'normal',
  } = opts
  const padX = 3.4
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  const w = doc.getTextWidth(text) + padX * 2
  if (fill) doc.setFillColor(...fill)
  if (stroke) {
    doc.setDrawColor(...stroke)
    doc.setLineWidth(0.28)
  }
  const drawStyle: 'F' | 'D' | 'FD' = fill && stroke ? 'FD' : fill ? 'F' : 'D'
  doc.roundedRect(x, y, w, h, h / 2, h / 2, drawStyle)
  doc.setTextColor(...textColor)
  doc.text(text, x + padX, y + h / 2 + size * 0.14)
  return w
}

interface PillItem {
  text: string
  accent?: boolean
}

/** Lays out pills left-to-right, wrapping to new rows; returns the end y. */
function pillRow(
  doc: jsPDF,
  items: PillItem[],
  x: number,
  y: number,
  maxWidth: number,
  theme: 'dark' | 'light' = 'dark',
): number {
  const gap = 3,
    rowGap = 3,
    h = 6.6
  let cx = x,
    cy = y
  items.forEach((it) => {
    // truncate any single pill's text so it can never exceed the row width
    const text = fitSingleLine(doc, it.text, maxWidth - 6.8, 7.2, 'bold')
    const w = textWidth(doc, text, 7.2, 'bold') + 3.4 * 2
    if (cx + w > x + maxWidth && cx !== x) {
      cx = x
      cy += h + rowGap
    }
    pill(doc, cx, cy, text, {
      textColor: it.accent ? INK : theme === 'dark' ? WHITE : HEAD,
      fill: it.accent ? LIME : null,
      stroke: it.accent ? null : theme === 'dark' ? MUTED_D : LINE,
      style: 'bold',
    })
    cx += w + gap
  })
  return cy + h
}

/** Shared section eyebrow: a lime/green tick + bold title + small caps
 *  sub-label + a divider rule. Returns the y to start drawing content at. */
function sectionHeader(
  doc: jsPDF,
  x: number,
  y: number,
  maxWidth: number,
  title: string,
  sub: string | null,
  theme: 'dark' | 'light',
): number {
  const tick = theme === 'dark' ? LIME : GREEN
  const txt = theme === 'dark' ? WHITE : HEAD
  const line = theme === 'dark' ? LINE_D : LINE
  const mut = theme === 'dark' ? MUTED_D : MUTED

  doc.setFillColor(...tick)
  doc.rect(x, y - 3.6, 1.1, 4.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(...txt)
  doc.text(caps(title), x + 4.5, y)

  if (sub) {
    const tw = doc.getTextWidth(caps(title))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...mut)
    doc.text(tracked(sub), x + 4.5 + tw + 4, y - 0.2)
  }
  doc.setDrawColor(...line)
  doc.setLineWidth(0.3)
  doc.line(x, y + 2.4, x + maxWidth, y + 2.4)
  return y + 9
}

function footer(
  doc: jsPDF,
  leftText: string,
  pageNum: number,
  theme: 'dark' | 'light',
): void {
  const line = theme === 'dark' ? LINE_D : LINE
  const mut = theme === 'dark' ? MUTED_D : MUTED
  doc.setDrawColor(...line)
  doc.setLineWidth(0.25)
  doc.line(MARGIN, PAGE_H - 11, PAGE_W - MARGIN, PAGE_H - 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...mut)
  doc.text(tracked(leftText), MARGIN, PAGE_H - 6.5)
  doc.text(
    `${String(pageNum).padStart(2, '0')} / ${String(TOTAL_PAGES).padStart(2, '0')}`,
    PAGE_W - MARGIN,
    PAGE_H - 6.5,
    { align: 'right' },
  )
}

function pageBg(doc: jsPDF): void {
  doc.setFillColor(...BG)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
}

/** Light-page header: "GOLAFLY" wordmark + a right-aligned eyebrow that
 *  truncates safely (e.g. a very long player name) so it can never collide
 *  with the wordmark. */
function pageHead(doc: jsPDF, title: string, sub: string): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...HEAD)
  doc.text('GOLAFLY', MARGIN, 15)
  const logoW = textWidth(doc, 'GOLAFLY', 11, 'bold')
  const avail = PAGE_W - MARGIN - (MARGIN + logoW + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  doc.setTextColor(...MUTED)
  const prefixTracked = tracked(`${title} · `)
  const prefixW = textWidth(doc, prefixTracked, 7.2, 'normal')
  const subTracked = fitTrackedLine(
    doc,
    sub,
    Math.max(avail - prefixW, 20),
    7.2,
  )
  doc.text(prefixTracked + subTracked, PAGE_W - MARGIN, 15, { align: 'right' })
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, 20, PAGE_W - MARGIN, 20)
}

type KvRow = [string, string]

/** A responsive label/value grid. Labels wrap to at most 2 lines and the
 *  row height adjusts to match, so long labels never overlap the next row. */
function kvGrid(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: KvRow[],
  cols: number,
): number {
  const colW = w / cols
  const padR = 5
  for (let i = 0; i < rows.length; i += cols) {
    const rowItems: { lines: string[]; value: string }[] = []
    let labelLines = 1
    for (let c = 0; c < cols; c++) {
      const item = rows[i + c]
      if (!item) {
        rowItems.push(null as unknown as { lines: string[]; value: string })
        continue
      }
      const lines = wrapText(
        doc,
        caps(item[0]),
        colW - padR,
        6.6,
        'normal',
      ).slice(0, 2)
      labelLines = Math.max(labelLines, lines.length)
      rowItems.push({ lines, value: item[1] })
    }
    const valueY = y + (labelLines === 2 ? 8.2 : 4.6)
    rowItems.forEach((item, c) => {
      if (!item) return
      const cx = x + c * colW
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.6)
      doc.setTextColor(...MUTED)
      item.lines.forEach((l, li) => doc.text(l, cx, y + li * 3.1))
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.6)
      doc.setTextColor(...HEAD)
      doc.text(
        fitSingleLine(doc, String(item.value), colW - padR, 8.6, 'bold'),
        cx,
        valueY,
      )
    })
    y = valueY + 5.4
  }
  return y + 2
}

function barListLight(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: [string, number][],
  max: number,
): number {
  rows.forEach((r) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.6)
    doc.setTextColor(...HEAD)
    doc.text(r[0], x, y + 1.2)
    const barX = x + 22,
      barW = w - 22 - 8
    doc.setFillColor(...TRACK)
    doc.roundedRect(barX, y - 1, barW, 2, 1, 1, 'F')
    const pct = Math.max(0, Math.min(1, r[1] / max))
    if (pct > 0) {
      doc.setFillColor(...GREEN)
      doc.roundedRect(barX, y - 1, Math.max(barW * pct, 2), 2, 1, 1, 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.6)
    doc.setTextColor(...HEAD)
    doc.text(`${r[1]}`, x + w - 4, y + 1.2, { align: 'right' })
    y += 6.4
  })
  return y + 3
}

interface AttrRow {
  label: string
  value: number
}

function barGrid100(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: AttrRow[],
): number {
  const colGap = 10,
    colW = (w - colGap) / 2
  const half = Math.ceil(rows.length / 2)
  for (let i = 0; i < half; i++) {
    for (let c = 0; c < 2; c++) {
      const r = rows[i + c * half]
      if (!r) continue
      const cx = x + c * (colW + colGap)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...HEAD)
      doc.text(r.label, cx, y + 1.4)
      const barX = cx + 24,
        barW = colW - 24 - 9
      doc.setFillColor(...TRACK)
      doc.roundedRect(barX, y - 0.7, barW, 2.2, 1.1, 1.1, 'F')
      const pct = Math.max(0, Math.min(1, r.value / 100))
      if (pct > 0) {
        doc.setFillColor(...GREEN)
        doc.roundedRect(
          barX,
          y - 0.7,
          Math.max(barW * pct, 2.2),
          2.2,
          1.1,
          1.1,
          'F',
        )
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...HEAD)
      doc.text(`${r.value}`, cx + colW, y + 1.4, { align: 'right' })
    }
    y += 7.4
  }
  return y + 4
}

function statCardRow(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: [string, string | number][],
  perRow: number,
): number {
  const gap = 3,
    cardW = (w - gap * (perRow - 1)) / perRow,
    cardH = 18
  rows.forEach(([label, val], i) => {
    const cx = x + i * (cardW + gap)
    roundRect(doc, cx, y, cardW, cardH, 2.5, 'FD', WHITE, LINE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...GREEN)
    doc.text(String(val), cx + cardW / 2, y + 9.5, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.4)
    doc.setTextColor(...MUTED)
    const lbl = wrapText(doc, caps(label), cardW - 6, 6.4, 'normal').slice(0, 2)
    doc.text(lbl, cx + cardW / 2, y + 14, { align: 'center' })
  })
  return y + cardH
}

/** Small vector trophy glyph (avoids depending on an icon font/image). */
function drawTrophyIcon(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  color: RGB,
): void {
  doc.setDrawColor(...color)
  doc.setFillColor(...color)
  doc.setLineWidth(r * 0.22)
  doc.ellipse(cx, cy - r * 0.15, r * 0.72, r * 0.62, 'F') // bowl
  doc.circle(cx - r * 0.95, cy - r * 0.35, r * 0.32, 'S') // handles
  doc.circle(cx + r * 0.95, cy - r * 0.35, r * 0.32, 'S')
  doc.setLineWidth(r * 0.26)
  doc.line(cx, cy + r * 0.35, cx, cy + r * 0.75) // stem
  doc.line(cx - r * 0.55, cy + r * 0.78, cx + r * 0.55, cy + r * 0.78) // base
}

function pick01to100(map: Map<string, number>, keys: string[]): number {
  for (const k of keys)
    if (map.has(k)) return Math.round((map.get(k) as number) * 10)
  return 0
}

/** Draws an arc (used for the two "Golafly Index" gauges) by stroking short
 *  straight segments — jsPDF has no native arc primitive. */
function drawArc(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  color: RGB,
  lw: number,
): void {
  doc.setDrawColor(...color)
  doc.setLineWidth(lw)
  doc.setLineCap('round')
  const steps = Math.max(2, Math.ceil(Math.abs(endDeg - startDeg) / 4))
  let prev: [number, number] | null = null
  for (let i = 0; i <= steps; i++) {
    const a = ((startDeg + (endDeg - startDeg) * (i / steps)) * Math.PI) / 180
    const p: [number, number] = [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    if (prev) doc.line(prev[0], prev[1], p[0], p[1])
    prev = p
  }
  doc.setLineCap(0)
}

/** Six-axis attribute radar (hexagon grid + filled value polygon). */
function drawRadar(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  labels: string[],
  values: number[],
): void {
  const n = labels.length
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.25)
  ;[0.33, 0.66, 1].forEach((f) => {
    const pts: [number, number][] = []
    for (let i = 0; i < n; i++)
      pts.push([
        cx + r * f * Math.cos(angle(i)),
        cy + r * f * Math.sin(angle(i)),
      ])
    for (let i = 0; i < n; i++) {
      const a = pts[i],
        b = pts[(i + 1) % n]
      doc.line(a[0], a[1], b[0], b[1])
    }
  })
  for (let i = 0; i < n; i++) {
    const p = [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]
    doc.line(cx, cy, p[0], p[1])
  }

  const vpts: [number, number][] = values.map((v, i) => {
    const f = Math.max(0, Math.min(1, v / 100))
    return [cx + r * f * Math.cos(angle(i)), cy + r * f * Math.sin(angle(i))]
  })
  withOpacity(doc, 0.18, () => {
    doc.setFillColor(...GREEN)
    const lines = vpts
      .slice(1)
      .map((p, i) => [p[0] - vpts[i][0], p[1] - vpts[i][1]] as [number, number])
    doc.lines(lines, vpts[0][0], vpts[0][1], [1, 1], 'F', true)
  })
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.6)
  for (let i = 0; i < n; i++) {
    const a = vpts[i],
      b = vpts[(i + 1) % n]
    doc.line(a[0], a[1], b[0], b[1])
  }
  vpts.forEach((p) => {
    doc.setFillColor(...GREEN)
    doc.circle(p[0], p[1], 0.7, 'F')
  })

  labels.forEach((lab, i) => {
    const lp = [
      cx + (r + 7) * Math.cos(angle(i)),
      cy + (r + 7) * Math.sin(angle(i)),
    ]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...MUTED)
    doc.text(lab, lp[0], lp[1] - 1, { align: 'center' })
    doc.setFontSize(6.4)
    doc.setTextColor(...GREEN)
    doc.text(String(values[i]), lp[0], lp[1] + 2.6, { align: 'center' })
  })
}

/** Draws one photo into a cell, cropped (cover-fit) to exactly fill it.
 *  Falls back to a plain grey tile if the image failed to load. */
function placeImg(
  doc: jsPDF,
  img: LoadedImage | null,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  doc.setFillColor(60, 60, 60)
  doc.rect(x, y, w, h, 'F')
  if (img) {
    const scale = Math.max(w / img.w, h / img.h)
    const dw = img.w * scale,
      dh = img.h * scale
    doc.addImage(
      img.dataUrl,
      img.fmt,
      x - (dw - w) / 2,
      y - (dh - h) / 2,
      dw,
      dh,
      undefined,
      'FAST',
    )
  }
}

/** Adaptive photo-gallery mosaic. Each photo count (1–6+) gets its own
 *  layout so the container is always fully covered — no dead space, no
 *  half-empty rows. Anything beyond 6 photos is not shown here; that's a
 *  deliberate cap to match the fixed-size dossier layout. */
function drawCollage(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  imgs: (LoadedImage | null)[],
): void {
  const n = Math.min(imgs.length, 6)
  const g = 3
  if (n === 1) {
    placeImg(doc, imgs[0], x, y, w, h)
    return
  }
  if (n === 2) {
    const cw = (w - g) / 2
    placeImg(doc, imgs[0], x, y, cw, h)
    placeImg(doc, imgs[1], x + cw + g, y, cw, h)
    return
  }
  if (n === 3) {
    const bigW = w * 0.6,
      rtW = w - bigW - g,
      rtH = (h - g) / 2
    placeImg(doc, imgs[0], x, y, bigW, h)
    placeImg(doc, imgs[1], x + bigW + g, y, rtW, rtH)
    placeImg(doc, imgs[2], x + bigW + g, y + rtH + g, rtW, rtH)
    return
  }
  if (n === 4) {
    const bigW = w * 0.58,
      rtW = w - bigW - g,
      rtH = (h - g * 2) / 3
    placeImg(doc, imgs[0], x, y, bigW, h)
    for (let i = 0; i < 3; i++)
      placeImg(doc, imgs[1 + i], x + bigW + g, y + i * (rtH + g), rtW, rtH)
    return
  }
  // 5 or 6: big left + 2 stacked right (62% height) + a row of the rest below
  const bigW = w * 0.58,
    topH = h * 0.62,
    rtW = w - bigW - g
  placeImg(doc, imgs[0], x, y, bigW, topH)
  const rtH = (topH - g) / 2
  placeImg(doc, imgs[1], x + bigW + g, y, rtW, rtH)
  if (imgs[2]) placeImg(doc, imgs[2], x + bigW + g, y + rtH + g, rtW, rtH)
  const row2 = imgs.slice(3, 6)
  if (row2.length) {
    const r2W = (w - (row2.length - 1) * g) / row2.length
    row2.forEach((im, i) =>
      placeImg(doc, im, x + i * (r2W + g), y + topH + g, r2W, h - topH - g),
    )
  }
}

// ============================================================================
// Main entry point
// ============================================================================

/**
 * Builds and downloads a branded player dossier PDF entirely on the
 * frontend, from the data we already have — no backend round-trip.
 */
async function renderDossier(player: ApiPlayer): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const MX = MARGIN,
    CW = PAGE_W - MX * 2

  const fullName = `${player.first_name} ${player.last_name}`.trim()
  const age = ageFromDob(player.date_of_birth)
  const season = player.season_stats?.[0]
  const seasonLabel = season?.season || 'Current Season'

  const [photo, highlightImgs] = await Promise.all([
    player.profile_photo_url
      ? loadImage(player.profile_photo_url)
      : Promise.resolve(null),
    Promise.all((player.highlights ?? []).slice(0, 6).map((u) => loadImage(u))),
  ])

  // ══════════════════════════ PAGE 1 — COVER (dark) ═══════════════════════
  doc.setFillColor(...INK)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  // Faint grid texture — drawn as a very dark opaque tint rather than a
  // translucent lime stroke: hairline strokes render at full intensity
  // regardless of GState alpha in some PDF renderers, so a subtle solid
  // colour is the reliable way to keep this understated.
  doc.setDrawColor(24, 29, 22)
  doc.setLineWidth(0.12)
  for (let gx = 18; gx < PAGE_W; gx += 18) doc.line(gx, 0, gx, PAGE_H)
  for (let gy = 18; gy < PAGE_H; gy += 18) doc.line(0, gy, PAGE_W, gy)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...LIME)
  doc.text('GOLAFLY', MX, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED_D)
  doc.text(
    tracked(`Player Dossier · ${new Date().getFullYear()} Season`),
    PAGE_W - MX,
    15,
    { align: 'right' },
  )

  let y = 26
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...LIME)
  doc.text(
    fitTrackedLine(
      doc,
      `${player.nationality || '—'} · ${player.player_status || 'Free Agent'}`,
      PAGE_W - MX * 2,
      9,
    ),
    MX,
    y,
  )

  // hero geometry: name column on the left, photo card pinned to the right
  const photoW = 76,
    photoH = 122
  const photoX = PAGE_W - MX - photoW
  const photoY = 34
  const nameColW = photoX - MX - 7

  y = 42
  doc.setTextColor(...WHITE)
  const firstFit = fitBlock(
    doc,
    caps(player.first_name || ''),
    nameColW,
    32,
    18,
    'bold',
  )
  doc.setFontSize(firstFit.size)
  firstFit.lines.forEach((l) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text(l, MX, y)
    y += firstFit.size * 0.37
  })

  const lastFit = fitBlock(
    doc,
    caps(player.last_name || ''),
    nameColW,
    firstFit.size,
    16,
    'bold',
  )
  doc.setFontSize(lastFit.size)
  lastFit.lines.forEach((l) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LIME)
    doc.text(l, MX, y)
    y += lastFit.size * 0.37
  })
  y += 6

  // Position/foot/level pills are plain caps (not letter-tracked): these are
  // free-text, data-driven values that can be long in any language, so
  // tracking them risks overflowing the pill or the row.
  const posItems: PillItem[] = []
  if (player.primary_position)
    posItems.push({ text: caps(player.primary_position), accent: true })
  if (player.secondary_position)
    posItems.push({ text: caps(player.secondary_position), accent: true })
  if (player.preferred_foot)
    posItems.push({ text: caps(`${player.preferred_foot} Foot`) })
  if (player.current_level) posItems.push({ text: caps(player.current_level) })
  y = pillRow(doc, posItems, MX, y, nameColW, 'dark') + 6

  const desc = player.additional_notes
    ? player.additional_notes
    : [
        player.height_cm ? `${player.height_cm}cm` : null,
        [player.primary_position, player.secondary_position]
          .filter(Boolean)
          .join(' / ') || null,
        player.preferred_foot ? `${player.preferred_foot}-footed` : null,
        player.current_level || null,
      ]
        .filter(Boolean)
        .join(' — ') + ' prospect.'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.2)
  doc.setTextColor(...MUTED_D)
  const descLines = wrapText(doc, desc, nameColW, 9.2, 'normal').slice(0, 5)
  descLines.forEach((l, i) => doc.text(l, MX, y + i * 4.8))
  y += descLines.length * 4.8 + 8

  // quick fact chips (up to 2 rows x 3 columns)
  const chipDefs: [string, string][] = (
    [
      ['Age', age != null ? `${age}` : '—'],
      ['Height', player.height_cm != null ? `${player.height_cm} cm` : '—'],
      ['Weight', player.weight_kg != null ? `${player.weight_kg} kg` : '—'],
      ['Foot', player.preferred_foot || '—'],
      player.jersey_number ? ['Jersey', `#${player.jersey_number}`] : null,
    ] as ([string, string] | null)[]
  ).filter((c): c is [string, string] => c != null)
  const chipCols = 3,
    chipGap = 3.5
  const chipW = (nameColW - chipGap * (chipCols - 1)) / chipCols
  const chipH = 15.5
  chipDefs.forEach((c, i) => {
    const col = i % chipCols,
      row = Math.floor(i / chipCols)
    const cx = MX + col * (chipW + chipGap)
    const cy = y + row * (chipH + chipGap)
    doc.setFillColor(...CARD_D)
    doc.setDrawColor(...LINE_D)
    doc.setLineWidth(0.3)
    doc.roundedRect(cx, cy, chipW, chipH, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.4)
    doc.setTextColor(...MUTED_D)
    doc.text(tracked(c[0]), cx + 3.5, cy + 5.2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    doc.text(
      fitSingleLine(doc, c[1], chipW - 7, 10, 'bold'),
      cx + 3.5,
      cy + 11.6,
    )
  })
  const chipRows = Math.ceil(chipDefs.length / chipCols)
  y += chipRows * chipH + (chipRows - 1) * chipGap

  // photo card
  doc.setFillColor(...CARD_D)
  doc.setDrawColor(...LINE_D)
  doc.roundedRect(photoX, photoY, photoW, photoH, 3, 3, 'FD')
  if (photo) {
    doc.addImage(
      photo.dataUrl,
      photo.fmt,
      photoX,
      photoY,
      photoW,
      photoH,
      undefined,
      'FAST',
    )
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...LINE_D)
    const initials =
      `${(player.first_name || '?')[0] || ''}${(player.last_name || '?')[0] || ''}`.toUpperCase()
    doc.text(initials, photoX + photoW / 2, photoY + photoH / 2 + 4, {
      align: 'center',
    })
  }
  if (player.jersey_number) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...LIME)
    doc.text(`#${player.jersey_number}`, photoX + photoW - 4, photoY + 9, {
      align: 'right',
    })
  }
  // Bottom overlay strip: tall enough for a 2-line wrapped name, and gives
  // the status pill its own row above the name when the name wraps, so a
  // long status string can never collide with the caption.
  const capLines = wrapText(
    doc,
    caps(fullName),
    photoW - 26,
    7.4,
    'bold',
  ).slice(0, 2)
  const overlayH = capLines.length > 1 ? 20 : 16
  withOpacity(doc, 0.55, () => {
    doc.setFillColor(0, 0, 0)
    doc.rect(photoX, photoY + photoH - overlayH, photoW, overlayH, 'F')
  })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.4)
  doc.setTextColor(...WHITE)
  capLines.forEach((l, i) =>
    doc.text(l, photoX + 3.5, photoY + photoH - 9.5 + i * 3.4),
  )
  const statusTxt = fitSingleLine(
    doc,
    caps(player.player_status || 'Free Agent'),
    photoW - 12,
    6,
    'bold',
  )
  const statusW = textWidth(doc, statusTxt, 6, 'bold') + 6.4
  const pillY =
    capLines.length > 1 ? photoY + photoH - 18.2 : photoY + photoH - 12.2
  pill(
    doc,
    Math.max(photoX + photoW - 3 - statusW, photoX + 3.5),
    pillY,
    statusTxt,
    { size: 6, fill: LIME, textColor: INK, h: 5.4 },
  )

  y = Math.max(y, photoY + photoH) + 10

  // Signature Stats — only rendered when at least one value is present; see
  // the note on ApiPlayer.aerial_duels_won_pct etc. Nothing is fabricated.
  const sig = (
    [
      ['Aerial Duels Won', player.aerial_duels_won_pct],
      ['Pass Accuracy', player.pass_accuracy_pct],
      ['Duels Won', player.duels_won_pct],
    ] as [string, number | undefined][]
  ).filter((s): s is [string, number] => s[1] != null)
  if (sig.length) {
    y = sectionHeader(
      doc,
      MX,
      y,
      CW,
      'Signature Stats',
      'Style of Play',
      'dark',
    )
    const gap = 4,
      w = (CW - gap * (sig.length - 1)) / sig.length,
      h = 26
    sig.forEach(([label, val], i) => {
      const cx = MX + i * (w + gap)
      roundRect(doc, cx, y, w, h, 2.5, 'FD', CARD_D, LINE_D)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...WHITE)
      doc.text(`${val}`, cx + 5, y + 11)
      const valW = textWidth(doc, `${val}`, 18, 'bold')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...MUTED_D)
      doc.text('%', cx + 5 + valW + 1, y + 11)
      capLabel(doc, label, cx + 5, y + 16.2, w - 10, 6.6, MUTED_D, 3)
      const trackY = y + 20
      doc.setFillColor(...TRACK_D)
      doc.roundedRect(cx + 5, trackY, w - 10, 1.8, 0.9, 0.9, 'F')
      doc.setFillColor(...LIME)
      const pct = Math.max(0, Math.min(1, val / 100))
      doc.roundedRect(
        cx + 5,
        trackY,
        Math.max((w - 10) * pct, 2),
        1.8,
        0.9,
        0.9,
        'F',
      )
    })
    y += h + 12
  }

  // Scout Rating & Season
  const scoutRatings = [
    player.scout_technical_rating,
    player.scout_tactical_rating,
    player.scout_physical_rating,
    player.scout_mental_rating,
  ].filter((v): v is number => v != null)
  const golaflyIndex = scoutRatings.length
    ? (scoutRatings.reduce((a, b) => a + b, 0) / scoutRatings.length) * 2
    : null

  y = sectionHeader(
    doc,
    MX,
    y,
    CW,
    'Scout Rating & Season',
    `${seasonLabel} Output`,
    'dark',
  )
  const ringSectionH = 46
  roundRect(doc, MX, y, CW, ringSectionH, 3, 'FD', CARD_D, LINE_D)
  const ringBoxW = 56
  const ringCx = MX + ringBoxW / 2,
    ringCy = y + ringSectionH / 2,
    ringR = 16.5
  doc.setDrawColor(...TRACK_D)
  doc.setLineWidth(4)
  doc.circle(ringCx, ringCy, ringR, 'S')
  if (golaflyIndex != null)
    drawArc(
      doc,
      ringCx,
      ringCy,
      ringR,
      -90,
      -90 + (golaflyIndex / 10) * 360,
      LIME,
      4,
    )
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text(
    golaflyIndex != null ? golaflyIndex.toFixed(1) : '—',
    ringCx,
    ringCy + 2,
    { align: 'center' },
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...MUTED_D)
  doc.text('/ 10', ringCx, ringCy + 6.4, { align: 'center' })

  const infoX = MX + ringBoxW + 6
  const infoTextW = 34
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED_D)
  doc.text(tracked('Golafly Index'), infoX, y + 13)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(...LIME)
  const recLines = wrapText(
    doc,
    player.overall_recommendation || 'Pending Review',
    infoTextW,
    12.5,
    'bold',
  ).slice(0, 2)
  recLines.forEach((l, i) => doc.text(l, infoX, y + 21 + i * 5))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(...MUTED_D)
  const posDescLines = wrapText(
    doc,
    [player.primary_position, player.secondary_position]
      .filter(Boolean)
      .join(' · ') || 'Position pending',
    infoTextW,
    7.6,
    'normal',
  ).slice(0, 2)
  posDescLines.forEach((l, i) =>
    doc.text(l, infoX, y + 21 + recLines.length * 5 + 4 + i * 3.8),
  )

  const seasonCards: [string, number][] = [
    ['Appearances', season?.appearances ?? 0],
    ['Goals', season?.goals ?? 0],
    ['Assists', season?.assists ?? 0],
    ['Clean Sheets', season?.clean_sheets ?? 0],
  ]
  const statsX = infoX + infoTextW + 8
  const statW = (MX + CW - statsX) / 4
  const statCy = y + ringSectionH / 2
  seasonCards.forEach(([label, val], i) => {
    const cx = statsX + i * statW + statW / 2
    if (i > 0) {
      doc.setDrawColor(...LINE_D)
      doc.setLineWidth(0.25)
      doc.line(
        statsX + i * statW,
        y + 9,
        statsX + i * statW,
        y + ringSectionH - 9,
      )
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...WHITE)
    doc.text(`${val}`, cx, statCy - 1, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.1)
    doc.setTextColor(...MUTED_D)
    const lbLines = wrapText(doc, caps(label), statW - 6, 6.1, 'normal').slice(
      0,
      2,
    )
    doc.text(lbLines, cx, statCy + (lbLines.length > 1 ? 4.5 : 6), {
      align: 'center',
    })
  })

  footer(doc, 'Generated by Golafly · golafly.com', 1, 'dark')

  // ══════════════════════════ PAGE 2 — PROFILE (light) ═════════════════════
  doc.addPage()
  pageBg(doc)
  pageHead(doc, 'Player Profile', fullName)
  y = 32

  y = sectionHeader(
    doc,
    MX,
    y,
    CW,
    'Player Overview',
    'Identity & Status',
    'light',
  )
  y = kvGrid(
    doc,
    MX,
    y,
    CW,
    [
      ['Date of Birth', fmtDate(player.date_of_birth)],
      ['Age', age != null ? `${age} years` : '—'],
      ['Nationality', player.nationality || '—'],
      [
        'Languages',
        player.languages?.length ? player.languages.join(', ') : '—',
      ],
      [
        'Country of Residence',
        [player.city, player.country_of_residence].filter(Boolean).join(', ') ||
          '—',
      ],
      ['Current Club / Academy', player.current_club_academy || '—'],
      ['Preferred Foot', player.preferred_foot || '—'],
      [
        'Jersey Number',
        player.jersey_number ? `#${player.jersey_number}` : '—',
      ],
      ['Level', player.current_level || '—'],
      ['Player Status', player.player_status || '—'],
      ['Passport', player.passport_number || '—'],
      [
        'Golafly Profile ID',
        player.id
          ? `GF${new Date(player.created_at || Date.now()).getFullYear()}-${String(player.id).padStart(4, '0')}`
          : '—',
      ],
    ],
    4,
  )
  y += 4

  const colGap = 8
  const leftW = (CW - colGap) * 0.46
  const rightW = CW - colGap - leftW
  const rightX = MX + leftW + colGap
  const twoColY = y

  let ly = sectionHeader(
    doc,
    MX,
    twoColY,
    leftW,
    'Physical Profile',
    'Athletic Data',
    'light',
  )
  const physCards: [string, string, string][] = [
    [
      'Height',
      player.height_cm != null ? `${player.height_cm}` : '—',
      player.height_cm != null ? 'cm' : '',
    ],
    [
      'Weight',
      player.weight_kg != null ? `${player.weight_kg}` : '—',
      player.weight_kg != null ? 'kg' : '',
    ],
    [
      'Top Speed',
      player.top_speed_kmh != null ? `${player.top_speed_kmh}` : '—',
      player.top_speed_kmh != null ? 'km/h' : '',
    ],
  ]
  const pcGap = 3,
    pcW = (leftW - pcGap * 2) / 3,
    pcH = 21
  physCards.forEach((c, i) => {
    const cx = MX + i * (pcW + pcGap)
    roundRect(doc, cx, ly, pcW, pcH, 2, 'FD', WHITE, LINE)
    const numTxt = fitSingleLine(doc, c[1], pcW - 6, 14, 'bold')
    const numW = textWidth(doc, numTxt, 14, 'bold')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...HEAD)
    doc.text(numTxt, cx + 3, ly + 11)
    if (c[2]) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(c[2], cx + 3 + numW + 1.2, ly + 11)
    }
    capLabel(doc, c[0], cx + 3, ly + 17, pcW - 6, 6.4, MUTED, 3)
  })
  ly += pcH + 6
  ly = barListLight(
    doc,
    MX,
    ly,
    leftW,
    [
      ['Strength', player.strength ?? 0],
      ['Agility', player.agility ?? 0],
      ['Stamina', player.stamina ?? 0],
    ],
    10,
  )

  let ry = sectionHeader(
    doc,
    rightX,
    twoColY,
    rightW,
    'Attribute Radar',
    'Six-Axis',
    'light',
  )
  const attrMap = new Map(
    (player.attributes ?? []).map((a) => [a.label.toLowerCase(), a.value]),
  )
  const radarLabels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']
  const radarVals = [
    pick01to100(attrMap, ['pace']),
    pick01to100(attrMap, ['shooting']),
    pick01to100(attrMap, ['passing']),
    pick01to100(attrMap, ['dribbling']),
    pick01to100(attrMap, ['defending']),
    Math.round((player.strength ?? 0) * 10),
  ]
  const radarSize = Math.min(rightW, 66)
  roundRect(doc, rightX, ry, rightW, radarSize + 6, 2, 'FD', WHITE, LINE)
  drawRadar(
    doc,
    rightX + rightW / 2,
    ry + (radarSize + 6) / 2,
    radarSize * 0.38,
    radarLabels,
    radarVals,
  )
  ry += radarSize + 6 + 6

  y = Math.max(ly, ry) + 4

  y = sectionHeader(
    doc,
    MX,
    y,
    CW,
    'Player Attributes',
    'Scouting Scale 0-100',
    'light',
  )
  const attrRows: AttrRow[] = DEFAULT_ATTRIBUTES.map((label) => ({
    label,
    value: Math.round((attrMap.get(label.toLowerCase()) ?? 0) * 10),
  }))
  y = barGrid100(doc, MX, y, CW, attrRows)

  footer(doc, 'Golafly · Player Dossier', 2, 'light')

  // ══════════════════════════ PAGE 3 — PERFORMANCE (light) ═════════════════
  doc.addPage()
  pageBg(doc)
  // Avoid "Current Season Season": only append the word "Season" when the
  // label isn't already the generic fallback (which already reads fine on
  // its own — real season strings like "2025/26" still get " Season" added).
  const seasonHeading = /season/i.test(seasonLabel)
    ? seasonLabel
    : `${seasonLabel} Season`
  pageHead(doc, 'Performance', seasonHeading)
  y = 32

  y = sectionHeader(
    doc,
    MX,
    y,
    CW,
    'Career Statistics',
    'Current Season',
    'light',
  )
  y =
    statCardRow(
      doc,
      MX,
      y,
      CW,
      [
        ['Appearances', season?.appearances ?? 0],
        ['Goals', season?.goals ?? 0],
        ['Assists', season?.assists ?? 0],
        ['Clean Sheets', season?.clean_sheets ?? 0],
      ],
      4,
    ) + 4
  y =
    statCardRow(
      doc,
      MX,
      y,
      CW,
      [
        ['Minutes Played', (season?.minutes_played ?? 0).toLocaleString()],
        ['Yellow Cards', season?.yellow_cards ?? 0],
        ['Red Cards', season?.red_cards ?? 0],
      ],
      4,
    ) + 8

  y = sectionHeader(
    doc,
    MX,
    y,
    CW,
    'Action Photos',
    'In-Match Gallery',
    'light',
  )
  const galH = 118
  roundRect(doc, MX, y, CW, galH, 3, 'F', BLACK_PANEL)
  if (highlightImgs.length) {
    drawCollage(doc, MX + 3, y + 3, CW - 6, galH - 6, highlightImgs)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(200, 200, 200)
    doc.text('No action photos uploaded yet.', MX + CW / 2, y + galH / 2, {
      align: 'center',
    })
  }

  footer(doc, 'Golafly · Player Dossier', 3, 'light')

  // ══════════════════════════ PAGE 4 — ACHIEVEMENTS / CONTACT ══════════════
  doc.addPage()
  pageBg(doc)
  pageHead(doc, 'Achievements', 'Goals · Contact')
  y = 32

  const colGap2 = 8
  const leftW2 = (CW - colGap2) * 0.5
  const rightW2 = CW - colGap2 - leftW2
  const rightX2 = MX + leftW2 + colGap2
  const topY = y

  let aly = sectionHeader(
    doc,
    MX,
    topY,
    leftW2,
    'Achievements',
    'Honours',
    'light',
  )
  const achievements = player.achievements ?? []
  if (achievements.length) {
    achievements.forEach((a) => {
      const h = 15
      roundRect(doc, MX, aly, leftW2, h, 2.5, 'FD', WHITE, LINE)
      withOpacity(doc, 0.14, () => {
        doc.setFillColor(...GREEN)
        doc.roundedRect(MX + 3, aly + 3, 9, 9, 2, 2, 'F')
      })
      drawTrophyIcon(doc, MX + 3 + 4.5, aly + 3 + 4.5, 3.1, GREEN)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...HEAD)
      doc.text(
        fitSingleLine(doc, a.title, leftW2 - 40, 9.5, 'bold'),
        MX + 15,
        aly + 8.5,
      )
      if (a.year) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10.5)
        doc.setTextColor(...GREEN)
        doc.text(a.year, MX + leftW2 - 4, aly + 9, { align: 'right' })
      }
      aly += h + 3
    })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('No achievements added yet.', MX, aly + 4)
    aly += 10
  }
  aly += 4
  aly = sectionHeader(
    doc,
    MX,
    aly,
    leftW2,
    'Goals with Golafly',
    'Ambitions',
    'light',
  )
  const goals = player.goals_with_golafly ?? []
  if (goals.length) {
    const gGap = 3,
      gW = (leftW2 - gGap) / 2,
      gH = 15
    goals.slice(0, 6).forEach((g, i) => {
      const col = i % 2,
        row = Math.floor(i / 2)
      const gx = MX + col * (gW + gGap),
        gy = aly + row * (gH + gGap)
      roundRect(doc, gx, gy, gW, gH, 2.5, 'FD', PANEL, LINE)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...HEAD)
      const lines = wrapText(doc, g, gW - 8, 8.5, 'normal').slice(0, 2)
      lines.forEach((l, li) => doc.text(l, gx + 4, gy + 7 + li * 4))
    })
    aly += Math.ceil(goals.length / 2) * (gH + gGap)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('No goals added yet.', MX, aly + 4)
  }

  let cy = sectionHeader(
    doc,
    rightX2,
    topY,
    rightW2,
    'Contact Information',
    'Get in Touch',
    'light',
  )
  // Guardian fields are optional; the emergency contact is required on every
  // registration. Falling back to it means the dossier always shows at
  // least one adult contact instead of silently omitting the row when a
  // guardian wasn't given separately.
  const hasGuardian = !!player.guardian_name
  const adultContactRows: [string, string | undefined][] = hasGuardian
    ? [
        ['Guardian', player.guardian_name],
        ['Guardian Phone', player.guardian_phone],
      ]
    : [
        [
          'Emergency Contact',
          [
            player.emergency_contact_name,
            player.emergency_contact_relationship &&
              `(${player.emergency_contact_relationship})`,
          ]
            .filter(Boolean)
            .join(' '),
        ],
        ['Contact Phone', player.emergency_contact_phone],
      ]
  const contactRows = (
    [
      ['Email', player.email],
      ['Phone', player.phone],
      [
        'Location',
        [player.city, player.country_of_residence].filter(Boolean).join(', '),
      ],
      ...adultContactRows,
      ['Agent', player.agent_name],
      ['Agent Phone', player.agent_phone],
      ['Agent Email', player.agent_email],
    ] as [string, string | undefined][]
  )
    .filter((r): r is [string, string] => !!r[1])
    .slice(0, 7)
  const rowH = 9.4
  const contactH = contactRows.length ? 8 + contactRows.length * rowH : 20
  roundRect(doc, rightX2, cy, rightW2, contactH, 3, 'FD', WHITE, LINE)
  if (contactRows.length) {
    let iny = cy + 6.4
    contactRows.forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.4)
      doc.setTextColor(...MUTED)
      doc.text(tracked(label), rightX2 + 4, iny)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...HEAD)
      doc.text(
        fitSingleLine(doc, val, rightW2 - 8, 9, 'bold'),
        rightX2 + 4,
        iny + 4.6,
      )
      iny += rowH
    })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text('No contact details on file.', rightX2 + 4, cy + 11)
  }
  cy += contactH + 5

  const idxH = 26
  roundRect(doc, rightX2, cy, rightW2, idxH, 3, 'FD', WHITE, LINE)
  const r2 = 10,
    cxr = rightX2 + 16,
    cyr = cy + idxH / 2
  doc.setDrawColor(...TRACK)
  doc.setLineWidth(2.6)
  doc.circle(cxr, cyr, r2, 'S')
  if (golaflyIndex != null)
    drawArc(doc, cxr, cyr, r2, -90, -90 + (golaflyIndex / 10) * 360, GREEN, 2.6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...HEAD)
  doc.text(
    golaflyIndex != null ? golaflyIndex.toFixed(1) : '—',
    cxr,
    cyr + 1.2,
    { align: 'center' },
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...MUTED)
  doc.text(tracked('Golafly Index'), rightX2 + 30, cy + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...HEAD)
  doc.text(
    fitSingleLine(
      doc,
      player.overall_recommendation || 'Pending Review',
      rightW2 - 34,
      10,
      'bold',
    ),
    rightX2 + 30,
    cy + 13.5,
  )

  renderCtaBand(doc, MX, CW, fullName, player.id)

  footer(doc, 'Generated by Golafly · golafly.com', 4, 'light')

  const safeName =
    fullName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') ||
    `player-${player.id}`
  doc.save(`${safeName}-CV.pdf`)
}

/** Bottom "Ready to get discovered" CTA band with a QR code placeholder. */
function renderCtaBand(
  doc: jsPDF,
  MX: number,
  CW: number,
  _fullName: string,
  _playerId: number,
): void {
  const bandY = 260,
    bandH = 22
  roundRect(doc, MX, bandY, CW, bandH, 3, 'F', INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.6)
  doc.setTextColor(...LIME)
  doc.text(tracked('Open to Trials & Opportunities'), MX + 6, bandY + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text('Ready to get discovered.', MX + 6, bandY + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.6)
  doc.setTextColor(...MUTED_D)
  doc.text(
    'Share this dossier with scouts, academies and clubs worldwide.',
    MX + 6,
    bandY + 18.5,
  )

  // ── QR code: placeholder for now ──────────────────────────────────────────
  // Real generation needs the `qrcode` package (not currently a project
  // dependency) plus a canonical, public profile URL to encode. Once both
  // are available, swap this block for:
  //
  //   import QRCode from "qrcode";
  //   ...
  //   const profileUrl = `${window.location.origin}/players/${_playerId}`;
  //   const qrDataUrl = await QRCode.toDataURL(profileUrl, { margin: 0, color: { dark: "#0b0f0a", light: "#ffffff" } });
  //   doc.addImage(qrDataUrl, "PNG", PAGE_W - MX - 6 - qrS, bandY + 3, qrS, qrS);
  //
  // (this whole function would need to become async and be awaited from
  // downloadPlayerCv, since QRCode.toDataURL is promise-based)
  const qrS = 16
  roundRect(doc, PAGE_W - MX - 6 - qrS, bandY + 3, qrS, qrS, 1.5, 'F', WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  doc.setTextColor(...INK)
  doc.text('QR', PAGE_W - MX - 6 - qrS / 2, bandY + 3 + qrS / 2 + 1, {
    align: 'center',
  })
}

// ─── matchday: the raw API record → the dossier's shape ────────────────────

interface RatedAttr {
  label: string
  value: number
}

interface SeasonStats {
  season: string
  appearances?: number
  goals?: number
  assists?: number
  clean_sheets?: number
  minutes_played?: number
  yellow_cards?: number
  red_cards?: number
}

/** The player shape the dossier draws from — golafly.com's ApiPlayer. */
interface DossierPlayer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  nationality: string
  country_of_residence: string
  passport_number?: string
  city?: string
  languages?: string[]
  primary_position: string
  secondary_position?: string
  preferred_foot: string
  jersey_number?: string
  height_cm: number
  weight_kg?: number
  current_club_academy?: string
  current_level: string
  player_status?: string
  goals_with_golafly?: string[]
  highlights?: string[]
  top_speed_kmh?: number
  strength?: number
  stamina?: number
  agility?: number
  attributes?: RatedAttr[]
  season_stats?: SeasonStats[]
  achievements?: { title: string; year?: string }[]
  profile_photo_url?: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  guardian_name?: string
  guardian_phone?: string
  agent_name?: string
  agent_phone?: string
  agent_email?: string
  additional_notes?: string
  created_at: string
  scout_technical_rating?: number // 0–5
  scout_tactical_rating?: number // 0–5
  scout_physical_rating?: number // 0–5
  scout_mental_rating?: number // 0–5
  overall_recommendation?: string
  aerial_duels_won_pct?: number
  pass_accuracy_pct?: number
  duels_won_pct?: number
}

/* A structured field can arrive as an object, a JSON string, or an array of
   either — the backend has returned all three. */
function asObject(v: unknown): Record<string, unknown> | undefined {
  if (v == null) return undefined
  if (Array.isArray(v)) return asObject(v[0])
  if (typeof v === 'string') {
    try {
      return asObject(JSON.parse(v))
    } catch {
      return undefined
    }
  }
  if (typeof v === 'object') return v as Record<string, unknown>
  return undefined
}

function toNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

/* ["English","Spanish"] or one brace-wrapped "{English, Spanish}". */
function normLanguages(v: unknown): string[] | undefined {
  if (v == null) return undefined
  const out = (Array.isArray(v) ? v : [v])
    .flatMap(item => String(item).replace(/[{}]/g, '').split(','))
    .map(x => x.trim())
    .filter(Boolean)
  return out.length ? out : undefined
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

function toDossierPlayer(player: RawPlayer): DossierPlayer {
  const raw = player as unknown as Record<string, unknown>
  const base = raw as unknown as DossierPlayer
  const str = (k: string) => (typeof raw[k] === 'string' && raw[k] ? (raw[k] as string) : undefined)

  const rate = asObject(raw.rate_yourself)
  const attrObj = asObject(raw.player_attributes)
  const cs = asObject(raw.career_statistics)
  const achRaw = raw.achievements

  const dossier: DossierPlayer = {
    ...base,
    languages: normLanguages(raw.language_spoken) ?? normLanguages(raw.languages),
    top_speed_kmh: toNum(raw.top_speed) ?? toNum(raw.top_speed_kmh),
    strength: toNum(rate?.strenght ?? rate?.strength) ?? toNum(raw.strength),
    stamina: toNum(rate?.stamina) ?? toNum(raw.stamina),
    agility: toNum(rate?.agility) ?? toNum(raw.agility),
    attributes: attrObj
      ? Object.entries(attrObj).map(([k, v]) => ({ label: cap(k), value: toNum(v) ?? 0 }))
      : base.attributes,
    season_stats: cs
      ? [
          {
            season: (cs.season as string) || 'Current Season',
            appearances: toNum(cs.appearances),
            goals: toNum(cs.goals),
            assists: toNum(cs.assists),
            clean_sheets: toNum(cs.clean_sheets),
            minutes_played: toNum(cs.minutes_played),
            yellow_cards: toNum(cs.yellow_card ?? cs.yellow_cards),
            red_cards: toNum(cs.red_cards),
          },
        ]
      : base.season_stats,
    achievements: Array.isArray(achRaw)
      ? achRaw
          .map(a => (typeof a === 'string' ? asObject(a) : (a as Record<string, unknown>)))
          .filter((a): a is Record<string, unknown> => !!a)
          .map(o => ({ title: String(o.title ?? ''), year: o.year != null ? String(o.year) : undefined }))
          .filter(a => a.title)
      : base.achievements,
    highlights: Array.isArray(raw.highlights) ? (raw.highlights as string[]) : undefined,
    agent_name: str('agency_name') ?? str('agent_name'),
    agent_phone: str('agency_phone') ?? str('agent_phone'),
    agent_email: str('agency_email') ?? str('agent_email'),
    profile_photo_url: str('profile_photo_url') ?? str('profile_photo'),
    height_cm: toNum(raw.height_cm) ?? 0,
    weight_kg: toNum(raw.weight_kg),
    scout_technical_rating: toNum(raw.scout_technical_rating),
    scout_tactical_rating: toNum(raw.scout_tactical_rating),
    scout_physical_rating: toNum(raw.scout_physical_rating),
    scout_mental_rating: toNum(raw.scout_mental_rating),
    overall_recommendation: str('overall_recommendation'),
  }

  /* The scout evaluation wins over the older scout_* fields as soon as a
     scout has scored the player, so the CV follows every new evaluation.
     Scores are 1–10 per group; the dossier's ratings are 0–5 (its Golafly
     Index doubles them back to /10). */
  const evaluation = player.evaluation
  if (isEvaluated(evaluation)) {
    const half = (n: number | null) => (n == null ? undefined : n / 2)
    dossier.scout_technical_rating = half(groupAverage(evaluation, 'technical')) ?? dossier.scout_technical_rating
    dossier.scout_tactical_rating = half(groupAverage(evaluation, 'tactical')) ?? dossier.scout_tactical_rating
    dossier.scout_physical_rating = half(groupAverage(evaluation, 'physical')) ?? dossier.scout_physical_rating
    dossier.scout_mental_rating = half(groupAverage(evaluation, 'mental')) ?? dossier.scout_mental_rating
    const sum = evaluationSummary(evaluation.summary)
    dossier.overall_recommendation =
      sum.recommendation || sum.headline || dossier.overall_recommendation
  }

  return dossier
}

/** Builds and downloads the player's dossier PDF from the raw API record. */
export async function downloadPlayerCv(player: RawPlayer): Promise<void> {
  await renderDossier(toDossierPlayer(player))
}
