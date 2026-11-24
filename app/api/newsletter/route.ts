import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { submitHubSpotForm } from '@/lib/hubspot/hubspot-forms'
import { subscribeBrevoNewsletter } from '@/lib/brevo/newsletter'
import { hubspotContextFromRequest } from '@/app/api/hubspot/_shared'

// Newsletter sign-ups (site footer, landing footer) → HubSpot AND Brevo.
//
// Same rules as the exit popup route: the two are sent in parallel and are
// independent, a missing configuration is skipped, and the request only
// fails when nothing received the address.
//   HubSpot: the form in HUBSPOT_FORM_GUID_NEWSLETTER (email field only).
//   Brevo:   see lib/brevo/newsletter.ts (list + optional double opt-in).

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().trim().min(1).max(40),
  site: z.string().trim().max(40).optional(),
  /** Honeypot: hidden from people, filled in by bots. */
  website: z.string().optional(),
})

/* Best-effort burst limit per IP (per server instance): 5 sign-ups in 10 min. */
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()
function limited(ip: string | undefined): boolean {
  if (!ip) return false
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5_000) hits.clear() // never grow without bound
  return recent.length > MAX_PER_WINDOW
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
  }
  const { email, source, site, website } = parsed.data

  // A bot filled the hidden field: pretend it worked, send nothing.
  if (website) return NextResponse.json({ ok: true, confirm: false })

  const context = hubspotContextFromRequest(request)
  if (limited(context.ipAddress)) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 },
    )
  }

  const hubspotGuid = process.env.HUBSPOT_FORM_GUID_NEWSLETTER
  const [hubspot, brevo] = await Promise.allSettled([
    hubspotGuid
      ? submitHubSpotForm({
          formGuid: hubspotGuid,
          fields: [{ objectTypeId: '0-1', name: 'email', value: email }],
          context,
        }).then((r) => {
          if (!r.ok) throw new Error(`HubSpot ${r.status}: ${r.error}`)
          return 'ok' as const
        })
      : Promise.resolve('skipped' as const),
    process.env.BREVO_API_KEY
      ? subscribeBrevoNewsletter({ email, source, site }, request.nextUrl.origin)
      : Promise.resolve('skipped' as const),
  ])

  if (hubspot.status === 'rejected') console.error('[newsletter] HubSpot failed', hubspot.reason)
  if (brevo.status === 'rejected') console.error('[newsletter] Brevo failed', brevo.reason)

  const hubspotOk = hubspot.status === 'fulfilled' && hubspot.value === 'ok'
  const brevoOk = brevo.status === 'fulfilled' && brevo.value !== 'skipped'
  if (!hubspotOk && !brevoOk) {
    return NextResponse.json(
      { ok: false, error: 'We couldn’t sign you up just now. Please try again.' },
      { status: 502 },
    )
  }

  // Ask the visitor to check their inbox only when Brevo actually sent a
  // confirmation email.
  const confirm = brevo.status === 'fulfilled' && brevo.value === 'confirm'
  return NextResponse.json({ ok: true, confirm })
}
