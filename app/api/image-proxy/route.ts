/* Streams a remote image back through our own origin so the browser can read
 * its bytes — the player CV (lib/player-cv.ts) embeds profile and highlight
 * photos into a PDF, and Cloudinary does not always send CORS headers.
 *
 * Kept deliberately narrow, because an open proxy is an SSRF hole:
 *   · https only
 *   · no localhost, private or link-local hosts
 *   · the upstream must answer with an image content type
 *   · capped at 8 MB */

const MAX_BYTES = 8 * 1024 * 1024

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true
  if (/^\[?::1\]?$/.test(h) || h.startsWith('[fc') || h.startsWith('[fd') || h.startsWith('[fe80')) {
    return true
  }
  const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!ipv4) return false
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get('url')

  let url: URL
  try {
    url = new URL(target ?? '')
  } catch {
    return new Response('Invalid url', { status: 400 })
  }
  if (url.protocol !== 'https:' || isBlockedHost(url.hostname)) {
    return new Response('Invalid url', { status: 400 })
  }

  try {
    const upstream = await fetch(url, { cache: 'no-store', redirect: 'error' })
    if (!upstream.ok) return new Response('Upstream error', { status: 502 })

    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 415 })
    }

    const body = await upstream.arrayBuffer()
    if (body.byteLength > MAX_BYTES) return new Response('Too large', { status: 413 })

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new Response('Fetch failed', { status: 502 })
  }
}
