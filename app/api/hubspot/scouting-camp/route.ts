import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

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

/* Scouting Camp landing page sign-ups. They go to HubSpot only — a contact the
   team can follow up with — and are not saved on the Golafly backend. */

const campSignupSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  country: z.string().trim().min(1),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  age: z.number().int().min(1).max(120),
  position: z.string().trim().min(1),
  visa_required: z.boolean(),
  under_18: z.boolean(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  gclid: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
})

const LEAD_SOURCE = process.env.HUBSPOT_DEFAULT_LEAD_SOURCE ?? 'golafly'

export async function POST(request: NextRequest) {
  try {
    const data = campSignupSchema.parse(await request.json())

    /* The contact properties the Football Tourism form already takes, with
       the values it already sends — known to be accepted by HubSpot. */
    const tourism = {
      email: data.email,
      firstname: data.first_name,
      lastname: data.last_name,
      phone: data.phone,
      country: data.country,
      golafly_source_form: 'apply_football_tourism',
      golafly_segment: 'Tourism Player',
      hs_lead_status: 'NEW',
      golafly_lead_source: LEAD_SOURCE,
      golafly_program_interest: 'football_tourism',
      golafly_experience_type: 'trial-showcase',
      golafly_nationality: data.country,
      golafly_needs_visa: data.visa_required ? 'yes' : 'no',
      golafly_age: String(data.age),
    }

    const notes = [
      'Scouting Camp sign-up (landing page)',
      `Position: ${data.position}`,
      `Date of birth: ${data.date_of_birth}`,
      data.under_18
        ? `Under 18 — guardian: ${data.guardian_name ?? ''} ${data.guardian_phone ?? ''}`.trim()
        : null,
      data.gclid ? `gclid: ${data.gclid}` : null,
      ...(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const).map(
        (k) => (data[k] ? `${k}: ${data[k]}` : null),
      ),
    ].filter(Boolean)

    /* The camp's own details on top. If HubSpot refuses any of these (a
       property it doesn't have, or a value it doesn't list), the sign-up is
       sent again as a plain Football Tourism lead rather than lost. */
    const full = {
      ...tourism,
      golafly_source_form: 'scouting_camp_landing',
      golafly_date_of_birth: data.date_of_birth,
      golafly_player_position: data.position,
      message: notes.join(' | '),
    }

    let result = await submitHubSpotForm({
      formGuid: HubSpotFormGuids.scoutingCamp(),
      fields: propertiesToFormFields(full),
      context: hubspotContextFromRequest(request),
    })
    if (!result.ok) {
      console.error('[hubspot] scouting-camp full submit refused:', result.status, result.error)
      result = await submitHubSpotForm({
        formGuid: HubSpotFormGuids.scoutingCamp(),
        fields: propertiesToFormFields(tourism),
        context: hubspotContextFromRequest(request),
      })
    }

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
