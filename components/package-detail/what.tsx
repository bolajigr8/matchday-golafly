'use client'

import { Shield, LayoutGrid } from 'lucide-react'
import Image from 'next/image'

export default function What({
  facilityCards,
  program,
}: {
  facilityCards: any[]
  program: any
}) {
  return (
    <div className='mt-32 max-w-5xl transition-colors duration-300'>
      {/* Header Section */}
      <p className='text-[#a3ff00] text-[10px] font-black uppercase tracking-[0.3em] mb-4'>
        {"Where You'll Train"}
      </p>

      <h2 className='text-3xl lg:text-5xl font-black mb-10 text-zinc-900 dark:text-white uppercase tracking-tighter leading-none'>
        World-Class <br className='hidden lg:block' /> Facilities
      </h2>

      <div className='space-y-7 text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm lg:text-base max-w-4xl font-medium'>
        <p>
          Barcelona is one of the world’s great football cities — a metropolitan
          area that supports hundreds of professional and semi-professional
          clubs at every level of the Spanish pyramid. Golafly secures
          facilities that fit this infrastructure, giving players access to
          environments that match the competitive standard of the programme.
        </p>

        <p>
          All training sessions and competitive fixtures take place at
          established clubs within the Barcelona metropolitan area, using the
          same pitches and facilities as the resident teams. Accommodation is
          positioned for convenience, with all logistics managed by the Golafly
          team.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className='grid lg:grid-cols-3 gap-5 mt-16'>
        {facilityCards.map((item, idx) => (
          <div
            key={idx}
            className='rounded-[32px] border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-8 hover:border-[#a3ff00]/30 transition-all group'
          >
            <div className='w-12 h-12 rounded-2xl bg-[#a3ff00]/10 border border-[#a3ff00]/20 flex items-center justify-center text-[#a3ff00] mb-8 group-hover:scale-110 transition-transform'>
              <LayoutGrid size={20} />
            </div>

            <h3 className='text-lg font-black mb-4 text-zinc-900 dark:text-zinc-100 uppercase tracking-tight'>
              {item.title}
            </h3>

            <p className='text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-medium'>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Bar */}
      <div className='grid grid-cols-2 md:grid-cols-4 border border-zinc-100 dark:border-zinc-800 rounded-[24px] overflow-hidden mt-8 bg-white dark:bg-zinc-950 shadow-sm'>
        {[
          ['5', 'Days Duration'],
          ['3rd Tier', 'Competition Level'],
          ['1:1', 'Scouting Report'],
          ['BCN', 'Metropolitan Area'],
        ].map((item, idx) => (
          <div
            key={idx}
            className='text-center py-8 border-b md:border-b-0 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 last:border-b-0'
          >
            <h4 className='text-[#a3ff00] font-black text-3xl mb-1 tracking-tighter'>
              {item[0]}
            </h4>
            <p className='text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest'>
              {item[1]}
            </p>
          </div>
        ))}
      </div>

      {/* Image Gallery Grid - Matching the Collage Look */}
      {/* <div className="mt-10 grid grid-cols-2 gap-4">
        {[...program?.facilityImages, ...program?.galleryImages].map(
          (el, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-[32px] bg-zinc-100 dark:bg-zinc-900"
            >
              <Image
                width={1000}
                height={1000}
                quality={100}
                loading="lazy"
                alt="Elite training facilities"
                src={el}
                className="col-span-2 h-[360px] w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
              />
            </div>
          ),
        )}
      </div> */}

      {/* Performance Guarantee - Theme-Aware Callout */}
      <div className='w-full flex items-start gap-6 p-8 mt-16 rounded-[32px] bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5'>
        <div className='w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-black bg-[#a3ff00] shadow-[0_0_20px_rgba(163,255,0,0.3)]'>
          <Shield size={24} fill='currentColor' />
        </div>
        <div>
          <h2 className='text-zinc-900 dark:text-[#a3ff00] font-black text-sm uppercase tracking-widest mb-2'>
            Performance Guarantee
          </h2>
          <p className='font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm max-w-3xl'>
            If a player is assessed as not meeting the required competitive
            standard during the initial evaluation, the participation fee will
            be refunded in full —{' '}
            <span className='text-zinc-900 dark:text-white font-bold italic'>
              no questions asked.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
