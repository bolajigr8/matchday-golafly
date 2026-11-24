'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useGetProgramCategoriesLanding } from '@/hooks/useGetProgramCategoriesLanding'
import { ProgramsService } from '@/services/programs'
import { stripHtmlToText } from '@/lib/content-normalizers'
import type {
  Program,
  ProgramCategory,
  ProgramSubcategory,
} from '@/services/programs'
import { SafeImage } from '@/components/shared/safe-image'

export interface ExploreSectionProps {
  categorySlug?: string
  heading?: string
  subheading?: string
}

function getDescription(desc: Program['description']): string {
  return stripHtmlToText(desc) || ''
}

function ExploreSkeleton() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse'>
      <div className='lg:col-span-7 bg-[#EBEFE6] dark:bg-[#0D0D0D] rounded-[32px] overflow-hidden border border-black/5 dark:border-white/5'>
        <div className='h-[300px] bg-zinc-200 dark:bg-zinc-800' />
        <div className='p-8 space-y-4'>
          <div className='h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800' />
          <div className='h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800' />
          <div className='h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
          <div className='h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800' />
          <div className='grid grid-cols-4 gap-4 py-6 border-y border-black/5 dark:border-white/5'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='h-10 rounded bg-zinc-200 dark:bg-zinc-800'
              />
            ))}
          </div>
          <div className='h-11 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
        </div>
      </div>
      <div className='lg:col-span-5 space-y-3'>
        <div className='flex justify-between mb-4 px-2'>
          <div className='h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-900' />
          <div className='h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-900' />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='h-[68px] rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5'
          />
        ))}
      </div>
    </div>
  )
}

function FeaturedCard({
  program,
  subcategoryName,
}: {
  program: Program
  subcategoryName: string
}) {
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
    <div className='bg-[#EBEFE6] dark:bg-[#0D0D0D] rounded-[32px] overflow-hidden border border-black/5 dark:border-white/5 h-full'>
      <div className='relative h-[300px]'>
        <SafeImage
          src={img}
          alt={program.title}
          fill
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
        {(program.country_code || program.location) && (
          <div className='absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg'>
            {[program.country_code, program.location]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
        <div className='absolute top-4 right-4 bg-[#a3ff00] text-black text-[10px] font-bold px-3 py-1.5 rounded-lg'>
          ★ {subcategoryName}
        </div>
      </div>

      <div className='p-8'>
        {(program.season_label || program.deadline) && (
          <div className='flex items-center gap-3 text-[#76B900] dark:text-[#a3ff00] text-[10px] font-bold mb-4 uppercase tracking-wider'>
            {program.season_label && <span>{program.season_label}</span>}
            {program.season_label && program.deadline && (
              <span className='w-1 h-1 bg-current rounded-full' />
            )}
            {program.deadline && <span>Deadline {program.deadline}</span>}
          </div>
        )}

        <h3 className='text-3xl font-bold mb-4 text-[#1A1C19] dark:text-white tracking-tight'>
          {program.title}
        </h3>

        {desc && (
          <p className='text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed line-clamp-3'>
            {desc}
          </p>
        )}

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 py-6 border-y border-black/5 dark:border-white/5'>
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

        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
          <Link
            href={`/tourism-packages/${program.id}`}
            className='bg-[#a3ff00] text-black px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform'
          >
            View Details <ArrowUpRight size={16} />
          </Link>
          {highlights.length > 0 && (
            <div className='flex flex-col gap-2'>
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
        </div>
      </div>
    </div>
  )
}

function RotatingItem({
  program,
  isActive,
  onClick,
  subcategoryName,
}: {
  program: Program
  isActive: boolean
  onClick: () => void
  subcategoryName: string
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={`group cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
        isActive
          ? 'bg-[#E1E7DB] dark:bg-[#151515] border-[#a3ff00]/30 shadow-[0_0_20px_rgba(163,255,0,0.05)]'
          : 'bg-[#F1F3EE] dark:bg-[#0D0D0D] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'
      }`}
    >
      <div className='flex items-center gap-4 min-w-0'>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            isActive
              ? 'bg-[#a3ff00] text-black'
              : 'bg-black/5 dark:bg-white/5 text-[#6DBE45] dark:text-[#B7FF00]'
          }`}
        >
          {program.country_code || '–'}
        </div>
        <div className='min-w-0'>
          <h4
            className={`text-xs font-bold transition-colors truncate ${
              isActive
                ? 'text-[#1A1C19] dark:text-[#F5F7F3]'
                : 'text-gray-600 dark:text-[#F5F7F3] group-hover:text-black dark:group-hover:text-white'
            }`}
          >
            {program.title}
          </h4>
          <p className='text-[9px] font-bold text-gray-400 mt-0.5 tracking-wider uppercase'>
            {program.location} {program.start_date && `• ${program.start_date}`}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-3 flex-shrink-0 ml-3'>
        <span
          className={`text-[8px] font-black px-2 py-1 rounded border tracking-tighter ${
            isActive
              ? 'bg-[#a3ff00] border-transparent text-black'
              : 'border-black/10 dark:border-white/10 text-[#3B4239] dark:text-[#A6B0A3]'
          }`}
        >
          {subcategoryName.slice(0, 5).toUpperCase()}
        </span>
        <ArrowUpRight
          size={14}
          className={
            isActive
              ? 'text-black dark:text-white'
              : 'text-gray-300 dark:text-gray-700'
          }
        />
      </div>
    </motion.div>
  )
}

export default function ExploreSection({
  categorySlug,
  heading = 'Explore All',
  subheading = 'Browse every opportunity in one place — from elite trial showcases and VIP matchday experiences to iconic stadium tours across Europe.',
}: ExploreSectionProps) {
  const { data: categoriesResponse, isLoading: isLoadingCats } =
    useGetProgramCategoriesLanding()
  const categories: ProgramCategory[] = categoriesResponse?.data ?? []

  const normalizeSlug = (s: string) => s.replace(/-/g, '_').toLowerCase()

  const targetCategory = categorySlug
    ? categories.find(
        (c) => normalizeSlug(c.slug) === normalizeSlug(categorySlug),
      )
    : null

  const { data: singleCatData, isLoading: isLoadingSingle } = useQuery({
    queryKey: ['subcategories-by-category', targetCategory?.id],
    queryFn: () =>
      ProgramsService.getSubcategoriesByCategory(targetCategory!.id),
    enabled: !!targetCategory?.id,
  })

  const allCatQueries = useQueries({
    queries:
      !categorySlug && categories.length > 0
        ? categories.map((cat) => ({
            queryKey: ['subcategories-by-category', cat.id],
            queryFn: () => ProgramsService.getSubcategoriesByCategory(cat.id),
          }))
        : [],
  })

  const subcategories: ProgramSubcategory[] = categorySlug
    ? (singleCatData?.data?.subcategories ?? [])
    : allCatQueries.flatMap((q) => q.data?.data?.subcategories ?? [])

  const isLoadingSubcats = categorySlug
    ? isLoadingSingle
    : allCatQueries.some((q) => q.isLoading)

  // Active subcategory — derived, not effect-synced: falls back to the first
  // loaded subcategory until the user manually picks one.
  const [manualSubcategoryId, setManualSubcategoryId] = useState<number | null>(
    null,
  )
  const activeSubcategoryId =
    manualSubcategoryId ?? subcategories[0]?.id ?? null

  const activeSubcategory = subcategories.find(
    (s) => s.id === activeSubcategoryId,
  )

  const { data: programsData, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs-by-subcategory', activeSubcategoryId],
    queryFn: () =>
      ProgramsService.getProgramsBySubcategory(activeSubcategoryId!),
    enabled: !!activeSubcategoryId,
    select: (data) => data.data ?? [],
  })

  const programs: Program[] = programsData ?? []

  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || programs.length <= 1) return
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % programs.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [programs.length, isPaused, featuredIndex])

  const handleSelectProgram = (index: number) => {
    setFeaturedIndex(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 15000)
  }

  const isLoading = isLoadingCats || isLoadingSubcats || isLoadingPrograms
  const featuredProgram = programs[featuredIndex]
  const otherPrograms = programs.filter((_, i) => i !== featuredIndex)

  return (
    <section className='w-full overflow-hidden  bg-white dark:bg-black transition-colors duration-300'>
      <div className='container mx-auto py-20 px-6'>
        <div className='flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8'>
          <div className='max-w-2xl'>
            <div className='flex items-center gap-2 mb-4'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#a3ff00]' />
              <span className='text-[10px] uppercase tracking-widest text-[#76B900] dark:text-[#a3ff00] font-bold'>
                Programs • All Opportunities
              </span>
            </div>
            <h2 className='text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-[#1A1C19] dark:text-white'>
              {heading} <br />
              <span className='text-[#a3ff00]'>Opportunities</span>
            </h2>
            <p className='text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed'>
              {subheading}
            </p>
          </div>

          {subcategories.length > 0 && (
            <div className='bg-black/5 overflow-auto dark:bg-white/5 p-1.5 rounded-full flex gap-1 w-full lg:w-fit scrollbar-hide'>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setManualSubcategoryId(sub.id)
                    setFeaturedIndex(0)
                    setIsPaused(false)
                  }}
                  className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    activeSubcategoryId === sub.id
                      ? 'bg-[#a3ff00] text-black'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <ExploreSkeleton />
        ) : programs.length === 0 ? (
          <p className='text-center py-20 text-gray-400'>
            No programs available in this category right now.
          </p>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            <div className='lg:col-span-7'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={featuredProgram.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className='h-full'
                >
                  <FeaturedCard
                    program={featuredProgram}
                    subcategoryName={activeSubcategory?.name ?? ''}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {otherPrograms.length > 0 && (
              <div className='lg:col-span-5 space-y-3'>
                <div className='flex items-center justify-between mb-4 px-2'>
                  <div className='flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest'>
                    <span className='w-1.5 h-1.5 bg-[#a3ff00] rounded-full' />
                    Next in rotation
                  </div>
                  <div className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                    Rotating every 8s&nbsp;•&nbsp;{programs.length}/
                    {programs.length}
                  </div>
                </div>

                {otherPrograms.map((program) => {
                  const originalIndex = programs.findIndex(
                    (p) => p.id === program.id,
                  )
                  return (
                    <RotatingItem
                      key={program.id}
                      program={program}
                      isActive={
                        originalIndex === (featuredIndex + 1) % programs.length
                      }
                      onClick={() => handleSelectProgram(originalIndex)}
                      subcategoryName={activeSubcategory?.name ?? ''}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
