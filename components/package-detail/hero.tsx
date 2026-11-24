'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Calendar,
  Download,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import DownloadBrochureModal from './download-brochure-modal'

export default function ScoutingCampHero({
  tourPackage,
  programId,
}: {
  tourPackage: any
  programId?: number
}) {
  const [brochureModalOpen, setBrochureModalOpen] = useState(false)
  const title = tourPackage?.name || ''

  const words = title.split(' ')
  const lastWord = words.pop()
  const remainingWords = words.join(' ')
  return (
    <section className='relative min-h-[520px] w-full flex flex-col justify-center overflow-hidden bg-[#0a0c10] selection:bg-[#a3ff00] selection:text-black'>
      {/* Background Image with Lighting Focus */}
      <div
        className='absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105'
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 12, 16, 0.4), rgba(10, 12, 16, 0.9)), url(${tourPackage?.image})`,
        }}
      />

      {/* Content Container */}
      <div className='relative z-10 container mx-auto px-6 lg:px-20 pt-20'>
        {/* 1. Breadcrumbs & Status Tag */}
        <div className='flex flex-wrap items-center gap-3 mb-8'>
          <div className='flex items-center gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-widest'>
            <span>Football Tourism</span>
            <ChevronRight size={12} className='text-zinc-600' />
            <span>{tourPackage?.category}</span>
          </div>

          <div className='flex items-center gap-2 bg-[#a3ff00]/10 border border-[#a3ff00]/20 px-3 py-1 rounded-full'>
            <motion.span
              className='w-1.5 h-1.5 bg-[#a3ff00] rounded-full shadow-[0_0_8px_#a3ff00]'
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className='text-[10px] font-bold text-[#a3ff00] uppercase tracking-tighter'>
              {tourPackage?.location} • {new Date().getFullYear()}
            </span>
          </div>
        </div>
        {/* 2. Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-6'
        >
          {remainingWords} <span className='text-[#a3ff00]'>{lastWord}</span>
        </motion.h1>

        <p className='text-zinc-300 text-lg md:text-xl font-medium mb-12 max-w-2xl'>
          Direct Access. Real Competition. Real Opportunity.
        </p>
        {/* 3. Info Data Pills */}
        <div className='flex flex-wrap gap-3 mb-12'>
          <div className='flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/5 px-5 py-3 rounded-full'>
            <MapPin size={16} className='text-[#a3ff00]' />
            <span className='text-xs font-bold text-zinc-100 uppercase tracking-widest'>
              {tourPackage?.location}
            </span>
          </div>

          <div className='flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/5 px-5 py-3 rounded-full'>
            <Calendar size={16} className='text-[#a3ff00]' />
            <span className='text-xs font-bold text-zinc-100 uppercase tracking-widest'>
              {tourPackage?.tourDates}
            </span>
          </div>

          <div className='flex items-center gap-3 bg-[#a3ff00]/5 border border-[#a3ff00]/20 px-5 py-3 rounded-full'>
            <span className='text-xs font-black text-[#a3ff00] uppercase tracking-widest'>
              {tourPackage?.currency || 'NGN'}{' '}
              {tourPackage?.costNumeric?.toLocaleString()} / person
            </span>
          </div>
        </div>
        {/* 4. Action Buttons */}
        <div className='flex flex-wrap items-center gap-6'>
          <motion.a
            href='#apply'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='bg-[#a3ff00] text-black px-8 py-4 rounded-full font-black uppercase text-sm flex items-center gap-3 shadow-xl shadow-[#a3ff00]/20'
          >
            <ArrowRight size={18} />
            Apply Now
          </motion.a>

          {tourPackage?.brochureUrl && (
            <button
              onClick={() => setBrochureModalOpen(true)}
              className='flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest hover:text-[#a3ff00] transition-colors group'
            >
              <Download
                size={18}
                className='text-zinc-400 group-hover:text-[#a3ff00]'
              />
              <span>Download Brochure</span>
            </button>
          )}
          <DownloadBrochureModal
            isOpen={brochureModalOpen}
            onClose={() => setBrochureModalOpen(false)}
            packageName={tourPackage?.name || ''}
            programId={programId}
          />
        </div>
      </div>

      {/* Decorative Glow for "Lighting" effect from the screenshot */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#a3ff00]/10 blur-[120px] pointer-events-none z-0' />
    </section>
  )
}
