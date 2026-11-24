import { cn } from '@/lib/utils'
import { VipButtonLink } from '@/components/vip/flow/button'
import { VipEyebrow } from '@/components/vip/flow/eyebrow'

/* "Build your VIP matchday in 4 steps" (Figma 504:3077), shared by the
   landing page and the match page. The steps follow the backend's own
   order: the match ticket first, then the trip, one payment, and the
   ticket is secured before the flight, hotel and eSIM are booked. */
const STEPS = [
  { title: 'Pick seats', body: 'Choose a VIP hospitality ticket for the match and how many of you are going.' },
  { title: 'Add your trip', body: 'A Business or First Class flight, a 4 or 5 star hotel, and an eSIM if you want one.' },
  { title: 'Checkout', body: 'Traveller details once, then one secure payment for everything.' },
  {
    title: 'Booked for you',
    body: 'We secure your match tickets first, then book your flight, hotel and eSIM. Each confirmation arrives by email.',
  },
]

export function VipHowItWorks({
  cta,
  className,
}: {
  /** Optional button under the steps. */
  cta?: { href: string; label: string }
  className?: string
}) {
  return (
    <section
      aria-labelledby='vip-steps-title'
      className={cn('page-container flex flex-col gap-9 pb-20 pt-20 lg:pb-[110px] lg:pt-24', className)}
    >
      <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
        <div className='flex flex-col gap-3.5'>
          <VipEyebrow>MATCHDAY BUILDER</VipEyebrow>
          <h2
            id='vip-steps-title'
            className='font-heading text-[32px] font-bold uppercase leading-none text-vip-chalk sm:text-[48px]'
          >
            Build your VIP matchday
            <br />
            in 4 steps.
          </h2>
        </div>
        <p className='text-[16px] leading-[normal] text-vip-mist'>One booking. One payment.</p>
      </div>
      <ol className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={cn(
              'flex flex-col gap-3 rounded-[18px] border bg-vip-tint/3 p-6',
              i === 0 ? 'border-vip-gold/50' : 'border-vip-line/8',
            )}
          >
            <span className='font-mono text-[12px] font-medium leading-[normal] text-vip-gold-text'>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className='font-heading text-[22px] font-bold leading-[normal] text-vip-chalk'>{s.title}</span>
            <span className='text-[14px] leading-[normal] text-vip-mist'>{s.body}</span>
          </li>
        ))}
      </ol>
      {cta && (
        <VipButtonLink href={cta.href} arrow className='w-fit'>
          {cta.label}
        </VipButtonLink>
      )}
    </section>
  )
}
