'use client'

import Link from 'next/link'
import { Ticket, BedDouble, Plane, Smartphone } from 'lucide-react'
import { Routes } from '@/routes'

const PLATFORM_CARDS = [
  {
    icon: Ticket,
    title: 'Match Tickets',
    copy: 'Authentic tickets and hospitality packages for football’s biggest fixtures, sourced from vetted ticket sellers. You see the exact category and stand before you pay.',
  },
  {
    icon: BedDouble,
    title: 'Stays',
    copy: 'Hotels and apartments near the stadium, each with its cancellation window shown before checkout — not after.',
  },
  {
    icon: Plane,
    title: 'Flights & Transfers',
    copy: 'Add flights and private or shared airport and stadium transfers to your matchday in the same checkout as your tickets.',
  },
  {
    icon: Smartphone,
    title: 'eSIM',
    copy: 'Add an eSIM as a builder extra and land connected in the host country, with your e-tickets ready on your phone.',
  },
] as const

const PROMISES = [
  {
    label: 'Authentic Tickets',
    copy: 'Every ticket is sourced from vetted ticket sellers, with the category and stand shown before checkout.',
  },
  {
    label: 'Transparent Pricing',
    copy: 'The amount shown at checkout is the amount charged, in your selected currency, with no hidden conversion fees from Golafly.',
  },
  {
    label: 'Secure Payments',
    copy: 'Payments are processed by PCI-DSS compliant providers with 3-D Secure. Full card details are never stored on our servers.',
  },
  {
    label: 'Real Support',
    copy: 'Chat and email support, plus a priority WhatsApp concierge for hospitality and group bookings — faster on matchdays.',
  },
] as const

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className='inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary'>
      <span className='size-1.5 shrink-0 rounded-full bg-primary' />
      {children}
    </div>
  )
}

export function AboutClient() {
  return (
    <div className='min-h-screen bg-background'>
      {/* ── Hero ── */}
      <header className='relative overflow-hidden border-b border-border'>
        <div
          className='pointer-events-none absolute inset-0'
          style={{
            background:
              'radial-gradient(ellipse at 50% 120%, var(--brand-glow) 0%, transparent 60%)',
          }}
        />
        <div className='page-container relative pt-24 pb-14 sm:pt-32 sm:pb-20'>
          <div className='max-w-[780px]'>
            <Eyebrow>Golafly Match Day · About Us</Eyebrow>

            <h1 className='mt-4 font-heading text-4xl font-bold uppercase leading-[0.98] tracking-tight text-foreground sm:text-6xl'>
              Be there
              <br />
              <span className='text-primary'>on matchday.</span>
            </h1>

            <p className='mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Golafly Match Day is where fans get into the stadium. We sell
              authentic match tickets and hospitality for football’s biggest
              fixtures, and build the trip around them — stays, flights,
              transfers and eSIM — in a single checkout.
            </p>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link
                href={Routes.matches}
                className='inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wide text-primary-foreground transition-shadow hover:shadow-[0_0_20px_var(--brand-glow)] sm:w-auto'
              >
                Browse Matches
              </Link>
              <Link
                href={Routes.helpFaqs}
                className='inline-flex w-full items-center justify-center rounded-full border border-input px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto'
              >
                Help &amp; FAQs
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Story / Mission ── */}
      <section className='page-container py-14 sm:py-[72px]'>
        <div className='grid gap-12 sm:grid-cols-2 sm:gap-14'>
          <div>
            <Eyebrow>Our Story</Eyebrow>
            <h2 className='mt-4 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
              Born in the stands
            </h2>
            <p className='mt-4 text-base leading-relaxed text-muted-foreground'>
              Golafly started by moving footballers, families and fans — to
              trials, camps and matchdays across Europe. Along the way we saw
              how hard it is for a fan to get a genuine ticket: unofficial
              sellers, unclear seat categories, surprise fees and no plan for
              the rest of the trip.
            </p>
            <p className='mt-4 text-base leading-relaxed text-muted-foreground'>
              Golafly Match Day is our answer. We took the club and hospitality
              relationships we built through football tourism and opened them to
              every fan — so getting to the match is one booking, one account
              and one support team.
            </p>
          </div>
          <div>
            <Eyebrow>Our Mission</Eyebrow>
            <h2 className='mt-4 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
              Real tickets. Real matchdays.
            </h2>
            <p className='mt-4 text-base leading-relaxed text-muted-foreground'>
              Every fan should know exactly what they’re buying: the fixture,
              the stand, the category and the price, before they pay. We keep
              ticketing transparent and clear about club terms, cancellation
              rules and delivery dates.
            </p>
            <p className='mt-4 text-base leading-relaxed text-muted-foreground'>
              And when you need more than a seat, the matchday builder adds
              hospitality, stays, flights, transfers and connectivity so the
              whole trip works together.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform cards ── */}
      <section className='border-y border-border bg-muted/20 py-14 sm:py-[72px]'>
        <div className='page-container'>
          <Eyebrow>The Platform</Eyebrow>
          <h2 className='mt-4 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
            Everything a matchday needs
          </h2>

          <div className='mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            {PLATFORM_CARDS.map((c) => (
              <article
                key={c.title}
                className='rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_0_1px_var(--brand-glow)] sm:p-7'
              >
                <div className='mb-[18px] grid size-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary'>
                  <c.icon className='size-5' strokeWidth={1.8} />
                </div>
                <h3 className='font-heading text-lg font-semibold uppercase tracking-wide text-foreground'>
                  {c.title}
                </h3>
                <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                  {c.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promises ── */}
      <section className='page-container py-14 sm:py-[72px]'>
        <Eyebrow>Why Golafly Match Day</Eyebrow>
        <h2 className='mt-4 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
          Four promises on every booking
        </h2>
        <div className='mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {PROMISES.map((p) => (
            <div
              key={p.label}
              className='rounded-r-xl border border-l-2 border-border border-l-primary bg-muted/20 p-5 sm:p-[22px]'
            >
              <span className='block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-primary'>
                {p.label}
              </span>
              <p className='mt-2.5 text-sm leading-relaxed text-muted-foreground'>
                {p.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Golafly family band ── */}
      <section className='border-y border-border bg-muted/20 py-14 sm:py-[72px]'>
        <div className='page-container flex flex-col items-start gap-6 rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-8'>
          <div className='max-w-[620px]'>
            <h3 className='font-heading text-lg font-bold uppercase tracking-tight text-foreground'>
              Part of the Golafly family
            </h3>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
              Golafly Match Day sits alongside Golafly’s football tourism,
              player trials, sports marketing and player management programmes.
              Same team, same standards — with matchday tickets open to every
              fan.
            </p>
          </div>
          <Link
            href={Routes.footballTourism}
            className='inline-flex w-full shrink-0 items-center justify-center rounded-full border border-border px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto'
          >
            Explore Golafly Programs
          </Link>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className='page-container py-14 text-center sm:py-[72px]'>
        <h2 className='font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl'>
          Your next matchday starts here
        </h2>
        <p className='mx-auto mt-4 max-w-[560px] text-base text-muted-foreground'>
          Find your fixture, pick your seats and build the trip around it.
        </p>
        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href={Routes.matches}
            className='inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wide text-primary-foreground transition-shadow hover:shadow-[0_0_20px_var(--brand-glow)] sm:w-auto'
          >
            Browse Matches
          </Link>
        </div>
      </section>
    </div>
  )
}
