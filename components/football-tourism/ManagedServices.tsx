'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SafeImage } from '@/components/shared/safe-image'

const features = [
  'Pro Club Trial Matches',
  'International Competitions',
  'Stadium Tours & Museums',
  'Matchday Experiences',
  'Cultural Football Travel',
]

export const ManagedServices = () => {
  const router = useRouter()

  return (
    <section className='bg-white dark:bg-black py-16 lg:py-24 px-6 lg:px-20 text-zinc-950 dark:text-white overflow-hidden transition-colors duration-500'>
      <div className='max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
        {/* LEFT: Featured Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='relative aspect-[4/3] rounded-[32px] lg:rounded-[40px] overflow-hidden border border-zinc-200 dark:border-white/5 shadow-2xl order-2 lg:order-1'
        >
          <SafeImage
            src='/golafly/golafly/footballer.png'
            alt='Footballer in action'
            fill
            className='object-cover'
          />
        </motion.div>

        {/* RIGHT: Content & Features */}
        <div className='flex flex-col order-1 lg:order-2'>
          <div className='flex items-center gap-2 mb-6'>
            <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
            <span className='text-[#76B900] dark:text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
              What Our Tours Include
            </span>
          </div>

          <h2 className='text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 lg:mb-10'>
            Everything <br className='hidden md:block' /> managed{' '}
            <br className='hidden md:block' /> from start to{' '}
            <br className='hidden md:block' /> finish
          </h2>

          <div className='grid grid-cols-1 gap-3 mb-10'>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 8 }}
                className='flex items-center gap-4 bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-4 lg:p-5 rounded-2xl cursor-default transition-all hover:border-[#b4ff39]/40 hover:shadow-lg hover:shadow-[#b4ff39]/5'
              >
                <div className='flex-shrink-0 w-6 h-6 rounded-full bg-[#b4ff39] flex items-center justify-center shadow-sm'>
                  <Check size={14} className='text-black stroke-[3]' />
                </div>
                <span className='text-sm font-bold tracking-tight text-zinc-700 dark:text-gray-200'>
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/apply-now')}
            className='flex items-center justify-center gap-2 bg-[#b4ff39] text-black w-full md:w-fit px-10 py-5 rounded-full font-black text-sm uppercase tracking-tight shadow-xl shadow-[#b4ff39]/20 transition-all'
          >
            Apply Now <ArrowRight size={18} strokeWidth={3} />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
