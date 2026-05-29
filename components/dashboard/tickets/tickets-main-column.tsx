'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  QrCode,
  FileText,
  SlidersHorizontal,
  Plane,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_TICKETS, type DashboardTicket } from '@/store/dashboard'

type Tab = 'Upcoming' | 'Past' | 'Cancelled'

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
  MCI: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
  MUN: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/120px-Manchester_United_FC_crest.svg.png',
  ACM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/500px-Logo_of_AC_Milan.svg.png',
  JUV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg/330px-Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg.png',
}

function Crest({ code }: { code: string }) {
  const src = TEAM_BADGES[code]
  if (src) {
    return (
      <img
        src={src}
        alt={code}
        width={72}
        height={72}
        className='object-contain drop-shadow-xl'
        style={{ width: 72, height: 72 }}
      />
    )
  }
  return (
    <div className='flex h-18 w-18 items-center justify-center rounded-full border border-border bg-card font-heading text-[11px] font-bold text-foreground'>
      {code}
    </div>
  )
}

function TicketCard({
  ticket,
  index,
}: {
  ticket: DashboardTicket
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.38 }}
      className='overflow-hidden rounded-2xl border border-border bg-card'
    >
      {/* Header row */}
      <div className='flex items-center justify-between px-5 pt-4 pb-0'>
        <div className='flex items-center gap-2 font-mono text-[11px] text-muted-foreground'>
          <span>{ticket.date}</span>
          <span>·</span>
          <span>{ticket.time}</span>
        </div>
        <div className='flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary' />
          {ticket.status}
        </div>
      </div>

      {/* Stadium + teams panel */}
      <div
        className='relative mx-4 mt-3 flex items-center justify-center gap-8 overflow-hidden rounded-xl py-7'
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className='absolute inset-0'
          style={{
            background:
              'linear-gradient(180deg,rgba(3,9,3,0.88) 0%,rgba(3,9,3,0.80) 100%)',
          }}
        />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card/60 to-transparent' />

        <div className='relative z-10 flex flex-col items-center gap-2.5'>
          <Crest code={ticket.team1Code} />
          <span className='font-heading text-[11px] font-bold uppercase tracking-wide text-white'>
            {ticket.team1}
          </span>
        </div>

        <span className='relative z-10 font-heading text-xl font-bold text-white/30'>
          VS
        </span>

        <div className='relative z-10 flex flex-col items-center gap-2.5'>
          <Crest code={ticket.team2Code} />
          <span className='font-heading text-[11px] font-bold uppercase tracking-wide text-white'>
            {ticket.team2}
          </span>
        </div>
      </div>

      {/* Venue row */}
      <div className='flex items-center justify-center gap-1.5 py-3 text-[12px] text-muted-foreground'>
        <MapPin className='h-3.5 w-3.5 text-primary' />
        <span>{ticket.venue}</span>
        <span className='text-border'>·</span>
        <span>{ticket.city}</span>
      </div>

      {/* Ticket details grid */}
      <div className='mx-4 mb-4 rounded-xl border border-border/50 bg-background/40 px-4 py-3'>
        <div className='grid grid-cols-3 gap-4'>
          <div>
            <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
              Ticket ID
            </p>
            <p className='mt-0.5 font-mono text-[11px] font-bold text-foreground'>
              {ticket.ticketId}
            </p>
          </div>
          <div>
            <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
              Seat
            </p>
            <p className='mt-0.5 font-mono text-[11px] font-bold text-foreground'>
              {ticket.seat}
            </p>
          </div>
          <div>
            <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
              Gate
            </p>
            <p className='mt-0.5 font-mono text-[11px] font-bold text-foreground'>
              {ticket.gate}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex gap-2 border-t border-border px-4 py-3'>
        <button className='flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 font-heading text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary'>
          <QrCode className='h-3.5 w-3.5' /> View QR Code
        </button>
        <button className='flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 font-heading text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary'>
          <FileText className='h-3.5 w-3.5' /> Ticket Details
        </button>
        <button className='flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 font-heading text-[11px] font-bold text-background transition-opacity hover:opacity-90'>
          <ChevronRight className='h-3.5 w-3.5' /> Match Info
        </button>
      </div>
    </motion.div>
  )
}

export function TicketsMainColumn() {
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming')

  const addOns = [
    {
      label: 'Airport Lounge Access',
      sub: 'Relax before your flight with premium lounge access.',
      price: '$45',
      color: 'text-[#C084FC]',
    },
    {
      label: 'Stadium Transfer',
      sub: 'Hassle-free transfers to and from the stadium.',
      price: '$25',
      color: 'text-[#34D399]',
    },
    {
      label: 'Matchday Hospitality',
      sub: 'Premium seats, food & drinks and VIP experience.',
      price: '$159',
      color: 'text-[#60A5FA]',
    },
  ]

  return (
    <div className='space-y-5'>
      {/* Tabs + sort */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex gap-0 border-b border-border'>
          {(['Upcoming', 'Past', 'Cancelled'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 font-heading text-[13px] font-semibold transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-mono text-[11px] text-foreground'>
            Sort by: Upcoming{' '}
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </div>
          <button className='rounded-xl border border-border bg-card p-2'>
            <SlidersHorizontal className='h-4 w-4 text-muted-foreground' />
          </button>
        </div>
      </div>

      {/* Ticket cards */}
      {activeTab === 'Upcoming' && (
        <div className='space-y-4'>
          {DASHBOARD_TICKETS.map((t, i) => (
            <TicketCard key={t.id} ticket={t} index={i} />
          ))}
        </div>
      )}

      {activeTab !== 'Upcoming' && (
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center'>
          <p className='font-heading text-base font-bold text-foreground'>
            No {activeTab.toLowerCase()} tickets
          </p>
          <p className='text-[12px] text-muted-foreground'>
            Your {activeTab.toLowerCase()} tickets will appear here.
          </p>
        </div>
      )}

      {/* Heading to game banner */}
      <div
        className='relative overflow-hidden rounded-2xl border border-border'
        style={{ background: 'linear-gradient(135deg, #0d1a0d, #050a05)' }}
      >
        <div
          className='pointer-events-none absolute inset-y-0 right-0 w-1/2'
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=60)',
            backgroundSize: 'cover',
            backgroundPosition: 'center left',
          }}
        />
        <div className='pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-linear-to-l from-transparent to-[#0d1a0d]' />

        <div className='relative z-10 flex items-center gap-4 p-5'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10'>
            <Plane className='h-6 w-6 text-primary' />
          </div>
          <div className='flex-1'>
            <p className='font-heading text-base font-bold text-foreground'>
              Heading to the game?
            </p>
            <p className='mt-0.5 text-[12px] text-muted-foreground'>
              Plan your trip and get the best deals on hotels, flights and more.
            </p>
            <Link
              href='/dashboard/travel'
              className='mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-heading text-[12px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary'
            >
              Explore Travel Options <ChevronRight className='h-3.5 w-3.5' />
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Add-ons */}
      <section className='space-y-3'>
        <div>
          <h2 className='font-heading text-[16px] font-bold text-foreground'>
            Recommended Add-ons
          </h2>
          <p className='text-[12px] text-muted-foreground'>
            Make your matchday even better
          </p>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {addOns.map((a) => (
            <div
              key={a.label}
              className='rounded-2xl border border-border bg-card p-4'
            >
              <div className='mb-3 h-8 w-8 rounded-lg bg-primary/10' />
              <p className='font-heading text-[13px] font-bold text-foreground'>
                {a.label}
              </p>
              <p className='mt-1 text-[11px] text-muted-foreground'>{a.sub}</p>
              <div className='mt-3 flex items-center justify-between'>
                <span className={cn('font-heading text-sm font-bold', a.color)}>
                  From {a.price}
                </span>
                <button className='flex h-7 w-7 items-center justify-center rounded-full bg-primary'>
                  <ChevronRight className='h-3.5 w-3.5 text-background' />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className='flex w-full items-center justify-center gap-1.5 font-mono text-[12px] font-bold text-primary'>
          View All Add-ons <ChevronRight className='h-3.5 w-3.5' />
        </button>
      </section>
    </div>
  )
}
