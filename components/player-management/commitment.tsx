'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Globe, LineChart } from 'lucide-react'

const commitmentCards = [
  {
    id: '01',
    title: 'Trusted Representation',
    description:
      'We represent our players professionally, ethically, and transparently. Your career is our priority.',
    icon: <ShieldCheck size={20} />,
  },
  {
    id: '02',
    title: 'Global Network',
    description:
      'Linked to clubs, scouts, and agents in leading football markets across Europe and Africa.',
    icon: <Globe size={20} />,
  },
  {
    id: '03',
    title: 'Long Term Focus',
    description:
      "Ongoing support to build a player's career, not just a deal. We invest in your future.",
    icon: <LineChart size={20} />,
  },
]

export const CareerCommitment = () => {
  return (
    <section className='bg-white dark:bg-black py-10 md:py-16 lg:py-24 px-6 lg:px-20 text-zinc-950 dark:text-white transition-colors duration-500'>
      <div className='max-w-[1400px] mx-auto'>
        <header className='mb-12 lg:mb-20'>
          <div className='flex items-center gap-2 mb-6'>
            <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
            <span className='text-[#76B900] dark:text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
              Why Choose Golafly
            </span>
          </div>
          <h2 className='text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.1] max-w-4xl'>
            Your career, <br className='hidden md:block' /> our commitment
          </h2>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {commitmentCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className='relative group bg-zinc-50 dark:bg-[#111111] rounded-[32px] p-8 lg:p-10 border border-zinc-200 dark:border-white/5 flex flex-col h-full overflow-hidden transition-all hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-none'
            >
              <div className='flex justify-between items-start mb-12'>
                <span className='text-[#76B900] dark:text-[#b4ff39] font-mono text-sm font-bold opacity-80'>
                  {card.id}
                </span>
                <div className='w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[#76B900] dark:text-[#b4ff39] shadow-sm dark:shadow-none'>
                  {card.icon}
                </div>
              </div>

              <div className='mt-auto'>
                <h3 className='text-2xl font-bold mb-4 lg:mb-6 tracking-tight'>
                  {card.title}
                </h3>
                <p className='text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px]'>
                  {card.description}
                </p>
              </div>

              <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-[#b4ff39] scale-x-0 group-hover:scale-x-75 transition-transform duration-500 origin-center shadow-[0_0_15px_#b4ff39]' />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
