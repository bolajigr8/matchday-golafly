import publicAxios from '@/services/golafly-public-axios'
import { normalizeAvailability } from '@/services/programs'
import type { ApiPlayer } from '@/services/players'
import type {
  ApiResponse,
  Program,
  ProgramApplicant,
  ProgramAvailability,
  ProgramCategory,
  ProgramSubcategory,
} from '@/services/programs'

/* ── Programs a player can register on ──────────────────────────────────
 * GET /v1/program is admin-only, so this walks the public tree instead:
 * categories (which carry their subcategories) → each subcategory's
 * programs. Sports Marketing is left out — its programs are for brands. */
export async function getRegistrationPrograms(): Promise<Program[]> {
  const { data } = await publicAxios.get<
    ApiResponse<(ProgramCategory & { subcategories?: ProgramSubcategory[] })[]>
  >('/v1/program/categories')

  const subcategoryIds = data.data
    .filter(c => c.status && c.slug !== 'sports_marketing')
    .flatMap(c => (c.subcategories ?? []).map(s => s.id))

  const lists = await Promise.all(
    subcategoryIds.map(id =>
      publicAxios
        .get<ApiResponse<Program[]>>(`/v1/program/subcategories/${id}/programs`)
        .then(r => r.data.data)
        .catch(() => [] as Program[]),
    ),
  )
  return lists.flat()
}

export async function getProgramAvailability(id: number) {
  const { data } = await publicAxios.get<ApiResponse<ProgramAvailability>>(
    `/v1/program/${id}/availability`,
  )
  return normalizeAvailability(data.data)
}

export async function getProgramApplicants(id: number) {
  const { data } = await publicAxios.get<ApiResponse<ProgramApplicant[]>>(
    `/v1/program/${id}/applicants`,
  )
  return data.data
}

/* ── POST /v1/players — "submit information" ────────────────────────────
 * The same multipart contract the golafly.com form sends. The program comes
 * along as `program_id`; the backend takes the spot for `primary_position`.
 * Positions are codes (GK, CB, CM, …), the codes program spots count by. */
export interface PlayerRegistrationPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string // MM/DD/YYYY
  gender: string
  nationality: string
  country_of_residence: string
  passport_number?: string
  city?: string
  address?: string
  language_spoken?: string[]

  program_id: number
  primary_position: string
  secondary_position: string
  preferred_foot: string
  jersey_number?: string
  height_cm: string
  weight_kg?: string
  current_club_academy?: string
  current_level: string
  player_status?: string
  goals_with_golafly?: string[]

  top_speed?: string
  /* The backend spells it `strenght`; mirrored so the value round-trips. */
  rate_yourself?: { strenght?: number; stamina?: number; agility?: number }
  player_attributes?: Record<string, number>
  career_statistics?: {
    season?: string
    appearances?: number
    goals?: number
    assists?: number
    clean_sheets?: number
    minutes_played?: number
    yellow_card?: number // singular on the backend
    red_cards?: number
  }
  achievements?: { title: string; year?: string }[]

  profile_photo?: File | null
  passport_document?: File | null
  medical_certificate?: File | null
  highlights?: File[]

  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  emergency_contact_email?: string
  guardian_name?: string
  guardian_phone?: string
  agency_name?: string
  agency_phone?: string
  agency_email?: string
  additional_notes?: string
}

export async function submitPlayerRegistration(payload: PlayerRegistrationPayload) {
  const fd = new FormData()
  const text = (k: string, v?: string) => {
    if (v != null && v !== '') fd.append(k, v)
  }

  fd.append('first_name', payload.first_name)
  fd.append('last_name', payload.last_name)
  fd.append('email', payload.email)
  fd.append('phone', payload.phone)
  fd.append('date_of_birth', payload.date_of_birth)
  fd.append('gender', payload.gender.toLowerCase())
  fd.append('nationality', payload.nationality)
  fd.append('country_of_residence', payload.country_of_residence)
  text('passport_number', payload.passport_number)
  text('city', payload.city)
  text('address', payload.address)
  payload.language_spoken?.forEach(l => fd.append('language_spoken[]', l))

  fd.append('program_id', String(payload.program_id))
  fd.append('primary_position', payload.primary_position)
  fd.append('secondary_position', payload.secondary_position)
  fd.append('preferred_foot', payload.preferred_foot)
  text('jersey_number', payload.jersey_number)
  fd.append('height_cm', payload.height_cm)
  text('weight_kg', payload.weight_kg)
  text('current_club_academy', payload.current_club_academy)
  fd.append('current_level', payload.current_level)
  text('player_status', payload.player_status)
  payload.goals_with_golafly?.forEach(g => fd.append('goals_with_golafly[]', g))

  // JSON-encoded objects under bracketed keys, as the backend expects.
  text('top_speed', payload.top_speed)
  if (payload.rate_yourself && Object.keys(payload.rate_yourself).length) {
    fd.append('rate_yourself[]', JSON.stringify(payload.rate_yourself))
  }
  if (payload.player_attributes && Object.keys(payload.player_attributes).length) {
    fd.append('player_attributes[]', JSON.stringify(payload.player_attributes))
  }
  if (payload.career_statistics && Object.keys(payload.career_statistics).length) {
    fd.append('career_statistics[]', JSON.stringify(payload.career_statistics))
  }
  if (payload.achievements?.length) {
    fd.append('achievements[]', JSON.stringify(payload.achievements))
  }

  if (payload.profile_photo) fd.append('profile_photo', payload.profile_photo)
  if (payload.passport_document) fd.append('passport_document', payload.passport_document)
  if (payload.medical_certificate) fd.append('medical_certificate', payload.medical_certificate)
  payload.highlights?.forEach((file, i) => fd.append(`highlights[${i}]`, file))

  fd.append('emergency_contact_name', payload.emergency_contact_name)
  fd.append('emergency_contact_relationship', payload.emergency_contact_relationship)
  fd.append('emergency_contact_phone', payload.emergency_contact_phone)
  text('emergency_contact_email', payload.emergency_contact_email)
  text('guardian_name', payload.guardian_name)
  text('guardian_phone', payload.guardian_phone)
  text('agency_name', payload.agency_name)
  text('agency_phone', payload.agency_phone)
  text('agency_email', payload.agency_email)
  text('additional_notes', payload.additional_notes)
  fd.append('terms_accepted', '1')

  const { data } = await publicAxios.post<ApiResponse<ApiPlayer>>('/v1/players', fd)
  return data
}
