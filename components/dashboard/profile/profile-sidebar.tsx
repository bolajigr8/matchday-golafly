'use client'

import {
  ChevronRight,
  LogOut,
  Leaf,
  ArrowRight,
  User,
  Shield,
  CreditCard,
  Bell,
  Lock,
  MapPinned,
} from 'lucide-react'

const FCB_BADGE =
  'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png'

const MEMBERSHIP = {
  level: 'Bronze Fan',
  points: 1250,
  pointsToNext: 750,
  totalPointsForNext: 2000,
  co2Offset: 12.4,
}

const ACCOUNT_LINKS = [
  { icon: User, label: 'Personal Information' },
  { icon: Shield, label: 'Security' },
  { icon: CreditCard, label: 'Payment Methods' },
  { icon: MapPinned, label: 'Saved Addresses' },
  { icon: Bell, label: 'Notification Settings' },
  { icon: Lock, label: 'Privacy Settings' },
]

export function ProfileSidebar() {
  const pct = (MEMBERSHIP.points / MEMBERSHIP.totalPointsForNext) * 100

  return (
    <aside className='space-y-4'>
      {/* ── Your Membership ── */}
      <div className='rounded-2xl border border-border bg-card p-4 sm:p-5'>
        <h3 className='font-heading text-[13px] sm:text-[14px] font-bold text-foreground'>
          Your Membership
        </h3>

        <div className='mt-3 flex items-center gap-3'>
          <div className='flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-500/15 text-[22px] sm:text-[24px]'>
            🛡️
          </div>
          <div>
            <p className='font-heading text-[14px] sm:text-[15px] font-bold text-foreground'>
              {MEMBERSHIP.level}
            </p>
            <p className='font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
              Silver in {MEMBERSHIP.pointsToNext} points
            </p>
          </div>
        </div>

        <div className='mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-primary transition-all duration-500'
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className='mt-1.5 font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
          {MEMBERSHIP.points.toLocaleString()} /{' '}
          {MEMBERSHIP.totalPointsForNext.toLocaleString()} pts
        </p>

        <button className='mt-4 flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 font-heading text-[12px] sm:text-[13px] font-bold text-primary transition-colors hover:bg-primary/20'>
          View Benefits <ChevronRight className='h-4 w-4' />
        </button>
      </div>

      {/* ── Favorite Team ── */}
      <div className='rounded-2xl border border-border bg-card p-4 sm:p-5'>
        <h3 className='font-heading text-[13px] sm:text-[14px] font-bold text-foreground'>
          Favorite Team
        </h3>
        <div className='mt-3 flex items-center gap-3'>
          <img
            src={FCB_BADGE}
            alt='FC Barcelona'
            className='h-9 w-9 sm:h-10 sm:w-10 object-contain'
          />
          <div>
            <p className='font-heading text-[13px] sm:text-[14px] font-bold text-foreground'>
              FC Barcelona
            </p>
            <p className='font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
              La Liga
            </p>
          </div>
        </div>
        <button className='mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-2.5 font-heading text-[12px] sm:text-[13px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'>
          Manage Teams <ChevronRight className='h-4 w-4' />
        </button>
      </div>

      {/* ── Account ── */}
      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div className='px-4 sm:px-5 py-3 sm:py-4'>
          <h3 className='font-heading text-[13px] sm:text-[14px] font-bold text-foreground'>
            Account
          </h3>
        </div>
        {ACCOUNT_LINKS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className='flex w-full items-center gap-3 border-t border-border px-4 sm:px-5 py-2.5 sm:py-3 text-left transition-colors hover:bg-muted/40'
          >
            <Icon className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
            <span className='flex-1 font-heading text-[12px] font-semibold text-foreground'>
              {label}
            </span>
            <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
          </button>
        ))}
        <button className='flex w-full items-center gap-3 border-t border-border px-4 sm:px-5 py-2.5 sm:py-3 text-left text-red-400 transition-colors hover:bg-red-500/5'>
          <LogOut className='h-3.5 w-3.5 shrink-0' />
          <span className='font-heading text-[12px] font-semibold'>
            Log out
          </span>
        </button>
      </div>

      {/* ── Your Impact ── */}
      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div
          className='h-24 sm:h-28 w-full'
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1522778034537-20a2486be803?w=400&q=60)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='flex h-full items-start p-3 sm:p-4'>
            <div className='flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20'>
              <Leaf className='h-3.5 w-3.5 text-emerald-400' />
            </div>
          </div>
        </div>
        <div className='p-4 sm:p-5'>
          <p className='text-[11px] sm:text-[12px] text-muted-foreground'>
            Together, we're building a better matchday experience.
          </p>
          <p className='mt-3 font-heading text-2xl sm:text-3xl font-bold text-primary'>
            {MEMBERSHIP.co2Offset} kg
          </p>
          <p className='font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
            CO₂ offset
          </p>
          <p className='mt-0.5 font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
            Thank you!
          </p>
          <button className='mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-2.5 font-heading text-[11px] sm:text-[12px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'>
            Learn More <ArrowRight className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>
    </aside>
  )
}
