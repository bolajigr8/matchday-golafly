import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

/**
 * Academies. Ported from the Golafly frontend's AcademyService — same backend,
 * so the contract is not being invented here.
 *
 * Only the read surface the admin dashboard needs. Write methods land when the
 * payload contracts are verified.
 */

export interface AcademyImage {
  id: number
  url: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface Academy {
  id: number
  name: string
  slug: string
  /* Rich text — arrives as an HTML string OR as { html }. Always read it
     through getHtmlContent(); a `typeof === "string"` guard drops the object
     form silently. */
  description: string | { html?: string } | null
  city: string
  country_name: string
  country_code: string
  duration_label: string
  age_min: number
  age_max: number
  price_from: string
  price_currency: string
  /* Genuinely a union: the API returns an array on some records and a
     comma-joined string on others. The old form coerced with
     `Array.isArray(f) ? f : String(f).split(",")`. */
  features: string[] | string
  has_accommodation: boolean
  accepts_all_ages: boolean
  terms_and_conditions: string | null
  status: boolean
  primary_image_url: string | null
  header_image_url: string | null
  images: AcademyImage[]
  created_at: string
  updated_at: string
}

export type AcademiesResponse = ApiResponse<Academy[]>
export type AcademyResponse = ApiResponse<Academy>

/** Normalises the features union to an array. */
export function academyFeatures(academy: Pick<Academy, 'features'>): string[] {
  const f = academy.features
  if (Array.isArray(f)) return f.filter(Boolean)
  if (typeof f === 'string' && f.trim())
    return f.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export class AcademyService {
  public static async getAcademies(): Promise<AcademiesResponse> {
    const response = await golaflyAxios.get<AcademiesResponse>('/v1/academies', {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  public static async getAcademyById(id: number): Promise<AcademyResponse> {
    const response = await golaflyAxios.get<AcademyResponse>(`/v1/academies/${id}`, {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }
}
