'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Compact step indicator for a product's own mini booking wizard
 * (e.g. Flight: Search → Results → Fare → Bags → Seats, or
 * eSIM: Search → Results → Confirm), nested inside a single builder
 * page rather than spread across separate routes.
 *
 * Deliberately a smaller sibling of components/checkout/step-progress.tsx
 * (the page-level Seats/Extras/Checkout tracker) rather than a variant of
 * it — that component's step list and sizing are fixed to the 4-step
 * builder flow, while this one is reused for two different step counts on
 * the same page. Token usage (border-border / bg-primary / text-primary-
 * foreground / text-muted-foreground) is identical on purpose so both
 * trackers read as one visual language and pick up light/dark theming for
 * free from the existing CSS variables — nothing here is hardcoded to a
 * color.
 */
export function MiniStepProgress({
  steps,
  currentStep,
}: {
  steps: readonly string[]
  /** 1-based index into `steps`. */
  currentStep: number
}) {
  return (
    <motion.div
      className='flex flex-wrap items-center gap-y-1.5'
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {steps.map((step, i) => {
        const num = i + 1
        const done = num < currentStep
        const active = num === currentStep

        return (
          <div key={step} className='flex items-center'>
            <div className='flex items-center gap-1.5'>
              <motion.span
                className={cn(
                  'flex size-[18px] shrink-0 items-center justify-center rounded-full border font-mono text-[9px] font-bold tracking-wider',
                  done && 'border-border bg-muted text-muted-foreground',
                  active &&
                    'border-brand-text bg-primary text-primary-foreground shadow-[0_0_6px_var(--brand-glow)]',
                  !done &&
                    !active &&
                    'border-muted-foreground/40 text-muted-foreground/60',
                )}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.25,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                {done ? '✓' : num}
              </motion.span>
              <span
                className={cn(
                  'font-mono text-[9px] tracking-wider sm:block',
                  active ? 'block font-bold text-brand-text' : 'hidden text-muted-foreground sm:block',
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className='mx-1.5 h-px w-4 shrink-0 bg-border sm:mx-2.5 sm:w-8' />
            )}
          </div>
        )
      })}
    </motion.div>
  )
}
