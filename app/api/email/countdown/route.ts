// GET /api/email/countdown?kickoff=2027-02-14T20:00:00Z
//
// The live "KICKOFF IN" countdown image for the Brevo booking email. Drawn
// fresh on every open (no caching), from the kick-off moment in UTC that the
// Brevo trigger sends (lib/brevo/matchday.ts → kickoff_utc / countdown_url).
// Missing or bad kickoff → tiles show "--"; after kick-off → all zeros.
// Not linked from any page.

import { countdownGif } from '@/lib/email/countdown'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('kickoff') ?? ''
  const at = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})$/.test(raw) ? Date.parse(raw) : NaN
  const secondsLeft = Number.isFinite(at) ? Math.max(0, Math.floor((at - Date.now()) / 1000)) : null

  try {
    const gif = await countdownGif(secondsLeft)
    return new Response(new Uint8Array(gif), {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (e) {
    console.error('[email/countdown] could not draw the countdown:', e)
    return new Response('Countdown unavailable', { status: 500 })
  }
}
