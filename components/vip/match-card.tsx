import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipKickoff, formatVipPrice, formatVipTime } from '@/features/vip/format'
import { vipFlowHref } from '@/features/vip/routes'
import { VipCrest } from './crest'

/* Figma: "VIP · Match card · …" (358:2819 and siblings): 2px gold border,
   photo under a dark top-and-bottom gradient, the whole card is the link
   into the booking flow. Three per row on desktop (client request); the
   crests are shown like the main matches page (transparent, no ring). The
   crests and competition come from the backend event, the photo is the
   club's Figma picture. */
export function VipMatchCard({
  match,
  className,
  priority = false,
}: {
  match: VipEventView
  className?: string
  /** Load the photo eagerly (cards visible without scrolling). */
  priority?: boolean
}) {
  return (
    <Link
      href={vipFlowHref(match.club, match.eventId)}
      aria-label={`${match.home} vs ${match.away}: select match`}
      className={cn(
        'dark group relative block h-[440px] overflow-hidden rounded-3xl border-2 border-vip-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vip-gold-light',
        className,
      )}
    >
      <Image
        src={match.cardImage}
        /* Supplier stadium photos are small already; the image optimiser's
           server fetch to their CDN times out (500), so load them directly. */
        unoptimized={match.cardImage.startsWith('http')}
        alt=''
        fill
        priority={priority}
        sizes='(min-width: 1024px) 390px, (min-width: 640px) 45vw, 92vw'
        className='rounded-3xl object-cover transition-transform duration-500 group-hover:scale-105'
      />
      <div className='absolute -inset-0.5 bg-linear-to-b from-[rgba(5,5,5,0.55)] via-[rgba(5,5,5,0.2)] via-40% to-[rgba(5,5,5,0.97)]' />

      <div className='absolute inset-x-[22px] top-[22px] flex flex-wrap items-start justify-between gap-2'>
        <span className='rounded-full bg-vip-ink/60 px-3 py-1.5 font-mono text-[12px] font-medium uppercase leading-[normal] tracking-[2.64px] text-vip-fg'>
          {match.city}
        </span>
        {match.competition && (
          <span className='max-w-[60%] truncate rounded-full bg-vip-ink/60 px-3 py-1.5 font-mono text-[11px] font-medium uppercase leading-[normal] tracking-[1.4px] text-vip-gold-text'>
            {match.competition}
          </span>
        )}
      </div>

      <div className='absolute inset-x-[22px] bottom-[22px] flex flex-col items-start gap-2.5'>
        <div className='flex items-center gap-2.5'>
          <VipCrest name={match.home} src={match.homeCrest} className='size-11' />
          <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-vip-muted'>vs</span>
          <VipCrest name={match.away} src={match.awayCrest} className='size-11' />
        </div>
        <p className='font-mono text-[12px] font-medium leading-[normal] tracking-[2.64px] text-vip-gold-text'>
          {formatVipKickoff(match.date)}
        </p>
        <p className='line-clamp-1 text-[26px] font-bold leading-[32px] text-vip-fg'>{match.home}</p>
        <p className='flex min-w-0 items-center gap-2'>
          <span className='text-[17px] leading-[normal] text-vip-muted'>vs</span>
          <span className='line-clamp-1 text-[26px] font-bold leading-[32px] text-vip-fg'>{match.away}</span>
        </p>
        <p className='line-clamp-1 text-[14px] leading-[normal] text-vip-muted'>
          {match.venue}, {match.city}
        </p>
        <div className='flex w-full flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-2'>
          <div className='flex flex-col gap-0.5 leading-[normal]'>
            {match.priceFrom && (
              <>
                <span className='text-[12.5px] text-vip-muted'>Hospitality from</span>
                <span className='text-[19px] font-bold text-vip-gold-text'>
                  {formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)}{' '}
                  <span className='text-[13px] font-medium text-vip-muted'>per person</span>
                </span>
              </>
            )}
          </div>
          <span className='shrink-0 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-5 py-3 text-[14px] font-semibold leading-[normal] text-[#0a0a0a] transition-[filter] group-hover:brightness-105'>
            Select match
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── List view: the main /matches FixtureRow layout, in VIP colours ──
   ≥ lg  [date] [crest vs crest] COMPETITION                FROM €X  [Select match →]
                                 Home vs Away
                                 ⌖ Venue, City · 20:00
   sm–lg same row; a crest sits next to each team name.
   < sm  stacked, price + button under a line. */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Weekday · day · month of the local kick-off, read as written (no time zone). */
function dateParts(local: string) {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return { weekday: 'Date', day: 'TBC', month: '' }
  const [, y, mo, d] = m
  const weekday = DAYS[new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay()]
  return { weekday, day: String(Number(d)), month: MONTHS[Number(mo) - 1] }
}

function DateTile({ local }: { local: string }) {
  const p = dateParts(local)
  return (
    <div
      aria-hidden
      className='flex w-[58px] shrink-0 flex-col items-center justify-center self-stretch rounded-[14px] bg-vip-line/5 px-1 py-2 text-center sm:w-[74px] sm:self-auto sm:py-2.5'
    >
      <span className='font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-vip-mist'>{p.weekday}</span>
      <span className='mt-1 font-display text-[34px] leading-[0.9] text-vip-chalk sm:text-[44px]'>{p.day}</span>
      <span className='font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-vip-chalk/80'>{p.month}</span>
    </div>
  )
}

export function VipMatchRow({ match }: { match: VipEventView }) {
  const href = vipFlowHref(match.club, match.eventId)
  return (
    <article className='group relative flex flex-col gap-3.5 rounded-[20px] border border-vip-line/10 bg-vip-card p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-vip-gold/60 hover:shadow-[0_12px_32px_rgba(212,178,106,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:gap-5 sm:p-4 sm:pr-5'>
      <div className='flex min-w-0 flex-1 items-center gap-3.5 sm:gap-5'>
        <DateTile local={match.date} />

        {/* Crest pair, desktop only; smaller screens show a crest per line. */}
        <div aria-hidden className='hidden shrink-0 items-center gap-2 lg:flex'>
          <VipCrest name={match.home} src={match.homeCrest} className='size-11' />
          <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-vip-mist'>vs</span>
          <VipCrest name={match.away} src={match.awayCrest} className='size-11' />
        </div>

        <div className='min-w-0 flex-1'>
          {match.competition && (
            <p className='truncate font-mono text-[10.5px] uppercase tracking-[0.14em] text-vip-gold-text sm:text-[11px]'>
              {match.competition}
            </p>
          )}
          <h3 className='mt-1.5 font-heading text-[15px] font-semibold leading-snug tracking-[-0.01em] text-vip-chalk sm:text-[16px] lg:text-[17px]'>
            {/* after:inset-0 makes the whole row clickable, as on /matches. */}
            <Link
              href={href}
              className='flex flex-col gap-1 rounded-sm decoration-1 underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light lg:inline'
            >
              <span className='flex min-w-0 items-center gap-2 lg:inline'>
                <span aria-hidden className='lg:hidden'>
                  <VipCrest name={match.home} src={match.homeCrest} className='size-5' />
                </span>
                <span className='truncate lg:whitespace-normal'>{match.home}</span>
              </span>
              <span className='sr-only lg:not-sr-only lg:mx-1.5 lg:font-normal lg:text-vip-mist'> vs </span>
              <span className='flex min-w-0 items-center gap-2 lg:inline'>
                <span aria-hidden className='lg:hidden'>
                  <VipCrest name={match.away} src={match.awayCrest} className='size-5' />
                </span>
                <span className='truncate lg:whitespace-normal'>{match.away}</span>
              </span>
            </Link>
          </h3>
          <p className='mt-1.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-vip-mist sm:text-[13px]'>
            <MapPin aria-hidden className='size-3.5 shrink-0' />
            <span className='truncate'>
              {match.venue}, {match.city}
            </span>
            <span aria-hidden className='shrink-0 opacity-50'>
              ·
            </span>
            <time className='shrink-0 font-mono text-[12px]'>{formatVipTime(match.date)}</time>
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 border-t border-vip-line/10 pt-3.5 sm:shrink-0 sm:justify-end sm:gap-5 sm:border-0 sm:pt-0'>
        {match.priceFrom && (
          <div className='leading-none sm:text-right'>
            <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-vip-mist'>From · per person</p>
            <p className='mt-1.5 font-heading text-[20px] font-bold tracking-[-0.01em] text-vip-gold-text sm:text-[22px]'>
              {formatVipPrice(match.priceFrom.amount, match.priceFrom.currency)}
            </p>
          </div>
        )}
        <span className='relative inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-5 text-[13px] font-semibold text-[#0a0a0a] transition-[filter] duration-200 group-hover:brightness-105 sm:h-11 sm:px-6 sm:text-[14px]'>
          Select match
          <ArrowRight
            aria-hidden
            className='size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none'
            strokeWidth={2.25}
          />
        </span>
      </div>
    </article>
  )
}
