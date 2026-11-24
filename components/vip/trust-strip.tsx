/* Figma: VIP Hospitality (Desktop) → Trust strip (346:2561).
 *
 * Three 362px columns, centred as a group (x=176 on 1440), each with a left
 * hairline and no right one. Below md they stack with a top hairline. */

const ITEMS = [
  { title: '150% order guarantee', body: 'Book with complete confidence' },
  { title: 'Business or First Class', body: 'On every leg of your flight' },
  { title: 'One payment', body: 'Tickets, flight, hotel and eSIM' },
]

export function VipTrustStrip() {
  return (
    <section
      aria-label='Why book VIP with Golafly'
      className='border-y border-vip-line/8 bg-vip-ink'
    >
      <ul className='mx-auto grid max-w-[1087px] grid-cols-1 md:grid-cols-3'>
        {ITEMS.map((item) => (
          <li
            key={item.title}
            className='flex flex-col justify-center gap-1 border-vip-line/8 px-6 py-5 not-first:border-t md:h-[108px] md:border-l md:py-0 md:not-first:border-t-0'
          >
            <p className='flex items-center gap-2.5 text-[16px] font-semibold leading-[normal] text-vip-fg'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='/figma/vip/dot-gold.svg'
                alt=''
                width={6}
                height={6}
                className='size-1.5 shrink-0'
              />
              {item.title}
            </p>
            <p className='text-[14px] leading-[normal] text-vip-muted'>
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
