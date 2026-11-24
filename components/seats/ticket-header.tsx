'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronRight, Info, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatKickoffTime, isTimeTba, parseEventDate } from '@/features/matchday/format'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import {
  TeamCrest,
  relativeKickoff,
  ticketMoney,
} from '@/components/tickets/primitives'

/* Top of the seats page, partner-marketplace layout:

   Home › Premier League › Arsenal vs Hull City
   ┌───────────────────────────────────────────────────────────┐
   │ (crest) vs (crest)  [Premier League]                        │
   │                     Arsenal vs Hull City Tickets            │
   │                     Arsenal vs Hull City takes place at …   │
   │                     more                                    │
   │ Saturday, 7 November 2026 · Kick-off 15:00 (In 4 weeks)     │
   │ Emirates Stadium · London · United Kingdom                  │
   │ Arsenal  Hull City  Emirates Stadium                        │
   │ (FROM €190.87) (✓ 150% order guarantee) (✓ Verified sellers)│
   └───────────────────────────────────────────────────────────┘ */

export interface TicketHeaderProps {
  home: string
  away: string
  homeCrest?: string | null
  awayCrest?: string | null
  homeId?: number
  awayId?: number
  competition?: string
  competitionId?: number
  /** ISO kick-off; header falls back to `dateLabel` when absent (demo data). */
  dateISO?: string
  dateLabel?: string
  venueName?: string
  city?: string
  country?: string
  minPrice?: number | null
  currency?: string | null
  onFromClick?: () => void
}

function longDate(iso: string) {
  const d = parseEventDate(iso)
  return {
    tba: isTimeTba(iso),
    date: d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: formatKickoffTime(iso),
  }
}

export function TicketHeader(p: TicketHeaderProps) {
  const slugs = useCatalogueSlugs()
  const when = p.dateISO ? longDate(p.dateISO) : null
  const rel = p.dateISO ? relativeKickoff(p.dateISO) : null
  const priceText =
    p.minPrice != null && p.minPrice > 0 ? ticketMoney(p.minPrice, p.currency ?? 'EUR') : null

  const where = [p.venueName, p.city].filter(Boolean)
  const description = [
    `${p.home} vs ${p.away} takes place`,
    where.length ? ` at ${where.join(' in ')}` : '',
    when
      ? when.tba
        ? ` on ${when.date} (kick-off time to be confirmed)`
        : ` on ${when.date}, kick-off ${when.time} local time`
      : p.dateLabel
        ? ` on ${p.dateLabel}`
        : '',
    p.competition ? `, as part of the ${p.competition}.` : '.',
    priceText ? ` Tickets start from ${priceText} per seat` : ' Tickets are listed',
    ' from verified sellers, and every order is covered by our 150% order guarantee.',
    ' Pick a zone on the stadium map to see the seats available there, then choose the listing that suits you.',
  ].join('')

  return (
    <div>
      <nav aria-label='Breadcrumb' className='mb-3 flex min-w-0 items-center gap-1 text-[13px] text-ticket-ink'>
        <Link href='/' className='shrink-0 hover:underline'>
          Home
        </Link>
        {p.competition && (
          <>
            <ChevronRight className='size-3 shrink-0 opacity-60' />
            <Link
              href={p.competitionId && slugs.hasTournament(p.competitionId) ? slugs.tournamentPath(p.competitionId, p.competition) : '/tournaments'}
              className='shrink-0 hover:underline'
            >
              {p.competition}
            </Link>
          </>
        )}
        <ChevronRight className='size-3 shrink-0 opacity-60' />
        <span aria-current='page' className='truncate font-semibold'>
          {p.home} vs {p.away}
        </span>
      </nav>

      <section className='rounded-2xl bg-ticket-surface p-4 ring-1 ring-ticket-line sm:p-6'>
        {/* Phones/tablets: crests and title side by side, both vertically
            centred so the crests sit in the middle of their space; the
            description then runs full-width underneath (shown once).
            Desktop (md+): description sits in the title column. */}
        <div className='flex items-center gap-4 md:items-start md:gap-6'>
          <div className='flex shrink-0 items-center gap-1.5 self-center md:rounded-2xl md:bg-muted/60 md:px-4 md:py-5'>
            <span className='rounded-full bg-white p-1.5 shadow-sm ring-1 ring-ticket-line'>
              <TeamCrest teamId={p.homeId} src={p.homeId ? undefined : p.homeCrest} name={p.home} className='size-10 sm:size-12 md:size-14' />
            </span>
            <span className='text-[11px] font-semibold text-muted-foreground'>vs</span>
            <span className='rounded-full bg-white p-1.5 shadow-sm ring-1 ring-ticket-line'>
              <TeamCrest teamId={p.awayId} src={p.awayId ? undefined : p.awayCrest} name={p.away} className='size-10 sm:size-12 md:size-14' />
            </span>
          </div>

          <div className='min-w-0 flex-1'>
            {p.competition && (
              <span className='inline-flex max-w-full rounded-full bg-ticket-soft px-3 py-1 text-[12px] font-semibold text-ticket-soft-foreground'>
                <span className='truncate'>{p.competition}</span>
              </span>
            )}
            <h1 className='mt-2 text-[19px] font-semibold leading-tight text-ticket-ink sm:text-[22px] md:text-[26px]'>
              {p.home} vs {p.away}{' '}
              <span className='font-normal text-muted-foreground'>Tickets</span>
            </h1>
            <div className='hidden md:block'>
              <Description text={description} />
            </div>
          </div>
        </div>

        <div className='mt-3 md:hidden'>
          <Description text={description} />
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14px] text-ticket-ink'>
          <span>{when ? when.date : p.dateLabel}</span>
          {when && (
            <>
              <span aria-hidden className='text-muted-foreground'>·</span>
              <span>Kick-off {when.time}</span>
            </>
          )}
          {rel && (
            <span className='rounded-md bg-amber-100 px-2 py-0.5 text-[12.5px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'>
              {rel}
            </span>
          )}
        </div>

        {(p.venueName || p.city) && (
          <p className='mt-2 text-[13px] text-muted-foreground'>
            {[p.venueName, p.city, p.country].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ticket-ink'>
          {/* Linked only while the team page exists (removed teams 404). */}
          {p.homeId && slugs.hasTeam(p.homeId) ? <Link href={slugs.teamPath(p.homeId, p.home)} className='hover:underline'>{p.home}</Link> : <span>{p.home}</span>}
          {p.awayId && slugs.hasTeam(p.awayId) ? <Link href={slugs.teamPath(p.awayId, p.away)} className='hover:underline'>{p.away}</Link> : <span>{p.away}</span>}
          {p.venueName && <span>{p.venueName}</span>}
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-2'>
          {priceText && (
            <button
              type='button'
              onClick={p.onFromClick}
              className='inline-flex h-11 items-center gap-1.5 rounded-full bg-ticket px-5 text-[18px] font-bold text-ticket-foreground transition-opacity hover:opacity-90'
            >
              <span className='text-[11px] font-semibold uppercase'>From</span>
              <span translate='no' className='notranslate'>
                {priceText}
              </span>
            </button>
          )}
          <Assurance icon={<ShieldCheck className='size-3.5' />}>
            150% order guarantee
            <Info className='size-3 opacity-60' aria-hidden />
          </Assurance>
          <Assurance icon={<Check className='size-3.5' />}>Verified sellers</Assurance>
          <Assurance icon={<Check className='size-3.5' />}>Secure checkout</Assurance>
        </div>
      </section>
    </div>
  )
}

function Assurance({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full bg-ticket-surface px-3 py-1.5 text-[12.5px] font-medium text-ticket-ink ring-1 ring-ticket-line'>
      <span className='text-ticket-ink'>{icon}</span>
      {children}
    </span>
  )
}

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <p
        className={cn(
          'mt-2 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground md:text-[14px]',
          !expanded && 'line-clamp-3 md:line-clamp-2',
        )}
      >
        {text}
      </p>
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className='mt-1 text-[13px] font-semibold text-ticket-ink underline underline-offset-2'
      >
        {expanded ? 'less' : 'more'}
      </button>
    </>
  )
}
