export type PackageCategory = 'trial' | 'matchday' | 'venue'

export interface PackageItinerary {
  day: number
  description: string
}

export interface TourismPackage {
  slug: string
  category: PackageCategory
  image: string
  name: string
  // flag: string;
  location: string
  cities: string
  features: string[]
  cost: string
  costNumeric: number
  currency: string
  tourDates: string
  overview: string
  inclusions: string[]
  itinerary: PackageItinerary[]
  galleryImages: string[]
  terms: string[]
  brochureUrl?: string
  facilityImages?: string[]
}
