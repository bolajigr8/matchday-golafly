import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { playerManagementSchema } from '@/features/apply-now/schema'
import {
  propertiesToFormFields,
  submitHubSpotForm,
} from '@/lib/hubspot/hubspot-forms'
import { HubSpotFormGuids } from '@/lib/hubspot/hubspot-form-guids'

import {
  hubspotContextFromRequest,
  serverError,
  validationError,
} from '@/app/api/hubspot/_shared'
import { mapPlayerManagementToHubSpot } from '@/lib/hubspot/hubspot-mappers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = playerManagementSchema.parse(body)
    const properties = mapPlayerManagementToHubSpot(payload)
    const result = await submitHubSpotForm({
      formGuid: HubSpotFormGuids.applyPlayerManagement(),
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
