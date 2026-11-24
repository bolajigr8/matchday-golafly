'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import React from 'react'
import { SafeImage } from '@/components/shared/safe-image'
import { PillarBadge } from '@/components/brand/pillar-badge'
import type { Pillar } from '@/lib/pillar-intro'

export default function ReusableHero({
  actions,
  pillar,
  tags = [],
  title,
  bottomNav = [],
  stats = [],
  description,
  src,
}: {
  actions: React.ReactElement
  /** Shows the pillar badge in place of `tags`. */
  pillar?: Pillar
  tags?: string[]
  title: React.ReactElement
  bottomNav?: { label: string; route: string }[]
  stats?: { value: string; label: string }[]
  description: string
  src?: string
}) {
  /* `dark` on the root: this hero is always a photo under a black overlay, so
     it stays in the dark theme whatever the site theme is. Titles passed in
     (e.g. `text-[#1A1C19] dark:text-white`) and buttons with `dark:` styles
     then render white on the image in light mode too, and the theme tokens
     inside take their dark values. */
  return (
    <div className='dark relative md:min-h-screen w-full overflow-x-hidden bg-black text-white selection:bg-[#a3ff00] selection:text-black'>
      <main className='relative min-h-[90vh] md:min-h-screen w-full flex flex-col justify-center overflow-hidden'>
        {/* Background Image — falls back to a bundled placeholder if `src` is missing/broken */}
        <div className='absolute inset-0 z-0 scale-105'>
          <SafeImage src={src} alt='' fill priority className='object-cover' />
        </div>

        {/* Main Dark/Green Overlay */}
        {src && (
          <div
            className='absolute inset-0 z-10'
            style={{
              background: `
              linear-gradient(
                90deg,
                rgba(0,0,0,0.96) 0%,
                rgba(5,15,5,0.92) 18%,
                rgba(15,40,10,0.78) 38%,
                rgba(35,90,15,0.38) 62%,
                rgba(163,255,0,0.08) 100%
              )
            `,
            }}
          />
        )}

        {/* Neon Glow */}
        {src && (
          <div
            className='absolute inset-0 z-10'
            style={{
              background: `
              radial-gradient(
                circle at 78% 35%,
                rgba(163,255,0,0.30) 0%,
                rgba(163,255,0,0.12) 22%,
                transparent 55%
              )
            `,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Grid Overlay */}
        <div
          className='absolute inset-0 z-10 opacity-[0.05]'
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
          }}
        />

        {/* Diagonal Slashes */}
        <div className='absolute inset-0 z-10 overflow-hidden pointer-events-none'>
          <svg
            viewBox='0 0 1440 900'
            preserveAspectRatio='none'
            className='w-full h-full'
          >
            <path
              d='M-40,220 L360,60 L400,90 L0,280 Z'
              fill='#a3ff00'
              opacity='.10'
            />
            <path
              d='M-40,320 L460,90 L480,110 L-10,360 Z'
              fill='#a3ff00'
              opacity='.06'
            />
          </svg>
        </div>

        {/* Content */}
        <div className='relative z-20 container mx-auto px-6 pt-24 md:pt-32'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className='max-w-3xl'
          >
            {/* Tags */}
            <div className='flex flex-wrap gap-3 mb-6'>
              {pillar && <PillarBadge pillar={pillar} onInk />}
              {!pillar && tags.map((tag) => (
                <span
                  key={tag}
                  className='text-[10px] uppercase tracking-[0.28em] text-[#a3ff00] font-bold flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#a3ff00]/10'
                >
                  <motion.span
                    className='w-1.5 h-1.5 bg-[#a3ff00] rounded-full shadow-[0_0_8px_#a3ff00]'
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <div
              style={{ fontFamily: 'Space Grotesk' }}
              className='drop-shadow-[0_0_30px_rgba(163,255,0,0.08)]'
            >
              {title}
            </div>

            {/* Description */}
            <p className='text-zinc-300 text-sm md:text-lg max-w-xl mb-10 leading-relaxed font-medium mt-8'>
              {description}
            </p>

            {/* Actions */}
            {actions}
          </motion.div>
        </div>

        {/* Bottom Pills */}
        <div className='relative hidden md:block z-20 container mx-auto px-6 mt-auto pb-10'>
          <div className='w-full flex items-center justify-end gap-3 overflow-x-auto no-scrollbar'>
            {bottomNav.map((item) => (
              <Link
                className='px-4 py-2 border rounded-full border-white/10 bg-white/5 backdrop-blur-xl text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300 hover:text-[#a3ff00] hover:border-[#a3ff00]/40 transition-all whitespace-nowrap'
                key={item?.label}
                href={item?.route}
              >
                {item?.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Stats Footer */}
      {stats.length > 0 && (
        <footer
          style={{ fontFamily: 'Space Grotesk' }}
          className='relative z-20 border-t border-white/10 bg-black py-16'
        >
          <div className='container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12'>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className='flex flex-col gap-3'
              >
                <span className='text-5xl md:text-6xl font-black text-[#a3ff00] tracking-tighter drop-shadow-[0_0_18px_rgba(163,255,0,0.35)]'>
                  {stat.value}
                </span>
                <span className='text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-bold leading-tight'>
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </footer>
      )}
    </div>
  )
}
