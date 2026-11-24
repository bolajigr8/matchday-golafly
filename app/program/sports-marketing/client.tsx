'use client'

import Hero from '@/components/sports-marketing/hero'
import { MarketingStats } from '@/components/sports-marketing/marketing-stats'
import { FanEngagementServices } from '@/components/sports-marketing/fan-engagement'
import { FinalCTA } from '@/components/sports-marketing/final-cta'

export function SportsMarketingClient() {
  return (
    <main>
      <Hero />
      <MarketingStats />
      <FanEngagementServices />
      <FinalCTA />
    </main>
  )
}
