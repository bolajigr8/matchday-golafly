import type {
  FootballTourismFormData,
  SportsMarketingFormData,
  PlayerManagementFormData,
} from '@/features/apply-now/schema'

export type HubSpotContactProperties = Record<
  string,
  string | number | boolean | null | undefined
>

const DEFAULT_LEAD_SOURCE = process.env.HUBSPOT_DEFAULT_LEAD_SOURCE ?? 'golafly'

function splitName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Unknown' }
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function baseProperties(input: {
  email: string
  firstName: string
  lastName?: string
  phone?: string
  country?: string
  sourceForm: string
  segment: string
}): HubSpotContactProperties {
  return {
    email: input.email,
    firstname: input.firstName,
    lastname: input.lastName,
    phone: input.phone,
    country: input.country,
    golafly_source_form: input.sourceForm,
    golafly_segment: input.segment,
    hs_lead_status: 'NEW',
    golafly_lead_source: DEFAULT_LEAD_SOURCE,
  }
}

export function mapFootballTourismToHubSpot(
  data: FootballTourismFormData,
): HubSpotContactProperties {
  return {
    ...baseProperties({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      country: data.country,
      sourceForm: 'apply_football_tourism',
      segment: 'Tourism Player',
    }),
    golafly_program_interest: 'football_tourism',
    golafly_experience_type: data.experienceType,
    golafly_nationality: data.nationality,
    golafly_needs_visa: data.needsVisa,
    golafly_age: data.age,
  }
}

export function mapSportsMarketingToHubSpot(
  data: SportsMarketingFormData,
): HubSpotContactProperties {
  const { firstName, lastName } = splitName(data.fullName)
  return {
    ...baseProperties({
      email: data.email,
      firstName,
      lastName,
      phone: data.phone,
      country: data.country,
      sourceForm: 'apply_sports_marketing',
      segment: 'Sport Marketing',
    }),
    company: data.companyName,
    jobtitle: data.position,
    golafly_program_interest: 'sports_marketing',
    golafly_service_interest: data.serviceInterest,
    golafly_budget: data.budget,
    golafly_project_details: data.projectDetails,
  }
}

/* Player Management = the player/tryout registration */
export function mapPlayerManagementToHubSpot(
  data: PlayerManagementFormData,
): HubSpotContactProperties {
  const { firstName, lastName } = splitName(data.fullName)
  return {
    ...baseProperties({
      email: data.email,
      firstName,
      lastName,
      phone: data.phone,
      country: data.country,
      sourceForm: 'apply_player_management',
      segment: 'Tourism Player',
    }),
    golafly_program_interest: 'player_management',
    golafly_date_of_birth: data.dateOfBirth,
    golafly_nationality: data.nationality,
    golafly_player_position: data.position,
    golafly_current_club: data.currentClub,
    golafly_preferred_foot: data.preferredFoot,
    golafly_video_highlights: data.videoHighlights,
    golafly_height: data.height,
    golafly_weight: data.weight,
    golafly_experience_summary: data.experienceSummary,
    golafly_message: data.message,
  }
}

/** Exit-intent popup (and the package InquiryCard, which shares the route).
 *  `golafly_segment` reuses values that already exist on the HubSpot
 *  property — "Fan" (also used by the consultation form) and "Tourism
 *  Player" (used by the player forms) — so no HubSpot change is needed.
 *  No choice → "Unqualified Lead", exactly as golafly-main sends today. */
export function mapExitIntentToHubSpot(data: {
  firstName: string
  email: string
  /** Optional from the landing-page popup; empty fields are not sent. */
  phone?: string
  leadType?: 'fan' | 'player'
}): HubSpotContactProperties {
  const segment =
    data.leadType === 'fan'
      ? 'Fan'
      : data.leadType === 'player'
        ? 'Tourism Player'
        : 'Unqualified Lead'
  return {
    email: data.email,
    firstname: data.firstName,
    phone: data.phone,
    golafly_source_form: 'exit_intent_popup',
    golafly_segment: segment,
    hs_lead_status: 'NEW',
    golafly_lead_source: DEFAULT_LEAD_SOURCE,
  }
}
