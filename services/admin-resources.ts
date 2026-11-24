import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'
import type { Offer, OfferCategory } from '@/services/offers'
import type { Program } from '@/services/programs'
import type { Academy } from '@/services/academy'
import type { ApiPlayer } from '@/services/players'

/**
 * Admin read layer for the dashboard.
 *
 * Deliberately one file rather than six: these are the authenticated LIST
 * endpoints the eight admin screens need, nothing else. The existing
 * services/offers.ts and services/programs.ts hold the *public* landing
 * methods and are consumed by live marketing pages — extending them with
 * admin CRUD would mix two audiences in one class and put working pages at
 * risk for no benefit. When admin write operations land, split this per
 * domain the way the Golafly frontend does.
 *
 * Every endpoint here 401s without a Bearer token; golaflyAxios attaches it
 * from the session cookie.
 *
 * Response envelope is flat — ApiResponse<T[]>, no pagination wrapper. The
 * screens page client-side until the backend offers server pagination.
 */

/* ── Players ──────────────────────────────────────────────────────────────
   Typed as the full `ApiPlayer`. The previous hand-trimmed shape made the
   profile photo, passport, medical certificate and highlight media
   unreachable from the dashboard. */

/* ── Transactions ─────────────────────────────────────────────────────────── */

/* The API resolves the purchased entity into `paid_for`, keyed by type. The
   bare product_type ("program") is a category, not a product — the name of the
   thing bought lives in the nested object. */
export interface TransactionPaidFor {
  type: 'program' | 'academy' | 'offer'
  program: { id: number; title: string; slug: string } | null
  academy: { id: number; name: string; slug: string } | null
  offer: { id: number; title: string; slug: string } | null
}

export interface AdminTransactionRecord {
  id: number
  product_type: 'program' | 'academy' | 'offer'
  paid_for?: TransactionPaidFor | null
  full_name: string
  email: string
  amount: string
  currency: string
  payment_status: 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded'
  payment_method: string | null
  created_at: string
}

/** The human name of what was bought, falling back to the bare type. */
export function paidForName(t: AdminTransactionRecord): string {
  const p = t.paid_for
  return (
    p?.program?.title ??
    p?.academy?.name ??
    p?.offer?.title ??
    t.product_type ??
    '—'
  )
}

/* ── Academies ────────────────────────────────────────────────────────────
   Typed as the full `Academy` — the trimmed shape carried none of the
   description, terms, features or images. */

/* ── Programs ─────────────────────────────────────────────────────────────
   Typed as the full `Program` from services/programs.ts rather than a trimmed
   shape: /v1/program returns every field, and the edit sheet needs all of
   them. A narrower interface here would silently hide content the old
   dashboard collected. */

/* ── Scouting partner applications ────────────────────────────────────────── */

export interface AdminPartnerApplicationRecord {
  id: number
  full_name: string
  email: string
  phone: string | null
  country: string | null
  role: string | null
  current_role?: string | null
  years_of_experience: number | string | null
  areas_of_experience?: string[] | null
  local_resources?: string[] | null
  execution_plan?: string | null
  estimated_players?: string | null
  motivation: string | null
  partnership_acknowledged?: boolean
  terms_accepted?: boolean
  /* Storage paths vs resolved URLs — the old dashboard used file_urls only. */
  files?: string[] | null
  file_urls?: string[] | null
  status: string
  created_at: string
}

/* ── Team members (Settings → Teams) ──────────────────────────────────────── */

export interface AdminTeamMember {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export type AdminTeamsResponse = ApiResponse<AdminTeamMember[]>

/* POST /v1/teams. Confirmed against the live endpoint: an empty body comes
   back 422 naming name, email, role and password as required, and `password`
   carries Laravel's `confirmed` rule plus an 8-character minimum — so
   password_confirmation is part of the request, not a client-side nicety.

   `role` is NOT validated server-side (a nonsense value is accepted), which is
   exactly why the form offers a fixed set rather than a free text box: an
   unrecognised role would be stored happily and then match nothing in
   features/scout/roles.ts. */
export interface CreateTeamMemberPayload {
  name: string
  email: string
  role: string
  password: string
  password_confirmation: string
}

export type AdminTeamMemberResponse = ApiResponse<AdminTeamMember>

export type AdminPlayersResponse = ApiResponse<ApiPlayer[]>
export type AdminTransactionsResponse = ApiResponse<AdminTransactionRecord[]>
export type AdminAcademiesResponse = ApiResponse<Academy[]>
export type AdminProgramsResponse = ApiResponse<Program[]>
export type AdminOffersResponse = ApiResponse<Offer[]>
export type AdminOfferCategoriesResponse = ApiResponse<OfferCategory[]>
export type AdminPartnerApplicationsResponse = ApiResponse<
  AdminPartnerApplicationRecord[]
>

const json = { headers: { Accept: 'application/json' } }

export class AdminResourcesService {
  public static async getPlayers(): Promise<AdminPlayersResponse> {
    const response = await golaflyAxios.get<AdminPlayersResponse>('/v1/players', json)
    return response.data
  }

  public static async getTransactions(): Promise<AdminTransactionsResponse> {
    const response = await golaflyAxios.get<AdminTransactionsResponse>(
      '/v1/transactions',
      json,
    )
    return response.data
  }

  public static async getAcademies(): Promise<AdminAcademiesResponse> {
    const response = await golaflyAxios.get<AdminAcademiesResponse>('/v1/academies', json)
    return response.data
  }

  public static async getPrograms(): Promise<AdminProgramsResponse> {
    const response = await golaflyAxios.get<AdminProgramsResponse>('/v1/program', json)
    return response.data
  }

  public static async getOffers(): Promise<AdminOffersResponse> {
    const response = await golaflyAxios.get<AdminOffersResponse>('/v1/offers', json)
    return response.data
  }

  public static async getOfferCategories(): Promise<AdminOfferCategoriesResponse> {
    const response = await golaflyAxios.get<AdminOfferCategoriesResponse>(
      '/v1/offer-categories',
      json,
    )
    return response.data
  }

  public static async getTeams(): Promise<AdminTeamsResponse> {
    const response = await golaflyAxios.get<AdminTeamsResponse>('/v1/teams', json)
    return response.data
  }

  public static async createTeamMember(
    payload: CreateTeamMemberPayload,
  ): Promise<AdminTeamMemberResponse> {
    const response = await golaflyAxios.post<AdminTeamMemberResponse>(
      '/v1/teams',
      payload,
      json,
    )
    return response.data
  }

  public static async getPartnerApplications(): Promise<AdminPartnerApplicationsResponse> {
    const response = await golaflyAxios.get<AdminPartnerApplicationsResponse>(
      '/v1/program/scouting-partner-applications',
      json,
    )
    return response.data
  }
}
