'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Routes } from '@/routes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SafeImage } from '@/components/shared/safe-image'

const ExperienceFootball = () => {
  const [activeTab, setActiveTab] = useState('All')
  const router = useRouter()

  const tabs = ['All', 'Trials', 'Matchday', 'Venues']

  const experiences = [
    {
      id: 1,
      title: 'TRIAL & SHOWCASE',
      title2: 'TOURS',
      description:
        'Organised trials and showcase matches with pro clubs where you can prove your talent, compete internationally, and showcase your skills directly to clubs.',
      image: '/golafly/golafly/FTH1.png',
      link: Routes.trialShowCase,
      category: 'Trials',
      country: 'ES',
    },
    {
      id: 2,
      title: 'MATCHDAY TRAVEL',
      title2: 'EXPERIENCES',
      description:
        'Travel to the biggest matchday destinations. From FIFA World Cup and UEFA Champions League matches to European football adventures, feel the pressing moments.',
      image: '/golafly/golafly/HT2.png',
      link: Routes.matchdayExperiences,
      category: 'Matchday',
      country: 'DE',
    },
    {
      id: 3,
      title: 'ICONIC FOOTBALL',
      title2: 'VENUES',
      description:
        'Visit legendary football venues and sports museums. Walk the grounds of iconic stadiums and experience the nostalgia of football history.',
      image: '/golafly/golafly/HT3.png',
      link: Routes.iconicVenues,
      category: 'Venues',
      country: 'UK',
    },
  ]

  const filteredItems =
    activeTab === 'All'
      ? experiences
      : experiences.filter((item) => item.category === activeTab)

  return (
    <section
      id='programs'
      className='py-24 px-6 bg-white dark:bg-black transition-colors duration-300'
    >
      <div className='container mx-auto max-w-7xl'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8'>
          <div>
            <div className='flex items-center gap-2 mb-6'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#a3ff00]' />
              <span className='text-[10px] uppercase tracking-widest text-[#76B900] dark:text-[#a3ff00] font-black'>
                Football Tourism Program
              </span>
            </div>
            <h2 className='text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-[#1A1C19] dark:text-white max-w-xl'>
              Three ways to experience football
            </h2>
          </div>

          {/* Filtering Tabs */}
          <div className='flex overflow-auto p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-full border border-black/5 dark:border-white/5'>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#a3ff00] text-black shadow-lg shadow-[#a3ff00]/20'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Grid */}
        <motion.div
          layout
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        >
          <AnimatePresence mode='popLayout'>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className='group relative flex flex-col bg-[#F8F9F7] dark:bg-[#111111] rounded-[32px] overflow-hidden border border-black/5 dark:border-white/5'
              >
                {/* Top Image Card */}
                <div
                  onClick={() => router.push(item?.link)}
                  className='relative cursor-pointer h-64 overflow-hidden'
                >
                  <SafeImage
                    width={1000}
                    height={1000}
                    quality={100}
                    loading='lazy'
                    src={item.image}
                    alt={item.title}
                    className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  <div className='absolute top-4 left-4'>
                    <span className='bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 rounded-lg border border-white/10'>
                      {item.country}
                    </span>
                  </div>
                  <div className='absolute top-4 right-4'>
                    <span className='bg-[#a3ff00] text-black text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-xl'>
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div
                  onClick={() => router.push(item?.link)}
                  className='p-8 cursor-pointer flex flex-col flex-grow'
                >
                  <h3 className='text-2xl font-bold text-[#1A1C19] dark:text-white mb-4 tracking-tight'>
                    {item.title}
                  </h3>
                  <p className='text-gray-500 dark:text-zinc-500 text-sm leading-relaxed mb-8 flex-grow'>
                    {item.description}
                  </p>
                  <Link
                    href={item?.link}
                    className='flex items-center gap-2 text-[#76B900] dark:text-[#a3ff00] text-[10px] font-black uppercase tracking-widest group/btn'
                  >
                    Learn More
                    <ArrowRight
                      size={14}
                      className='group-hover/btn:translate-x-1 transition-transform'
                    />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

export default ExperienceFootball
