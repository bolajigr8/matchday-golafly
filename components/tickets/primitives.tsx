'use client'

import { useState } from 'react'
import { ArrowRight, Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatKickoffTime,
  formatMatchdayMoney,
  parseEventDate,
} from '@/features/matchday/format'

/* Building blocks shared by every ticket surface: fixture cards, the
   tickets hero, the seats-page header and the directories. Colours come
   from the --ticket-* tokens in app/globals.css (deep green on light,
   Golafly lime on dark). */

/* ── Crest ─────────────────────────────────────────────────────────── */

function initials(name: string) {
  const words = name
    .replace(/\b(fc|cf|afc|sc|ac|club)\b/gi, '')
    .trim()
    .split(/\s+/)
  const s =
    words.length > 1
      ? words
          .slice(0, 3)
          .map((w) => w[0])
          .join('')
      : name.slice(0, 3)
  return s.toUpperCase()
}

/** Transparent club crest on the supplier CDN. The API's `team.image` is a
 *  promotional squad photo (great for big tiles and hero slides, wrong for
 *  a crest); the crest itself lives at /teams/<team_id>/logo.webp — the
 *  same file footballticketnet.com renders, keyed by the same team id our
 *  GET /events returns (e.g. Arsenal = 1). */
export function teamCrestUrl(teamId: number | null | undefined): string | null {
  return teamId
    ? `https://cdn.footballticketnet.com/teams/${teamId}/logo.webp`
    : null
}

/** A club crest — transparent, no tile behind it. Pass `teamId` to use the
 *  supplier crest; `src` overrides it. Falls back to the club's initials
 *  in a ring when the crest is missing or fails to load (never a photo). */
export function TeamCrest({
  src,
  teamId,
  name,
  className,
}: {
  src?: string | null
  teamId?: number | null
  name: string
  className?: string
}) {
  const [bad, setBad] = useState(false)
  const url = src ?? teamCrestUrl(teamId)
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center',
        className,
      )}
    >
      {url && !bad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          loading='lazy'
          className='size-full object-contain'
          onError={() => setBad(true)}
        />
      ) : (
        <span
          aria-label={name}
          className='flex size-full items-center justify-center rounded-full border-2 border-ticket-line bg-ticket-surface font-heading text-[9px] font-bold leading-none tracking-tight text-ticket-ink sm:text-[11px]'
        >
          {initials(name)}
        </span>
      )}
    </span>
  )
}

/* ── Date helpers ──────────────────────────────────────────────────── */

/** `time` is "TBA" when the kick-off time isn't known (isTimeTba). */
export function eventDateParts(iso: string | null | undefined) {
  const d = parseEventDate(iso)
  // No date yet (the API sends `date: null` for some postponed fixtures):
  // show "Date TBC" instead of "Invalid Date" / "NaN".
  if (Number.isNaN(d.getTime())) {
    return { month: '', day: 'TBC', weekday: 'Date', time: 'TBA', valid: false as const }
  }
  return {
    month: d.toLocaleDateString('en-GB', { month: 'short' }),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    time: formatKickoffTime(iso),
    valid: true as const,
  }
}

/** Partner-style relative tag: "This weekend" / "Next week" / "This month". */
export function urgencyFor(iso: string | null | undefined): string | null {
  const diff = parseEventDate(iso).getTime() - Date.now()
  const day = 86_400_000
  if (Number.isNaN(diff) || diff < 0) return null
  if (diff < 8 * day) return 'This weekend'
  if (diff < 14 * day) return 'Next week'
  if (diff < 35 * day) return 'This month'
  return null
}

/** "In 4 weeks", "Tomorrow", "In 3 days" — used on the ticket header. */
export function relativeKickoff(iso: string | null | undefined): string | null {
  const diff = parseEventDate(iso).getTime() - Date.now()
  if (Number.isNaN(diff) || diff < 0) return null
  const days = Math.round(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `In ${days} days`
  if (days < 60) return `In ${Math.round(days / 7)} weeks`
  return `In ${Math.round(days / 30)} months`
}

/** Money without a trailing ".00" (€250 rather than €250.00). */
export function ticketMoney(amount: number, currency: string) {
  return formatMatchdayMoney(amount, currency).replace(/\.00(?=\D*$)/, '')
}

/* ── Date block ────────────────────────────────────────────────────── */

export function DateBlock({
  iso,
  className,
}: {
  iso: string
  className?: string
}) {
  const p = eventDateParts(iso)
  return (
    <div
      className={cn(
        'flex w-[50px] shrink-0 flex-col items-center justify-center rounded-md border border-ticket-line bg-ticket-surface px-0.5 py-1.5 text-center sm:w-[90px] sm:py-2.5',
        className,
      )}
    >
      <span className='text-[13px] font-semibold leading-none text-ticket-ink sm:text-[21px]'>
        {p.month}
      </span>
      <span className='mt-0.5 font-display text-[38px] leading-[0.92] text-ticket-ink sm:text-[66px]'>
        {p.day}
      </span>
      <span className='whitespace-nowrap text-[9px] leading-none text-ticket-ink/80 sm:text-[13px]'>
        {p.weekday} {p.time}
      </span>
    </div>
  )
}

/* ── Badges & pills ────────────────────────────────────────────────── */

export function UrgencyBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-ticket-surface px-2 py-1 text-[8.5px] font-medium uppercase tracking-wide text-ticket-ink shadow-[0_1px_6px_rgba(0,0,0,0.12)] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[12px] dark:ring-1 dark:ring-ticket-line',
        className,
      )}
    >
      <Hourglass className='size-2.5 sm:size-3.5' />
      {label}
    </span>
  )
}

export function PricePill({
  amount,
  currency,
  onClick,
  size = 'md',
  className,
}: {
  amount: number
  currency: string
  onClick?: (e: React.MouseEvent) => void
  size?: 'md' | 'lg'
  className?: string
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-ticket font-bold uppercase text-ticket-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ticket',
        size === 'lg'
          ? 'h-11 px-5 text-[15px]'
          : 'h-[30px] px-3 text-[11px] sm:h-[28px] sm:rounded-lg sm:px-3.5 sm:text-[13px]',
        className,
      )}
    >
      <span className={size === 'lg' ? 'text-[11px] font-semibold' : ''}>
        From
      </span>{' '}
      {ticketMoney(amount, currency)}
      {size === 'md' && (
        <ArrowRight className='size-3 sm:size-3.5' strokeWidth={2.5} />
      )}
    </button>
  )
}
