import type { VipEventView } from '@/features/vip/clubs'
import { VipCrest } from '@/components/vip/crest'
import { formatVipMediumDate, formatVipPrice, formatVipTime } from '@/features/vip/format'

/* Seats → "Match header" (Figma 506:3569): crests, title with gold "VIP
   Hospitality", intro, mono match line, then the From pill and trust chips. */
const CHIPS = ['🛡  150% order guarantee', '✓  Business or First Class flights', '✓  Secure checkout']

export function VipMatchBanner({ match }: { match: VipEventView }) {
  const line = [formatVipMediumDate(match.date), `${formatVipTime(match.date)} local time`, `${match.venue}, ${match.city}`]
    .join('  ·  ')
    .toUpperCase()

  return (
    <section className='flex flex-col gap-[18px] rounded-[22px] border border-vip-gold/25 bg-linear-to-r from-vip-gold/10 to-vip-line/2 to-60% p-5 sm:p-7'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6'>
        <div
          aria-label={`${match.home} vs ${match.away}`}
          className='flex w-fit shrink-0 items-center gap-2.5 rounded-2xl bg-vip-line/4 px-[18px] py-4'
        >
          <VipCrest ring name={match.home} src={match.homeCrest} className='size-12 sm:size-16' />
          <span className='text-[13px] leading-[normal] text-vip-mist'>vs</span>
          <VipCrest ring name={match.away} src={match.awayCrest} className='size-12 sm:size-16' />
        </div>
        <div className='flex min-w-0 flex-col gap-2'>
          <h1 className='font-heading text-[26px] font-bold leading-[1.15] text-vip-chalk sm:text-[34px]'>
            {match.home} vs {match.away} <span className='text-vip-gold-text'>VIP Hospitality</span>
          </h1>
          <p className='text-[15px] leading-[normal] text-vip-mist'>
            Choose your hospitality ticket. Your flight, hotel and eSIM come next.
          </p>
          <p className='font-mono text-[11px] leading-[normal] tracking-[1.1px] text-vip-gold-text sm:whitespace-pre'>
            {line}
          </p>
        </div>
      </div>
      <ul className='flex flex-wrap items-center gap-2.5'>
        {match.priceFrom && (
          <li className='flex items-center gap-2 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-4 py-[9px] text-[#111111]'>
            <span className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.05px]'>FROM</span>
            <span className='font-heading text-[18px] font-bold leading-[normal]'>
              {formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)}
            </span>
          </li>
        )}
        {CHIPS.map((c) => (
          <li
            key={c}
            className='whitespace-pre rounded-full border border-vip-line/12 bg-vip-tint/4 px-3 py-[7px] text-[12.5px] font-medium leading-[normal] text-vip-chalk'
          >
            {c}
          </li>
        ))}
      </ul>
    </section>
  )
}
