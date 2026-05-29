'use client'

import {
  Plane,
  BedDouble,
  Wifi,
  TicketIcon,
  Bell,
  Gift,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NEXT_MATCH } from '@/store/dashboard'

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
}

export function InboxRightSidebar() {
  const unreadSummary = [
    {
      label: 'Tickets',
      count: 1,
      icon: TicketIcon,
      color: 'bg-primary/20 text-primary',
    },
    {
      label: 'Travel',
      count: 2,
      icon: Plane,
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      label: 'Announcements',
      count: 0,
      icon: Bell,
      color: 'bg-gray-500/20 text-gray-400',
    },
    {
      label: 'Rewards',
      count: 0,
      icon: Gift,
      color: 'bg-amber-500/20 text-amber-400',
    },
  ]

  const tripItems = [
    { icon: Plane, label: 'Flight', status: 'Confirmed', ok: true },
    { icon: BedDouble, label: 'Hotel', status: 'Confirmed', ok: true },
    { icon: Wifi, label: 'eSIM', status: 'Ready to install', ok: true },
  ]

  return (
    <div className='hidden w-64 shrink-0 overflow-y-auto xl:block'>
      <div className='space-y-4 p-4'>
        {/* ── Upcoming Match ── */}
        <div className='rounded-2xl border border-border bg-card p-4'>
          <h3 className='font-heading text-[13px] font-bold text-foreground'>
            Upcoming Match
          </h3>

          {/* Team logos */}
          <div className='mt-3 flex items-center justify-center gap-3'>
            <img
              src={TEAM_BADGES['FCB']}
              alt='FCB'
              className='h-10 w-10 object-contain drop-shadow-lg'
            />
            <span className='font-heading text-xs text-muted-foreground'>
              VS
            </span>
            <img
              src={TEAM_BADGES['RMA']}
              alt='RMA'
              className='h-10 w-10 object-contain drop-shadow-lg'
            />
          </div>

          <p className='mt-2 text-center font-mono text-[10px] text-muted-foreground'>
            {NEXT_MATCH.date} · {NEXT_MATCH.time.split(' ')[0]}
          </p>
          <p className='text-center font-mono text-[10px] text-muted-foreground'>
            {NEXT_MATCH.venue}
          </p>

          {/* Countdown */}
          <div className='mt-3 flex justify-center gap-4'>
            {[
              { v: NEXT_MATCH.countdownDays, l: 'DAYS' },
              { v: NEXT_MATCH.countdownHrs, l: 'HRS' },
              { v: NEXT_MATCH.countdownMins, l: 'MINS' },
            ].map(({ v, l }) => (
              <div key={l} className='text-center'>
                <p className='font-heading text-lg font-bold text-primary'>
                  {String(v).padStart(2, '0')}
                </p>
                <p className='font-mono text-[8px] tracking-widest text-muted-foreground'>
                  {l}
                </p>
              </div>
            ))}
          </div>

          <button className='mt-3 w-full rounded-xl border border-border py-2 font-heading text-[11px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'>
            View Match Details
          </button>
        </div>

        {/* ── My Trip ── */}
        <div className='rounded-2xl border border-border bg-card p-4'>
          <h3 className='font-heading text-[13px] font-bold text-foreground'>
            My Trip
          </h3>
          <div className='mt-2 h-20 overflow-hidden rounded-lg'>
            <img
              src='https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=70'
              alt='Barcelona'
              className='h-full w-full object-cover'
            />
          </div>
          <p className='mt-2 font-heading text-sm font-bold text-foreground'>
            Barcelona
          </p>
          <p className='font-mono text-[10px] text-muted-foreground'>
            24 May – 27 May 2024
          </p>

          <div className='mt-3 space-y-2'>
            {tripItems.map(({ icon: Icon, label, status, ok }) => (
              <div key={label} className='flex items-center gap-2'>
                <Icon className='h-3.5 w-3.5 text-muted-foreground' />
                <span className='flex-1 text-[11px] text-foreground'>
                  {label}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px]',
                    ok ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>

          <button className='mt-3 w-full rounded-xl border border-border py-2 font-heading text-[11px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'>
            View Trip
          </button>
        </div>

        {/* ── Unread Summary ── */}
        <div className='rounded-2xl border border-border bg-card p-4'>
          <h3 className='font-heading text-[13px] font-bold text-foreground'>
            Unread Summary
          </h3>
          <div className='mt-3 space-y-2.5'>
            {unreadSummary.map(({ label, count, icon: Icon, color }) => (
              <div key={label} className='flex items-center gap-2.5'>
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                    color,
                  )}
                >
                  <Icon className='h-3 w-3' />
                </div>
                <span className='flex-1 text-[12px] text-foreground'>
                  {label}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px] font-bold',
                    count > 0 ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
          <button className='mt-3 w-full rounded-xl border border-border py-2 font-heading text-[11px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'>
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  )
}
