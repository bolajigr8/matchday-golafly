'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const commitmentValues = [
  { title: 'Ethical', description: 'Transparent representation at every step' },
  {
    title: 'Selective',
    description: 'Only suitable opportunities for real talent',
  },
  { title: 'Focused', description: 'Personalized attention for every player' },
  { title: 'Realistic', description: 'Honest advice, no false promises' },
]

export const CompanyCommitment = () => {
  const router = useRouter()
  return (
    <section className='bg-zinc-50 dark:bg-black py-24 px-6 transition-colors duration-500'>
      <div className='max-w-6xl mx-auto text-center'>
        <header className='mb-16'>
          <div className='flex justify-center items-center gap-2 mb-6'>
            <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
            <span className='text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
              The Golafly Commitment
            </span>
          </div>

          <h2 className='text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.1] text-zinc-950 dark:text-white mb-8'>
            Career building, not <br className='hidden md:block' /> empty
            promises
          </h2>

          <p className='text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed'>
            We create selective, realistic, and focused opportunities for
            genuine talent. We do not make false guarantees. Every player we
            manage receives personalized attention and clear direction.
          </p>
        </header>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16'>
          {commitmentValues.map((val, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='group bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-8 rounded-[24px] flex flex-col items-center justify-center min-h-[180px] transition-all hover:border-[#b4ff39]/30'
            >
              <h4 className='text-xl font-bold text-zinc-900 dark:text-white mb-3'>
                {val.title}
              </h4>
              <p className='text-zinc-500 dark:text-zinc-500 text-xs font-medium leading-tight max-w-[140px]'>
                {val.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/apply-now')}
          className='inline-flex items-center gap-2 bg-[#b4ff39] text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-tight shadow-xl shadow-[#b4ff39]/10'
        >
          Get Scouted <ArrowRight size={18} strokeWidth={3} />
        </motion.button>
      </div>
    </section>
  )
}
