'use client'

import PackageHero from '@/components/package-detail/package-hero'
import TourDetails from '@/components/package-detail/tour-details'
import TrainingFacility from '@/components/package-detail/training-facility'
import PaymentMethod from '@/components/package-detail/payment-method'
import type { TourismPackage } from '@/lib/tourism-packages-data'
import type { Program } from '@/services/programs'
import { getHtmlContent } from '@/lib/content-normalizers'
import Hero from '@/components/package-detail/hero'
import Details from '@/components/package-detail/details'

interface PackageDetailClientProps {
  tourPackage: TourismPackage | Program
  isApiData?: boolean
}

// Helper function to check if it's an API Program
function isProgram(data: unknown): data is Program {
  return (
    !!data &&
    typeof data === 'object' &&
    'program_category_id' in data &&
    'program_subcategory_id' in data
  )
}

// Convert Program to TourismPackage-like format
function adaptProgramToPackage(program: Program): TourismPackage {
  const brochureUrl = program.brochure_url || undefined

  const heroImage = program.banner_url || program.gallery?.[0] || ''

  const galleryImages = (program.gallery || []).filter(Boolean)

  // Determine category from subcategory slug
  let category: 'trial' | 'matchday' | 'venue' = 'trial'
  if (program.program_subcategory?.slug.includes('match')) {
    category = 'matchday'
  } else if (program.program_subcategory?.slug.includes('iconic')) {
    category = 'venue'
  }

  // Parse inclusions from HTML if present
  let parsedInclusions: string[] = []
  if (program.inclusions) {
    const inclusionsStr =
      typeof program.inclusions === 'string' ? program.inclusions : ''

    if (inclusionsStr.includes('<li')) {
      parsedInclusions = [
        ...inclusionsStr.matchAll(/<li[^>]*>(.*?)<\/li>/gi),
      ].map((m) =>
        m[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim(),
      )
    } else if (inclusionsStr.includes('<p')) {
      parsedInclusions = [...inclusionsStr.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
        .map((m) =>
          m[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim(),
        )
        .filter(Boolean)
    } else {
      parsedInclusions = inclusionsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  if (parsedInclusions.length === 0 && program.highlights) {
    parsedInclusions = program.highlights
  }

  return {
    slug: program.slug,
    category,
    image: heroImage,
    name: program.title,
    location: program.location || 'TBD',
    cities: program.location || 'TBD',
    features: program.highlights || [],
    cost: `${program.price_currency} ${program.price_from}`,
    costNumeric: program.price_from
      ? parseFloat(String(program.price_from))
      : 0,
    currency: program.price_currency || 'NGN',
    tourDates:
      program.start_date && program.end_date
        ? `${program.start_date} - ${program.end_date}`
        : 'TBD',
    overview:
      getHtmlContent(program.description) || 'Discover this amazing program.',
    inclusions: parsedInclusions,
    itinerary: [],
    galleryImages,
    facilityImages: [], // avoid duplicating gallery images
    terms: [],
    brochureUrl,
  }
}

export default function PackageDetailClient({
  tourPackage,
  isApiData = false,
}: PackageDetailClientProps) {
  const programId =
    isApiData && isProgram(tourPackage)
      ? (tourPackage as Program).id
      : undefined

  // Convert API Program to TourismPackage format if needed
  const displayPackage =
    isApiData && isProgram(tourPackage)
      ? adaptProgramToPackage(tourPackage)
      : (tourPackage as TourismPackage)

  return (
    <div>
      <Hero tourPackage={displayPackage} programId={programId} />
      <Details tourPackage={displayPackage} programId={programId} />
      {/* <PackageHero tourPackage={displayPackage} programId={programId} />
      <TourDetails tourPackage={displayPackage} />
      <TrainingFacility images={displayPackage.facilityImages || []} />
      <PaymentMethod tourPackage={displayPackage} programId={programId} /> */}
    </div>
  )
}
