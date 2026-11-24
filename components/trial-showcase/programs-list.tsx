'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useGetProgramCategoriesLanding } from '@/hooks/useGetProgramCategoriesLanding'
import { ProgramsService } from '@/services/programs'
import { stripHtmlToText } from '@/lib/content-normalizers'
import type {
  Program,
  ProgramCategory,
  ProgramSubcategory,
} from '@/services/programs'
import { SafeImage } from '@/components/shared/safe-image'

function getDescription(desc: Program['description']): string {
  return stripHtmlToText(desc) || ''
}

function ProgramCard({ program, index }: { program: Program; index: number }) {
  const img = program.banner_url || program.gallery?.[0] || ''
  const desc = getDescription(program.description)
  const highlights = program.highlights?.slice(0, 3) ?? []

  const grid = [
    { label: 'Location', value: program.location || 'TBD' },
    { label: 'Start Date', value: program.start_date || 'TBD' },
    {
      label: 'Price',
      value: program.price_from
        ? `${program.price_currency} ${program.price_from}`
        : 'On request',
    },
    { label: 'Deadline', value: program.deadline || 'Open' },
  ]

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className='bg-[#EBEFE6] dark:bg-[#0D0D0D] rounded-[28px] overflow-hidden border border-black/5 dark:border-white/5 h-full flex flex-col'
    >
      <div className='relative h-[220px]'>
        <SafeImage
          src={img}
          alt={program.title}
          fill
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
        {(program.country_code || program.location) && (
          <div className='absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg'>
            {[program.country_code, program.location]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
      </div>

      <div className='p-6 flex flex-col flex-1'>
        {(program.season_label || program.deadline) && (
          <div className='flex items-center gap-2 text-[#76B900] dark:text-[#a3ff00] text-[10px] font-bold mb-3 uppercase tracking-wider'>
            {program.season_label && <span>{program.season_label}</span>}
            {program.season_label && program.deadline && (
              <span className='w-1 h-1 bg-current rounded-full' />
            )}
            {program.deadline && <span>Deadline {program.deadline}</span>}
          </div>
        )}

        <h3 className='text-xl font-bold mb-3 text-[#1A1C19] dark:text-white tracking-tight'>
          {program.title}
        </h3>

        {desc && (
          <p className='text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed line-clamp-2'>
            {desc}
          </p>
        )}

        <div className='grid grid-cols-2 gap-4 mb-6 py-4 border-y border-black/5 dark:border-white/5'>
          {grid.map((item) => (
            <div key={item.label}>
              <p className='text-[9px] uppercase text-gray-400 font-bold mb-1 tracking-widest'>
                {item.label}
              </p>
              <p className='text-xs font-bold text-[#1A1C19] dark:text-white'>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {highlights.length > 0 && (
          <div className='flex flex-col gap-1.5 mb-5'>
            {highlights.map((item) => (
              <div
                key={item}
                className='flex items-center gap-2 text-[10px] font-bold text-[#76B900] dark:text-[#a3ff00] uppercase tracking-tighter'
              >
                <Check size={12} strokeWidth={3} /> {item}
              </div>
            ))}
          </div>
        )}

        <div className='mt-auto'>
          <Link
            href={`/tourism-packages/${program.id}`}
            className='bg-[#a3ff00] text-black px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform'
          >
            View Details <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

function ProgramCardSkeleton() {
  return (
    <div className='bg-[#EBEFE6] dark:bg-[#0D0D0D] rounded-[28px] overflow-hidden border border-black/5 dark:border-white/5 animate-pulse'>
      <div className='h-[220px] bg-zinc-200 dark:bg-zinc-800' />
      <div className='p-6 space-y-3'>
        <div className='h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800' />
        <div className='h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800' />
        <div className='h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
        <div className='grid grid-cols-2 gap-4 py-4 border-y border-black/5 dark:border-white/5'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-8 rounded bg-zinc-200 dark:bg-zinc-800' />
          ))}
        </div>
        <div className='h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
      </div>
    </div>
  )
}

export interface ProgramsListProps {
  categorySlug?: string
  subcategorySlug?: string
  eyebrow?: string
  heading?: React.ReactNode
  subheading?: string
}

export function ProgramsList({
  categorySlug = 'football_tourism',
  subcategorySlug = 'trial_showcase',
  eyebrow = 'Trial Showcase',
  heading = (
    <>
      Showcase your <br /> talent globally
    </>
  ),
  subheading = 'Step into elite trial showcases across Europe. Each program is designed to put you in front of professional scouts and clubs.',
}: ProgramsListProps) {
  const { data: categoriesResponse, isLoading: isLoadingCats } =
    useGetProgramCategoriesLanding()
  const categories: ProgramCategory[] = categoriesResponse?.data ?? []

  const normalizeSlug = (s: string) => s.replace(/-/g, '_').toLowerCase()
  const targetCategory = categories.find(
    (c) => normalizeSlug(c.slug) === normalizeSlug(categorySlug),
  )

  const { data: subcatsData, isLoading: isLoadingSubcats } = useQuery({
    queryKey: ['subcategories-by-category', targetCategory?.id],
    queryFn: () =>
      ProgramsService.getSubcategoriesByCategory(targetCategory!.id),
    enabled: !!targetCategory?.id,
  })

  const allSubcategories: ProgramSubcategory[] =
    subcatsData?.data?.subcategories ?? []

  const targetSubcategory = subcategorySlug
    ? (allSubcategories.find(
        (s) => normalizeSlug(s.slug) === normalizeSlug(subcategorySlug),
      ) ??
      allSubcategories.find((s) =>
        normalizeSlug(s.name).includes(normalizeSlug(subcategorySlug)),
      ))
    : null

  const { data: programsData, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs-by-subcategory', targetSubcategory?.id],
    queryFn: () =>
      ProgramsService.getProgramsBySubcategory(targetSubcategory!.id),
    enabled: !!targetSubcategory?.id,
    select: (data) => data.data ?? [],
  })

  const programs: Program[] = programsData ?? []

  const isLoading = isLoadingCats || isLoadingSubcats || isLoadingPrograms

  return (
    <section className='bg-white dark:bg-black py-24 px-6 lg:px-20 transition-colors duration-500'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 mb-16 items-end'>
          <div>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-1.5 h-1.5 rounded-full bg-[#a3ff00] shadow-[0_0_8px_#a3ff00]' />
              <span className='text-[#76B900] dark:text-[#a3ff00] text-[10px] font-bold tracking-[0.3em] uppercase'>
                {eyebrow}
              </span>
            </div>
            <h2 className='text-6xl md:text-7xl font-bold tracking-tighter leading-[0.95] text-zinc-950 dark:text-white'>
              {heading}
            </h2>
          </div>
          <p className='text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed max-w-md'>
            {subheading}
          </p>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProgramCardSkeleton key={i} />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <p className='text-center py-16 text-zinc-400 text-sm'>
            No programs available at the moment.
          </p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {programs.map((program, i) => (
              <ProgramCard key={program.id} program={program} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
