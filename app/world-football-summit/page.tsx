import type { Metadata } from 'next'
import { canonical, NO_INDEX } from '@/lib/seo'
import { getSummitEvent } from '@/features/summit/api'
import { SummitHero } from '@/components/summit/landing/hero'
import { SummitMarquee } from '@/components/summit/landing/marquee'
import { SummitPartnership } from '@/components/summit/landing/partnership'
import { SummitTicketTrip } from '@/components/summit/landing/ticket-trip'
import { SummitWhyAttend } from '@/components/summit/landing/why-attend'
import { SummitFinalCta } from '@/components/summit/landing/final-cta'

/* World Football Summit landing page (Figma "WFS London · 1 · Landing").
   Not linked from the site and kept out of search engines until launch. */
export const metadata: Metadata = {
  alternates: canonical('/world-football-summit'),
  title: 'World Football Summit London 2027: Tickets, Flights & Hotel | Golafly',
  description:
    'Book your World Football Summit London ticket with flights and a hotel by the river in one booking. 10 & 11 March 2027, Fulham Pier, Craven Cottage.',
  robots: NO_INDEX,
}

export default async function SummitLandingPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams
  const initial = getSummitEvent(event)?.key ?? 'london'
  return (
    <>
      <SummitHero initialEvent={initial} />
      <SummitMarquee />
      <SummitPartnership />
      <SummitTicketTrip />
      <SummitWhyAttend />
      <SummitFinalCta />
    </>
  )
}
