import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

export type ProgramApplicantsResponse = ApiResponse<null>

/**
 * Used specifically for the "apply to this exact program subcategory" flow
 * (i.e. the Apply Now form was opened from a specific program card via
 * ?subcategoryId=..., rather than the generic per-category application).
 */
export class ProgramApplicantsService {
  public static async createApplicant(
    formData: FormData,
  ): Promise<ProgramApplicantsResponse> {
    const response = await golaflyAxios.post<ProgramApplicantsResponse>(
      '/v1/program/applicants',
      formData,
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
