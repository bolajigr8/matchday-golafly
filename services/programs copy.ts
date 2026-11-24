// import axiosInstance from "@/services/axios-instance";
// import type { ApiResponse } from "@/services/auth";

// export interface ProgramCategory {
//   id: number;
//   name: string;
//   slug: string;
//   status: boolean;
//   created_at: string;
//   updated_at: string;
//   image: string;
//   description?: string;
// }

// export interface ProgramSubcategory {
//   id: number;
//   program_category_id: number;
//   name: string;
//   slug: string;
//   status: boolean;
//   created_at: string;
//   updated_at: string;
//   image: string;
//   description?: string;
// }

// export interface CreateCategoryPayload {
//   name: string;
//   slug: string;
//   status: boolean;
// }

// export interface UpdateCategoryPayload {
//   name: string;
//   slug: string;
//   status: boolean;
// }

// export interface CreateSubcategoryPayload {
//   name: string;
//   slug: string;
//   status: boolean;
//   program_category_id: number;
// }

// export interface UpdateSubcategoryPayload {
//   name: string;
//   slug: string;
//   status: boolean;
// }

// export interface Program {
//   id: number;
//   program_category_id: number;
//   program_subcategory_id: number;
//   program_category: {
//     id: number;
//     name: string;
//     slug: string;
//   };
//   program_subcategory: {
//     id: number;
//     name: string;
//     slug: string;
//   };
//   title: string;
//   slug: string;
//   description:
//     | string
//     | {
//         html?: string;
//       }
//     | null;
//   inclusions?: string | null;
//   season_label?: string | null;
//   country_code?: string | null;
//   deadline?: string | null;
//   details?: Record<string, unknown>;
//   badges?: string[];
//   icon_image?: string | null;
//   hero_image?: string | null;
//   banner_url?: string | null;
//   start_date: string;
//   end_date: string;
//   highlights: string[] | null;
//   price_from: string;
//   price_currency: string;
//   location: string;
//   gallery: string[] | null;
//   brochure_url?: string | null;
//   status: boolean;
//   created_at: string;
//   updated_at: string;
// }

// export interface CreateProgramPayload {
//   program_category_id: number;
//   program_subcategory_id: number;
//   title: string;
//   slug: string;
//   description?: string;
//   inclusions?: string;
//   start_date: string;
//   end_date: string;
//   highlights: string[];
//   price_from: number;
//   price_currency: string;
//   location: string;
//   status: boolean;
// }

// export type UpdateProgramPayload = Partial<CreateProgramPayload>;

// export type ProgramCategoriesResponse = ApiResponse<ProgramCategory[]>;
// export type ProgramSubcategoriesResponse = ApiResponse<ProgramSubcategory[]>;
// export type ProgramsResponse = ApiResponse<Program[]>;
// export type ProgramResponse = ApiResponse<Program>;

// // Scouting Partner Applications
// export interface ScoutingPartnerApplication {
//   id: number;
//   full_name: string;
//   email: string;
//   phone: string;
//   country: string;
//   current_role: string;
//   areas_of_experience: string[];
//   local_resources: string[];
//   execution_plan: string;
//   estimated_players: string;
//   motivation: string;
//   partnership_acknowledged: boolean;
//   terms_accepted: boolean;
//   files: string[];
//   file_urls: string[];
//   status: string;
//   created_at: string;
//   updated_at: string;
// }

// export type ScoutingPartnerApplicationsResponse = ApiResponse<ScoutingPartnerApplication[]>;
// export type ScoutingPartnerApplicationResponse = ApiResponse<ScoutingPartnerApplication>;

// export class ProgramsService {
//   // Categories
//   public static async getProgramCategories(): Promise<ProgramCategoriesResponse> {
//     const response = await axiosInstance.get<ProgramCategoriesResponse>(
//       "/v1/program/categories",
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Landing pages currently use same categories endpoint
//   public static async getLandingProgramCategories(): Promise<ProgramCategoriesResponse> {
//     return this.getProgramCategories();
//   }

//   public static async toggleProgramCategoryStatus(
//     id: number,
//   ): Promise<ApiResponse<ProgramCategory>> {
//     const response = await axiosInstance.patch<ApiResponse<ProgramCategory>>(
//       `/v1/program/categories/${id}/toggle-status`,
//       {},
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Subcategories (nested under categories)
//   public static async getSubcategoriesByCategory(categoryId: number): Promise<
//     ApiResponse<{
//       category: ProgramCategory;
//       subcategories: ProgramSubcategory[];
//     }>
//   > {
//     const response = await axiosInstance.get<
//       ApiResponse<{
//         category: ProgramCategory;
//         subcategories: ProgramSubcategory[];
//       }>
//     >(`/v1/program/categories/${categoryId}/subcategories`, {
//       headers: { Accept: "application/json" },
//     });
//     return response.data;
//   }

//   // Programs
//   public static async getPrograms(): Promise<ProgramsResponse> {
//     const response = await axiosInstance.get<ProgramsResponse>("/v1/program", {
//       headers: { Accept: "application/json" },
//     });
//     return response.data;
//   }

//   public static async getProgramById(id: number): Promise<ProgramResponse> {
//     const response = await axiosInstance.get<ProgramResponse>(
//       `/v1/program/${id}/details`,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async getProgramsBySubcategory(
//     subcategoryId: number,
//   ): Promise<ProgramsResponse> {
//     const response = await axiosInstance.get<ProgramsResponse>(
//       `/v1/program/subcategories/${subcategoryId}/programs`,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async createProgram(
//     payload: CreateProgramPayload | FormData,
//   ): Promise<ProgramResponse> {
//     const response = await axiosInstance.post<ProgramResponse>(
//       "/v1/program",
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async updateProgram(
//     id: number,
//     payload: UpdateProgramPayload | FormData,
//   ): Promise<ProgramResponse> {
//     const response = await axiosInstance.post<ProgramResponse>(
//       `/v1/program/${id}`,
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async deleteProgram(id: number): Promise<ApiResponse<null>> {
//     const response = await axiosInstance.delete<ApiResponse<null>>(
//       `/v1/program/${id}`,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async uploadProgramBrochure(
//     id: number,
//     formData: FormData,
//   ): Promise<
//     ApiResponse<{
//       path: string;
//       url: string;
//       program: Program;
//     }>
//   > {
//     const response = await axiosInstance.post<
//       ApiResponse<{
//         path: string;
//         url: string;
//         program: Program;
//       }>
//     >(
//       `/v1/program/${id}/brochure/upload`,
//       formData,
//       {
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "multipart/form-data",
//         },
//       },
//     );
//     return response.data;
//   }

//   public static async uploadProgramBanner(
//     id: number,
//     formData: FormData,
//   ): Promise<
//     ApiResponse<{
//       path: string;
//       url: string;
//       program: Program;
//     }>
//   > {
//     const response = await axiosInstance.post<
//       ApiResponse<{
//         path: string;
//         url: string;
//         program: Program;
//       }>
//     >(
//       `/v1/program/${id}/banners/upload`,
//       formData,
//       {
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "multipart/form-data",
//         },
//       },
//     );
//     return response.data;
//   }

//   public static async sendProgramBrochure(
//     id: number,
//     payload: { full_name: string; email: string },
//   ): Promise<ApiResponse<null>> {
//     const response = await axiosInstance.post<ApiResponse<null>>(
//       `/v1/program/${id}/brochure/send`,
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Categories (create/update)
//   public static async createCategory(
//     payload: CreateCategoryPayload,
//   ): Promise<ApiResponse<ProgramCategory>> {
//     const response = await axiosInstance.post<ApiResponse<ProgramCategory>>(
//       "/v1/program/categories",
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async updateCategory(
//     id: number,
//     payload: UpdateCategoryPayload,
//   ): Promise<ApiResponse<ProgramCategory>> {
//     const response = await axiosInstance.patch<ApiResponse<ProgramCategory>>(
//       `/v1/program/categories/${id}`,
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Subcategories (create/update)
//   public static async createSubcategory(
//     payload: CreateSubcategoryPayload,
//   ): Promise<ApiResponse<ProgramSubcategory>> {
//     const response = await axiosInstance.post<ApiResponse<ProgramSubcategory>>(
//       "/v1/program/subcategories",
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async updateSubcategory(
//     id: number,
//     payload: UpdateSubcategoryPayload,
//   ): Promise<ApiResponse<ProgramSubcategory>> {
//     const response = await axiosInstance.patch<ApiResponse<ProgramSubcategory>>(
//       `/v1/program/subcategories/${id}`,
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Checkout
//   public static async checkoutProgram(
//     id: number,
//     payload: {
//       full_name: string;
//       email: string;
//       phone: string;
//       country: string;
//       guests?: number;
//       success_url: string;
//       cancel_url: string;
//     },
//   ): Promise<
//     ApiResponse<{
//       checkout_url: string;
//       session_id: string;
//       transaction_id: number;
//     }>
//   > {
//     const response = await axiosInstance.post<
//       ApiResponse<{
//         checkout_url: string;
//         session_id: string;
//         transaction_id: number;
//       }>
//     >(
//       `/v1/program/${id}/checkout`,
//       payload,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   // Scouting Partner Applications
//   public static async createScoutingPartnerApplication(
//     formData: FormData,
//   ): Promise<ScoutingPartnerApplicationResponse> {
//     const response = await axiosInstance.post<ScoutingPartnerApplicationResponse>(
//       "/v1/program/scouting-partner-applications",
//       formData,
//       {
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "multipart/form-data",
//         },
//       },
//     );
//     return response.data;
//   }

//   public static async getScoutingPartnerApplications(): Promise<ScoutingPartnerApplicationsResponse> {
//     const response = await axiosInstance.get<ScoutingPartnerApplicationsResponse>(
//       "/v1/program/scouting-partner-applications",
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async getScoutingPartnerApplicationById(
//     id: number,
//   ): Promise<ScoutingPartnerApplicationResponse> {
//     const response = await axiosInstance.get<ScoutingPartnerApplicationResponse>(
//       `/v1/program/scouting-partner-applications/${id}`,
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }

//   public static async updateScoutingPartnerApplicationStatus(
//     id: number,
//     status: string,
//   ): Promise<ScoutingPartnerApplicationResponse> {
//     const response = await axiosInstance.patch<ScoutingPartnerApplicationResponse>(
//       `/v1/program/scouting-partner-applications/${id}/status`,
//       { status },
//       {
//         headers: { Accept: "application/json" },
//       },
//     );
//     return response.data;
//   }
// }
