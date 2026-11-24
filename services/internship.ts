import publicAxios from '@/services/golafly-public-axios'
import type { InternshipApplicationData } from '@/schema/internship'

/* Golafly Internship applications — POST /v1/internships (multipart).
 *
 * Public: applicants aren't signed in, so this goes through the token-free
 * client. The form's field names are its own; this maps them onto the API's.
 * The one reshaping is the phone: PhoneInput emits "+44 7700900123" and the
 * API wants the dial code and the number as separate fields. */

/** "+44 7700 900123" → { code: "+44", number: "7700900123" }. */
export function splitPhone(value: string): { code: string; number: string } {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/)
  if (!match) return { code: '', number: trimmed.replace(/\D/g, '') }
  return { code: match[1], number: match[2].replace(/\D/g, '') }
}

export function buildInternshipFormData(
  data: InternshipApplicationData,
  positionTitle: string,
): FormData {
  const { code, number } = splitPhone(data.phone)
  const formData = new FormData()
  formData.append('full_name', data.fullName.trim())
  formData.append('email', data.email.trim())
  formData.append('phone_country_code', code)
  formData.append('phone', number)
  formData.append('country_of_residence', data.country)
  formData.append('university', data.university.trim())
  formData.append('course_of_study', data.course.trim())
  formData.append('year_of_study', data.yearOfStudy)
  formData.append('earliest_start_date', data.startDate)
  formData.append('position', positionTitle)
  if (data.portfolioUrl) formData.append('linkedin_or_portfolio', data.portfolioUrl.trim())
  formData.append('why_this_track', data.motivation.trim())
  formData.append('consent_accepted', data.acceptTerms ? '1' : '0')
  formData.append('cv', data.cv, data.cv.name)
  return formData
}

export class InternshipService {
  public static async submitApplication(formData: FormData): Promise<{ message: string }> {
    const { data } = await publicAxios.post<{ success: boolean; message: string }>(
      '/v1/internships',
      formData,
    )
    return { message: data.message }
  }
}

/* API field → the form field it belongs to, for putting a 422 message on the
   right input. `phone_country_code` lands on the phone field too. */
export const INTERNSHIP_FIELD_MAP: Record<string, keyof InternshipApplicationData> = {
  full_name: 'fullName',
  email: 'email',
  phone: 'phone',
  phone_country_code: 'phone',
  country_of_residence: 'country',
  university: 'university',
  course_of_study: 'course',
  year_of_study: 'yearOfStudy',
  earliest_start_date: 'startDate',
  position: 'position',
  linkedin_or_portfolio: 'portfolioUrl',
  why_this_track: 'motivation',
  consent_accepted: 'acceptTerms',
  cv: 'cv',
}
