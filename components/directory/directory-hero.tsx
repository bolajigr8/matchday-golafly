'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Directory page header, partner-marketplace layout: breadcrumb, a big
   condensed title, a one-line subtitle and a short paragraph. `panel`
   puts it on the green band (Teams, Tournaments); `plain` leaves it on the
   page background (International). */
export function DirectoryHero({
  crumb,
  title,
  subtitle,
  description,
  variant = 'panel',
}: {
  crumb: string
  title: string
  subtitle?: ReactNode
  description?: ReactNode
  variant?: 'panel' | 'plain'
}) {
  const panel = variant === 'panel'
  return (
    <div className={cn(panel && 'page-container pt-4 sm:pt-6')}>
      <header
        className={cn(
          panel
            ? 'rounded-2xl bg-ticket-panel px-5 pt-6 pb-8 text-ticket-panel-foreground sm:rounded-3xl sm:px-10 sm:pt-8 sm:pb-12 lg:px-[18%]'
            : 'page-container pt-5 pb-6 text-ticket-ink sm:pt-6',
        )}
      >
        <nav aria-label='Breadcrumb' className='flex items-center gap-1 text-[12.5px]'>
          <Link href='/' className='opacity-80 hover:underline'>
            Home
          </Link>
          <ChevronRight className='size-3 opacity-60' />
          <span aria-current='page' className='font-semibold'>
            {crumb}
          </span>
        </nav>
        <h1
          className={cn(
            'mt-3 font-display uppercase leading-[0.88] sm:mt-4',
            panel ? 'text-[56px] sm:text-[84px]' : 'text-[48px] sm:text-[80px]',
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className='mt-3 text-[16px] sm:mt-5 sm:text-[17px]'>{subtitle}</p>
        )}
        {description && (
          <p
            className={cn(
              'mt-3 max-w-[560px] text-[13px] leading-relaxed sm:mt-4',
              panel ? 'text-ticket-panel-foreground/85' : 'text-ticket-ink/85',
            )}
          >
            {description}
          </p>
        )}
      </header>
    </div>
  )
}
