import Image from 'next/image'
import { SummitGolaflyLogo } from '../logo'
import { WfsTick } from '../ui'

/* Figma "Partnership": Golafly × WFS lockup, the claim, three proof cards. */
const PROOF = [
  ['Official WFS tickets', 'Issued by World Football Summit in your name'],
  ['Same price as WFS', 'No booking fee on the ticket itself'],
  ['One person, start to finish', 'One WhatsApp chat for the whole trip'],
]

export function SummitPartnership() {
  return (
    <section className='bg-wfs-surface'>
      <div className='page-container flex flex-col items-center gap-8 pb-10 pt-16 text-center lg:gap-12 lg:pt-[120px]'>
        <div className='flex items-center gap-4'>
          <SummitGolaflyLogo className='h-12 sm:h-16' />
          <span aria-hidden className='text-[36px] leading-none text-[#b9beb6] dark:text-[#434343] sm:text-[48px]'>
            ×
          </span>
          <Image
            src='/figma/summit/wfs-logo.svg'
            alt='World Football Summit'
            width={150}
            height={68}
            unoptimized
            className='h-[52px] w-auto rounded-[14px] sm:h-[68px]'
          />
        </div>
        <div className='contents'>
          <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[2.88px] text-wfs-lime-ink'>OFFICIAL TRAVEL PARTNER</p>
          <h2 className='font-display text-[56px] leading-[0.9] text-wfs-text sm:text-[76px] lg:text-[96px]'>TWO PLATFORMS. ONE TRIP.</h2>
          <p className='max-w-[720px] text-[16px] leading-[1.6] text-wfs-muted sm:text-[18px] sm:leading-[28.8px]'>
            World Football Summit has brought football&apos;s decision makers together since 2016. Golafly gets you there: the official
            ticket, flights and hotel, booked in one place.
          </p>
        </div>
        <ul className='grid w-full gap-4 text-left md:grid-cols-3'>
          {PROOF.map(([title, text]) => (
            <li key={title} className='flex flex-col gap-2 rounded-[20px] border border-wfs-line bg-wfs-surface px-6 py-[22px]'>
              <WfsTick size={28} />
              <span className='font-heading text-[18px] font-bold leading-[normal] text-wfs-text'>{title}</span>
              <span className='text-[14px] leading-[20.3px] text-wfs-muted'>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
