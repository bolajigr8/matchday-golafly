import { VipSectionHead } from './section-head'

/* Figma: "Why Golafly VIP" (352:2618). Top hairline, 100 / 110 padding,
   four equal cards with 24 gaps. */
const REASONS = [
  { title: 'Hospitality seats', body: 'Every package starts with a VIP hospitality ticket for a home match.' },
  { title: 'Tickets first', body: 'We secure your match tickets first, then book your flight, hotel and eSIM.' },
  { title: '150% guarantee', body: 'Every order is protected by Golafly’s 150% order guarantee.' },
  { title: 'Premium travel', body: 'Business or First Class flights and a 4 or 5 star hotel in the city.' },
]

export function VipWhy() {
  return (
    <section
      aria-labelledby='vip-why-title'
      className='border-t border-vip-line/8 bg-vip-ink pb-20 pt-16 sm:pt-24 xl:pb-[110px] xl:pt-[100px]'
    >
      <div className='page-container flex flex-col gap-10 xl:gap-12'>
        <VipSectionHead
          id='vip-why-title'
          eyebrow='WHY GOLAFLY VIP'
          line1='QUIET LUXURY.'
          line2='ZERO HASSLE.'
        />
        <ol className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {REASONS.map((r, i) => (
            <li
              key={r.title}
              className='flex flex-col gap-3.5 rounded-[20px] border border-vip-line/8 bg-vip-card p-7'
            >
              <span className='font-display text-[45px] leading-[42px] text-vip-gold-text'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className='text-[19px] font-bold leading-[normal] text-vip-fg'>{r.title}</p>
              <p className='text-[15px] leading-[23px] text-vip-muted'>{r.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
