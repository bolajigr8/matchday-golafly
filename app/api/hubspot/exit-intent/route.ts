import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { leadRequestSchema } from '@/schema/applynow'
import { propertiesToFormFields, submitHubSpotForm } from '@/lib/hubspot/hubspot-forms'
import { HubSpotFormGuids } from '@/lib/hubspot/hubspot-form-guids'
import { mapExitIntentToHubSpot } from '@/lib/hubspot/hubspot-mappers'
import { upsertBrevoLead } from '@/lib/brevo/leads'
import {
  hubspotContextFromRequest,
  serverError,
  validationError,
} from '@/app/api/hubspot/_shared'

// Exit popup (main site + landing pages) + package InquiryCard leads → HubSpot AND Brevo.
//
// The two CRMs are sent in parallel and are fully independent: if one fails
// (or isn't configured) the other still receives the lead. The request only
// fails when BOTH fail. Brevo is skipped silently when BREVO_API_KEY is unset.
export async function POST(request: NextRequest) {
  let payload
  try {
    payload = leadRequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) return validationError(error)
    return serverError('Invalid request body')
  }

  const sourcePage = request.headers.get('referer') ?? undefined

  const [hubspot, brevo] = await Promise.allSettled([
    submitHubSpotForm({
      formGuid: HubSpotFormGuids.exitIntent(),
      fields: propertiesToFormFields(mapExitIntentToHubSpot(payload)),
      context: hubspotContextFromRequest(request),
    }).then((r) => {
      if (!r.ok) throw new Error(`HubSpot ${r.status}: ${r.error}`)
    }),
    process.env.BREVO_API_KEY
      ? upsertBrevoLead({ ...payload, sourcePage })
      : Promise.resolve('skipped' as const),
  ])

  const status = {
    hubspot: hubspot.status === 'fulfilled' ? 'ok' : 'error',
    brevo:
      brevo.status === 'rejected'
        ? 'error'
        : brevo.value === 'skipped'
          ? 'skipped'
          : 'ok',
  } as const

  if (hubspot.status === 'rejected') console.error('[exit-intent] HubSpot failed', hubspot.reason)
  if (brevo.status === 'rejected') console.error('[exit-intent] Brevo failed', brevo.reason)

  const anyOk = status.hubspot === 'ok' || status.brevo === 'ok'
  return NextResponse.json({ ok: anyOk, ...status }, { status: anyOk ? 200 : 502 })
}
