import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { supportSchema } from '@/schema/support'
import { sendSupportEmail } from '@/lib/support/send-support-email'

// Support form → emails to support@golafly.com + contact@golafly.com.

// Very small in-memory rate limit (per server instance) to blunt spam.
// For multi-instance / serverless production use Upstash/Redis instead.
const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 5

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_HITS
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (limited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  let payload
  try {
    payload = supportSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', issues: error.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'Invalid request body' },
      { status: 400 },
    )
  }

  // Honeypot filled → pretend success, send nothing.
  if (payload.website) return NextResponse.json({ ok: true })

  try {
    await sendSupportEmail(payload, {
      sourcePage: request.headers.get('referer') ?? undefined,
      ip,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[support] email failed', error)
    return NextResponse.json(
      { ok: false, error: 'We could not send your message. Please try again.' },
      { status: 502 },
    )
  }
}
