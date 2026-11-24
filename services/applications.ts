import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

export interface ApplicationFile {
  id: number
  original_name: string
  url: string
  created_at: string
}

export interface FootballTourismApplicationPayload {
  experience_type: string
  first_name: string
  last_name: string
  age: number
  nationality: string
  visa_required: boolean
  email: string
  phone: string
  current_location_country: string
}

export interface SportMarketingApplicationPayload {
  company_name: string
  contact_name: string
  position: string
  email: string
  phone: string
  country: string
  service_interest: string
  budget_range: string
  project_details: string
}

export interface PlayerManagementApplicationPayload {
  full_name: string
  date_of_birth: string
  nationality: string
  current_club: string
  position: string
  height_cm: number
  weight_kg: number
  preferred_foot: string
  email: string
  phone: string
  country: string
  training_link: string
  video_highlights_url: string
  sport: string
  experience_summary: string
  message: string
}

export interface Application {
  id: number
  offer_category_id: number
  offer_category_slug: string
  offer_id: number
  offer: { id: number; title: string; slug: string }
  payload:
    | FootballTourismApplicationPayload
    | SportMarketingApplicationPayload
    | PlayerManagementApplicationPayload
    | Record<string, unknown>
  status: string
  terms_accepted_at: string
  files: ApplicationFile[]
  created_at: string
  updated_at: string
}

export type ApplicationsResponse = ApiResponse<Application[]>
export type ApplicationResponse = ApiResponse<Application>

/**
 * Same endpoints as Golafly main's ApplicationsService — this is what
 * powers the real Apply Now forms (Football Tourism / Sports Marketing /
 * Player Management), submitted as multipart/form-data to
 * POST /v1/applications on the Golafly API.
 */
export class ApplicationsService {
  public static async getApplications(
    categorySlug?: string,
  ): Promise<ApplicationsResponse> {
    const response = await golaflyAxios.get<ApplicationsResponse>(
      '/v1/applications',
      {
        headers: { Accept: 'application/json' },
        params: categorySlug ? { category_slug: categorySlug } : undefined,
      },
    )
    return response.data
  }

  public static async getApplicationById(
    id: number,
  ): Promise<ApplicationResponse> {
    const response = await golaflyAxios.get<ApplicationResponse>(
      `/v1/applications/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async updateApplicationStatus(
    id: number,
    status: string,
  ): Promise<ApplicationResponse> {
    const response = await golaflyAxios.patch<ApplicationResponse>(
      `/v1/applications/${id}/status`,
      { status },
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async createApplication(
    payload: FormData,
  ): Promise<ApplicationResponse> {
    const response = await golaflyAxios.post<ApplicationResponse>(
      '/v1/applications',
      payload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  }
}
