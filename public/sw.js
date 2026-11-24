/* Golafly Matchday service worker.
 *
 * Deliberately small, and deliberately conservative. It does three things:
 *   1. Keeps the static files that never change (hashed /_next/static files,
 *      fonts, images) so repeat visits are faster.
 *   2. Shows /offline.html when a page can't be reached.
 *   3. Nothing else. It NEVER stores pages or API answers.
 *
 * Why no page or API caching: ticket prices, availability and the whole
 * checkout are live. A stale price or a stale payment page is worse than no
 * app, so those requests always go straight to the network.
 *
 * It is registered by components/pwa-register.tsx on golafly.com only.
 * To release a change to this file, bump VERSION: browsers only notice a new
 * worker when this file's bytes change, and the old caches are then removed.
 */
const VERSION = 'v1'
const STATIC_CACHE = 'gf-static-' + VERSION
const ASSET_CACHE = 'gf-assets-' + VERSION
const OFFLINE_URL = '/offline.html'
const MAX_ASSETS = 150
const MAX_STATIC = 250

/* Never touched by the worker, whatever the request type. */
const BYPASS_PREFIXES = [
  '/api',
  '/admin',
  '/fan',
  '/player',
  '/scout',
  '/studio',
  '/builder',
  '/cart',
  '/payment-',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/flights',
  '/dashboard',
  '/sw.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .catch(() => {}),
  )
  /* No skipWaiting() here: a new worker waits until the visitor taps
     "Refresh" in the update toast, so a page is never swapped under them
     mid-booking. See the SKIP_WAITING message below. */
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, ASSET_CACHE]
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((n) => n.startsWith('gf-') && !keep.includes(n))
          .map((n) => caches.delete(n)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

function isBypassed(url) {
  const p = url.pathname
  return BYPASS_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/') || (prefix.endsWith('-') && p.startsWith(prefix)))
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)))
  }
}

/* Cache-first: for files whose address changes when their content changes. */
async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') {
    cache.put(request, res.clone()).then(() => trim(cacheName, max)).catch(() => {})
  }
  return res
}

/* Stale-while-revalidate: show the saved copy now, refresh it in the background. */
async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok && res.type === 'basic') {
        cache.put(request, res.clone()).then(() => trim(cacheName, max)).catch(() => {})
      }
      return res
    })
    .catch(() => null)
  return hit || (await refresh) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isBypassed(url)) return
  if (request.headers.has('range')) return

  /* A page: always the network. Only if it fails (offline) show the offline page. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE)
        return (await cache.match(OFFLINE_URL)) || Response.error()
      }),
    )
    return
  }

  /* Next's hashed build files: the name changes when the content changes. */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC))
    return
  }

  /* Pictures and fonts. */
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE, MAX_ASSETS))
  }
  /* Everything else (data fetches, Next's page-data requests): untouched. */
})
