'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Download, Phone } from 'lucide-react'
import type { TourismPackage } from '@/lib/tourism-packages-data'
import DownloadBrochureModal from './download-brochure-modal'

const categoryLabels: Record<string, string> = {
  trial: 'Trial & Showcase',
  matchday: 'Match-day Experience',
  venue: 'Iconic Venue Tour',
}

interface PackageHeroProps {
  tourPackage: TourismPackage
  programId?: number
}

export default function PackageHero({
  tourPackage,
  programId,
}: PackageHeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <section className='dark-section relative w-full flex flex-col'>
      <div className='relative w-full min-h-[360px] sm:min-h-[420px] lg:min-h-[500px] flex items-center justify-center py-[80px] sm:py-[60px] lg:py-0'>
        {/* Background Image */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <Image
            src={tourPackage.image}
            alt={tourPackage.name}
            fill
            className='object-cover opacity-60'
            priority
            sizes='100vw'
          />
        </div>

        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.3)] to-[#12100e]' />

        {/* Content */}
        <div className='relative container-custom px-custom w-full z-10'>
          <div className='flex flex-col items-start max-w-[900px]'>
            {/* Category badge */}
            <span className='inline-block bg-brand-gold-main/20 border border-brand-gold-main/40 text-brand-gold-main text-[11px] lg:text-[12px] font-semibold uppercase tracking-[1.5px] rounded-full px-3 sm:px-4 py-1 mb-3'>
              {categoryLabels[tourPackage.category] ?? tourPackage.category}
            </span>

            {/* Tour dates */}
            <p className='text-lp-text text-[13px] sm:text-[14px] opacity-90 mb-2 sm:mb-3'>
              Tour · {tourPackage.tourDates}
            </p>

            {/* Title */}
            <h1 className='text-[24px] sm:text-[32px] lg:text-[56px] font-bold leading-tight uppercase mb-3 sm:mb-4'>
              <span className='text-brand-gold-main'>
                {tourPackage.name}
                {/* {tourPackage.flag} */}
              </span>
            </h1>

            {/* Cities */}
            <p className='text-lp-text text-[14px] sm:text-[16px] lg:text-[20px]'>
              {tourPackage.cities}
            </p>

            {/* Price Badge - Mobile */}
            <div className='flex lg:hidden mt-4'>
              <div className='flex items-center gap-2 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-brand-gold-main rounded-[4px] px-4 py-2.5 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]'>
                <span className='text-brand-gold-main text-[18px] font-bold'>
                  {tourPackage.currency}{' '}
                  {tourPackage.costNumeric.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 mt-8 w-full'>
              {(tourPackage.brochureUrl || programId) && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#b4ff39] hover:bg-[#b4ff39]/90 text-[#1a1a1a] px-6 py-3.5 rounded font-bold transition-colors'
                >
                  <Download className='w-5 h-5 flex-shrink-0' />
                  Download Program Brochure
                </button>
              )}
              <Link
                href='https://calendly.com/golafly-ltd/30min'
                target='_blank'
                rel='noopener noreferrer'
                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#121212]/50 backdrop-blur-sm border border-[#b4ff39] text-[#b4ff39] hover:bg-[#b4ff39]/10 px-6 py-3.5 rounded font-bold transition-colors'
              >
                <Phone className='w-5 h-5 flex-shrink-0' />
                Need help planning? Book a video call
              </Link>
            </div>
          </div>

          {/* Price Badge - Desktop */}
          <div className='hidden lg:flex absolute right-[60px] top-1/2 -translate-y-1/2'>
            <div className='flex items-center gap-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-brand-gold-main rounded-[4px] px-6 py-3.5 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]'>
              <span className='text-brand-gold-main text-[20px] font-bold'>
                {tourPackage.currency}{' '}
                {tourPackage.costNumeric.toLocaleString()}
              </span>
              <span className='text-lp-text-subtle text-[14px]'>
                {tourPackage.currency === 'NGN' ? '' : ''}
              </span>
              <ChevronRight className='w-5 h-5 text-lp-text-subtle' />
            </div>
          </div>
        </div>
      </div>

      <DownloadBrochureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageName={tourPackage.name}
        programId={programId}
      />
    </section>
  )
}
