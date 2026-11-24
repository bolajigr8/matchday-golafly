'use client'

import React from 'react'
import { motion } from 'framer-motion'

const stats = [
  { value: '50M+', label: 'Global football fans' },
  { value: '3.5B', label: 'World Cup viewers' },
  { value: '40%', label: 'Sports sponsorship ROI increase' },
  { value: '14', label: 'Countries served' },
]

export const MarketingStats = () => {
  return (
    <section className='bg-zinc-50 dark:bg-black py-24 px-6 lg:px-20 transition-colors duration-500'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 items-end mb-20'>
          <div>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
              <span className='text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
                Why Market Through Football
              </span>
            </div>
            <h2 className='text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-zinc-950 dark:text-white'>
              Unlock the power <br /> of <br /> football to engage <br />{' '}
              millions
            </h2>
          </div>

          <div className='max-w-md lg:pb-4'>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed'>
              Work with a trusted partner in maximizing sports marketing
              returns. Our data-driven campaigns deliver visibility, engagement,
              and measurable results.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/[0.03] p-10 rounded-[32px] flex flex-col items-center justify-center text-center transition-all hover:border-[#b4ff39]/40 group'
            >
              <span className='text-5xl lg:text-6xl font-black text-[#b4ff39] mb-4 tracking-tighter group-hover:scale-110 transition-transform'>
                {stat.value}
              </span>
              <span className='text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-600 max-w-[120px] leading-tight'>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
