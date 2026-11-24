'use client'

import { Sparkles } from 'lucide-react'

export default function Why({ reasons }: { reasons: any[] }) {
  return (
    <div className='mt-28 max-w-5xl transition-colors duration-300'>
      <p className='text-[#a3ff00] text-[10px] font-black uppercase tracking-[0.3em] mb-4'>
        Why Golafy
      </p>

      <h2 className='text-3xl lg:text-5xl font-black mb-10 text-zinc-900 dark:text-white uppercase tracking-tighter'>
        Why Join This Camp?
      </h2>

      <div className='grid gap-4'>
        {reasons.map((item: any, idx: number) => (
          <div
            key={idx}
            className='rounded-[24px] border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-6 flex gap-6 hover:border-[#a3ff00]/40 transition-all duration-500 group shadow-sm dark:shadow-none'
          >
            {/* Icon Container with Theme-Aware Colors */}
            <div className='w-12 h-12 rounded-2xl bg-white dark:bg-[#a3ff00]/10 border border-zinc-200 dark:border-[#a3ff00]/20 flex items-center justify-center text-zinc-400 dark:text-[#a3ff00] shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300'>
              <Sparkles size={18} />
            </div>

            <div className='flex flex-col justify-center'>
              <h3 className='font-black text-lg mb-1 text-zinc-900 dark:text-zinc-100 uppercase tracking-tight'>
                {item.title}
              </h3>
              <p className='text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium'>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
