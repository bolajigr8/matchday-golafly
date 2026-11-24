'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const SuccessStories = () => {
  const router = useRouter()
  return (
    <section className='bg-zinc-50 dark:bg-black py-10 md:py-24 px-4 lg:px-20 transition-colors duration-500'>
      <div className='max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-[40px] p-10 md:p-16 flex flex-col justify-between h-full min-h-[600px] shadow-sm'
        >
          <div>
            <div className='flex items-center gap-2 mb-8'>
              <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
              <span className='text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
                Success Stories
              </span>
            </div>

            <h2 className='text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] text-zinc-950 dark:text-white mb-10'>
              200+ players <br /> have signed <br /> professional <br />{' '}
              contracts
            </h2>

            <p className='text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mb-12'>
              Our showcase events have launched careers across Europe. From
              grassroots to professional leagues, Golafly has helped players
              achieve their dreams.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/blog')}
            className='flex items-center justify-center gap-2 bg-[#b4ff39] text-black w-fit px-8 py-5 rounded-full font-black text-sm uppercase tracking-tight shadow-lg shadow-[#b4ff39]/10'
          >
            Read Their Stories <ArrowRight size={18} strokeWidth={3} />
          </motion.button>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className='bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center md:h-[300px] hover:border-[#b4ff39]/30 transition-colors'
          >
            <span className='text-5xl md:text-7xl font-black text-[#b4ff39] tracking-tighter mb-2'>
              200+
            </span>
            <span className='text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest'>
              Successful Placements
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className='bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center md:h-[300px] hover:border-[#b4ff39]/30 transition-colors'
          >
            <span className='text-5xl md:text-7xl font-black text-[#b4ff39] tracking-tighter mb-2'>
              Pro
            </span>
            <span className='text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest'>
              Contracts
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
