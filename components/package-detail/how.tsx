'use client'

import React from 'react'

export default function How({ process }: { process: any[] }) {
  return (
    <div className='mt-28 max-w-4xl transition-colors duration-300'>
      <p className='text-[#a3ff00] text-[10px] font-black uppercase tracking-[0.3em] mb-4'>
        How It Works
      </p>

      <h2 className='text-3xl lg:text-5xl font-black mb-10 text-zinc-900 dark:text-white uppercase tracking-tighter'>
        Selection Process
      </h2>

      <div className='space-y-12'>
        {process.map((item: any, idx: number) => (
          <div key={idx} className='flex gap-6 items-start group'>
            {/* Step Number with Theme-Aware Background */}
            <div className='relative shrink-0'>
              <div className='w-[42px] h-[42px] flex items-center justify-center rounded-full bg-zinc-100 dark:bg-[#a3ff00]/10 border border-zinc-200 dark:border-[#a3ff00]/20 text-[13px] font-black text-zinc-900 dark:text-[#a3ff00] group-hover:scale-110 transition-transform'>
                {idx + 1}
              </div>
              {/* Vertical line connector (optional, matches premium roadmap styles) */}
              {idx !== process.length - 1 && (
                <div className='absolute top-[42px] left-1/2 -translate-x-1/2 w-[1px] h-8 bg-zinc-100 dark:bg-zinc-800' />
              )}
            </div>

            <div>
              <h3 className='font-black text-lg mb-2 text-zinc-900 dark:text-zinc-100 uppercase tracking-tight'>
                {item.title}
              </h3>
              <p className='text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm max-w-2xl font-medium'>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
