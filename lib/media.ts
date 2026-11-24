/* Media URL helpers for the admin dashboard.
 *
 * The Laravel backend sometimes emits storage URLs rooted at its OWN host —
 * `http://localhost/storage/...` — rather than the public API host. The old
 * dashboard had this rewrite in lib/utils.ts and then inlined the same regex
 * in seven more places; keeping it in one function here.
 *
 * This matters more in matchday than it did there: next.config.ts allow-lists
 * `http://localhost` for next/image, so an un-rewritten URL passes Next's host
 * check and then silently fails to fetch in production instead of erroring.
 */

const API_HOST = 'https://api.golafly.com/'

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return ''
  return url.replace(/^https?:\/\/localhost\//, API_HOST)
}

/* Program testimonials are a flat list of media URLs mixing images and video,
   with no type field — the old dashboard sniffed the extension to decide
   between <img> and <video>, and so do we. */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)
}

/** Last path segment, for labelling a file link. */
export function fileNameFromUrl(url?: string | null): string {
  if (!url) return ''
  try {
    const path = new URL(url, API_HOST).pathname
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '')
  } catch {
    return url.split('/').filter(Boolean).pop() ?? ''
  }
}
