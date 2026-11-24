'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Plane, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipEventView } from '@/features/vip/clubs'
import { formatVipPrice, formatVipShortDate } from '@/features/vip/format'
import type { VipHospitalityCard } from '@/features/vip/landing'
import { useVipPrefs } from '@/features/vip/prefs'
import { vipFlowHref } from '@/features/vip/routes'
import { VipSectionHead } from './section-head'

/* Figma: "Step 4 · Complete & summary" (352:2496). Add-ons on the left,
 * the gold "Your VIP package" ticket (440px) on the right.
 *
 * Live data, nothing estimated:
 *   · the ticket line is the chosen hospitality card's real lowest price ×
 *     the hero's guests (browse price, up to 2 minutes old);
 *   · the flight line shows the chosen cabin and route and says "Priced
 *     live": flight prices only exist after a search;
 *   · the add-ons are the hotel (always in a package: Figma's "Included"
 *     style, priced live in the trip builder) and the eSIM (optional).
 *     Chauffeur, concierge and visa are not sold.
 *   · the total is "from": the tickets now, the flight (and eSIM) added
 *     at their live price. Figma's local-currency line and "pay in
 *     instalments" are left out (no backend data for them). */
export function VipCompleteTrip({
  match,
  card,
}: {
  match: VipEventView | null
  /** The hospitality card chosen above (or the cheapest). */
  card: VipHospitalityCard | null
}) {
  const [esim, setEsim] = useState(true)
  if (!match) return null

  return (
    <section aria-labelledby='vip-complete-title' className='bg-vip-ink pb-20 pt-16 sm:pt-24 xl:pb-[120px] xl:pt-[100px]'>
      <div className='page-container flex flex-col gap-10 lg:flex-row lg:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-10'>
          <VipSectionHead
            id='vip-complete-title'
            eyebrow='STEP 04 · COMPLETE THE TRIP'
            line1='EVERYTHING ELSE,'
            line2='HANDLED.'
            intro='Add the finishing touches. Everything goes into one booking and one payment.'
          />
          <ul className='flex flex-col gap-3.5'>
            <li>
              <AddonRow
                icon='hotel'
                title='4 or 5 star hotel'
                description={`In ${match.city} · your nights follow your flight · chosen in your trip builder`}
                price='Included'
                on
              />
            </li>
            <li>
              <AddonRow
                icon='esim'
                title='eSIM for Spain'
                description='Data from the moment you land · plans and prices in your trip builder'
                price='Optional'
                on={esim}
                onToggle={() => setEsim((v) => !v)}
              />
            </li>
          </ul>
        </div>

        {card && <SummaryTicket match={match} card={card} esim={esim} />}
      </div>
    </section>
  )
}

/* Figma: "VIP · Add-on · …" (408:5090 and siblings). Figma only draws the
   "on" state, so "off" drops the gold border and empties the check box. */
function AddonRow({
  icon,
  title,
  description,
  price,
  on,
  onToggle,
}: {
  icon: 'hotel' | 'esim'
  title: string
  description: string
  price: string
  on: boolean
  /** Absent = always included (Figma's "Included" rows). */
  onToggle?: () => void
}) {
  const included = !onToggle
  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={on}
      aria-disabled={included || undefined}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-[20px] border bg-vip-card py-5 pl-5 pr-6 text-left transition-colors sm:gap-[18px]',
        on ? 'border-vip-gold/45' : 'border-vip-line/8 hover:border-vip-line/20',
        included && 'cursor-default',
      )}
    >
      <span className='hidden size-[52px] shrink-0 place-items-center rounded-[14px] bg-vip-gold/12 sm:grid'>
        {icon === 'hotel' ? (
          /* Figma's hotel add-on icon; light gold, darkened in light mode. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src='/figma/vip/addon-hotel.svg' alt='' width={22} height={22} className='size-[22px] brightness-[0.55] saturate-150 dark:brightness-100 dark:saturate-100' />
        ) : (
          /* Figma has no eSIM icon: lucide's, in the add-on icon gold. */
          <Smartphone aria-hidden className='size-[22px] text-vip-gold-text' strokeWidth={1.75} />
        )}
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-1 leading-[normal]'>
        <span className='text-[17px] font-semibold text-vip-fg'>{title}</span>
        <span className='text-[14px] text-vip-muted'>{description}</span>
      </span>
      <span className='shrink-0 text-[17px] font-bold leading-[normal] text-vip-gold-text'>{price}</span>
      <span
        aria-hidden
        className={cn(
          'grid size-[26px] shrink-0 place-items-center rounded-lg text-[14px] font-bold leading-[normal] text-vip-on-gold',
          on ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep' : 'border border-vip-line/20',
        )}
      >
        {on ? '✓' : ''}
      </span>
    </button>
  )
}

function SummaryTicket({ match, card, esim }: { match: VipEventView; card: VipHospitalityCard; esim: boolean }) {
  const { origin, cabin, guests } = useVipPrefs()
  const money = (amount: number) => formatVipPrice(amount, card.currency)
  const ticketsTotal = card.price * guests
  const from = origin || 'YOU'
  const to = match.airport || match.city
  const cabinName = (cabin ?? 'first') === 'first' ? 'First Class' : 'Business Class'

  const rows: { label: string; text: string; price?: string; gold?: boolean }[] = [
    { label: 'MATCH', text: `${match.home} vs ${match.away} · ${formatVipShortDate(match.date)}` },
    { label: 'HOSPITALITY', text: `${card.name} × ${guests}`, price: money(ticketsTotal) },
    { label: 'FLIGHT', text: `${cabinName} · ${from} – ${to} × ${guests}`, price: 'Priced live', gold: true },
    { label: 'HOTEL', text: `4 or 5 star · ${match.city}`, price: 'Priced live', gold: true },
    ...(esim ? [{ label: 'ESIM', text: 'Spain data plan', price: 'Optional', gold: true }] : []),
  ]

  return (
    <aside
      aria-label='Your VIP package'
      className='w-full shrink-0 overflow-hidden rounded-[28px] border-[1.5px] border-vip-gold/80 bg-vip-panel shadow-[0px_20px_60px_0px_rgba(212,178,106,0.18)] lg:sticky lg:top-28 lg:w-[440px]'
    >
      {/* Gold header */}
      <div className='flex flex-col gap-2.5 bg-linear-to-r from-vip-gold-light to-vip-gold-deep px-7 pb-6 pt-7'>
        <div className='flex items-center justify-between font-mono text-[12px] font-bold leading-[normal] tracking-[2.64px] text-vip-on-gold'>
          <span>YOUR VIP MATCHDAY</span>
          <span>
            {guests} GUEST{guests === 1 ? '' : 'S'}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <Airport code={from} city={origin ? 'Your airport' : 'Pick in the hero'} />
          <span aria-hidden className='flex items-center gap-1.5 text-[16px] font-bold leading-[normal] text-vip-on-gold'>
            <span>·  ·  ·</span>
            <Plane className='size-4 rotate-45' strokeWidth={2.25} />
            <span>·  ·  ·</span>
          </span>
          <Airport code={to} city={match.city} />
        </div>
      </div>

      {/* Lines */}
      <dl className='flex flex-col px-7 py-2'>
        {rows.map((r) => (
          <div key={r.label} className='flex items-start justify-between gap-4 border-b border-vip-line/8 py-3.5 leading-[normal]'>
            <div className='flex min-w-0 flex-col gap-[3px] font-medium'>
              <dt className='font-mono text-[10.5px] tracking-[2.31px] text-vip-gold-text'>{r.label}</dt>
              <dd className='text-[14.5px] text-vip-fg'>{r.text}</dd>
            </div>
            {r.price && (
              <dd className={cn('shrink-0 text-[15px] font-semibold', r.gold ? 'text-vip-gold-text' : 'text-vip-fg')}>{r.price}</dd>
            )}
          </div>
        ))}
      </dl>

      {/* Perforation: page-coloured notches at both edges, dashed gold line */}
      <div aria-hidden className='relative h-6 overflow-hidden'>
        <span className='absolute -left-3 top-0 size-6 rounded-full bg-vip-ink' />
        <span className='absolute -right-3 top-0 size-6 rounded-full bg-vip-ink' />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src='/figma/vip/ticket-perforation.svg' alt='' className='absolute inset-x-[5.45%] top-1/2 h-px w-[89.1%] max-w-none -translate-y-1/2' />
      </div>

      {/* Total + CTA */}
      <div className='flex flex-col gap-4 px-7 pb-7 pt-3'>
        <div className='flex items-end justify-between gap-3'>
          <div className='flex flex-col gap-0.5 leading-[normal] text-vip-muted'>
            <span className='text-[14px]'>
              From, for {guests} guest{guests === 1 ? '' : 's'}
            </span>
            <span className='text-[12.5px]'>+ your flight, hotel{esim ? ' and eSIM' : ''} at their live price</span>
          </div>
          <span className='font-display text-[49px] leading-[46px] text-vip-gold-text'>{money(ticketsTotal)}</span>
        </div>
        <Link
          href={`${vipFlowHref(match.club, match.eventId, 'seats')}?category=${encodeURIComponent(card.name)}`}
          className='flex h-[58px] w-full items-center justify-center gap-2.5 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-[30px] font-semibold leading-[normal] text-[#0a0a0a] transition-[filter] hover:brightness-105'
        >
          <span className='text-[16px]'>Book my VIP experience</span>
          <ArrowRight aria-hidden className='size-[17px]' strokeWidth={2.25} />
        </Link>
        <p className='text-center text-[12.5px] leading-[normal] text-vip-muted'>
          One secure payment · the price is confirmed in your package
        </p>
      </div>
    </aside>
  )
}

function Airport({ code, city }: { code: string; city: string }) {
  return (
    <div className='flex flex-col items-center'>
      <span className='font-display text-[52px] leading-[48px] text-vip-on-gold'>{code}</span>
      <span className='text-[12.5px] font-medium leading-[normal] text-vip-gold-shade'>{city}</span>
    </div>
  )
}
