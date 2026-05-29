'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  User,
  Shield,
  CreditCard,
  Bell,
  Lock,
  ArrowRight,
  Ticket as TicketIcon,
  Wifi,
  Users,
  MapPinned,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
}

const USER = {
  name: 'Adewale',
  email: 'adewale@email.com',
  phone: '+234 812 345 6789',
  location: 'Lagos, Nigeria',
  memberSince: 'May 2024',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=300&q=80',
  matchesAttended: 7,
  points: 1250,
  rewardsRedeemed: 3,
  level: 'Bronze Fan',
  pointsToNext: 750,
  totalPointsForNext: 2000,
  co2Offset: 12.4,
}

const ACTIVITY = [
  {
    id: 1,
    emoji: '🎫',
    title: 'Ticket confirmed',
    subtitle: 'FC Barcelona vs Real Madrid',
    date: '10 May 2024',
  },
  {
    id: 2,
    emoji: '🏨',
    title: 'Hotel booking confirmed',
    subtitle: 'Hotel Arts Barcelona',
    date: '27 Apr 2024',
  },
  {
    id: 3,
    emoji: '✈️',
    title: 'Flight booked',
    subtitle: 'Lagos → Barcelona',
    date: '23 Apr 2024',
  },
  {
    id: 4,
    emoji: '🎁',
    title: 'Reward redeemed',
    subtitle: '10% Off Next Booking',
    date: '15 Apr 2024',
  },
]

const TRIP_ESSENTIALS = [
  {
    icon: TicketIcon,
    label: 'Documents',
    name: 'Passport',
    detail: 'Valid until 12 May 2027',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: CreditCard,
    label: 'Payment Cards',
    name: '•••• 4242',
    detail: 'Visa · Expires 06/27',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
  },
  {
    icon: Wifi,
    label: 'eSIM',
    name: 'Spain eSIM 10GB',
    detail: 'Active · Valid until 27 May 2024',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Users,
    label: 'Saved Travelers',
    name: '1 Traveler',
    detail: 'You',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
]

export function ProfileContent() {
  return (
    <div className='space-y-6 sm:space-y-8'>
      {/* ── My Preferences ── */}
      <section className='space-y-3'>
        <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
          My Preferences
        </h2>
        {/* Single col on mobile, 3 col on sm+ */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {/* Favorite Teams */}
          <div className='rounded-2xl border border-border bg-card p-4'>
            <h3 className='font-heading text-[13px] font-bold text-foreground'>
              Favorite Teams
            </h3>
            <div className='mt-3 space-y-3'>
              {[
                { code: 'FCB', name: 'FC Barcelona', sub: 'Primary' },
                { code: 'RMA', name: 'Real Madrid', sub: 'Secondary' },
              ].map(({ code, name, sub }) => (
                <div key={code} className='flex items-center gap-3'>
                  <img
                    src={TEAM_BADGES[code]}
                    alt={name}
                    className='h-8 w-8 object-contain'
                  />
                  <div>
                    <p className='font-heading text-[13px] font-bold text-foreground'>
                      {name}
                    </p>
                    <p className='font-mono text-[10px] text-muted-foreground'>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className='mt-4 flex items-center gap-1 font-heading text-[12px] font-bold text-primary'>
              Manage Teams <ChevronRight className='h-3 w-3' />
            </button>
          </div>

          {/* Travel Preferences */}
          <div className='rounded-2xl border border-border bg-card p-4'>
            <h3 className='font-heading text-[13px] font-bold text-foreground'>
              Travel Preferences
            </h3>
            <div className='mt-3 space-y-3'>
              {[
                { emoji: '✈️', label: 'Economy', sub: 'Preferred class' },
                { emoji: '🛏️', label: '3 Nights', sub: 'Typical stay' },
                { emoji: '📅', label: '2 Days Before', sub: 'Arrival time' },
              ].map(({ emoji, label, sub }) => (
                <div key={label} className='flex items-center gap-2.5'>
                  <span className='text-[15px]'>{emoji}</span>
                  <div>
                    <p className='font-heading text-[12px] font-bold text-foreground'>
                      {label}
                    </p>
                    <p className='font-mono text-[10px] text-muted-foreground'>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className='mt-4 flex items-center gap-1 font-heading text-[12px] font-bold text-primary'>
              Edit Preferences <ChevronRight className='h-3 w-3' />
            </button>
          </div>

          {/* Communication */}
          <div className='rounded-2xl border border-border bg-card p-4'>
            <h3 className='font-heading text-[13px] font-bold text-foreground'>
              Communication
            </h3>
            <div className='mt-3 space-y-3'>
              {[
                { emoji: '📧', label: 'Email', value: USER.email },
                { emoji: '🔔', label: 'Push Notifications', value: 'Enabled' },
                { emoji: '💬', label: 'SMS', value: USER.phone },
              ].map(({ emoji, label, value }) => (
                <div key={label} className='flex items-start gap-2'>
                  <span className='mt-0.5 text-[13px]'>{emoji}</span>
                  <div className='min-w-0 flex-1'>
                    <p className='font-heading text-[12px] font-bold text-foreground'>
                      {label}
                    </p>
                    <p className='truncate font-mono text-[10px] text-muted-foreground'>
                      {value}
                    </p>
                  </div>
                  <span className='mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary'>
                    ✓
                  </span>
                </div>
              ))}
            </div>
            <button className='mt-4 flex items-center gap-1 font-heading text-[12px] font-bold text-primary'>
              Manage Settings <ChevronRight className='h-3 w-3' />
            </button>
          </div>
        </div>
      </section>

      {/* ── My Trip Essentials ── */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
            My Trip Essentials
          </h2>
          <Link
            href='#'
            className='font-mono text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground'
          >
            View all
          </Link>
        </div>
        {/* 2 col on mobile, 4 col on sm+ */}
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {TRIP_ESSENTIALS.map(
            ({ icon: Icon, label, name, detail, iconBg, iconColor }) => (
              <div
                key={label}
                className='flex flex-col rounded-2xl border border-border bg-card p-3 sm:p-4'
              >
                <p className='font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                  {label}
                </p>
                <div
                  className={cn(
                    'mt-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl',
                    iconBg,
                  )}
                >
                  <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />
                </div>
                <p className='mt-2 sm:mt-3 font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                  {name}
                </p>
                <p className='mt-0.5 text-[9px] sm:text-[10px] leading-relaxed text-muted-foreground'>
                  {detail}
                </p>
                <button className='mt-2 sm:mt-3 flex items-center gap-1 font-heading text-[11px] sm:text-[12px] font-bold text-primary'>
                  Manage <ChevronRight className='h-3 w-3' />
                </button>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
            Recent Activity
          </h2>
          <Link
            href='#'
            className='font-mono text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground'
          >
            View all
          </Link>
        </div>
        <div className='overflow-hidden rounded-2xl border border-border bg-card'>
          {ACTIVITY.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4',
                i < ACTIVITY.length - 1 && 'border-b border-border',
              )}
            >
              <div className='flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-[14px] sm:text-[16px]'>
                {item.emoji}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                  {item.title}
                </p>
                <p className='text-[10px] sm:text-[11px] text-muted-foreground truncate'>
                  {item.subtitle}
                </p>
              </div>
              <span className='shrink-0 font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <div
        className='relative overflow-hidden rounded-2xl border border-border p-5 sm:p-7'
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=50)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className='absolute inset-0 bg-linear-to-r from-background/90 via-background/70 to-transparent' />
        <div className='relative z-10 flex flex-col gap-5 sm:gap-6 sm:flex-row sm:items-center sm:justify-between'>
          <p className='font-heading text-xl sm:text-2xl font-bold leading-snug text-foreground'>
            More matches.
            <br />
            More memories.
            <br />
            More rewards.
          </p>
          {/* Icon flow — hidden on mobile to prevent overflow */}
          <div className='hidden sm:flex items-center gap-2'>
            {(
              [
                { icon: '🎫', label: 'Attend' },
                { icon: '⭐', label: 'Earn Points' },
                { icon: '🎁', label: 'Redeem' },
                { icon: '😊', label: 'Enjoy' },
              ] as const
            ).map(({ icon, label }, i) => (
              <div key={label} className='flex items-center gap-2'>
                <div className='flex flex-col items-center gap-1'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-xl'>
                    {icon}
                  </div>
                  <span className='font-mono text-[9px] text-muted-foreground'>
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <ArrowRight className='h-3.5 w-3.5 shrink-0 text-primary/50' />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
