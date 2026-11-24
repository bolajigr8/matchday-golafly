'use client'

// "About Us" — restyled from footballticketnet.com's homepage section
// (trust-bullet strip + CTA), using Golafly's own color tokens
// (bg-primary / text-primary / bg-card / border-border) so it matches
// the rest of the site instead of footballticketnet's teal.
//
// ⚠ FLAGGED: two bullets ("Teams" and "Tournaments" counts) pull real
// numbers from GET /teams and GET /tournaments. The rest are hand-written
// brand/trust copy, not something any API returns. The original reference
// design had an "Established 2012" bullet — removed here since Golafly is
// a new platform and that claim would be false. EDIT THESE STRINGS to
// match your actual operational facts before shipping.

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Clock,
  Lock,
  Headset,
  BadgeCheck,
  Heart,
  ArrowRight,
} from 'lucide-react'
import {
  useMatchdayTeams,
  useMatchdayTournaments,
} from '@/features/matchday/hooks'
import { SectionHead } from './section-head'

// ⚠ STATIC brand copy — edit to match Golafly's real claims.
const BULLETS = [
  {
    icon: Heart,
    title: 'Built by Fans, for Fans',
    body: 'A platform, built the right way from day one.',
  },
  {
    icon: BadgeCheck,
    title: '100% Verified Tickets',
    body: 'Every ticket is checked before delivery.',
  },
  {
    icon: ShieldCheck,
    title: '150% Order Guarantee',
    body: 'Money-back guarantee on every order.',
  },
  {
    icon: Clock,
    title: '100% Delivery in Time',
    body: 'Tickets always arrive before kickoff.',
  },
  {
    icon: Lock,
    title: '100% Secured Transaction',
    body: 'Payment encrypted end-to-end.',
  },
  {
    icon: Headset,
    title: 'Skilled Support',
    body: 'Multilingual, 24/7 availability.',
  },
] as const

export function AboutSection() {
  const { data: teams } = useMatchdayTeams()
  const { data: tournaments } = useMatchdayTournaments()

  return (
    <section className='overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-10 sm:py-16'>
      <SectionHead
        eyebrow='About Us'
        title={
          <>
            Trusted by fans <span className='text-primary'>globally</span>
          </>
        }
        subtitle={`${
          teams?.length ? `${teams.length} teams` : 'Thousands of teams'
        } · ${
          tournaments?.length
            ? `${tournaments.length} competitions`
            : 'dozens of competitions'
        } on sale right now.`}
      />

      {/* Two-column list of bullets, left-aligned, icon + title + body stacked */}
      <div className='mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-x-12 gap-y-7 text-left sm:mt-12 sm:grid-cols-2'>
        {BULLETS.map((b, i) => (
          <motion.div
            key={b.title}
            className='flex items-start gap-3'
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <b.icon className='mt-0.5 size-5 shrink-0 text-primary' />
            <div>
              <p className='font-heading text-sm font-bold text-primary'>
                {b.title}
              </p>
              <p className='mt-0.5 text-sm text-muted-foreground'>{b.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className='mt-10 sm:mt-12'>
        <button
          type='button'
          className='inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02]'
        >
          Read more about us
          <ArrowRight className='size-4' />
        </button>
      </div>
    </section>
  )
}
