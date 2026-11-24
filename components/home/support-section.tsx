'use client'

// FAQ preview + 24/7 support, closing the home page.
//
// ⚠ FLAGGED: the questions come from `FAQ_CATEGORIES` in store/faqs.ts,
// this app's existing static FAQ content (also used, unchanged, on
// /help-faqs). It is not backend-driven — there's no FAQ API in this
// codebase — but it's not new invented content either; this section just
// surfaces a handful of questions from the same source of truth and links
// to /help-faqs for the full list. Contact details come from CONTACT in
// store/data.ts.

import { useId, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Mail, MessageCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FAQ_CATEGORIES, type FaqItem } from '@/store/faqs'
import { CONTACT } from '@/store/data'
import { SectionHead } from './section-head'

/** [category id, question index] — the questions buyers ask first. Missing
 *  picks (if the FAQ content changes) are simply skipped. */
const PICKS: [string, number][] = [
  ['tickets', 0],
  ['tickets', 1],
  ['tickets', 3],
  ['payments', 3],
  ['cancellations', 1],
]

const TOP_FAQS: FaqItem[] = PICKS.map(
  ([id, i]) => FAQ_CATEGORIES.find((c) => c.id === id)?.items[i],
).filter((item): item is FaqItem => !!item)

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function SupportSection() {
  const reduce = useReducedMotion()
  const baseId = useId()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      aria-labelledby='faq-title'
      className='grid gap-12 lg:grid-cols-12 lg:gap-16'
    >
      <div className='lg:col-span-5'>
        <div className='lg:sticky lg:top-[calc(7rem+var(--bf-bar-h,0px))]'>
          <SectionHead
            align='left'
            titleId='faq-title'
            eyebrow='Help centre'
            title='Questions, answered.'
            subtitle='Straight answers on tickets, delivery and payments. Still stuck? Our support team is on hand 24/7.'
          />

          <Link
            href='/help-faqs'
            className={cn(
              'group mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-foreground/15 px-5 text-[14px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background',
              FOCUS_RING,
            )}
          >
            Visit help centre
            <ArrowRight
              aria-hidden
              className='size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none'
            />
          </Link>

          <div className='mt-10 rounded-[20px] border border-border bg-card p-5 sm:p-6'>
            <p className='font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground'>
              Talk to us
            </p>
            <ul className='mt-4 space-y-1'>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className={cn(
                    '-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-medium text-foreground transition-colors duration-200 hover:bg-muted',
                    FOCUS_RING,
                  )}
                >
                  <span
                    aria-hidden
                    className='flex size-9 items-center justify-center rounded-full bg-muted text-foreground'
                  >
                    <Mail className='size-4' />
                  </span>
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.whatsapp}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn(
                    '-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-medium text-foreground transition-colors duration-200 hover:bg-muted',
                    FOCUS_RING,
                  )}
                >
                  <span
                    aria-hidden
                    className='flex size-9 items-center justify-center rounded-full bg-muted text-foreground'
                  >
                    <MessageCircle className='size-4' />
                  </span>
                  Chat on WhatsApp
                  <ArrowUpRight aria-hidden className='size-4 text-muted-foreground' />
                  <span className='sr-only'> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className='lg:col-span-7'>
        <ul className='border-t border-border'>
          {TOP_FAQS.map((item, i) => {
            const isOpen = open === i
            const buttonId = `${baseId}-q${i}`
            const panelId = `${baseId}-a${i}`
            return (
              <li key={item.q} className='border-b border-border'>
                <h3>
                  <button
                    id={buttonId}
                    type='button'
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={cn(
                      'group flex w-full items-center justify-between gap-6 rounded-sm py-5 text-left sm:py-6',
                      FOCUS_RING,
                    )}
                  >
                    <span className='font-heading text-[16px] font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-[18px]'>
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                        isOpen
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground group-hover:border-foreground/40',
                      )}
                    >
                      <Plus
                        className={cn(
                          'size-4 transition-transform duration-200 motion-reduce:transition-none',
                          isOpen && 'rotate-45',
                        )}
                      />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role='region'
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className='overflow-hidden'
                    >
                      <p className='max-w-2xl pr-12 pb-6 text-[15px] leading-relaxed text-muted-foreground'>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
