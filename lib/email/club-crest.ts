// lib/email/club-crest.ts
//
// Real club crests for the emails (user decision 19 Nov 2026: the supplier's
// data may be used; nothing we send may carry the FootballTicketNet brand).
//
// The supplier's CDN keeps a clean crest per team at
//   https://cdn.footballticketnet.com/teams/{team_id}/logo.webp
// (transparent background, no branding). That is the ONLY file used here —
// never the API's `team.image`, which is a promo poster with the
// "FootballTicketNet" logo printed on it.
//
// Emails never link to the supplier: golafly.com fetches the crest, turns it
// into a PNG (Outlook can't show WebP) on a fixed square canvas and serves it
// from its own address. A missing crest → null, and the caller falls back to
// the initials badge (lib/email/crest.ts).

import sharp from 'sharp'

const CDN = 'https://cdn.footballticketnet.com/teams'
/** Output canvas: shown at about 112 px in the email, so 240 stays sharp. */
export const CREST_SIZE = 240
const MAX_BYTES = 2 * 1024 * 1024
/** Crest files run from about 90 px to 1,550 px (AS Roma); a cap still
 *  guards against a huge or broken file. */
const MAX_SOURCE_SIDE = 4000

const cache = new Map<number, Promise<Buffer | null>>()

async function load(teamId: number): Promise<Buffer | null> {
  try {
    const res = await fetch(`${CDN}/${teamId}/logo.webp`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'image/webp,image/*' },
    })
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) return null
    const src = Buffer.from(await res.arrayBuffer())
    if (!src.length || src.length > MAX_BYTES) return null
    const meta = await sharp(src).metadata()
    if (!meta.width || !meta.height || Math.max(meta.width, meta.height) > MAX_SOURCE_SIDE) return null
    const crest = await sharp(src)
      .resize(CREST_SIZE - 16, CREST_SIZE - 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toBuffer()
    return await withHaloIfDark(crest)
  } catch {
    return null
  }
}

/** Dark crests (Juventus, Tottenham, Bolton …) vanish on the email's dark
 *  match card (#0e0e0e). Those get a thin soft-white outline that follows
 *  the crest's shape; colourful crests are left exactly as they are. */
async function withHaloIfDark(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  let sum = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    n++
  }
  const dark = n > 0 && sum / n < 70
  if (!dark) return sharp(png).png({ compressionLevel: 9 }).toBuffer()

  /* The crest's shape, grown by a few pixels, filled soft white. */
  const alpha = Buffer.alloc(info.width * info.height)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) alpha[j] = data[i + 3]
  const grown = await sharp(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
    .blur(3)
    .threshold(8)
    /* Keep it one channel: sharp would otherwise hand back three. */
    .extractChannel(0)
    .raw()
    .toBuffer()
  if (grown.length !== info.width * info.height) return sharp(png).png({ compressionLevel: 9 }).toBuffer()
  const halo = Buffer.alloc(info.width * info.height * 4)
  for (let j = 0; j < grown.length; j++) {
    halo[j * 4] = 245
    halo[j * 4 + 1] = 247
    halo[j * 4 + 2] = 243
    halo[j * 4 + 3] = Math.round(grown[j] * 0.92)
  }
  return sharp(halo, { raw: { width: info.width, height: info.height, channels: 4 } })
    .composite([{ input: png }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** The club's crest as a 240×240 PNG, or null when there is none. Kept per
 *  server process (successes only; a miss is tried again next time). */
export function clubCrestPng(teamId: number): Promise<Buffer | null> {
  if (!Number.isInteger(teamId) || teamId <= 0) return Promise.resolve(null)
  let p = cache.get(teamId)
  if (!p) {
    if (cache.size >= 500) cache.delete(cache.keys().next().value as number)
    p = load(teamId).then((png) => {
      if (!png) cache.delete(teamId)
      return png
    })
    cache.set(teamId, p)
  }
  return p
}
