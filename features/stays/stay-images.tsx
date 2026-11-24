// features/stays/stay-images.tsx

type UnknownImage = unknown

const SIZE_PLACEHOLDER = '{size}'

/**
 * The WorldOta/RateHawk CDN only accepts a fixed allow-list of thumbnail
 * sizes — anything else (e.g. 640x480, 96x96, 128x128) returns a 400
 * ("Invalid thumbnail format"). This is the full confirmed-working set.
 * Every size request in the app is coerced into one of these, so no
 * caller can ever accidentally request an invalid size again.
 */
export const ALLOWED_CDN_SIZES = ['80x80', '240x240', '1024x768'] as const
export type AllowedCdnSize = (typeof ALLOWED_CDN_SIZES)[number]

function coerceToAllowedSize(size: string): AllowedCdnSize {
  if ((ALLOWED_CDN_SIZES as readonly string[]).includes(size)) {
    return size as AllowedCdnSize
  }
  const match = /^(\d+)x(\d+)$/.exec(size)
  const width = match ? parseInt(match[1], 10) : 240
  if (width <= 100) return '80x80'
  if (width <= 400) return '240x240'
  return '1024x768'
}

/** Pull a single usable URL string out of a value that might be a
 * string, an array of strings/objects, or an object with a url-like key. */
export function extractImageUrl(value: UnknownImage): string | null {
  if (value == null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractImageUrl(item)
      if (url) return url
    }
    return null
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const candidateKeys = [
      'url',
      'src',
      'image',
      'image_url',
      'original',
      'large',
      'medium',
      'small',
      'path',
      'href',
    ]
    for (const key of candidateKeys) {
      if (key in obj) {
        const url = extractImageUrl(obj[key])
        if (url) return url
      }
    }
    for (const val of Object.values(obj)) {
      const url = extractImageUrl(val)
      if (url) return url
    }
  }

  return null
}

/** Flatten any shape into a de-duplicated list of resolvable URL strings. */
export function extractImageList(value: UnknownImage): string[] {
  const out: string[] = []

  function walk(v: UnknownImage) {
    if (v == null) return
    if (typeof v === 'string') {
      const url = extractImageUrl(v)
      if (url) out.push(url)
      return
    }
    if (Array.isArray(v)) {
      v.forEach(walk)
      return
    }
    if (typeof v === 'object') {
      const url = extractImageUrl(v)
      if (url) {
        out.push(url)
        return
      }
      Object.values(v as Record<string, unknown>).forEach(walk)
    }
  }

  walk(value)
  return Array.from(new Set(out))
}

/** Replace the `{size}` placeholder with a CDN-supported size — any size
 * string passed in is automatically snapped to the nearest valid one. */
export function applyImageSize(url: string, size = '240x240'): string {
  if (!url.includes(SIZE_PLACEHOLDER)) return url
  return url.replace(SIZE_PLACEHOLDER, coerceToAllowedSize(size))
}

/** Resolve a single hotel/room image field to a displayable URL, or null
 * if nothing usable was found. */
export function resolveImage(
  value: UnknownImage,
  size = '240x240',
): string | null {
  const url = extractImageUrl(value)
  return url ? applyImageSize(url, size) : null
}

/**
 * Collates up to `max` distinct images pulled from whatever image data is
 * available (a room's `images` array, several rooms' arrays flattened
 * together, a single hotel `image`, etc). Does NOT duplicate — if fewer
 * than `max` unique images exist, fewer are returned; the caller renders
 * a neutral placeholder for any remaining slots.
 */
export function collateGalleryImages(
  value: UnknownImage,
  max = 5,
  size = '1024x768',
): string[] {
  const list = extractImageList(value).map((u) => applyImageSize(u, size))
  return list.slice(0, max)
}

/** @deprecated use collateGalleryImages — kept so older imports don't break */
export const buildGallery = collateGalleryImages
