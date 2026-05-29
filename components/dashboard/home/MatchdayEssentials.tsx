'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Ticket as TicketIcon,
  BedDouble,
  Plane,
  Wifi,
  ChevronRight,
  Grid2x2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_TICKETS } from '@/store/dashboard'

interface EssentialCardProps {
  badgeCount?: number
  icon: React.ElementType
  title: string
  imageUrl: string
  line1: string
  line2?: string
  line3?: string
  ctaLabel: string
  ctaStyle: 'primary' | 'hotel' | 'flight' | 'esim'
  index: number
}

function EssentialCard({
  badgeCount,
  icon: Icon,
  title,
  imageUrl,
  line1,
  line2,
  line3,
  ctaLabel,
  ctaStyle,
  index,
}: EssentialCardProps) {
  const ctaAccent =
    ctaStyle === 'primary'
      ? ''
      : ctaStyle === 'hotel'
        ? 'text-[#C084FC]'
        : ctaStyle === 'flight'
          ? 'text-[#60A5FA]'
          : 'text-[#34D399]'

  const ctaIconAccent =
    ctaStyle === 'primary'
      ? 'bg-background/20 text-background'
      : ctaStyle === 'hotel'
        ? 'bg-[#C084FC]/20 text-[#C084FC]'
        : ctaStyle === 'flight'
          ? 'bg-[#60A5FA]/20 text-[#60A5FA]'
          : 'bg-[#34D399]/20 text-[#34D399]'

  const iconAccent =
    ctaStyle === 'primary'
      ? 'text-primary'
      : ctaStyle === 'hotel'
        ? 'text-[#C084FC]'
        : ctaStyle === 'flight'
          ? 'text-[#60A5FA]'
          : 'text-[#34D399]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 + index * 0.06, duration: 0.38 }}
      className='flex flex-col overflow-hidden rounded-2xl border border-border bg-card'
      whileHover={{ y: -2 }}
    >
      {/* Card header */}
      <div className='flex items-center gap-2 px-3 py-2.5'>
        <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconAccent)} />
        <span className='font-heading text-[12px] sm:text-[13px] font-semibold text-foreground'>
          {title}
        </span>
        {badgeCount != null && (
          <span className='ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-background'>
            {badgeCount}
          </span>
        )}
      </div>

      {/* Image — shorter on mobile */}
      <div className='relative h-28 sm:h-40 w-full overflow-hidden'>
        <img
          src={imageUrl}
          alt={title}
          className='h-full w-full object-cover'
        />
        <div className='absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card/80 to-transparent' />
      </div>

      {/* Text */}
      <div className='flex flex-1 flex-col px-3 pb-1 pt-2.5'>
        <p className='font-heading text-[11px] sm:text-[13px] font-bold leading-tight text-foreground'>
          {line1}
        </p>
        {line2 && (
          <p className='mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug'>
            {line2}
          </p>
        )}
        {line3 && (
          <p className='text-[10px] sm:text-[11px] text-muted-foreground leading-snug'>
            {line3}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className='px-3 pb-3 pt-2'>
        {ctaStyle === 'primary' ? (
          <button className='flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 sm:py-2.5 font-heading text-[11px] sm:text-[13px] font-bold text-background transition-opacity hover:opacity-90'>
            {ctaLabel}
            <Grid2x2 className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
          </button>
        ) : (
          <button className='flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 sm:py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/30'>
            <span
              className={cn(
                'font-heading text-[11px] sm:text-[13px] font-bold',
                ctaAccent,
              )}
            >
              {ctaLabel}
            </span>
            <span
              className={cn(
                'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg',
                ctaIconAccent,
              )}
            >
              <ArrowRight className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
            </span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

function SectionHeader({
  title,
  action,
  actionHref = '#',
}: {
  title: string
  action?: string
  actionHref?: string
}) {
  return (
    <div className='flex items-center justify-between'>
      <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
        {title}
      </h2>
      {action && (
        <Link
          href={actionHref}
          className='flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-muted-foreground transition-colors hover:text-foreground'
        >
          {action} <ChevronRight className='h-3 w-3' />
        </Link>
      )}
    </div>
  )
}

const ESSENTIALS_IMAGES = {
  tickets:
    'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=600&q=80',
  hotel:
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  flight:
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
  esim: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
}

export function MatchdayEssentials() {
  const ticket = DASHBOARD_TICKETS[0]

  return (
    <section className='space-y-4'>
      <SectionHeader
        title='Your Matchday Essentials'
        action='Manage All Bookings'
        actionHref='/dashboard/tickets'
      />
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <EssentialCard
          index={0}
          badgeCount={1}
          icon={TicketIcon}
          title='Tickets'
          imageUrl={ESSENTIALS_IMAGES.tickets}
          line1='Barcelona vs Real Madrid'
          line2={`${ticket.date.slice(0, 3)}, 25 May 2024 · 8:00 PM`}
          line3='Seat: Block 122, Row 12, Seat 15'
          ctaLabel='View Ticket'
          ctaStyle='primary'
        />
        <EssentialCard
          index={1}
          icon={BedDouble}
          title='Hotel'
          imageUrl={ESSENTIALS_IMAGES.hotel}
          line1='Hotel Arts Barcelona'
          line2='Check-in: 23 May 2024'
          line3='Check-out: 26 May 2024'
          ctaLabel='View Booking'
          ctaStyle='hotel'
        />
        <EssentialCard
          index={2}
          icon={Plane}
          title='Flight'
          imageUrl={ESSENTIALS_IMAGES.flight}
          line1='Lagos → Barcelona'
          line2='23 May 2024 · 1:20 PM'
          line3='Return: 27 May 2024 · 3:40 PM'
          ctaLabel='View Booking'
          ctaStyle='flight'
        />
        <EssentialCard
          index={3}
          icon={Wifi}
          title='eSIM'
          imageUrl={ESSENTIALS_IMAGES.esim}
          line1='Spain eSIM'
          line2='Data: 10GB'
          line3='Validity: 7 Days'
          ctaLabel='View eSIM'
          ctaStyle='esim'
        />
      </div>
    </section>
  )
}
