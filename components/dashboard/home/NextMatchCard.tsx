'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { NEXT_MATCH } from '@/store/dashboard'
import Image from 'next/image'

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
  MCI: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
  MUN: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/120px-Manchester_United_FC_crest.svg.png',
  ACM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/AC_Milan.svg/120px-AC_Milan.svg.png',
  JUV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Juventus_FC_2017_icon_%28black%29.svg/120px-Juventus_FC_2017_icon_%28black%29.svg.png',
}

export function TeamBadge({
  code,
  size = 'lg',
}: {
  code: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  const src = TEAM_BADGES[code]
  const dim =
    size === '2xl'
      ? 110
      : size === 'xl'
        ? 90
        : size === 'lg'
          ? 64
          : size === 'md'
            ? 44
            : 32
  if (src) {
    return (
      <Image
        src={src}
        alt={code}
        width={dim}
        height={dim}
        className='object-contain drop-shadow-xl'
        style={{ width: dim, height: dim }}
      />
    )
  }
  return (
    <div
      className='flex items-center justify-center rounded-full bg-card border border-border font-heading font-bold text-foreground'
      style={{ width: dim, height: dim, fontSize: dim * 0.22 }}
    >
      {code}
    </div>
  )
}

function CountdownUnit({ val, label }: { val: string; label: string }) {
  return (
    <div className='text-center'>
      <p className='font-heading text-3xl sm:text-4xl font-bold leading-none text-foreground dark:text-primary'>
        {val}
      </p>
      <p className='mt-1.5 font-mono text-[9px] tracking-widest text-foreground/40'>
        {label}
      </p>
    </div>
  )
}

export function NextMatchCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.42 }}
      className='relative overflow-hidden rounded-2xl border border-border bg-card'
    >
      <div
        className='absolute inset-0'
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className='absolute inset-0 bg-background/90 dark:bg-background/95' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-primary/8 to-transparent' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(183,255,0,0.05),transparent_60%)]' />

      {/* ── MOBILE ── */}
      <div className='relative z-10 flex flex-col md:hidden px-5 py-6 gap-5'>
        <span className='self-start  rounded-full border border-foreground dark:border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest dark:text-primary text-foreground'>
          NEXT MATCH
        </span>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col items-center gap-2'>
            <TeamBadge code={NEXT_MATCH.team1Code} size='lg' />
            <span className='font-heading text-[11px] font-bold uppercase tracking-wide text-foreground'>
              {NEXT_MATCH.team1}
            </span>
          </div>
          <span className='font-heading text-xl font-bold text-foreground/25'>
            VS
          </span>
          <div className='flex flex-col items-center gap-2'>
            <TeamBadge code={NEXT_MATCH.team2Code} size='lg' />
            <span className='font-heading text-[11px] font-bold uppercase tracking-wide text-foreground'>
              {NEXT_MATCH.team2}
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 text-[12px] text-foreground/65'>
            <Calendar className='h-3.5 w-3.5 shrink-0 text-primary' />
            {NEXT_MATCH.date} · {NEXT_MATCH.time}
          </div>
          <div className='flex items-center gap-2 text-[12px] text-foreground/65'>
            <MapPin className='h-3.5 w-3.5 shrink-0 text-primary' />
            {NEXT_MATCH.venue}, {NEXT_MATCH.city}
          </div>
        </div>
        <div className='h-px w-full bg-foreground/[0.07]' />
        <div className='flex flex-col items-center gap-4'>
          <p className='font-mono text-[10px] font-bold tracking-[0.2em] text-primary'>
            MATCH STARTS IN
          </p>
          <div className='flex items-center gap-6'>
            <CountdownUnit val={NEXT_MATCH.countdownDays} label='DAYS' />
            <CountdownUnit val={NEXT_MATCH.countdownHrs} label='HRS' />
            <CountdownUnit val={NEXT_MATCH.countdownMins} label='MINS' />
          </div>
          <Link
            href='/dashboard/tickets'
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90'
          >
            View Match Details
          </Link>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className='relative z-10 hidden md:flex items-stretch'>
        <div className='flex flex-1 flex-col justify-center px-8 py-6 gap-4'>
          <span className='w-fit rounded-full border border-foreground dark:border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest  dark:text-primary text-foreground'>
            NEXT MATCH
          </span>
          <div className='flex items-center gap-10'>
            <div className='flex flex-col items-center gap-2.5'>
              <TeamBadge code={NEXT_MATCH.team1Code} size='xl' />
              <span className='font-heading text-[12px] font-bold uppercase tracking-wide text-foreground'>
                {NEXT_MATCH.team1}
              </span>
            </div>
            <span className='font-heading text-2xl font-bold text-foreground/25'>
              VS
            </span>
            <div className='flex flex-col items-center gap-2.5'>
              <TeamBadge code={NEXT_MATCH.team2Code} size='xl' />
              <span className='font-heading text-[12px] font-bold uppercase tracking-wide text-foreground'>
                {NEXT_MATCH.team2}
              </span>
            </div>
            <div className='mx-2 h-16 w-px bg-foreground/10' />
            <div className='flex flex-col gap-3'>
              <div className='flex items-center gap-2.5 text-[13px] text-foreground/70'>
                <Calendar className='h-4 w-4 shrink-0 text-primary' />
                {NEXT_MATCH.date}
              </div>
              <div className='flex items-center gap-2.5 text-[13px] text-foreground/70'>
                <Clock className='h-4 w-4 shrink-0 text-primary' />
                {NEXT_MATCH.time}
              </div>
              <div className='flex items-start gap-2.5 text-[13px] text-foreground/70'>
                <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                <span>
                  {NEXT_MATCH.venue}
                  <br />
                  <span className='text-[12px] text-foreground/45'>
                    {NEXT_MATCH.city}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center gap-5 border-l border-foreground/[0.07] px-8 py-7 min-w-65'>
          <p className='font-mono text-[10px] font-bold tracking-[0.2em] dark:text-primary text-foreground'>
            MATCH STARTS IN
          </p>
          <div className='flex  items-center gap-6'>
            <CountdownUnit val={NEXT_MATCH.countdownDays} label='DAYS' />
            <CountdownUnit val={NEXT_MATCH.countdownHrs} label='HRS' />
            <CountdownUnit val={NEXT_MATCH.countdownMins} label='MINS' />
          </div>
          <Link
            href='/dashboard/tickets'
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90'
          >
            View Match Details
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
