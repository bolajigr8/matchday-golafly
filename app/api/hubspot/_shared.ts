import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { NextRequest } from 'next/server'
import { HubSpotFormContext } from '@/lib/hubspot/hubspot-forms'

export function validationError(error: ZodError) {
  return NextResponse.json(
    { ok: false, error: 'Validation failed', issues: error.issues },
    { status: 400 },
  )
}

export function serverError(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 500 })
}

export function hubspotContextFromRequest(
  request: NextRequest,
): HubSpotFormContext {
  const referer = request.headers.get('referer') ?? undefined
  const ipRaw =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    ''
  const ipAddress = ipRaw.split(',')[0]?.trim() || undefined
  return { ipAddress, pageUri: referer }
}
