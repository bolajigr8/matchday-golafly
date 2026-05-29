'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  ChevronRight,
  Plane,
  BedDouble,
  Wifi,
  Car,
  Headphones,
  Star,
  ArrowRight,
  Edit,
  Shield,
  Bell,
  CreditCard,
  Ticket as TicketIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TravelTab = 'Flights' | 'Hotels' | 'eSIM' | 'Transfers'

// ─── Data ──────────────────────────────────────────────────────────────────

const TEAM_BADGES: Record<string, string> = {
  FCB: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  RMA: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
}

const MATCH = {
  date: 'SAT, 25 MAY 2024',
  time: '8:00 PM',
  venue: 'Spotify Camp Nou',
  city: 'Barcelona, Spain',
  home: { code: 'FCB', name: 'FC BARCELONA' },
  away: { code: 'RMA', name: 'REAL MADRID' },
  countdown: { days: '03', hrs: '14', mins: '32' },
}

const FLIGHTS = [
  {
    id: 1,
    badge: 'Best Value',
    badgeCls: 'text-primary border-primary/40 bg-primary/10',
    airline: 'Turkish Airlines',
    color: '#E81932',
    initials: 'TK',
    depart: '10:20',
    arrive: '14:50',
    origin: 'LOS',
    dest: 'BCN',
    stops: '1 stop',
    duration: '10h 30m',
    price: 645,
  },
  {
    id: 2,
    badge: 'Fastest',
    badgeCls: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
    airline: 'Air France',
    color: '#002395',
    initials: 'AF',
    depart: '08:15',
    arrive: '13:10',
    origin: 'LOS',
    dest: 'BCN',
    stops: 'Direct',
    duration: '6h 55m',
    price: 912,
  },
  {
    id: 3,
    badge: 'Cheapest',
    badgeCls: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
    airline: 'Iberia',
    color: '#D91023',
    initials: 'IB',
    depart: '19:40',
    arrive: '12:20',
    origin: 'LOS',
    dest: 'BCN',
    stops: '1 stop',
    duration: '13h 40m',
    price: 598,
  },
]

const HOTELS = [
  {
    id: 1,
    badge: 'Popular',
    badgeCls: 'text-primary border-primary/40 bg-primary/10',
    name: 'Hotel Arts Barcelona',
    rating: 4.7,
    reviews: 1248,
    distance: '5.1 km to Camp Nou',
    price: 210,
    img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&q=80',
  },
  {
    id: 2,
    badge: 'Best Seller',
    badgeCls: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
    name: 'Melia Barcelona Sky',
    rating: 4.6,
    reviews: 982,
    distance: '4.3 km to Camp Nou',
    price: 165,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
  },
  {
    id: 3,
    badge: 'Great Value',
    badgeCls: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
    name: 'Catalonia Barcelona 505',
    rating: 4.4,
    reviews: 712,
    distance: '3.8 km to Camp Nou',
    price: 120,
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500&q=80',
  },
]

const ADD_ONS = [
  {
    icon: Wifi,
    label: 'eSIM',
    sub: 'Stay connected anywhere',
    price: '$8.99',
    cta: 'Get eSIM',
  },
  {
    icon: Car,
    label: 'Airport Transfer',
    sub: 'Hassle-free ride to hotel',
    price: '$28',
    cta: 'Book Now',
  },
  {
    icon: Plane,
    label: 'Matchday Shuttle',
    sub: 'Direct shuttle to stadium',
    price: '$15',
    cta: 'Book Now',
  },
  {
    icon: Shield,
    label: 'Travel Insurance',
    sub: 'Travel with peace of mind',
    price: '$12',
    cta: 'Get Covered',
  },
]

const TRUST = [
  { label: 'Secure Payments', sub: 'Your payment is safe and protected' },
  { label: 'Best Price Guarantee', sub: "Found a lower price? We'll match it" },
  { label: '24/7 Support', sub: "We're here anytime you need us" },
  { label: 'Trusted Partners', sub: 'We work with top airlines and hotels' },
]

const QUICK_ACTIONS = [
  {
    icon: TicketIcon,
    label: 'Manage Bookings',
    sub: 'View or modify your trips',
  },
  { icon: Star, label: 'Saved Items', sub: 'Your saved flights and hotels' },
  { icon: Bell, label: 'Price Alerts', sub: 'Get notified on price drops' },
  { icon: CreditCard, label: 'Payment Methods', sub: 'Manage your cards' },
]

// ─── Component 1: TravelHero ───────────────────────────────────────────────

export function TravelHero({
  activeTab,
  setActiveTab,
}: {
  activeTab: TravelTab
  setActiveTab: (t: TravelTab) => void
}) {
  const TABS: { key: TravelTab; Icon: React.ElementType }[] = [
    { key: 'Flights', Icon: Plane },
    { key: 'Hotels', Icon: BedDouble },
    { key: 'eSIM', Icon: Wifi },
    { key: 'Transfers', Icon: Car },
  ]

  return (
    <div className='space-y-4'>
      {/* Match hero */}
      <div
        className='overflow-hidden rounded-2xl border border-border p-5'
        style={{
          background: 'linear-gradient(135deg, #0d1a0d 0%, #050a05 100%)',
        }}
      >
        <p className='mb-4 text-center font-mono text-[11px] tracking-widest text-muted-foreground'>
          {MATCH.date} · {MATCH.time}
        </p>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          {/* Teams + venue */}
          <div className='flex flex-wrap items-center gap-5'>
            <div className='flex flex-col items-center gap-1.5'>
              <img
                src={TEAM_BADGES[MATCH.home.code]}
                alt={MATCH.home.name}
                className='h-14 w-14 object-contain'
              />
              <span className='font-heading text-[10px] font-bold text-foreground'>
                {MATCH.home.name}
              </span>
            </div>
            <span className='font-heading text-sm font-bold text-muted-foreground'>
              VS
            </span>
            <div className='flex flex-col items-center gap-1.5'>
              <img
                src={TEAM_BADGES[MATCH.away.code]}
                alt={MATCH.away.name}
                className='h-14 w-14 object-contain'
              />
              <span className='font-heading text-[10px] font-bold text-foreground'>
                {MATCH.away.name}
              </span>
            </div>
            <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
              <MapPin className='h-3.5 w-3.5 shrink-0 text-primary' />
              {MATCH.venue}, {MATCH.city}
            </div>
          </div>
          {/* Countdown + CTA */}
          <div className='flex items-center gap-5'>
            <div>
              <p className='font-mono text-[9px] tracking-widest text-primary'>
                MATCH STARTS IN
              </p>
              <div className='mt-1 flex gap-3'>
                {[
                  { v: MATCH.countdown.days, l: 'DAYS' },
                  { v: MATCH.countdown.hrs, l: 'HRS' },
                  { v: MATCH.countdown.mins, l: 'MINS' },
                ].map(({ v, l }) => (
                  <div key={l} className='text-center'>
                    <p className='font-heading text-2xl font-bold text-primary'>
                      {v}
                    </p>
                    <p className='font-mono text-[8px] tracking-widest text-muted-foreground'>
                      {l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <button className='flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-heading text-[12px] font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary'>
              View Match Details <ChevronRight className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs — only change: overflow-x-auto + scrollbar-hide + shrink-0 on buttons */}
      <div className='flex overflow-x-auto border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none'>
        {TABS.map(({ key, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 px-4 py-3 font-heading text-[13px] font-semibold transition-colors',
              activeTab === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className='h-3.5 w-3.5' />
            {key}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <div>
            <div className='flex items-center gap-2 font-heading text-[13px] font-bold text-foreground'>
              Lagos (LOS)
              <ArrowRight className='h-3.5 w-3.5 text-primary' />
              Barcelona (BCN)
            </div>
            <div className='mt-0.5 flex gap-2 font-mono text-[10px] text-muted-foreground'>
              <span>Murtala Muhammed Intl.</span>
              <span>·</span>
              <span>Barcelona El Prat Airport</span>
            </div>
          </div>
          <span className='h-8 w-px bg-border' />
          <div>
            <p className='font-heading text-[12px] font-semibold text-foreground'>
              24 – 27 May
            </p>
            <p className='font-mono text-[10px] text-muted-foreground'>
              3 Nights
            </p>
          </div>
          <span className='h-8 w-px bg-border' />
          <div>
            <p className='font-heading text-[12px] font-semibold text-foreground'>
              1 Traveler
            </p>
            <p className='font-mono text-[10px] text-muted-foreground'>
              Economy
            </p>
          </div>
          <button className='ml-auto flex items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 font-heading text-[12px] font-bold text-primary transition-colors hover:bg-primary/10'>
            <Edit className='h-3.5 w-3.5' /> Edit Search
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Component 2: TravelListings ───────────────────────────────────────────

export function TravelListings() {
  return (
    <div className='space-y-8'>
      {/* ── Recommended Flights ── */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-[16px] font-bold text-foreground'>
            Recommended Flights
          </h2>
          <button className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground'>
            View all flights <ArrowRight className='h-3 w-3' />
          </button>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {FLIGHTS.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className='rounded-2xl border border-border bg-card p-4'
            >
              <span
                className={cn(
                  'inline-block rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold',
                  f.badgeCls,
                )}
              >
                {f.badge}
              </span>
              <div className='mt-3 flex items-center gap-2.5'>
                <div
                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-[11px] font-bold text-white'
                  style={{ backgroundColor: f.color }}
                >
                  {f.initials}
                </div>
                <p className='font-heading text-[13px] font-bold text-foreground'>
                  {f.airline}
                </p>
              </div>
              <div className='mt-4 flex items-center justify-between'>
                <div>
                  <p className='font-heading text-xl font-bold text-foreground'>
                    {f.depart}
                  </p>
                  <p className='font-mono text-[10px] text-muted-foreground'>
                    {f.origin}
                  </p>
                </div>
                <div className='flex flex-col items-center gap-0.5'>
                  <p className='font-mono text-[9px] text-muted-foreground'>
                    {f.stops}
                  </p>
                  <div className='flex items-center gap-1'>
                    <div className='h-px w-7 bg-border' />
                    <Plane className='h-3 w-3 text-primary' />
                    <div className='h-px w-7 bg-border' />
                  </div>
                  <p className='font-mono text-[9px] text-muted-foreground'>
                    {f.duration}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-heading text-xl font-bold text-foreground'>
                    {f.arrive}
                  </p>
                  <p className='font-mono text-[10px] text-muted-foreground'>
                    {f.dest}
                  </p>
                </div>
              </div>
              <div className='mt-4 border-t border-border pt-3'>
                <p className='font-mono text-[10px] text-muted-foreground'>
                  From
                </p>
                <p className='font-heading text-xl font-bold text-foreground'>
                  ${f.price}{' '}
                  <span className='font-mono text-[10px] font-normal text-muted-foreground'>
                    per person
                  </span>
                </p>
                <button className='mt-3 w-full rounded-xl bg-primary py-2.5 font-heading text-[12px] font-bold text-background transition-opacity hover:opacity-90'>
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Recommended Hotels ── */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-[16px] font-bold text-foreground'>
            Recommended Hotels
          </h2>
          <button className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground'>
            View all hotels <ArrowRight className='h-3 w-3' />
          </button>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {HOTELS.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className='overflow-hidden rounded-2xl border border-border bg-card'
            >
              <div className='relative h-40'>
                <img
                  src={h.img}
                  alt={h.name}
                  className='h-full w-full object-cover'
                />
                <div className='absolute inset-0 bg-linear-to-t from-card/60 to-transparent' />
                <span
                  className={cn(
                    'absolute left-2 top-2 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold backdrop-blur-sm',
                    h.badgeCls,
                  )}
                >
                  {h.badge}
                </span>
              </div>
              <div className='p-4'>
                <p className='font-heading text-[14px] font-bold text-foreground'>
                  {h.name}
                </p>
                <div className='mt-1.5 flex items-center gap-1'>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={cn(
                        'h-3 w-3',
                        j < Math.floor(h.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-muted text-muted',
                      )}
                    />
                  ))}
                  <span className='ml-1 font-mono text-[10px] text-foreground'>
                    {h.rating}
                  </span>
                  <span className='font-mono text-[10px] text-muted-foreground'>
                    ({h.reviews.toLocaleString()})
                  </span>
                </div>
                <p className='mt-1 text-[11px] text-muted-foreground'>
                  {h.distance}
                </p>
                <div className='mt-3 flex items-center justify-between'>
                  <div>
                    <p className='font-mono text-[9px] text-muted-foreground'>
                      From
                    </p>
                    <p className='font-heading text-base font-bold text-foreground'>
                      ${h.price}
                      <span className='font-mono text-[10px] font-normal text-muted-foreground'>
                        {' '}
                        /night
                      </span>
                    </p>
                  </div>
                  <button className='rounded-xl bg-primary px-3 py-2 font-heading text-[11px] font-bold text-background transition-opacity hover:opacity-90'>
                    View Hotel
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Travel Add-ons ── */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-[16px] font-bold text-foreground'>
            Travel Add-ons
          </h2>
          <button className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground'>
            View all add-ons <ArrowRight className='h-3 w-3' />
          </button>
        </div>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {ADD_ONS.map(({ icon: Icon, label, sub, price, cta }) => (
            <div
              key={label}
              className='rounded-2xl border border-border bg-card p-4'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10'>
                <Icon className='h-5 w-5 text-primary' />
              </div>
              <p className='mt-3 font-heading text-[13px] font-bold text-foreground'>
                {label}
              </p>
              <p className='mt-0.5 text-[11px] text-muted-foreground'>{sub}</p>
              <p className='mt-2 font-mono text-[10px] text-muted-foreground'>
                From
              </p>
              <p className='font-heading text-sm font-bold text-foreground'>
                {price}
              </p>
              <button className='mt-2 flex items-center gap-1 font-heading text-[11px] font-bold text-primary'>
                {cta} <ArrowRight className='h-3 w-3' />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bundle & Save ── */}
      <div
        className='relative overflow-hidden rounded-2xl border border-border p-6'
        style={{
          background: 'linear-gradient(135deg, #0d1a0d 0%, #050a05 100%)',
        }}
      >
        <div
          className='absolute inset-0 opacity-15'
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=40)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className='relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='font-heading text-xl font-bold text-foreground'>
              Bundle & Save More ✨
            </h3>
            <p className='mt-1 text-[13px] text-muted-foreground'>
              Book your flight + hotel together and save up to{' '}
              <span className='font-bold text-primary'>15%</span>
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/50'>
              <Plane className='h-5 w-5 text-foreground' />
            </div>
            <span className='font-bold text-primary text-lg'>+</span>
            <div className='flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/50'>
              <BedDouble className='h-5 w-5 text-foreground' />
            </div>
            <span className='font-bold text-primary text-lg'>=</span>
            <div className='flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10'>
              <span className='text-lg'>🏷️</span>
            </div>
          </div>
          <button className='flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-heading text-[13px] font-bold text-background transition-opacity hover:opacity-90'>
            View Bundle Deals <ArrowRight className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {TRUST.map(({ label, sub }) => (
          <div
            key={label}
            className='flex items-start gap-2.5 rounded-xl border border-border bg-card p-3'
          >
            <div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] font-bold text-primary'>
              ✓
            </div>
            <div>
              <p className='font-heading text-[11px] font-bold text-foreground'>
                {label}
              </p>
              <p className='mt-0.5 text-[10px] text-muted-foreground'>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Component 3: TravelSidebar ────────────────────────────────────────────

export function TravelSidebar() {
  const TRIP_ITEMS = [
    { Icon: Plane, label: 'Flight', status: 'Not booked' },
    { Icon: BedDouble, label: 'Hotel', status: 'Not booked' },
    { Icon: Wifi, label: 'eSIM', status: 'Not added' },
    { Icon: Car, label: 'Transfers', status: 'Not added' },
  ]

  return (
    <aside className='space-y-4'>
      {/* Your Trip */}
      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div className='relative h-36'>
          <img
            src='https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500&q=80'
            alt='Barcelona'
            className='h-full w-full object-cover'
          />
          <div className='absolute inset-0 bg-linear-to-t from-card/95 via-card/30 to-transparent' />
          <div className='absolute bottom-3 left-3'>
            <p className='font-heading text-sm font-bold text-foreground'>
              Barcelona
            </p>
            <p className='font-mono text-[10px] text-muted-foreground'>
              24 May – 27 May 2024 · 3 Nights · 1 Traveler
            </p>
          </div>
        </div>
        <div className='p-4'>
          <h3 className='font-heading text-[14px] font-bold text-foreground'>
            Your Trip
          </h3>
          <div className='mt-3 space-y-2.5'>
            {TRIP_ITEMS.map(({ Icon, label, status }) => (
              <div key={label} className='flex items-center gap-2'>
                <Icon className='h-3.5 w-3.5 text-muted-foreground' />
                <span className='flex-1 text-[12px] text-foreground'>
                  {label}
                </span>
                <span className='font-mono text-[10px] text-muted-foreground'>
                  {status}
                </span>
              </div>
            ))}
          </div>
          <button className='mt-4 flex w-full items-center justify-center rounded-xl border border-border py-2.5 font-heading text-[12px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary'>
            View Itinerary
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='font-heading text-[14px] font-bold text-foreground'>
          Quick Actions
        </h3>
        <div className='mt-3 space-y-1'>
          {QUICK_ACTIONS.map(({ icon: Icon, label, sub }) => (
            <button
              key={label}
              className='flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted/40'
            >
              <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                <Icon className='h-3.5 w-3.5 text-primary' />
              </div>
              <div className='flex-1'>
                <p className='font-heading text-[12px] font-bold text-foreground'>
                  {label}
                </p>
                <p className='text-[10px] text-muted-foreground'>{sub}</p>
              </div>
              <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
            </button>
          ))}
        </div>
      </div>

      {/* Exclusive for fans */}
      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div
          className='relative h-24'
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=60)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-linear-to-b from-transparent to-card/90' />
        </div>
        <div className='p-4'>
          <p className='font-mono text-[10px] font-bold tracking-widest text-primary'>
            Exclusive for fans!
          </p>
          <p className='mt-1 font-heading text-[13px] font-bold text-foreground'>
            Get special travel deals only for Matchday members.
          </p>
          <button className='mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-heading text-[12px] font-bold text-background transition-opacity hover:opacity-90'>
            Explore Deals <ArrowRight className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      {/* Need help */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <p className='font-heading text-[13px] font-bold text-foreground'>
          Need help with your trip?
        </p>
        <p className='mt-0.5 text-[11px] text-muted-foreground'>
          Our travel experts are available 24/7.
        </p>
        <button className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 font-heading text-[12px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary'>
          <Headphones className='h-4 w-4' /> Contact Support
        </button>
      </div>
    </aside>
  )
}

// ─── Main TravelClient ─────────────────────────────────────────────────────

export function TravelClient() {
  const [activeTab, setActiveTab] = useState<TravelTab>('Flights')
  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='font-heading text-2xl font-bold text-foreground'>
          Travel
        </h1>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          Everything you need for your matchday trip.
        </p>
      </div>
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]'>
        <div className='space-y-6'>
          <TravelHero activeTab={activeTab} setActiveTab={setActiveTab} />
          <TravelListings />
        </div>
        <TravelSidebar />
      </div>
    </div>
  )
}
