'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Star,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  TicketIcon,
  Gift,
} from 'lucide-react'
import { INBOX_MESSAGES, type InboxMessage } from '@/store/dashboard'
import {
  InboxLeftPanel,
  InboxTab,
} from '@/components/dashboard/inbox/inbox-left-panel'
import { InboxRightSidebar } from '@/components/dashboard/inbox/inbox-right-sidebar'

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
}

const BODY_LIMIT = 200

function QrCodeIcon() {
  return (
    <svg
      className='h-4 w-4'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
    >
      <rect x='3' y='3' width='5' height='5' />
      <rect x='16' y='3' width='5' height='5' />
      <rect x='3' y='16' width='5' height='5' />
      <path d='M21 16h-3v3h3M21 21v-2M13 3v5h5M13 8v1M13 21v-5h5M18 21v-2M13 13h3v3M13 13v3' />
    </svg>
  )
}

export function InboxClient() {
  const [activeTab, setActiveTab] = useState<InboxTab>('All')
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage>(
    INBOX_MESSAGES[0],
  )
  const [expanded, setExpanded] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  useEffect(() => {
    setExpanded(false)
  }, [selectedMsg.id])

  const body = selectedMsg.preview ?? ''
  const isLong = body.length > BODY_LIMIT
  const display = expanded ? body : body.slice(0, BODY_LIMIT)

  function handleSelectMsg(msg: InboxMessage) {
    setSelectedMsg(msg)
    setMobileView('detail')
  }

  return (
    <div className='flex flex-col'>
      {/* Page header */}
      <div className='border-b border-border px-4 sm:px-6 py-4 sm:py-5'>
        <h1 className='font-heading text-xl sm:text-2xl font-bold text-foreground'>
          Inbox
        </h1>
        <p className='mt-1 text-[12px] sm:text-[13px] text-muted-foreground'>
          All your matchday updates, tickets and travel info in one place.
        </p>
      </div>

      {/* 3-column layout */}
      <div className='flex items-start'>
        {/*
          Column 1 — message list
          Mobile: full width, shown only when mobileView === 'list'
          Desktop (md+): fixed 288px, always visible
        */}
        <div
          className={[
            'shrink-0 border-r border-border',
            'md:block md:w-72',
            mobileView === 'list' ? 'block w-full' : 'hidden',
          ].join(' ')}
        >
          <InboxLeftPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedMsg={selectedMsg}
            setSelectedMsg={handleSelectMsg}
          />
        </div>

        {/*
          Column 2 — message detail
          Mobile: full width, shown only when mobileView === 'detail'
          Desktop (md+): flex-1, always visible
        */}
        <motion.div
          key={selectedMsg.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={[
            'min-w-0 border-r border-border',
            'md:block md:flex-1',
            mobileView === 'detail' ? 'block w-full' : 'hidden',
          ].join(' ')}
        >
          {/* Toolbar */}
          <div className='flex items-center border-b border-border px-4 sm:px-5 py-3 gap-2'>
            {/* Back button — mobile only */}
            <button
              onClick={() => setMobileView('list')}
              className='flex items-center gap-1 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden'
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='font-heading text-[12px] font-semibold'>
                Back
              </span>
            </button>

            <div className='flex items-center gap-2 ml-auto md:ml-0'>
              <button className='rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'>
                <Star className='h-4 w-4' />
              </button>
              <button className='rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'>
                <Trash2 className='h-4 w-4' />
              </button>
              <button className='rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'>
                <MoreHorizontal className='h-4 w-4' />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='p-4 sm:p-6'>
            <h2 className='font-heading text-lg sm:text-xl font-bold text-foreground'>
              {selectedMsg.title}
            </h2>
            <p className='mt-1 font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
              {selectedMsg.date} · {selectedMsg.time}
            </p>

            {/* Match ticket card */}
            {selectedMsg.type === 'ticket' && (
              <div className='mt-4 overflow-hidden rounded-2xl border border-border bg-card'>
                <div
                  className='flex items-center justify-center gap-6 sm:gap-8 py-5 sm:py-6'
                  style={{
                    background: 'linear-gradient(180deg,#0d1a0d,#050a05)',
                  }}
                >
                  <img
                    src={TEAM_BADGES['FCB']}
                    alt='FC Barcelona'
                    className='h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-xl'
                  />
                  <span className='font-heading text-lg sm:text-xl font-bold text-white/30'>
                    VS
                  </span>
                  <img
                    src={TEAM_BADGES['RMA']}
                    alt='Real Madrid'
                    className='h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-xl'
                  />
                </div>
                <div className='p-4'>
                  <p className='font-mono text-[10px] text-muted-foreground'>
                    La Liga
                  </p>
                  <p className='font-heading text-[14px] sm:text-base font-bold text-foreground'>
                    FC Barcelona vs Real Madrid
                  </p>
                  <div className='mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-2'>
                    <span>📅 Sat, 25 May 2024 · 8:00 PM</span>
                    <span>📍 Spotify Camp Nou, Barcelona, Spain</span>
                  </div>
                  <button className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-heading text-[12px] sm:text-[13px] font-bold text-background transition-opacity hover:opacity-90'>
                    View Ticket <QrCodeIcon />
                  </button>
                </div>
              </div>
            )}

            {/* Message body */}
            <div className='mt-5 space-y-3'>
              <p className='font-heading text-sm text-foreground'>
                Hi Adewale,
              </p>
              <p className='text-[12px] sm:text-[13px] leading-relaxed text-muted-foreground'>
                {display}
                {isLong && !expanded && '...'}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className='font-heading text-[12px] font-bold text-primary hover:underline'
                >
                  {expanded ? 'See less' : 'See more'}
                </button>
              )}
              {selectedMsg.type === 'ticket' && (
                <>
                  <p className='pt-1 font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                    What's inside?
                  </p>
                  {[
                    'Your QR code & seat details',
                    'Stadium entry information',
                    'Transport & parking guide',
                    'Important matchday tips',
                  ].map((item) => (
                    <div
                      key={item}
                      className='flex items-center gap-2 text-[11px] sm:text-[12px] text-foreground'
                    >
                      <Check className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary' />
                      {item}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Travel CTA */}
            <div
              className='mt-6 overflow-hidden rounded-2xl border border-border'
              style={{ background: 'linear-gradient(135deg,#0d1a0d,#050a05)' }}
            >
              <div className='flex items-center gap-4 p-4'>
                <div className='flex-1'>
                  <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                    Need anything for your trip?
                  </p>
                  <p className='mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground'>
                    Book hotels, flights, eSIM and more.
                  </p>
                  <Link
                    href='/dashboard/travel'
                    className='mt-2 inline-flex items-center gap-1 font-heading text-[11px] sm:text-[12px] font-bold text-primary'
                  >
                    Explore Travel <ChevronRight className='h-3.5 w-3.5' />
                  </Link>
                </div>
                <div className='h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl'>
                  <img
                    src='https://images.unsplash.com/photo-1581553673739-c4906b5d0de8?w=200&q=70'
                    alt='luggage'
                    className='h-full w-full object-cover'
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Column 3 — right sidebar (xl only, unchanged) */}
        <InboxRightSidebar />
      </div>

      {/* Bottom banner */}
      <div
        className='border-t border-border'
        style={{ background: 'linear-gradient(135deg,#0d1a0d,#050a05)' }}
      >
        <div className='relative overflow-hidden px-4 sm:px-6 py-4 sm:py-3'>
          <div
            className='pointer-events-none absolute inset-y-0 right-0 w-40 sm:w-56 opacity-50'
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&q=60)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='pointer-events-none absolute inset-y-0 right-0 w-56 sm:w-72 bg-linear-to-l from-transparent to-[#0d1a0d]' />

          <div className='relative z-10 flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h3 className='font-heading text-[13px] sm:text-[14px] font-bold leading-snug text-foreground'>
                More matches. More memories. More rewards.
              </h3>
              <p className='mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground'>
                Attend more matches and unlock exclusive perks.
              </p>
              <button className='mt-2.5 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-heading text-[11px] sm:text-[12px] font-bold text-background transition-opacity hover:opacity-90'>
                Explore Matches <ArrowRight className='h-3.5 w-3.5' />
              </button>
            </div>
            <div className='hidden sm:flex items-center gap-2'>
              {[
                { icon: TicketIcon, label: 'Attend' },
                { icon: Star, label: 'Earn Points' },
                { icon: Gift, label: 'Unlock Rewards' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={label} className='flex items-center gap-2'>
                  <div className='flex flex-col items-center gap-1'>
                    <div className='flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border/50 bg-white/5 backdrop-blur-sm'>
                      <Icon className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground' />
                    </div>
                    <span className='whitespace-nowrap font-heading text-[9px] font-semibold text-muted-foreground'>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <ArrowRight className='mb-3 h-3 w-3 shrink-0 text-muted-foreground' />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
