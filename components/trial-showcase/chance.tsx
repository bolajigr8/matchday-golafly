'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const Chance = () => {
  const router = useRouter()
  return (
    <section className='relative bg-zinc-50 dark:bg-black py-10 md:py-32 px-6 overflow-hidden transition-colors duration-500'>
      {/* Background Ambient Glow */}
      <div
        className='absolute inset-0 pointer-events-none opacity-40 dark:opacity-20'
        style={{
          background:
            'radial-gradient(circle at center, #b4ff3930 0%, transparent 70%)',
        }}
      />

      <div className='relative max-w-4xl mx-auto text-center'>
        {/* Main Heading */}
        <h2 className='text-5xl md:text-7xl lg:text-[9rem] font-bold tracking-tighter leading-[0.85] text-zinc-950 dark:text-white mb-12'>
          Your Chance <br />
          to Be{' '}
          <span className='text-[#b4ff39] drop-shadow-[0_0_15px_rgba(180,255,57,0.3)]'>
            Seen
          </span>
        </h2>

        {/* Supporting Text Block */}
        <div className='max-w-xl mx-auto space-y-6 mb-16'>
          <p className='text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium leading-relaxed'>
            Talent is everywhere, opportunity is not. We provide the stage for
            you to showcase your ability to the people who matter.
          </p>
          <p className='text-zinc-400 dark:text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed'>
            Slots for our Summer 2026 Showcase are filling up fast. Register
            today to guarantee your assessment.
          </p>
        </div>

        {/* Action Button */}
        <div className='flex justify-center'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/apply-now')}
            className='flex items-center gap-3 bg-[#b4ff39] text-black px-12 py-6 rounded-full font-black text-sm uppercase tracking-tight shadow-[0_20px_40px_rgba(180,255,57,0.2)]'
          >
            Apply For Trials <ArrowRight size={20} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {/* Decorative Grid Overlay (Subtle) */}
      <div
        className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
        style={{
          backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </section>
  )
}
