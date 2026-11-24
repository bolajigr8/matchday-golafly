'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const FinalCTA = () => {
  const trustMarkers = [
    'FIFA-licensed agents',
    '37+ partner clubs',
    'Response within 48h',
  ]
  const router = useRouter()

  return (
    <section className='relative bg-zinc-50 dark:bg-black py-24 lg:py-32 px-6 overflow-hidden transition-colors duration-500'>
      <div
        className='absolute inset-0 pointer-events-none opacity-40 dark:opacity-30'
        style={{
          background:
            'radial-gradient(circle at center, #b4ff3930 0%, transparent 70%)',
        }}
      />

      <div className='relative max-w-5xl mx-auto text-center'>
        <div className='flex justify-center items-center gap-2 mb-8'>
          <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
          <span className='text-[#76B900] dark:text-[#b4ff39] text-[10px] font-bold tracking-[0.4em] uppercase'>
            Start Your Journey
          </span>
        </div>

        <h2 className='text-5xl md:text-6xl lg:text-[7rem] font-bold tracking-tight leading-[0.95] lg:leading-[0.9] text-zinc-950 dark:text-white mb-10 lg:mb-12'>
          Your Talent <br />
          Deserves a <br />
          <span className='text-[#76B900] dark:text-[#b4ff39]'>Stage</span>
        </h2>

        <p className='text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-12 max-w-md mx-auto'>
          Let us help you find the right opportunity to showcase your ability.
        </p>

        <div className='flex flex-col items-center gap-8'>
          <motion.button
            onClick={() => router.push('/apply-now')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='w-full md:w-fit flex items-center justify-center gap-2 bg-[#b4ff39] text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-tight shadow-xl shadow-[#b4ff39]/20 transition-all'
          >
            Apply Now <ArrowRight size={18} strokeWidth={3} />
          </motion.button>

          <div className='flex flex-wrap justify-center gap-x-8 gap-y-4'>
            {trustMarkers.map((marker, i) => (
              <div key={i} className='flex items-center gap-2'>
                <Check
                  size={12}
                  className='text-[#76B900] dark:text-[#b4ff39]'
                />
                <span className='text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest'>
                  {marker}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
