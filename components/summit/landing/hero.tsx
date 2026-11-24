'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CONTACT } from '@/store/data'
import { getEarlyBirdEnds, getSummitEvents } from '@/features/summit/api'
import { summitLandingHref, summitStepHref } from '@/features/summit/routes'
import type { SummitEventKey } from '@/features/summit/types'
import { SummitBadge } from '../badge'
import { SummitCountdown } from '../countdown'
import { SummitSeal } from '../seal'
import { WfsButton, WfsButtonLink, wfsButtonClass } from '../ui'

/* Figma "WFS · Hero (event switcher)": Event=London / Event=Riyadh.
   London is on sale (ticket CTA + early-bird countdown); Riyadh has no dates
   yet, so it offers the waiting list instead. The tab also lives in the URL
   (?event=riyadh) so a link can open on either city. */
export function SummitHero({ initialEvent }: { initialEvent: SummitEventKey }) {
  const router = useRouter()
  const events = getSummitEvents()
  const [key, setKey] = useState<SummitEventKey>(initialEvent)
  const event = events.find((e) => e.key === key) ?? events[0]

  const choose = (next: SummitEventKey) => {
    setKey(next)
    router.replace(summitLandingHref(next), { scroll: false })
  }

  const notifyHref = `${CONTACT.whatsapp}?text=${encodeURIComponent('Hi Golafly, please add me to the World Football Summit Riyadh list.')}`

  return (
    <section id='events' className='relative scroll-mt-28 overflow-hidden bg-wfs-ink text-white'>
      <Image src='/figma/summit/hero-crowd.gif' alt='' fill priority unoptimized sizes='100vw' className='object-cover' />
      <div
        aria-hidden
        className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,6,0)_0%,rgba(5,6,6,0)_70%,rgba(5,6,6,0.9)_100%),linear-gradient(90deg,rgba(5,6,6,0.96)_0%,rgba(5,6,6,0.78)_55%,rgba(5,6,6,0.45)_100%)]'
      />

      <div className='page-container relative flex flex-col pb-14 pt-12 lg:min-h-[860px] lg:pb-[72px] lg:pt-[112px]'>
        <div className='flex max-w-[760px] flex-col gap-7'>
          {/* Event tabs */}
          <div role='tablist' aria-label='Summit city' className='flex w-fit max-w-full gap-1.5 rounded-full border border-white/14 bg-white/8 p-[5px]'>
            {events.map((e) => {
              const active = e.key === key
              return (
                <button
                  key={e.key}
                  type='button'
                  role='tab'
                  aria-selected={active}
                  onClick={() => choose(e.key)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime',
                    active ? 'bg-wfs-lime text-wfs-on-lime' : 'text-white hover:bg-white/8',
                  )}
                >
                  <span className='font-display text-[20px] leading-[1.2]'>{e.city}</span>
                  <span
                    className={cn(
                      'whitespace-nowrap font-mono text-[9.5px] font-medium leading-[normal] tracking-[0.95px]',
                      active ? 'text-wfs-on-lime' : 'text-wfs-on-ink-muted',
                    )}
                  >
                    {e.status}
                  </span>
                </button>
              )
            })}
          </div>

          <div className='flex flex-col'>
            <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[3.6px] sm:text-[15px] sm:tracking-[4.5px]'>
              WORLD FOOTBALL SUMMIT
            </p>
            <h1 className='font-display text-[88px] leading-[0.84] min-[420px]:text-[104px] sm:text-[160px] xl:text-[220px]'>
              {event.city} <span className='text-wfs-lime'>{event.year}</span>
            </h1>
          </div>

          <dl className='flex flex-wrap items-start gap-x-7 gap-y-4'>
            {[
              ['WHEN', event.when],
              ['WHERE', event.where],
            ].map(([label, value]) => (
              <div key={label} className='flex flex-col gap-1'>
                <dt className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.47px] text-wfs-on-ink-muted'>{label}</dt>
                <dd className='text-[17px] font-semibold leading-[normal]'>{value}</dd>
              </div>
            ))}
          </dl>

          <p className='max-w-[600px] text-[16px] leading-[1.55] text-wfs-on-ink-body sm:text-[17px] sm:leading-[26.3px]'>{event.heroSub}</p>

          <div className='flex flex-wrap items-center gap-3'>
            {event.onSale ? (
              <>
                <WfsButtonLink href={summitStepHref(event.key, 'ticket')} arrow>
                  Get your ticket
                </WfsButtonLink>
                <a href='#tickets' className={wfsButtonClass('ghostDark')}>
                  See what&apos;s included
                </a>
              </>
            ) : (
              <>
                <a href={notifyHref} target='_blank' rel='noopener noreferrer' className={wfsButtonClass('lime')}>
                  <span>Notify me first</span>
                  <ArrowRight aria-hidden className='size-[15px] shrink-0 transition-transform duration-200 group-hover/btn:translate-x-1.5' strokeWidth={2.4} />
                </a>
                <WfsButton variant='ghostDark' onClick={() => choose('london')}>
                  See London tickets
                </WfsButton>
              </>
            )}
          </div>

          {/* Early bird / dates box */}
          <div className='flex w-fit max-w-full flex-wrap items-center gap-[18px] rounded-[18px] border border-white/12 bg-white/6 px-[18px] py-3.5'>
            {event.onSale ? (
              <>
                <div className='flex flex-col gap-1'>
                  <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.54px] text-wfs-lime'>EARLY BIRD · £550</span>
                  <span className='text-[13px] leading-[18.2px] text-wfs-on-ink-body'>
                    Price goes up to £750
                    <br />
                    on 11 December
                  </span>
                </div>
                <SummitCountdown endsAt={getEarlyBirdEnds()} />
              </>
            ) : (
              <div className='flex flex-col gap-1 py-2'>
                <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.54px] text-[#ffc24b]'>DATES · TO BE ANNOUNCED</span>
                <span className='text-[13px] leading-[18.2px] text-wfs-on-ink-body'>
                  WFS will confirm Riyadh dates soon.
                  <br />
                  We message the list first, on WhatsApp.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badge + seal: beside the copy on desktop, under it on smaller screens */}
        <div className='relative mx-auto mt-10 lg:absolute lg:right-6 lg:top-[-40px] lg:mt-0 xl:right-[-5px] xl:top-[-56px]'>
          <SummitBadge line={event.badgeLine} foot={event.badgeFoot} airport={event.airport} className='hidden xl:block' />
          <SummitBadge line={event.badgeLine} foot={event.badgeFoot} airport={event.airport} scale={0.78} className='hidden lg:block xl:hidden' />
          <SummitBadge line={event.badgeLine} foot={event.badgeFoot} airport={event.airport} scale={0.62} className='lg:hidden' />
          <SummitSeal className='absolute -left-12 bottom-[-40px] origin-bottom-left scale-[0.62] lg:-left-[78px] lg:bottom-[-70px] lg:scale-[0.78] xl:-left-[100px] xl:bottom-[-121px] xl:scale-100' />
        </div>
      </div>
    </section>
  )
}
