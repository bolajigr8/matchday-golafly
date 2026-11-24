'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

const TRUST = [
  'Hospitality packages',
  'Best seat guarantees',
  '24/7 concierge support',
]

export function MatchCta({
  onCheckAvailability,
}: {
  onCheckAvailability?: () => void
}) {
  return (
    <section
      id='apply'
      className='relative overflow-hidden bg-gradient-to-b from-muted/40 to-background py-24 text-center'
    >
      {/* Neon glow */}
      <div className='pointer-events-none absolute left-1/2 top-[-120px] size-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(183,255,0,0.12),transparent_65%)]' />

      <motion.div
        className='relative z-10 mx-auto max-w-2xl px-5 sm:px-6'
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <p className='mb-3.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
          <span aria-hidden>●</span> Experience it live
        </p>
        <h2 className='mb-4 font-heading text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-6xl'>
          Feel the pressure
          <br />
          of{' '}
          <span className='text-brand-text dark:[text-shadow:0_0_14px_var(--brand-glow)]'>
            big matches
          </span>
        </h2>
        <p className='mb-7 text-base leading-relaxed text-muted-foreground'>
          From the Champions league to your favourite local derby — premium
          hospitality and travel packages available now.
        </p>
        <button
          type='button'
          onClick={onCheckAvailability}
          className='mb-7 inline-flex items-center gap-2 rounded-full bg-primary px-9 py-4 font-heading text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_28px_rgba(183,255,0,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(183,255,0,0.65)]'
        >
          Check Availability{' '}
          <ArrowRight className='size-3.5' strokeWidth={2.5} />
        </button>
        <div className='flex flex-wrap justify-center gap-6'>
          {TRUST.map((t) => (
            <span
              key={t}
              className='inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground'
            >
              <Check className='size-3 text-brand-text' strokeWidth={3} />
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
