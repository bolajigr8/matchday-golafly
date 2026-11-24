/**
 * Prepares a footballticketnet seating-plan SVG for inline rendering.
 *
 *  - removes FTN branding (the logo group on the pitch: white band + ball +
 *    "FootballTicketNet" wordmark) — see removeBranding() for how it's found;
 *  - sanitises (scripts, foreignObject, event handlers, external hrefs);
 *  - namespaces every id / class so two stadium SVGs never clash (.cls-2 etc.);
 *  - tags each block (data-block = normalised name, data-cat = category id),
 *    its filled shapes and its label glyphs, so CSS can recolour them;
 *  - measures every block from its geometry (rect / polygon / path …) for the
 *    price bubbles, and keeps each block's outline for the listing mini maps.
 *
 * Runs in the browser (needs DOMParser / XMLSerializer).
 */

export type PlanBox = { x: number; y: number; w: number; h: number }

export type PlanBlock = {
  /** Normalised block name, e.g. "AU1", "102", "EXCLUSIVE_01". */
  key: string
  categoryId: number | null
  /** Bounding box in viewBox units. From the geometry, not getBBox(), so it
   *  also works while the map is hidden (mobile + desktop copies). */
  box: PlanBox | null
  /** The block's filled shapes as plain SVG markup (no classes), wrapped in
   *  any ancestor transforms — used to highlight it on the mini maps. */
  outline: string
}

export type PreparedPlan = {
  markup: string
  viewBox: string
  blocks: PlanBlock[]
  /** Whether a branding group was found and removed. */
  brandingRemoved: boolean
  cls: { block: string; shape: string; label: string }
}

/* ── branding ─────────────────────────────────────────────────────────── */

/** ids that are FTN branding. Never matches "Football_Club" (the team crest). */
const BRANDING_ID =
  /ftn|ticketnet|ticket[-_]?net|watermark|^_?logo(?:[-_]?\d+)?$/i

function removeBranding(doc: Document): boolean {
  let removed = false
  // 1. By id: "LogoFTN" (Anfield), "logo", anything with ftn/ticketnet.
  doc.querySelectorAll('[id]').forEach((el) => {
    if (
      el.isConnected &&
      BRANDING_ID.test(el.id) &&
      !el.closest('.categories')
    ) {
      el.remove()
      removed = true
    }
  })
  if (removed) return true
  // 2. By structure: the logo's ball group ("ball") has a wordmark sibling
  //    ("text"). Remove their common parent group — that also takes the white
  //    band behind the wordmark, which sits in the same group.
  const ball = Array.from(doc.querySelectorAll('g[id]')).find(
    (g) => /^_?ball/i.test(g.id) && !g.closest('.categories'),
  )
  if (ball) {
    // Climb to the outermost group that holds ONLY logo parts — stop before
    // any group that also holds blocks, the pitch, the crest or stand names.
    const keep =
      '.categories, [id*="club" i], [id*="crest" i], [id*="pitch" i], [id*="frame" i], [id*="guide" i], [id*="stand" i]'
    let top: Element = ball
    for (
      let p = ball.parentElement;
      p && p.tagName.toLowerCase() === 'g';
      p = p.parentElement
    ) {
      if (
        /pitch|stand|stadium|guide|club|crest/i.test(p.id) ||
        p.querySelector(keep)
      )
        break
      top = p
    }
    top.remove()
    return true
  }
  return false
}

/* ── names ────────────────────────────────────────────────────────────── */

/** "_0AU1" / "0AU1" -> "AU1", "_102" -> "102", "_0Exclusive_01-2" -> "EXCLUSIVE_01" */
export function normalizeBlockId(raw: string): string {
  let s = raw.trim().replace(/^_/, '').replace(/-\d+$/, '')
  if (/^0[A-Za-z]/.test(s)) s = s.slice(1)
  return s.toUpperCase()
}

/** Same normalisation for API values (seating_blocks, listing blocks). */
export const normalizeApiBlock = (b: string) => b.trim().toUpperCase()

/* ── geometry ─────────────────────────────────────────────────────────── */

const SHAPE_TAGS = new Set([
  'polygon',
  'rect',
  'path',
  'polyline',
  'circle',
  'ellipse',
])
const LABEL_TAGS = new Set(['text', 'tspan'])

/** 2-D affine matrix [a, b, c, d, e, f] (SVG order): x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Mat = [number, number, number, number, number, number]
const IDENTITY: Mat = [1, 0, 0, 1, 0, 0]

function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

/** Parses an SVG transform list: matrix, translate, scale, rotate, skewX/Y. */
function parseTransform(t: string): Mat | null {
  let m: Mat = IDENTITY
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g
  let hit: RegExpExecArray | null
  let any = false
  while ((hit = re.exec(t))) {
    any = true
    const v = (hit[2].match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(
      Number,
    )
    let n: Mat
    switch (hit[1]) {
      case 'matrix':
        if (v.length < 6) return null
        n = [v[0], v[1], v[2], v[3], v[4], v[5]]
        break
      case 'translate':
        n = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]
        break
      case 'scale':
        n = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0]
        break
      case 'rotate': {
        const r = ((v[0] ?? 0) * Math.PI) / 180
        const cos = Math.cos(r)
        const sin = Math.sin(r)
        const cx = v[1] ?? 0
        const cy = v[2] ?? 0
        n = mul(mul([1, 0, 0, 1, cx, cy], [cos, sin, -sin, cos, 0, 0]), [
          1,
          0,
          0,
          1,
          -cx,
          -cy,
        ])
        break
      }
      case 'skewX':
        n = [1, 0, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 1, 0, 0]
        break
      default:
        n = [1, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]
    }
    m = mul(m, n)
  }
  return any ? m : t.trim() ? null : IDENTITY
}

/** The element's full transform up to the root <svg> (its own included). */
function matrixOf(el: Element | null): Mat | null {
  let m: Mat = IDENTITY
  const chain: Element[] = []
  for (
    let n: Element | null = el;
    n && n.tagName.toLowerCase() !== 'svg';
    n = n.parentElement
  )
    chain.push(n)
  for (let i = chain.length - 1; i >= 0; i--) {
    const t = chain[i].getAttribute('transform')
    if (!t) continue
    const own = parseTransform(t)
    if (!own) return null
    m = mul(m, own)
  }
  return m
}

const apply = (m: Mat, x: number, y: number): [number, number] => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
]

/** Points that bound a path: every end point and control point (a curve
 *  never leaves the hull of its control points, so this is a safe box). */
function pathPoints(d: string): number[][] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? []
  const pts: number[][] = []
  let i = 0
  let cmd = ''
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => Number(tokens[i++])
  const isNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++]
    else if (!cmd) return pts
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    if (C === 'Z') {
      x = sx
      y = sy
      continue
    }
    if (!isNum()) continue
    const pt = (px: number, py: number) => {
      const ax = rel ? x + px : px
      const ay = rel ? y + py : py
      pts.push([ax, ay])
      return [ax, ay]
    }
    switch (C) {
      case 'M': {
        ;[x, y] = pt(num(), num())
        sx = x
        sy = y
        cmd = rel ? 'l' : 'L' // further pairs are line-tos
        break
      }
      case 'L':
      case 'T':
        ;[x, y] = pt(num(), num())
        break
      case 'H': {
        const v = num()
        x = rel ? x + v : v
        pts.push([x, y])
        break
      }
      case 'V': {
        const v = num()
        y = rel ? y + v : v
        pts.push([x, y])
        break
      }
      case 'C': {
        pt(num(), num())
        pt(num(), num())
        ;[x, y] = pt(num(), num())
        break
      }
      case 'S':
      case 'Q': {
        pt(num(), num())
        ;[x, y] = pt(num(), num())
        break
      }
      case 'A': {
        const rx = Math.abs(num())
        const ry = Math.abs(num())
        i += 3 // rotation, large-arc, sweep
        const [nx, ny] = pt(num(), num())
        // the arc bulges at most one radius past its chord
        pts.push(
          [Math.min(x, nx) - rx, Math.min(y, ny) - ry],
          [Math.max(x, nx) + rx, Math.max(y, ny) + ry],
        )
        x = nx
        y = ny
        break
      }
      default:
        i++
    }
  }
  return pts
}

function shapePoints(el: Element): number[][] {
  const num = (a: string) => Number(el.getAttribute(a) ?? 0)
  switch (el.tagName.toLowerCase()) {
    case 'rect':
    case 'image': {
      const x = num('x')
      const y = num('y')
      const w = num('width')
      const h = num('height')
      return [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ]
    }
    case 'line':
      return [
        [num('x1'), num('y1')],
        [num('x2'), num('y2')],
      ]
    case 'text': {
      // Glyph extents aren't knowable without fonts: use the anchor point.
      const x = parseFloat(el.getAttribute('x') ?? '0') || 0
      const y = parseFloat(el.getAttribute('y') ?? '0') || 0
      return [[x, y]]
    }
    case 'polygon':
    case 'polyline': {
      const n = (el.getAttribute('points') ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      const out: number[][] = []
      for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]])
      return out
    }
    case 'circle':
      return [
        [num('cx') - num('r'), num('cy') - num('r')],
        [num('cx') + num('r'), num('cy') + num('r')],
      ]
    case 'ellipse':
      return [
        [num('cx') - num('rx'), num('cy') - num('ry')],
        [num('cx') + num('rx'), num('cy') + num('ry')],
      ]
    case 'path':
      return pathPoints(el.getAttribute('d') ?? '')
    default:
      return []
  }
}

function boxOf(shapes: Element[]): PlanBox | null {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const el of shapes) {
    const m = matrixOf(el)
    if (!m) continue
    for (const [px, py] of shapePoints(el)) {
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue
      const [x, y] = apply(m, px, py)
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }
  return Number.isFinite(x0) && x1 > x0 && y1 > y0
    ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
    : null
}

/** Is this a filled block shape (vs. a label glyph drawn as a path)? Shapes
 *  carry a fill class or fill attribute; FTN's label glyphs carry neither. */
function isFilledShape(el: Element): boolean {
  if (!SHAPE_TAGS.has(el.tagName.toLowerCase())) return false
  if (el.getAttribute('class')) return true
  const fill =
    el.getAttribute('fill') ??
    el.getAttribute('style')?.match(/fill\s*:\s*([^;]+)/)?.[1]
  return !!fill && fill.trim() !== 'none'
}

/** Plain markup of a block's shapes for the mini maps (classes stripped, any
 *  ancestor transforms re-applied). */
function outlineOf(shapes: Element[]): string {
  const ser = new XMLSerializer()
  return shapes
    .map((el) => {
      const c = el.cloneNode(false) as Element
      for (const a of Array.from(c.attributes)) {
        if (/^(class|id|style|fill|stroke|opacity)$|^data-/.test(a.name))
          c.removeAttribute(a.name)
      }
      let s = ser.serializeToString(c).replace(/\sxmlns="[^"]*"/, '')
      for (
        let n = el.parentElement;
        n && n.tagName.toLowerCase() !== 'svg';
        n = n.parentElement
      ) {
        const t = n.getAttribute('transform')
        if (t) s = `<g transform="${t.replace(/"/g, '')}">${s}</g>`
      }
      return s
    })
    .join('')
}

/* ── fit to stadium ───────────────────────────────────────────────── */

const NON_DRAWN =
  'defs, clipPath, mask, pattern, symbol, linearGradient, radialGradient, filter, marker, style, title, desc, metadata'
const LEAF_TAGS = new Set([
  'rect',
  'polygon',
  'polyline',
  'path',
  'circle',
  'ellipse',
  'line',
  'image',
  'text',
])

function fitToStadium(
  svg: Element,
  blocks: PlanBlock[],
  fallback: string,
): string {
  const boxes = blocks.map((b) => b.box).filter((b): b is PlanBox => !!b)
  const [fx, fy, fw, fh] = fallback.split(/[\s,]+/).map(Number)
  const fallbackPadded = () => {
    const pad = Number.isFinite(fw) ? Math.max(fw, fh) * 0.025 : 0
    return pad
      ? `${(fx - pad).toFixed(2)} ${(fy - pad).toFixed(2)} ${(fw + 2 * pad).toFixed(2)} ${(fh + 2 * pad).toFixed(2)}`
      : fallback
  }
  // Too few measured blocks to trust a crop → old behaviour.
  if (boxes.length < 4) return fallbackPadded()

  let x0 = Math.min(...boxes.map((b) => b.x))
  let y0 = Math.min(...boxes.map((b) => b.y))
  let x1 = Math.max(...boxes.map((b) => b.x + b.w))
  let y1 = Math.max(...boxes.map((b) => b.y + b.h))
  const m = Math.max(x1 - x0, y1 - y0) * 0.07
  x0 -= m
  y0 -= m
  x1 += m
  y1 += m
  // Never crop wider than the canvas itself.
  if (Number.isFinite(fw) && Number.isFinite(fh)) {
    x0 = Math.max(x0, fx)
    y0 = Math.max(y0, fy)
    x1 = Math.min(x1, fx + fw)
    y1 = Math.min(y1, fy + fh)
  }
  if (!(x1 > x0 && y1 > y0)) return fallbackPadded()

  // Remove separate drawings that would be cut by the crop (title, legend).
  // Things that span the stadium — the bowl outline, a page background — are
  // kept and simply clipped. Blocks and their labels are always kept.
  const cropArea = (x1 - x0) * (y1 - y0)
  for (const el of Array.from(svg.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase()
    if (!LEAF_TAGS.has(tag)) continue
    if (el.closest('[data-block]') || el.closest(NON_DRAWN)) continue
    const mat = matrixOf(el)
    if (!mat) continue // unknown transform → leave it alone
    const pts = shapePoints(el)
      .filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
      .map(([px, py]) => apply(mat, px, py))
    if (!pts.length) continue
    const bx0 = Math.min(...pts.map((p) => p[0]))
    const by0 = Math.min(...pts.map((p) => p[1]))
    const bx1 = Math.max(...pts.map((p) => p[0]))
    const by1 = Math.max(...pts.map((p) => p[1]))
    const area = (bx1 - bx0) * (by1 - by0)
    if (area <= 0) {
      // a point (text anchor) or a straight line: keep only if inside
      if (!(bx0 >= x0 && bx1 <= x1 && by0 >= y0 && by1 <= y1)) el.remove()
      continue
    }
    const ox = Math.max(0, Math.min(bx1, x1) - Math.max(bx0, x0))
    const oy = Math.max(0, Math.min(by1, y1) - Math.max(by0, y0))
    const overlap = ox * oy
    const spansStadium = overlap >= cropArea * 0.6
    if (!spansStadium && overlap < area * 0.98) el.remove()
  }
  return `${x0.toFixed(2)} ${y0.toFixed(2)} ${(x1 - x0).toFixed(2)} ${(y1 - y0).toFixed(2)}`
}

/* ── main ─────────────────────────────────────────────────────────────── */

export function prepareSeatingPlan(
  svgText: string,
  prefix = 'sp',
): PreparedPlan | null {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement
  if (
    !svg ||
    svg.nodeName.toLowerCase() !== 'svg' ||
    doc.querySelector('parsererror')
  )
    return null

  // 1. Branding.
  const brandingRemoved = removeBranding(doc)

  // 2. Sanitise.
  doc
    .querySelectorAll('script, foreignObject, iframe, object, embed')
    .forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if (
        (name === 'href' || name === 'xlink:href') &&
        !attr.value.startsWith('#')
      ) {
        el.removeAttribute(attr.name)
      }
    }
  })

  // 3. Blocks: the outermost ".categories" elements (a <g> or a bare shape),
  //    plus sibling <g>s with an id/name (unpriced blocks like CE1-M, L13).
  const blockEls = new Set<Element>()
  doc.querySelectorAll('.categories').forEach((el) => {
    if (el.parentElement?.closest('.categories')) return // nested duplicate
    blockEls.add(el)
    if (el.tagName.toLowerCase() !== 'g') return
    Array.from(el.parentElement?.children ?? []).forEach((sib) => {
      if (
        sib.tagName.toLowerCase() === 'g' &&
        (sib.getAttribute('data-name') || sib.id)
      )
        blockEls.add(sib)
    })
  })

  const cls = {
    block: `${prefix}-block`,
    shape: `${prefix}-shape`,
    label: `${prefix}-label`,
  }
  const blocks: PlanBlock[] = []

  blockEls.forEach((el) => {
    const key = normalizeBlockId(el.getAttribute('data-name') || el.id || '')
    if (!key) return
    const catAttr = el.getAttribute('data-category')
    const categoryId = catAttr && /^\d+$/.test(catAttr) ? Number(catAttr) : null

    el.querySelectorAll('.categories, [data-category]').forEach((inner) => {
      inner.classList.remove('categories')
      inner.removeAttribute('data-category')
    })

    el.setAttribute('data-block', key)
    if (categoryId !== null) el.setAttribute('data-cat', String(categoryId))
    else el.removeAttribute('data-cat')

    const isShapeItself = SHAPE_TAGS.has(el.tagName.toLowerCase())
    let shapes: Element[] = isShapeItself ? [el] : []
    if (!isShapeItself) {
      const parts = Array.from(el.querySelectorAll('*'))
      shapes = parts.filter(isFilledShape)
      // a block with no recognisable fill → its first shape is the block
      if (!shapes.length) {
        const first = parts.find((p) => SHAPE_TAGS.has(p.tagName.toLowerCase()))
        if (first) shapes = [first]
      }
      for (const p of parts) {
        const tag = p.tagName.toLowerCase()
        if (shapes.includes(p)) p.classList.add(cls.shape)
        else if (SHAPE_TAGS.has(tag) || LABEL_TAGS.has(tag))
          p.classList.add(cls.label)
      }
    } else {
      el.classList.add(cls.shape)
    }
    el.classList.add(cls.block)
    const box = boxOf(shapes)
    const outline = outlineOf(shapes)
    // Supplier SVGs can name several elements the same (PREFERENCIA,
    // TRIBUNA …). Keep one entry per key — React keys and the price-bubble
    // map rely on it — merging the geometry of the duplicates.
    const dup = blocks.find((b) => b.key === key)
    if (dup) {
      if (box) {
        if (dup.box) {
          const x = Math.min(dup.box.x, box.x)
          const y = Math.min(dup.box.y, box.y)
          dup.box = {
            x,
            y,
            w: Math.max(dup.box.x + dup.box.w, box.x + box.w) - x,
            h: Math.max(dup.box.y + dup.box.h, box.y + box.h) - y,
          }
        } else dup.box = box
      }
      dup.outline += outline
      if (dup.categoryId === null) dup.categoryId = categoryId
    } else {
      blocks.push({ key, categoryId, box, outline })
    }
  })

  // 4. Namespace ids + classes (keep our own prefixed classes untouched).
  const idMap = new Map<string, string>()
  doc.querySelectorAll('[id]').forEach((el) => {
    const next = `${prefix}-${el.id}`
    idMap.set(el.id, next)
    el.id = next
  })
  const rewriteRefs = (v: string) =>
    v
      .replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) =>
        idMap.has(id) ? `url(#${idMap.get(id)})` : m,
      )
      .replace(/^#(.+)$/, (m, id) => (idMap.has(id) ? `#${idMap.get(id)}` : m))

  const ours = new Set(Object.values(cls))
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === 'class') {
        el.setAttribute(
          'class',
          attr.value
            .split(/\s+/)
            .filter(Boolean)
            .map((c) => (ours.has(c) ? c : `${prefix}-${c}`))
            .join(' '),
        )
      } else if (/url\(#|^#/.test(attr.value)) {
        el.setAttribute(attr.name, rewriteRefs(attr.value))
      }
    }
  })
  doc.querySelectorAll('style').forEach((style) => {
    style.textContent = (style.textContent ?? '')
      // class selectors (".49" in "0.49" is skipped: a class starts with a letter/_)
      .replace(/\.([A-Za-z_][\w-]*)/g, (_, c) => `.${prefix}-${c}`)
      .replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) =>
        idMap.has(id) ? `url(#${idMap.get(id)})` : m,
      )
  })

  // 5. Responsive root.
  const viewBox =
    svg.getAttribute('viewBox') ??
    (svg.getAttribute('width') && svg.getAttribute('height')
      ? `0 0 ${parseFloat(svg.getAttribute('width')!)} ${parseFloat(svg.getAttribute('height')!)}`
      : '0 0 1000 1000')
  // Fit to the stadium. Supplier files are drawn on canvases of every size,
  // and some carry a title block and a colour legend inside the drawing
  // (London Stadium). Scaling the whole canvas left the stadium small and
  // its labels unreadable on some fixtures and fine on others. So the view
  // is cropped to the blocks themselves plus a 7% margin (room for stand
  // names), and anything decorative that would be cut by that edge
  // (title, legend, page background) is removed instead of half-shown.
  const paddedViewBox = fitToStadium(svg, blocks, viewBox)
  svg.setAttribute('viewBox', paddedViewBox)
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')

  if (!brandingRemoved && process.env.NODE_ENV !== 'production') {
    const top = Array.from(svg.children)
      .map((c) => c.id || c.tagName)
      .join(', ')
    console.warn(
      `[seating-plan] no branding group found to remove. Top-level elements: ${top}`,
    )
  }

  return {
    markup: new XMLSerializer().serializeToString(svg),
    viewBox: paddedViewBox,
    blocks,
    brandingRemoved,
    cls,
  }
}

/* ── mini map (listing cards) ─────────────────────────────────────────── */

/** A light, label-free copy of the plan for the listing-card thumbnails:
 *  every block grey, labels hidden, logo already gone. Rendered once as an
 *  <img> (blob URL) and shared by every card. */
export function planThumbnailMarkup(plan: PreparedPlan): string {
  const { block: B, shape: S, label: L } = plan.cls
  const css =
    `.${B} .${S}{fill:#d4d4d8;stroke:#ffffff;stroke-width:2px}` +
    `.${B} .${L}{display:none}`
  return plan.markup.replace(/<svg([^>]*)>/, `<svg$1><style>${css}</style>`)
}
