'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const FinalCTA = () => {
  const trustMarkers = [
    'Guaranteed scout exposure',
    'Professional event management',
    'Career-changing opportunity',
  ]

  const router = useRouter()

  return (
    <section className='relative bg-zinc-50 dark:bg-black py-10 md:py-24 lg:py-32 px-6 overflow-hidden transition-colors duration-500'>
      {/* Background Radial Glow */}
      <div
        className='absolute inset-0 pointer-events-none opacity-40 dark:opacity-30'
        style={{
          background:
            'radial-gradient(circle at center, #b4ff3930 0%, transparent 70%)',
        }}
      />

      <div className='relative max-w-5xl mx-auto text-center'>
        {/* Sub-label */}
        <div className='flex justify-center items-center gap-2 mb-8'>
          <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
          <span className='text-[#76B900] dark:text-[#b4ff39] text-[10px] font-bold tracking-[0.4em] uppercase'>
            {"Don't"} Wait
          </span>
        </div>

        {/* Main Heading */}
        <h2 className='text-5xl md:text-6xl lg:text-[7rem] font-bold tracking-tight leading-[0.95] lg:leading-[0.9] text-zinc-950 dark:text-white mb-10 lg:mb-12'>
          {"Don't"} Let Your <br />
          Talent Go <br />
          <span className='text-[#76B900] dark:text-[#b4ff39]'>Unnoticed</span>
        </h2>

        {/* Supporting Text */}
        <p className='text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-12 max-w-sm mx-auto'>
          Secure your spot at the next showcase event.
        </p>

        {/* Action Button */}
        <div className='flex flex-col items-center gap-8'>
          <motion.a
            href='https://calendly.com/golafly-ltd/30min'
            target='_blank'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='w-full md:w-fit flex items-center justify-center gap-2 bg-[#b4ff39] text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-tight shadow-xl shadow-[#b4ff39]/20 transition-all'
          >
            Talk To Our Team <ArrowRight size={18} strokeWidth={3} />
          </motion.a>

          {/* Small Trust Markers */}
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
