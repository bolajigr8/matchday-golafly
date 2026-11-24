import { useQuery } from '@tanstack/react-query'
import { OffersService } from '@/services/offers'

export function useGetLandingOfferCategories() {
  return useQuery({
    queryKey: ['landing-offer-categories'],
    queryFn: async () => {
      const response = await OffersService.getLandingOfferCategories()
      return response.data
    },
  })
}

export function useGetLandingOffers(categorySlug: string) {
  return useQuery({
    queryKey: ['landing-offers', categorySlug],
    queryFn: async () => {
      const response = await OffersService.getLandingOffers(categorySlug)
      return response.data
    },
    enabled: !!categorySlug,
  })
}

export function useGetOfferById(id: number) {
  return useQuery({
    queryKey: ['offers', id],
    queryFn: async () => {
      if (!id) return null
      const response = await OffersService.getOfferById(id)
      return response.data
    },
    enabled: !!id,
  })
}
