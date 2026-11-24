'use client'

import { Check, MapPin, Calendar, Plane } from 'lucide-react'
import type { TourismPackage } from '@/lib/tourism-packages-data'
import {
  getHtmlContent,
  isHtmlLike,
  stripHtmlToText,
} from '@/lib/content-normalizers'

interface TourDetailsProps {
  tourPackage: TourismPackage
}

export default function TourDetails({ tourPackage }: TourDetailsProps) {
  const overviewHtml = getHtmlContent(tourPackage.overview)?.replace(
    /&nbsp;/g,
    ' ',
  )
  const overviewText = stripHtmlToText(tourPackage.overview)?.replace(
    /&nbsp;/g,
    ' ',
  )

  return (
    <section className='relative w-full bg-lp-bg py-[30px] sm:py-[40px] lg:py-[60px]'>
      <div className='container-custom px-custom'>
        {/* Section Heading */}
        <h2 className='text-brand-gold-main text-[20px] sm:text-[22px] lg:text-[24px] font-bold uppercase mb-3 sm:mb-4'>
          Tour Details
        </h2>

        {/* Details Card - Cream/Beige */}
        <div className='bg-[#b4ff39] border border-[#b4ff39] rounded-[6px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] p-4 sm:p-5 lg:p-[25px]'>
          <div className='flex flex-col lg:flex-row gap-5 sm:gap-6 lg:gap-8'>
            {/* Left - Overview */}
            <div className='flex-1 lg:border-r lg:border-[rgba(42,27,18,0.2)] lg:pr-8'>
              <h3 className='text-[#4a3b32] text-[15px] sm:text-[16px] lg:text-[18px] font-bold uppercase mb-2 sm:mb-3'>
                {tourPackage.name} Overview
              </h3>
              {/* Overview — supports WYSIWYG HTML content */}
              {overviewHtml && isHtmlLike(tourPackage.overview) ? (
                <div
                  className='rich-text-content text-[#5c4d44] text-[13px] lg:text-[14px] leading-[1.6] mb-5 sm:mb-6 break-words'
                  dangerouslySetInnerHTML={{ __html: overviewHtml }}
                />
              ) : (
                <p className='text-[#5c4d44] text-[13px] lg:text-[14px] leading-[1.6] mb-5 sm:mb-6'>
                  {overviewText}
                </p>
              )}

              {/* Itinerary highlights */}
              <div className='space-y-2'>
                {tourPackage.itinerary.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-start sm:items-center gap-2.5 sm:gap-3'
                  >
                    {idx === 0 && (
                      <MapPin className='w-[13px] h-[13px] text-[#3e2723] shrink-0 mt-0.5 sm:mt-0' />
                    )}
                    {idx === 1 && (
                      <Calendar className='w-[13px] h-[13px] text-[#3e2723] shrink-0 mt-0.5 sm:mt-0' />
                    )}
                    {idx >= 2 && (
                      <Plane className='w-[13px] h-[13px] text-[#3e2723] shrink-0 mt-0.5 sm:mt-0' />
                    )}
                    <span className='text-[#3e2723] text-[12px] sm:text-[13px] font-semibold leading-[1.4]'>
                      Day {item.day}: {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider - Mobile only */}
            <div className='border-t border-[rgba(42,27,18,0.15)] lg:hidden' />

            {/* Right - Inclusions */}
            <div className='lg:w-[280px]'>
              <h3 className='text-[#4a3b32] text-[15px] sm:text-[16px] lg:text-[18px] font-bold uppercase mb-2 sm:mb-3'>
                Inclusions
              </h3>
              <div className='space-y-2.5 sm:space-y-3'>
                {tourPackage.inclusions.map((item, idx) => (
                  <div key={idx} className='flex items-start gap-2.5'>
                    <Check className='w-[13px] h-[13px] text-[#5c4d44] shrink-0 mt-0.5' />
                    <span className='text-[#2b241e] text-[12px] sm:text-[13px] leading-[1.4]'>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
