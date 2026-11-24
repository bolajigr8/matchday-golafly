'use client'

import { BedDouble, Plane, Smartphone } from 'lucide-react'

/* A short note that the same checkout can also take flights, a stay and an
   eSIM. Information only, no links: they are added inside the booking. */

const EXTRAS = [
  {
    icon: Plane,
    title: 'Flights',
    text: 'Search and add your flights while you book your seats.',
  },
  {
    icon: BedDouble,
    title: 'Stays',
    text: 'Find a hotel near the stadium and pay for it in the same checkout.',
  },
  {
    icon: Smartphone,
    title: 'eSIM',
    text: 'Land with data already sorted: add a travel eSIM in one tap.',
  },
]

export function LandingTripExtras() {
  return (
    <section
      id='trip'
      aria-labelledby='landing-trip-title'
      className='scroll-mt-24 border-y border-border bg-muted/40 py-16 sm:py-20'
    >
      <div className='page-container'>
        <div className='mb-10 text-center'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text'>
            Make it a trip
          </p>
          <h2
            id='landing-trip-title'
            className='font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'
          >
            Your whole matchday, one checkout
          </h2>
          <p className='mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground'>
            After you choose your seats you can add the rest of the trip. It’s
            optional, and you pay for everything once.
          </p>
        </div>

        <ul className='grid gap-4 md:grid-cols-3'>
          {EXTRAS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className='flex items-start gap-4 rounded-2xl border border-border bg-card p-6'
            >
              <span className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-brand-text'>
                <Icon aria-hidden className='size-5' strokeWidth={2} />
              </span>
              <div>
                <h3 className='font-heading text-[15px] font-bold uppercase tracking-wide text-foreground'>
                  {title}
                </h3>
                <p className='mt-1.5 text-[13px] leading-relaxed text-muted-foreground'>
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
