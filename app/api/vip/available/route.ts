// app/api/vip/available/route.ts
//
// Are VIP packages switched on? An admin switches them on and off on the
// dashboard (contract of 17 Nov, section 1). While they are off, every
// /hospitality route is a 404, including GET /hospitality/settings, and
// the contract says to hide the VIP entry points (header pill, homepage
// and /matches bands). /settings is the call it names for this check.
//
// The site asks HERE instead of the backend directly: one server call at
// most once a minute (per server instance), so the backend's limits are never
// spent on this check, while an admin's switch shows on the site within about
// a minute. Test mode
// (NEXT_PUBLIC_VIP_API_MODE=mock) always answers "on".

const TTL_MS = 60_000
let cache: { at: number; available: boolean } | null = null

/** true / false when the backend says so; null when it couldn't answer
 *  (429 over the limit, 5xx, timeout): then the last answer is kept. Only a
 *  404 means VIP packages are switched off (contract §1). */
async function ask(): Promise<boolean | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) return false
  const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/hospitality/settings`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })
  if (res.status === 404) return false
  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as { success?: boolean; data?: { mode?: unknown } } | null
  return body?.success === true && (body.data?.mode === 'package' || body.data?.mode === 'flexible')
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_VIP_API_MODE === 'mock') {
    return Response.json({ available: true })
  }
  if (!cache || Date.now() - cache.at > TTL_MS) {
    let answer: boolean | null = null
    try {
      answer = await ask()
    } catch {
      /* unreachable / timeout */
    }
    /* No clear answer: keep the last one; if there is none yet, show VIP
       (a busy backend must not hide it) and ask again in a minute. */
    cache =
      answer === null
        ? { at: Date.now() - TTL_MS + 30_000, available: cache?.available ?? true }
        : { at: Date.now(), available: answer }
  }
  return Response.json(
    { available: cache.available },
    { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } },
  )
}
