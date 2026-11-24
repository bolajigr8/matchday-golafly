'use client'

import { BadgeCheck, Plane, Search, Ticket } from 'lucide-react'
import { useLandingScope } from '@/features/landing/scope'

/* Four steps, no links. Plain copy that matches what the booking flow does:
   pick a match → choose seats → optional extras → confirmed. */

const STEPS = [
  {
    icon: Search,
    title: 'Pick your match',
    text: 'Browse every fixture or search by team, city or date.',
  },
  {
    icon: Ticket,
    title: 'Choose your seats',
    text: 'Tell us how many tickets you need and pick the category and stand.',
  },
  {
    icon: Plane,
    title: 'Add your trip',
    text: 'Optionally add flights, a stay and an eSIM before you pay.',
  },
  {
    icon: BadgeCheck,
    title: 'Pay once, you’re set',
    text: 'One checkout, one confirmation, covered by our 150% order guarantee.',
  },
]

export function LandingHowItWorks() {
  const scope = useLandingScope()

  return (
    <section
      id='how-it-works'
      aria-labelledby='landing-how-title'
      className='scroll-mt-24 bg-background py-16 sm:py-20'
    >
      <div className='page-container'>
        <div className='mb-10 text-center'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
            How it works
          </p>
          <h2
            id='landing-how-title'
            className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'
          >
            {scope ? `${scope.site.name} tickets` : 'Tickets'} in four steps
          </h2>
        </div>

        <ol className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className='relative rounded-2xl border border-border bg-card p-6'
            >
              <span className='mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-brand-text'>
                <Icon aria-hidden className='size-5' strokeWidth={2} />
              </span>
              <span className='absolute right-5 top-5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground'>
                0{i + 1}
              </span>
              <h3 className='font-heading text-[15px] font-bold uppercase tracking-wide text-foreground'>
                {title}
              </h3>
              <p className='mt-2 text-[13px] leading-relaxed text-muted-foreground'>
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
