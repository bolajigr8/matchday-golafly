import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

/* Internship applications, admin side — the admin token via golaflyAxios.
 *
 *   GET    /v1/internships        list
 *   GET    /v1/internships/{id}   one
 *   DELETE /v1/internships/{id}   delete */

export interface InternshipApplication {
  id: number
  full_name: string
  email: string
  phone_country_code: string | null
  phone: string | null
  country_of_residence: string | null
  university: string | null
  course_of_study: string | null
  year_of_study: string | null
  earliest_start_date: string | null
  position: string | null
  linkedin_or_portfolio: string | null
  why_this_track: string | null
  cv_path: string | null
  cv_original_name: string | null
  cv_url: string | null
  consent_accepted: boolean
  created_at: string
  updated_at: string
}

export const applicantPhone = (a: Pick<InternshipApplication, 'phone_country_code' | 'phone'>) =>
  [a.phone_country_code, a.phone].filter(Boolean).join(' ') || '—'

export class InternshipsAdminService {
  public static async getInternships(): Promise<ApiResponse<InternshipApplication[]>> {
    const { data } = await golaflyAxios.get<ApiResponse<InternshipApplication[]>>('/v1/internships', {
      headers: { Accept: 'application/json' },
    })
    return data
  }

  public static async getInternship(id: number): Promise<ApiResponse<InternshipApplication>> {
    const { data } = await golaflyAxios.get<ApiResponse<InternshipApplication>>(`/v1/internships/${id}`, {
      headers: { Accept: 'application/json' },
    })
    return data
  }

  public static async deleteInternship(id: number): Promise<ApiResponse<null>> {
    const { data } = await golaflyAxios.delete<ApiResponse<null>>(`/v1/internships/${id}`, {
      headers: { Accept: 'application/json' },
    })
    return data
  }
}
