import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { sportsMarketingSchema } from '@/features/apply-now/schema'
import {
  hubspotContextFromRequest,
  serverError,
  validationError,
} from '@/app/api/hubspot/_shared'
import { mapSportsMarketingToHubSpot } from '@/lib/hubspot/hubspot-mappers'
import {
  propertiesToFormFields,
  submitHubSpotForm,
} from '@/lib/hubspot/hubspot-forms'
import { HubSpotFormGuids } from '@/lib/hubspot/hubspot-form-guids'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = sportsMarketingSchema.parse(body)
    const properties = mapSportsMarketingToHubSpot(payload)
    const result = await submitHubSpotForm({
      formGuid: HubSpotFormGuids.applySportsMarketing(),
      fields: propertiesToFormFields(properties),
      context: hubspotContextFromRequest(request),
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `HubSpot forms submission failed (${result.status})`,
          details: result.error,
        },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ZodError) return validationError(error)
    return serverError(
      error instanceof Error ? error.message : 'Unknown HubSpot error',
    )
  }
}
