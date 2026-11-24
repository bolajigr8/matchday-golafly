// GET /api/email/crest?id=2&team=FC%20Barcelona
//
// Club crest image for the Brevo emails (booking confirmation).
//  • id = the match API's team id → the club's REAL crest from the
//    supplier's clean crest file, converted to PNG and served from
//    golafly.com (no supplier link or branding ever reaches the email —
//    lib/email/club-crest.ts).
//  • No id, or the club has no crest → the initials badge in club colours
//    (lib/email/crest.ts), so every team always has a picture.
// PNG 240×240 (shown at about 112 px), transparent. Not linked from any page.

import { ImageResponse } from 'next/og'
import { clubCrestPng, CREST_SIZE } from '@/lib/email/club-crest'
import { emailCrest } from '@/lib/email/crest'
import { emailFonts } from '@/lib/email/fonts'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const team = (params.get('team') ?? '').slice(0, 80).trim()
  const id = Number(params.get('id'))

  const real = Number.isInteger(id) && id > 0 ? await clubCrestPng(id) : null
  if (real) {
    return new Response(new Uint8Array(real), {
      headers: {
        'Content-Type': 'image/png',
        /* A crest doesn't change: email proxies and browsers may keep it. */
        'Cache-Control': 'public, max-age=604800, s-maxage=604800',
      },
    })
  }

  const crest = emailCrest(team || '?')
  const fontSize = crest.abbr.length >= 3 ? 76 : crest.abbr.length === 2 ? 92 : 108
  const image = new ImageResponse(
    (
      <div
        style={{
          width: CREST_SIZE,
          height: CREST_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: CREST_SIZE - 16,
            height: CREST_SIZE - 16,
            borderRadius: 9999,
            background: crest.bg,
            border: '6px solid rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: crest.color,
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize,
            letterSpacing: -2,
          }}
        >
          {crest.abbr}
        </div>
      </div>
    ),
    { width: CREST_SIZE, height: CREST_SIZE, fonts: await emailFonts() },
  )
  /* Fallback badge: keep it only an hour, so a crest added later shows up. */
  image.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return image
}
