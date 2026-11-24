'use client'

import React from 'react'
import { motion } from 'framer-motion'

const scoutingStats = [
  { value: '50+', label: 'Official scouts from professional clubs' },
  { value: '100%', label: 'Guaranteed scout attendance at every event' },
  { value: '3', label: 'Leagues represented (Premier, La Liga, Bundesliga)' },
]

export const ScoutingNetwork = () => {
  return (
    <section className='bg-zinc-50 dark:bg-black md:py-24 px-6 lg:px-20 transition-colors duration-500'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-20'>
          <div className='flex items-center gap-2 mb-6'>
            <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
            <span className='text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
              Scouting Network
            </span>
          </div>
          <h2 className='text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-zinc-950 dark:text-white max-w-3xl'>
            The most direct <br /> route <br /> to getting signed
          </h2>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {scoutingStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-12 rounded-[32px] flex flex-col items-center justify-center text-center transition-all hover:border-[#b4ff39]/40 group'
            >
              <span className='text-6xl lg:text-7xl font-black text-[#b4ff39] mb-6 tracking-tighter transition-transform group-hover:scale-105'>
                {stat.value}
              </span>
              <p className='text-zinc-500 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px]'>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
