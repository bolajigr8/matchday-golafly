// import golaflyAxios from '@/services/golafly-axios'

// export interface ApiResponse<T> {
//   success: boolean
//   message: string
//   data: T
// }

// export interface ProgramCategory {
//   id: number
//   name: string
//   slug: string
//   status: boolean
//   created_at: string
//   updated_at: string
//   image: string
//   description?: string
// }

// export interface ProgramSubcategory {
//   id: number
//   program_category_id: number
//   name: string
//   slug: string
//   status: boolean
//   created_at: string
//   updated_at: string
//   image: string
//   description?: string
// }

// export interface Program {
//   id: number
//   program_category_id: number
//   program_subcategory_id: number
//   program_category: { id: number; name: string; slug: string }
//   program_subcategory: { id: number; name: string; slug: string }
//   title: string
//   slug: string
//   description: string | { html?: string } | null
//   inclusions?: string | null
//   season_label?: string | null
//   country_code?: string | null
//   deadline?: string | null
//   details?: Record<string, unknown>
//   badges?: string[]
//   icon_image?: string | null
//   hero_image?: string | null
//   banner_url?: string | null
//   start_date: string
//   end_date: string
//   highlights: string[] | null
//   price_from: string
//   price_currency: string
//   location: string
//   gallery: string[] | null
//   brochure_url?: string | null
//   status: boolean
//   created_at: string
//   updated_at: string
// }

// export type ProgramCategoriesResponse = ApiResponse<ProgramCategory[]>
// export type ProgramsResponse = ApiResponse<Program[]>

// /**
//  * Same endpoints as Golafly main's ProgramsService — only the
//  * public, landing-page-facing methods are ported here (Matchday
//  * doesn't have the admin/CMS surface).
//  */
// export class ProgramsService {
//   public static async getProgramCategories(): Promise<ProgramCategoriesResponse> {
//     const response = await golaflyAxios.get<ProgramCategoriesResponse>(
//       '/v1/program/categories',
//       {
//         headers: { Accept: 'application/json' },
//       },
//     )
//     return response.data
//   }

//   public static async getLandingProgramCategories(): Promise<ProgramCategoriesResponse> {
//     return this.getProgramCategories()
//   }

//   public static async getSubcategoriesByCategory(categoryId: number): Promise<
//     ApiResponse<{
//       category: ProgramCategory
//       subcategories: ProgramSubcategory[]
//     }>
//   > {
//     const response = await golaflyAxios.get<
//       ApiResponse<{
//         category: ProgramCategory
//         subcategories: ProgramSubcategory[]
//       }>
//     >(`/v1/program/categories/${categoryId}/subcategories`, {
//       headers: { Accept: 'application/json' },
//     })
//     return response.data
//   }

//   public static async getProgramsBySubcategory(
//     subcategoryId: number,
//   ): Promise<ProgramsResponse> {
//     const response = await golaflyAxios.get<ProgramsResponse>(
//       `/v1/program/subcategories/${subcategoryId}/programs`,
//       { headers: { Accept: 'application/json' } },
//     )
//     return response.data
//   }
// }

import golaflyAxios from '@/services/golafly-axios'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ProgramCategory {
  id: number
  name: string
  slug: string
  status: boolean
  created_at: string
  updated_at: string
  image: string
  description?: string
}

export interface ProgramSubcategory {
  id: number
  program_category_id: number
  name: string
  slug: string
  status: boolean
  created_at: string
  updated_at: string
  image: string
  description?: string
}

export interface CreateCategoryPayload {
  name: string
  slug: string
  status: boolean
}

export interface UpdateCategoryPayload {
  name: string
  slug: string
  status: boolean
}

export interface CreateSubcategoryPayload {
  name: string
  slug: string
  status: boolean
  program_category_id: number
}

export interface UpdateSubcategoryPayload {
  name: string
  slug: string
  status: boolean
}

export interface Program {
  id: number
  program_category_id: number
  program_subcategory_id: number
  program_category: {
    id: number
    name: string
    slug: string
  }
  program_subcategory: {
    id: number
    name: string
    slug: string
  }
  title: string
  slug: string
  description:
    | string
    | {
        html?: string
      }
    | null
  inclusions?: string | null
  season_label?: string | null
  country_code?: string | null
  deadline?: string | null
  details?: Record<string, unknown>
  badges?: string[]
  icon_image?: string | null
  hero_image?: string | null
  banner_url?: string | null
  start_date: string
  end_date: string
  highlights: string[] | null
  price_from: string
  price_currency: string
  location: string
  gallery: string[] | null
  /* Flat list of media URLs mixing images AND video, with no type field —
     the extension decides which element renders it. */
  /**
   * ONE testimonial video per program, as a single URL string.
   *
   * Not a `testimonials: string[]` array — that field does not exist on the
   * API, so every read came back undefined. Confirmed against
   * GET /v1/program/{id}/details; the routes are singular to match
   * (`testimonial/video/upload`, `testimonial-video`).
   */
  testimonial_video_url?: string | null
  brochure_url?: string | null
  /* Player spots, set with PATCH /v1/program/{id}/spots. Absent or 0 on a
     program that takes no registrations. */
  spot?: number | null
  spot_left?: number | null
  availability?: string | null
  status: boolean
  created_at: string
  updated_at: string
}

/* ── Spots and registered players ─────────────────────────────────────────
   A program has an overall `spot` count and, optionally, spots per position.
   Positions are codes (GK, RB, … CF) — the same codes the public
   /register/player form submits. Each registered player (an "applicant")
   holds ONE position; that is the spot they use. */

export const PROGRAM_POSITIONS = [
  { code: 'GK', label: 'Goalkeeper' },
  { code: 'RB', label: 'Right Back' },
  { code: 'CB', label: 'Centre Back' },
  { code: 'LB', label: 'Left Back' },
  { code: 'CDM', label: 'Defensive Midfielder' },
  { code: 'CM', label: 'Central Midfielder' },
  { code: 'CAM', label: 'Attacking Midfielder' },
  { code: 'RW', label: 'Right Winger' },
  { code: 'LW', label: 'Left Winger' },
  { code: 'SS', label: 'Second Striker' },
  { code: 'CF', label: 'Centre Forward' },
] as const

export const positionLabel = (code?: string | null) =>
  PROGRAM_POSITIONS.find(p => p.code === code)?.label ?? code ?? ''

export interface ProgramPositionAvailability {
  code: string
  spot: number
  spot_left: number
  availability: string // "1/2 left"
}

/* GET /v1/program/{id}/availability. `positions` lists only the codes that
   were given spots; an empty list means no per-position limit. */
export interface ProgramAvailability {
  id: number
  title: string
  slug: string
  location: string
  spot: number
  spot_left: number
  availability: string
  positions: ProgramPositionAvailability[]
}

/* Whatever was submitted for the player. The backend stores it as-is and
   PATCH merges into it, so unknown keys from the public form survive. */
export interface ProgramApplicantPayload {
  first_name?: string
  last_name?: string
  age?: number
  email?: string
  phone?: string
  nationality?: string
  current_location_country?: string
  visa_required?: boolean
  experience_type?: string
  secondary_position?: string
  player_id?: number
  submitted_at?: string
  [key: string]: unknown
}

export interface ProgramApplicant {
  id: number
  program_id: number
  position: string
  program_category_id: number
  program_subcategory_id: number
  files: string[] | null
  file_urls: string[]
  payload: ProgramApplicantPayload
  status: string
  created_at: string
  program?: ProgramAvailability
}

export interface UpdateProgramSpotsPayload {
  spot: number
  positions: Record<string, number>
}

/* Before any spots are set the API sends `spot: null` and no positions.
   Read that as 0 everywhere, so no screen prints "null". */
export const normalizeAvailability = (a: ProgramAvailability): ProgramAvailability => ({
  ...a,
  spot: a.spot ?? 0,
  spot_left: a.spot_left ?? 0,
  positions: a.positions ?? [],
})

export const applicantName = (a: ProgramApplicant) =>
  [a.payload?.first_name, a.payload?.last_name].filter(Boolean).join(' ') ||
  `Player #${a.id}`

export interface CreateProgramPayload {
  program_category_id: number
  program_subcategory_id: number
  title: string
  slug: string
  description?: string
  inclusions?: string
  start_date: string
  end_date: string
  highlights: string[]
  price_from: number
  price_currency: string
  location: string
  status: boolean
}

export type UpdateProgramPayload = Partial<CreateProgramPayload>

export type ProgramCategoriesResponse = ApiResponse<ProgramCategory[]>
export type ProgramSubcategoriesResponse = ApiResponse<ProgramSubcategory[]>
export type ProgramsResponse = ApiResponse<Program[]>
export type ProgramResponse = ApiResponse<Program>

// Scouting Partner Applications
export interface ScoutingPartnerApplication {
  id: number
  full_name: string
  email: string
  phone: string
  country: string
  current_role: string
  areas_of_experience: string[]
  local_resources: string[]
  execution_plan: string
  estimated_players: string
  motivation: string
  partnership_acknowledged: boolean
  terms_accepted: boolean
  files: string[]
  file_urls: string[]
  status: string
  created_at: string
  updated_at: string
}

export type ScoutingPartnerApplicationsResponse = ApiResponse<
  ScoutingPartnerApplication[]
>
export type ScoutingPartnerApplicationResponse =
  ApiResponse<ScoutingPartnerApplication>

export class ProgramsService {
  // Categories
  public static async getProgramCategories(): Promise<ProgramCategoriesResponse> {
    const response = await golaflyAxios.get<ProgramCategoriesResponse>(
      '/v1/program/categories',
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  // Landing pages currently use same categories endpoint
  public static async getLandingProgramCategories(): Promise<ProgramCategoriesResponse> {
    return this.getProgramCategories()
  }

  public static async toggleProgramCategoryStatus(
    id: number,
  ): Promise<ApiResponse<ProgramCategory>> {
    const response = await golaflyAxios.patch<ApiResponse<ProgramCategory>>(
      `/v1/program/categories/${id}/toggle-status`,
      {},
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  // Subcategories (nested under categories)
  public static async getSubcategoriesByCategory(categoryId: number): Promise<
    ApiResponse<{
      category: ProgramCategory
      subcategories: ProgramSubcategory[]
    }>
  > {
    const response = await golaflyAxios.get<
      ApiResponse<{
        category: ProgramCategory
        subcategories: ProgramSubcategory[]
      }>
    >(`/v1/program/categories/${categoryId}/subcategories`, {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  // Programs
  public static async getPrograms(): Promise<ProgramsResponse> {
    const response = await golaflyAxios.get<ProgramsResponse>('/v1/program', {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  public static async getProgramById(id: number): Promise<ProgramResponse> {
    const response = await golaflyAxios.get<ProgramResponse>(
      `/v1/program/${id}/details`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async getProgramsBySubcategory(
    subcategoryId: number,
  ): Promise<ProgramsResponse> {
    const response = await golaflyAxios.get<ProgramsResponse>(
      `/v1/program/subcategories/${subcategoryId}/programs`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async createProgram(
    payload: CreateProgramPayload | FormData,
  ): Promise<ProgramResponse> {
    const response = await golaflyAxios.post<ProgramResponse>(
      '/v1/program',
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async updateProgram(
    id: number,
    payload: UpdateProgramPayload | FormData,
  ): Promise<ProgramResponse> {
    const response = await golaflyAxios.post<ProgramResponse>(
      `/v1/program/${id}`,
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async deleteProgram(id: number): Promise<ApiResponse<null>> {
    const response = await golaflyAxios.delete<ApiResponse<null>>(
      `/v1/program/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async uploadProgramBrochure(
    id: number,
    formData: FormData,
  ): Promise<
    ApiResponse<{
      path: string
      url: string
      program: Program
    }>
  > {
    const response = await golaflyAxios.post<
      ApiResponse<{
        path: string
        url: string
        program: Program
      }>
    >(`/v1/program/${id}/brochure/upload`, formData, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  public static async uploadProgramBanner(
    id: number,
    formData: FormData,
  ): Promise<
    ApiResponse<{
      path: string
      url: string
      program: Program
    }>
  > {
    const response = await golaflyAxios.post<
      ApiResponse<{
        path: string
        url: string
        program: Program
      }>
    >(`/v1/program/${id}/banners/upload`, formData, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /* ONE testimonial video per program.
   *
   * Takes a single file under the field name `video` — sending an array under
   * `testimonials[]` gets "The video field is required." Uploading again
   * replaces the existing video rather than appending. Both paths verified
   * against the live API; the older `/testimonials/upload` and
   * `/testimonials` routes do not exist at all (405, preflight only). */
  public static async uploadProgramTestimonialVideo(
    id: number,
    file: File,
  ): Promise<
    ApiResponse<{
      path?: string
      url?: string
      program: Program
    }>
  > {
    const formData = new FormData()
    formData.append('video', file)

    const response = await golaflyAxios.post<
      ApiResponse<{
        path?: string
        url?: string
        program: Program
      }>
    >(`/v1/program/${id}/testimonial/video/upload`, formData, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  public static async deleteProgramTestimonialVideo(
    id: number,
  ): Promise<ApiResponse<null>> {
    const response = await golaflyAxios.delete<ApiResponse<null>>(
      `/v1/program/${id}/testimonial-video`,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async sendProgramBrochure(
    id: number,
    payload: { full_name: string; email: string },
  ): Promise<ApiResponse<null>> {
    const response = await golaflyAxios.post<ApiResponse<null>>(
      `/v1/program/${id}/brochure/send`,
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  // Categories (create/update)
  public static async createCategory(
    payload: CreateCategoryPayload,
  ): Promise<ApiResponse<ProgramCategory>> {
    const response = await golaflyAxios.post<ApiResponse<ProgramCategory>>(
      '/v1/program/categories',
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async updateCategory(
    id: number,
    payload: UpdateCategoryPayload,
  ): Promise<ApiResponse<ProgramCategory>> {
    const response = await golaflyAxios.patch<ApiResponse<ProgramCategory>>(
      `/v1/program/categories/${id}`,
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  // Subcategories (create/update)
  public static async createSubcategory(
    payload: CreateSubcategoryPayload,
  ): Promise<ApiResponse<ProgramSubcategory>> {
    const response = await golaflyAxios.post<ApiResponse<ProgramSubcategory>>(
      '/v1/program/subcategories',
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async updateSubcategory(
    id: number,
    payload: UpdateSubcategoryPayload,
  ): Promise<ApiResponse<ProgramSubcategory>> {
    const response = await golaflyAxios.patch<ApiResponse<ProgramSubcategory>>(
      `/v1/program/subcategories/${id}`,
      payload,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  // Checkout
  public static async checkoutProgram(
    id: number,
    payload: {
      full_name: string
      email: string
      phone: string
      country: string
      guests?: number
      success_url: string
      cancel_url: string
    },
  ): Promise<
    ApiResponse<{
      checkout_url: string
      session_id: string
      transaction_id: number
    }>
  > {
    const response = await golaflyAxios.post<
      ApiResponse<{
        checkout_url: string
        session_id: string
        transaction_id: number
      }>
    >(`/v1/program/${id}/checkout`, payload, {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  // Scouting Partner Applications
  public static async createScoutingPartnerApplication(
    formData: FormData,
  ): Promise<ScoutingPartnerApplicationResponse> {
    const response =
      await golaflyAxios.post<ScoutingPartnerApplicationResponse>(
        '/v1/program/scouting-partner-applications',
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

  public static async getScoutingPartnerApplications(): Promise<ScoutingPartnerApplicationsResponse> {
    const response =
      await golaflyAxios.get<ScoutingPartnerApplicationsResponse>(
        '/v1/program/scouting-partner-applications',
        {
          headers: { Accept: 'application/json' },
        },
      )
    return response.data
  }

  public static async getScoutingPartnerApplicationById(
    id: number,
  ): Promise<ScoutingPartnerApplicationResponse> {
    const response = await golaflyAxios.get<ScoutingPartnerApplicationResponse>(
      `/v1/program/scouting-partner-applications/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async updateScoutingPartnerApplicationStatus(
    id: number,
    status: string,
  ): Promise<ScoutingPartnerApplicationResponse> {
    const response =
      await golaflyAxios.patch<ScoutingPartnerApplicationResponse>(
        `/v1/program/scouting-partner-applications/${id}/status`,
        { status },
        {
          headers: { Accept: 'application/json' },
        },
      )
    return response.data
  }

  /* ── Spots and registered players ─────────────────────────────────── */

  public static async updateProgramSpots(
    id: number,
    payload: UpdateProgramSpotsPayload,
  ): Promise<ProgramResponse> {
    const response = await golaflyAxios.patch<ProgramResponse>(
      `/v1/program/${id}/spots`,
      payload,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async getProgramAvailability(
    id: number,
  ): Promise<ApiResponse<ProgramAvailability>> {
    const response = await golaflyAxios.get<ApiResponse<ProgramAvailability>>(
      `/v1/program/${id}/availability`,
      { headers: { Accept: 'application/json' } },
    )
    return { ...response.data, data: normalizeAvailability(response.data.data) }
  }

  public static async getProgramApplicants(
    id: number,
  ): Promise<ApiResponse<ProgramApplicant[]>> {
    const response = await golaflyAxios.get<ApiResponse<ProgramApplicant[]>>(
      `/v1/program/${id}/applicants`,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  /* Takes a spot for `position`; the backend rejects it when that position
     (or the program) is full. */
  public static async registerProgramApplicant(
    id: number,
    body: { position: string; payload: ProgramApplicantPayload },
  ): Promise<ApiResponse<ProgramApplicant>> {
    const response = await golaflyAxios.post<ApiResponse<ProgramApplicant>>(
      `/v1/program/${id}/applicants`,
      body,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  /* Merges `payload` into what the player submitted. */
  public static async updateProgramApplicant(
    applicantId: number,
    payload: ProgramApplicantPayload,
  ): Promise<ApiResponse<ProgramApplicant>> {
    const response = await golaflyAxios.patch<ApiResponse<ProgramApplicant>>(
      `/v1/program/applicants/${applicantId}`,
      { payload },
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  /* Moves the player — and their position's spot — to another program. */
  public static async moveProgramApplicant(
    applicantId: number,
    programId: number,
  ): Promise<ApiResponse<ProgramApplicant>> {
    const response = await golaflyAxios.patch<ApiResponse<ProgramApplicant>>(
      `/v1/program/applicants/${applicantId}/move`,
      { program_id: programId },
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  /* Program id first, applicant id second — the route's own order. */
  public static async deleteProgramApplicant(
    programId: number,
    applicantId: number,
  ): Promise<ApiResponse<null>> {
    const response = await golaflyAxios.delete<ApiResponse<null>>(
      `/v1/program/${programId}/applicants/${applicantId}`,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }
}
