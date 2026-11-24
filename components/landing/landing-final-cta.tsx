'use client'

import { ArrowRight } from 'lucide-react'
import { FIXTURES_ANCHOR, useLandingScope } from '@/features/landing/scope'

/* One last button back up to the fixtures. */

export function LandingFinalCta() {
  const scope = useLandingScope()
  if (!scope) return null

  return (
    <section
      aria-labelledby='landing-cta-title'
      className='relative overflow-hidden bg-band-ink py-20 text-center text-band-ink-fg'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-[-160px] size-[640px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]'
      />
      <div className='relative mx-auto max-w-2xl px-5 sm:px-6'>
        <h2
          id='landing-cta-title'
          className='font-heading text-3xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-5xl'
        >
          Ready for the{' '}
          <span className='text-primary'>{scope.site.name}</span>?
        </h2>
        <p className='mt-4 text-[15px] leading-relaxed text-band-ink-muted'>
          Verified sellers, a 150% order guarantee and 24/7 support.
        </p>
        <a
          href={`#${FIXTURES_ANCHOR}`}
          className='mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,scale] duration-200 hover:brightness-95 active:scale-[0.98]'
        >
          Get tickets
          <ArrowRight aria-hidden className='size-4' />
        </a>
      </div>
    </section>
  )
}
