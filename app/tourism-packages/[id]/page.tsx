import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { canonical } from '@/lib/seo'
import { ProgramsService } from '@/services/programs'
import PackageDetailClient from './client'
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface PackageDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PackageDetailPageProps): Promise<Metadata> {
  const { id } = await params
  return { alternates: canonical(`/tourism-packages/${encodeURIComponent(id)}`) }
}

export default async function PackageDetailPage({
  params,
}: PackageDetailPageProps) {
  const { id } = await params
  const programId = Number(id)

  if (!programId || isNaN(programId)) {
    return notFound()
  }

  let apiProgram:
    | Awaited<ReturnType<typeof ProgramsService.getProgramById>>['data']
    | null = null

  try {
    const response = await ProgramsService.getProgramById(programId)
    apiProgram = response.data ?? null
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching program from API:', error)
    }
  }

  if (!apiProgram) {
    return notFound()
  }

  return <PackageDetailClient tourPackage={apiProgram} isApiData />
}
