import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

export interface OfferCategory {
  id: number
  name: string
  slug: string
  status: boolean
  created_at: string
  updated_at: string
}

export interface Offer {
  id: number
  offer_category_id: number
  category_slug: string
  title: string
  slug: string
  description: string | { html?: string } | null
  badges: string[] | null
  season_label: string | null
  country_code: string | null
  price_from: string | null
  price_currency: string
  hero_image: string | null
  icon_image: string | null
  deadline: string
  details: Record<string, unknown> | null
  status: boolean
  created_at: string
  updated_at: string
}

export type OfferCategoriesResponse = ApiResponse<OfferCategory[]>
export type OffersResponse = ApiResponse<Offer[]>
export type OfferResponse = ApiResponse<Offer>

/**
 * Same endpoints as Golafly main's OffersService — only the public,
 * read-only, landing-page-facing methods are ported (no admin CRUD
 * surface, Matchday doesn't have an offers admin panel).
 */
export class OffersService {
  public static async getLandingOfferCategories(): Promise<OfferCategoriesResponse> {
    const response = await golaflyAxios.get<OfferCategoriesResponse>(
      '/v1/offer-categories/landing/page',
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }

  public static async getLandingOffers(
    categorySlug: string,
  ): Promise<OffersResponse> {
    const response = await golaflyAxios.get<OffersResponse>(
      '/v1/offers/landing/page',
      {
        headers: { Accept: 'application/json' },
        params: { category_slug: categorySlug },
      },
    )
    return response.data
  }

  public static async getOfferById(offerId: number): Promise<OfferResponse> {
    const response = await golaflyAxios.get<OfferResponse>(
      `/v1/offers/${offerId}`,
      {
        headers: { Accept: 'application/json' },
      },
    )
    return response.data
  }
}
