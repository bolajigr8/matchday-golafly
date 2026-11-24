'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const serviceCategories = [
  {
    id: '01',
    title: 'Club & Kit Sponsorships',
    emoji: '👕',
    description:
      'Partner with professional clubs and academies. Get your brand visible on training kits, match-day apparel, and official club channels.',
    features: [
      'Training kit sponsorships',
      'Academy partnerships',
      'Youth team branding',
      'Club media features',
    ],
  },
  {
    id: '02',
    title: 'Stadium Advertising',
    emoji: '🏟️',
    description:
      'Reach audiences live in stadium environments. From perimeter LED boards to hospitality suites, we create impactful brand moments.',
    features: [
      'LED perimeter boards',
      'Hospitality branding',
      'Ticket back branding',
      'Stadium naming rights',
    ],
  },
  {
    id: '03',
    title: 'Matchday Activations',
    emoji: '🎉',
    description:
      'Create unforgettable fan experiences at live matches. Interactive zones, player meet-and-greets, and exclusive hospitality packages.',
    features: [
      'Fan experience zones',
      'Player appearances',
      'VIP hospitality events',
      'In-stadium activations',
    ],
  },
  {
    id: '04',
    title: 'Digital Partnerships',
    emoji: '📱',
    description:
      'Extend your reach through digital channels. Content creation, social media campaigns, and influencer partnerships across football networks.',
    features: [
      'Social media campaigns',
      'Content creation',
      'Influencer partnerships',
      'Email marketing integration',
    ],
  },
]

export const FanEngagementServices = () => {
  return (
    <section className='bg-zinc-50 dark:bg-black py-10 md:py-24 px-6 lg:px-20 transition-colors duration-500'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-20'>
          <div className='flex items-center gap-2 mb-6'>
            <div className='w-1.5 h-1.5 rounded-full bg-[#b4ff39] shadow-[0_0_8px_#b4ff39]' />
            <span className='text-[#b4ff39] text-[10px] font-bold tracking-[0.3em] uppercase'>
              Our Services
            </span>
          </div>
          <h2 className='text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-zinc-950 dark:text-white max-w-4xl'>
            Four ways to <br /> connect with fans
          </h2>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {serviceCategories.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-8 rounded-[32px] flex flex-col h-full transition-all hover:border-[#b4ff39]/40 ${
                index === 3 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className='flex justify-between items-start mb-8'>
                <span className='text-[#b4ff39] font-mono text-xs font-bold'>
                  {service.id}
                </span>
                <span className='text-2xl filter grayscale group-hover:grayscale-0 transition-all'>
                  {service.emoji}
                </span>
              </div>

              <h3 className='text-2xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight'>
                {service.title}
              </h3>
              <p className='text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8'>
                {service.description}
              </p>

              <ul className='mt-auto space-y-3'>
                {service.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className='flex items-center gap-2 text-zinc-400 dark:text-zinc-500 group/item'
                  >
                    <ChevronRight
                      size={14}
                      className='text-[#b4ff39] transition-transform group-hover/item:translate-x-1'
                    />
                    <span className='text-[11px] font-bold uppercase tracking-wider'>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className='absolute bottom-0 left-8 right-8 h-[2px] bg-[#b4ff39] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center shadow-[0_0_15px_#b4ff39]' />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
