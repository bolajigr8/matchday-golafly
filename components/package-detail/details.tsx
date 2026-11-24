'use client'

import {
  getHtmlContent,
  isHtmlLike,
  stripHtmlToText,
} from '@/lib/content-normalizers'
import Card from './card'
import How from './how'
import What from './what'
import WhatsIncluded from './whats-included'
import Why from './why'
import Image from 'next/image'
import InquiryCard from './InquiryCard'

export default function Details({
  tourPackage,
  programId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tourPackage: any
  programId?: number
}) {
  const features = [
    {
      title: 'Accommodation',
      desc: '4-star hotel stay close to all training venues, included for the full duration of the camp.',
      icon: '⌂',
    },
    {
      title: 'Transport',
      desc: 'Airport pickup on arrival and daily transfers between accommodation and training grounds.',
      icon: '◎',
    },
    {
      title: 'Full Board',
      desc: 'Breakfast, lunch and dinner provided every day — nutritionally structured for athletes.',
      icon: '⌘',
    },
    {
      title: 'Training Kit',
      desc: 'Official Golafly training and match jersey issued to every player on arrival.',
      icon: '⚑',
    },
    {
      title: 'Sessions & Matches',
      desc: 'Structured professional training sessions plus competitive fixtures against Spanish clubs.',
      icon: '↗',
    },
    {
      title: 'Scouting Report',
      desc: 'Individual written performance report from our coaching staff delivered post-programme.',
      icon: '▣',
    },
  ]

  const reasons = [
    {
      title: 'Direct Club Exposure',
      desc: 'Train and compete in front of scouts from Spanish and European clubs actively looking for talent.',
    },
    {
      title: 'Real Competition',
      desc: 'Matches against third-tier Spanish football clubs — structured, competitive fixtures.',
    },
    {
      title: 'Professional Standards',
      desc: 'Sessions held at professional-grade pitches used by clubs in the Barcelona area.',
    },
    {
      title: 'Expert Feedback',
      desc: 'Receive personalised performance feedback from UEFA-licensed coaches and scouts.',
    },
    {
      title: 'European Network',
      desc: 'Build direct connections inside the Spanish and broader European football ecosystem.',
    },
  ]

  const facilityCards = [
    {
      title: 'Professional Training Pitches',
      desc: 'Sessions are conducted on natural grass and hybrid turf pitches that meet professional standards used by resident semi-pro clubs.',
    },
    {
      title: 'Performance & Analysis',
      desc: 'Access to gym facilities on site. Coaching staff conduct analysis with individual feedback combining observation with performance notes.',
    },
    {
      title: 'Player Accommodation',
      desc: 'Shared lodging within easy reach of all venues. Full board is provided — meals are structured to support player recovery.',
    },
  ]

  const process = [
    {
      title: 'Application',
      desc: 'Submit your player profile and football background for initial review by our coaching staff.',
    },
    {
      title: 'Online Assessment',
      desc: 'A short video interview or questionnaire to evaluate your level, attitude, and motivation.',
    },
    {
      title: 'Acceptance & Payment',
      desc: 'Qualified players receive an acceptance letter and a secure payment link to confirm their spot.',
    },
    {
      title: 'Camp Participation',
      desc: 'Join training sessions and competitive matches in Barcelona, observed by professional scouts.',
    },
  ]

  const overviewHtml = getHtmlContent(tourPackage.overview)?.replace(
    /&nbsp;/g,
    ' ',
  )
  const overviewText = stripHtmlToText(tourPackage.overview)?.replace(
    /&nbsp;/g,
    ' ',
  )

  return (
    <div className='min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300 overflow-hidden'>
      <section className='relative max-w-[1450px] mx-auto px-6 lg:px-12 py-12 lg:py-20'>
        {/* Dynamic Glow Effect */}
        <div className='absolute top-0 right-0 w-[600px] h-[600px] bg-[#a3ff00]/10 dark:bg-[#a3ff00]/5 blur-[150px] rounded-full pointer-events-none' />

        <div className='grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-16 items-start'>
          {/* Main Content Area */}
          <div className='relative z-10'>
            <p className='text-[#a3ff00] text-[10px] font-black uppercase tracking-[0.4em] mb-6'>
              About The Program
            </p>

            <h1 className='text-4xl lg:text-7xl font-black leading-[0.9] tracking-tighter text-zinc-900 dark:text-white uppercase mb-10'>
              {tourPackage?.name}
            </h1>

            <div className='prose prose-zinc dark:prose-invert max-w-none'>
              {overviewHtml && isHtmlLike(tourPackage.overview) ? (
                <div
                  className='text-zinc-600 dark:text-zinc-400 text-base lg:text-lg leading-relaxed mb-12 space-y-6'
                  dangerouslySetInnerHTML={{ __html: overviewHtml }}
                />
              ) : (
                <p className='text-zinc-600 dark:text-zinc-400 text-base lg:text-lg leading-relaxed mb-12'>
                  {overviewText}
                </p>
              )}
            </div>

            <div className='space-y-24'>
              {(() => {
                const images = [
                  ...(tourPackage?.facilityImages || []),
                  ...(tourPackage?.galleryImages || []),
                ].filter(Boolean)
                return images.length > 0 ? (
                  <div className='mt-10 grid grid-cols-2 gap-4'>
                    {images.map((el, idx) => (
                      <div
                        key={idx}
                        className='overflow-hidden rounded-[32px] bg-zinc-100 dark:bg-zinc-900'
                      >
                        <Image
                          width={1000}
                          height={1000}
                          quality={100}
                          loading='lazy'
                          alt='Elite training facilities'
                          src={el}
                          className='col-span-2 h-[360px] w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700 hover:scale-105'
                        />
                      </div>
                    ))}
                  </div>
                ) : null
              })()}
              <WhatsIncluded features={features} />
              <How process={process} />
              <Why reasons={reasons} />
              <What program={tourPackage} facilityCards={facilityCards} />
            </div>
          </div>

          {/* Sticky Checkout Card */}
          <div className='lg:sticky flex flex-col gap-8  lg:top-12'>
            <InquiryCard
              tourPackage={tourPackage}
              programId={programId?.toString()}
            />
            <Card tourPackage={tourPackage} programId={programId?.toString()} />
          </div>
        </div>
      </section>
    </div>
  )
}
