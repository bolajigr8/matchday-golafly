// lib/email/countdown.tsx
//
// Live "KICKOFF IN" countdown for the booking-confirmation email, drawn as an
// animated GIF when the email is opened (emails can't run code). Matches the
// Figma block (Golafly Pro path, "Email 1 · Booking Confirmation", node
// 259:5385): lime "KICKOFF IN" label, four dark tiles DAYS · HRS · MIN · SEC,
// white digits, lime seconds, on the card's #0e0e0e.
//
// 60 frames, one per second, played once: the seconds tick for a minute,
// then the picture stays on the last frame. Only the first frame is a full
// picture; the others repaint just the digits that changed, so the file
// stays small (≈ 30–60 KB).
//
// Pieces are drawn with next/og (satori), decoded with pngjs and cached per
// server process, so after the first request a GIF is put together in a few
// milliseconds.

import { ImageResponse } from 'next/og'
import { PNG } from 'pngjs'
import { GifWriter } from 'omggif'
import { applyPalette, quantize } from 'gifenc'
import { emailFonts } from './fonts'

/* Figma units (the 1000 px wide email frame); drawn at 2× for sharp phones. */
const S = 2
const W = 698
const H = 124
const TILE_W = 164
const TILE_H = 96
const TILE_Y = 28
const TILE_STEP = 178
const DIGIT_Y = 12
const DIGIT_H = 52
const LABELS = ['DAYS', 'HRS', 'MIN', 'SEC'] as const

const C = {
  card: '#0e0e0e',
  tile: '#1e1e1c',
  tileBorder: '#3e3e38',
  lime: '#b7ff00',
  white: '#ffffff',
  muted: '#96968e',
}

export const FRAMES = 60

type Rgba = { data: Buffer; width: number; height: number }

async function renderPng(node: React.ReactElement, width: number, height: number): Promise<Rgba> {
  const res = new ImageResponse(node, { width, height, fonts: await emailFonts() })
  const png = PNG.sync.read(Buffer.from(await res.arrayBuffer()))
  return { data: png.data, width: png.width, height: png.height }
}

/* ── the still parts (label, tiles, tile names) — drawn once ── */
let basePromise: Promise<Rgba> | null = null
function base(): Promise<Rgba> {
  basePromise ??= renderPng(
    <div style={{ width: W * S, height: H * S, display: 'flex', position: 'relative', background: C.card }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 14 * S,
          letterSpacing: 2.52 * S,
          color: C.lime,
          lineHeight: 1,
        }}
      >
        KICKOFF IN
      </div>
      {LABELS.map((label, i) => (
        <div
          key={label}
          style={{
            position: 'absolute',
            left: i * TILE_STEP * S,
            top: TILE_Y * S,
            width: TILE_W * S,
            height: TILE_H * S,
            background: C.tile,
            border: `${S}px solid ${C.tileBorder}`,
            borderRadius: 8 * S,
            display: 'flex',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 67 * S,
              width: TILE_W * S - 2 * S,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 13 * S,
              letterSpacing: 2.34 * S,
              color: C.muted,
              lineHeight: 1,
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>,
    W * S,
    H * S,
  ).catch((e) => {
    basePromise = null
    throw e
  })
  return basePromise
}

/* ── the digits of one tile — drawn on demand, kept for later requests ── */
const SPRITE_W = (TILE_W - 4) * S
const SPRITE_H = DIGIT_H * S
const sprites = new Map<string, Promise<Rgba>>()
function sprite(text: string, color: string): Promise<Rgba> {
  const key = `${color}|${text}`
  let p = sprites.get(key)
  if (!p) {
    if (sprites.size > 400) sprites.delete(sprites.keys().next().value as string)
    p = renderPng(
      <div
        style={{
          width: SPRITE_W,
          height: SPRITE_H,
          background: C.tile,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 46 * S,
          color,
          lineHeight: 1,
        }}
      >
        {text}
      </div>,
      SPRITE_W,
      SPRITE_H,
    ).catch((e) => {
      sprites.delete(key)
      throw e
    })
    sprites.set(key, p)
  }
  return p
}

/** Where the digits of tile i go (inside the 1-unit border). */
function digitBox(i: number) {
  return { x: (i * TILE_STEP + 2) * S, y: (TILE_Y + DIGIT_Y) * S }
}

function blit(dst: Rgba, src: Rgba, x: number, y: number) {
  for (let row = 0; row < src.height; row++) {
    const from = row * src.width * 4
    src.data.copy(dst.data, ((y + row) * dst.width + x) * 4, from, from + src.width * 4)
  }
}

function crop(src: Rgba, x: number, y: number, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h * 4)
  for (let row = 0; row < h; row++) {
    const from = ((y + row) * src.width + x) * 4
    out.set(src.data.subarray(from, from + w * 4), row * w * 4)
  }
  return out
}

/* omggif's types ask for number[]; it reads any array-like of indexes. */
const indexed = (px: Uint8Array) => px as unknown as number[]

/** The four tile texts for `seconds` left; null = unknown kick-off ("--"). */
export function tileTexts(seconds: number | null): string[] {
  if (seconds === null) return ['--', '--', '--', '--']
  /* At most 999 days, so a mistyped far-future date can't overflow the tile. */
  const s = Math.min(Math.max(0, Math.floor(seconds)), 999 * 86400 + 86399)
  const pad = (n: number) => String(n).padStart(2, '0')
  return [pad(Math.floor(s / 86400)), pad(Math.floor((s % 86400) / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)]
}

/** The countdown GIF for `secondsLeft` at the moment of the request. */
export async function countdownGif(secondsLeft: number | null): Promise<Buffer> {
  const frameCount = secondsLeft === null || secondsLeft <= 0 ? 1 : Math.min(FRAMES, Math.floor(secondsLeft) + 1)
  const texts = Array.from({ length: frameCount }, (_, t) => tileTexts(secondsLeft === null ? null : secondsLeft - t))

  const [still, ...pieces] = await Promise.all([
    base(),
    ...texts.flatMap((row) => row.map((txt, i) => sprite(txt, i === 3 ? C.lime : C.white))),
  ])
  const pieceOf = (t: number, i: number) => pieces[t * 4 + i]

  /* One palette for the whole GIF, from the still parts + every digit used. */
  const sample = Buffer.concat([still.data, ...[...new Set(pieces)].map((p) => p.data)])
  const palette = quantize(new Uint8Array(sample.buffer, sample.byteOffset, sample.byteLength), 256)
  while (palette.length < 256) palette.push([0, 0, 0])
  const paletteInts = palette.map(([r, g, b]) => (r << 16) | (g << 8) | b)

  const width = W * S
  const height = H * S
  const out = Buffer.alloc(width * height * 2 + frameCount * SPRITE_W * SPRITE_H * 4 + 4096)
  /* No `loop` option = no looping block: the GIF plays once and stops. */
  const gif = new GifWriter(out, width, height, { palette: paletteInts })

  const frame: Rgba = { data: Buffer.from(still.data), width, height }
  for (let t = 0; t < frameCount; t++) {
    const changed = [0, 1, 2, 3].filter((i) => t === 0 || texts[t][i] !== texts[t - 1][i])
    for (const i of changed) {
      const { x, y } = digitBox(i)
      blit(frame, pieceOf(t, i), x, y)
    }
    const delay = t === frameCount - 1 ? 0 : 100
    if (t === 0) {
      gif.addFrame(0, 0, width, height, indexed(applyPalette(new Uint8Array(frame.data), palette)), { delay, disposal: 1 })
    } else {
      /* Repaint only the strip from the first to the last changed tile. */
      const first = digitBox(changed[0])
      const last = digitBox(changed[changed.length - 1])
      const w = last.x + SPRITE_W - first.x
      const rgba = crop(frame, first.x, first.y, w, SPRITE_H)
      gif.addFrame(first.x, first.y, w, SPRITE_H, indexed(applyPalette(rgba, palette)), { delay, disposal: 1 })
    }
  }
  return out.subarray(0, gif.end())
}
