'use client'

import { ChevronDown } from 'lucide-react'
import { FAQ_CATEGORIES } from '@/store/faqs'

/* Ticket questions, taken word for word from the site's own Help & FAQs
   (store/faqs.ts), so a landing page never promises anything the main site
   doesn't. To change which questions show, edit the QUESTIONS list: each
   entry is matched against the start of a question in store/faqs.ts.
   <details> keeps it working without JavaScript. */

const QUESTIONS = [
  'Are match tickets guaranteed and authentic?',
  'When will I receive my tickets?',
  'Can I choose where I sit?',
  'Can I book tickets, hotel and flights together?',
  'What happens if the match is rescheduled or postponed?',
  'Is my payment secure?',
]

export function LandingFaq() {
  const all = FAQ_CATEGORIES.flatMap((c) => c.items)
  const items = QUESTIONS.map((q) => all.find((i) => i.q.startsWith(q))).filter(
    (i): i is (typeof all)[number] => !!i,
  )
  if (items.length === 0) return null

  return (
    <section
      id='faq'
      aria-labelledby='landing-faq-title'
      className='scroll-mt-24 bg-background py-16 sm:py-20'
    >
      <div className='mx-auto max-w-3xl px-5 sm:px-6'>
        <div className='mb-8 text-center'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
            Good to know
          </p>
          <h2
            id='landing-faq-title'
            className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'
          >
            Questions, answered
          </h2>
        </div>

        <div className='divide-y divide-border rounded-2xl border border-border bg-card'>
          {items.map((item) => (
            <details key={item.q} className='group px-5 py-4 sm:px-6'>
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden'>
                {item.q}
                <ChevronDown
                  aria-hidden
                  className='size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180'
                />
              </summary>
              <p className='mt-3 text-[14px] leading-relaxed text-muted-foreground'>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
