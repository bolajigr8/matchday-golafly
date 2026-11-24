'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <motion.section
      className='relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-10 sm:py-20'
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Soft radial brand glow */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(60% 70% at 50% 100%, color-mix(in oklch, var(--brand) 22%, transparent), transparent 70%)',
        }}
      />

      <div className='relative z-10 mx-auto max-w-2xl space-y-5'>
        <p className='inline-flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest text-primary sm:text-xs'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary' />
          Make a day of it
        </p>
        <h2 className='text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl'>
          Build your matchday <br className='hidden sm:block' />
          around a tour
        </h2>
        <p className='mx-auto max-w-lg text-sm text-muted-foreground sm:text-base'>
          Pair a stadium tour with tickets, hospitality and travel — all in one
          booking with the Golafly matchday builder.
        </p>
        <motion.div
          className='pt-2'
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href='/matches'
            className='inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:shadow-[0_0_22px_rgba(183,255,0,0.5)]'
          >
            <ArrowRight className='h-4 w-4' strokeWidth={2.5} />
            Explore matchdays
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
