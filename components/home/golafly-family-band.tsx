'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { golaflyProduct, type GolaflyProductKey } from '@/store/ecosystem'
import { SectionHead } from './section-head'

/* "For players" band: introduces the rest of the Golafly family — Academy
   (not launched: "Soon" chip, never a link) and the Scouting Camp, which is
   Golafly's tryouts product (trials in front of clubs and scouts).
   Names, taglines and links come from store/ecosystem.ts. Full-bleed, on a
   faint tint with the fine stadium grid so it reads as a change of scene
   from the fan-facing sections around it. */

type FamilyKey = Extract<GolaflyProductKey, 'academy' | 'camp'>

const FAMILY: { key: FamilyKey; cta: string }[] = [
  { key: 'academy', cta: 'Launching soon' },
  { key: 'camp', cta: 'Explore the camp' },
]

function Crest({ product }: { product: FamilyKey }) {
  if (product === 'academy') {
    return (
      <Image
        src='/brand/golafly-academy-crest.svg'
        alt=''
        width={100}
        height={116}
        unoptimized
        className='h-[72px] w-auto'
      />
    )
  }
  return (
    <Image
      src='/brand/golafly-scouting-camp.png'
      alt=''
      width={256}
      height={256}
      className='size-[72px]'
    />
  )
}

export function GolaflyFamilyBand() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby='golafly-family-title'
      className='relative isolate overflow-hidden border-y border-border bg-muted/45 dark:bg-card/40'
    >
      <div aria-hidden className='bg-grid-fine grid-fade pointer-events-none absolute inset-0 -z-10' />

      <div className='page-container py-20 sm:py-24 lg:py-28'>
        <SectionHead
          align='left'
          titleId='golafly-family-title'
          eyebrow='For players'
          title='Play the game, not just watch it.'
          subtitle='Golafly opens doors on the pitch too: train abroad, or trial in front of professional clubs and scouts.'
        />

        <ul className='mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:gap-6'>
          {FAMILY.map(({ key, cta }, i) => {
            const product = golaflyProduct(key)
            const live = !!product.href && product.status !== 'soon'

            const body: ReactNode = (
              <>
                <div className='flex items-start justify-between gap-3'>
                  <Crest product={key} />
                  {!live && (
                    <span className='rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground'>
                      Soon
                    </span>
                  )}
                </div>
                <h3 className='mt-8 font-heading text-[20px] font-semibold tracking-[-0.01em] text-foreground'>
                  {product.fullName}
                </h3>
                <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>
                  {product.tagline}.{product.description && ` ${product.description}`}
                </p>
                <p
                  className={cn(
                    'mt-auto inline-flex items-center gap-1.5 pt-8 text-[14px] font-semibold',
                    live ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {cta}
                  {live && (
                    <ArrowRight
                      aria-hidden
                      className='size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none'
                    />
                  )}
                </p>
              </>
            )

            const shell =
              'flex h-full flex-col rounded-[20px] border border-border bg-card p-6 lg:p-8'

            return (
              <motion.li
                key={key}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {live ? (
                  <Link
                    href={product.href as string}
                    className={cn(
                      shell,
                      'group transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--lift-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                    )}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={shell}>{body}</div>
                )}
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
