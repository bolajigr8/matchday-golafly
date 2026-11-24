import { ArrowRight } from 'lucide-react'
import { CONTACT } from '@/store/data'
import { VipCrowdVideo } from './crowd-video'

/* Figma: "Concierge CTA" (352:2644). 420px band: the crowd loop under a
   78% dark wash, centred copy (Figma y=116.5) and two buttons. */
export function VipConciergeCta() {
  const tel = `tel:${CONTACT.phone.replace(/\s+/g, '')}`

  return (
    <section
      aria-labelledby='vip-cta-title'
      className='dark relative isolate flex min-h-[420px] items-center justify-center overflow-hidden bg-vip-ink py-16 xl:pb-4 xl:pt-0'
    >
      <VipCrowdVideo className='absolute inset-0 -z-10' />
      <div className='absolute inset-0 -z-10 bg-[rgba(5,5,5,0.78)]' />

      <div className='page-container flex flex-col items-center gap-6 text-center'>
        <p className='flex items-center gap-3 font-mono text-[11px] font-medium leading-[normal] tracking-[2.2px] text-vip-gold-text sm:text-[13px] sm:tracking-[2.86px]'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/figma/vip/dot-gold.svg' alt='' width={7} height={7} className='size-[7px] shrink-0' />
          TALK TO OUR TEAM
        </p>
        <h2
          id='vip-cta-title'
          className='font-heading text-[32px] font-bold leading-[0.96] tracking-[-0.02em] text-vip-fg sm:text-[44px] xl:text-[52px]'
        >
          PREFER TO PLAN IT TOGETHER?
        </h2>
        <div className='flex flex-wrap justify-center gap-3.5'>
          <a
            href={CONTACT.whatsapp}
            target='_blank'
            rel='noopener noreferrer'
            className='flex h-14 items-center justify-center gap-2.5 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold-deep px-[30px] font-semibold leading-[normal] text-vip-gold-ink transition-[filter] hover:brightness-105'
          >
            <span className='text-[16px]'>Chat on WhatsApp</span>
            <ArrowRight aria-hidden className='size-[17px]' />
          </a>
          <a
            href={tel}
            className='flex h-14 items-center justify-center rounded-full border border-vip-line/25 px-[30px] text-[16px] font-semibold leading-[normal] text-vip-fg transition-colors hover:border-vip-line/50'
          >
            Call us
          </a>
        </div>
      </div>
    </section>
  )
}
