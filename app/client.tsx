'use client'

import { HeroSection } from '@/components/home/hero-section'
import { StatsBand } from '@/components/home/stats-band'
import { ScoutingCampBand } from '@/components/home/scouting-camp-band'
import { TrendingTournaments, FeaturedTeams } from '@/components/home/featured-clubs'
import { PopularMatchesSection } from '@/components/home/popular-matches-section'
import { TravelCtaBand } from '@/components/home/travel-cta-band'
import { VipEntryBand } from '@/components/vip/entry-band'
import { UpcomingFixturesSection } from '@/components/home/upcoming-fixtures-section'
import { WhySection } from '@/components/home/why-section'
import { GolaflyFamilyBand } from '@/components/home/golafly-family-band'
import { SupportSection } from '@/components/home/support-section'
import { BlackFridayHero } from '@/components/promo/black-friday'

/* Home composition. Full-bleed bands (hero, camp, stats, travel, family) sit
   outside .page-container; everything else shares one vertical rhythm. */

const SECTION_STACK = 'page-container space-y-20 py-20 sm:space-y-24 sm:py-24 lg:space-y-28 lg:py-28'

export default function MatchdayClient() {
  return (
    <main className='relative min-h-screen bg-background'>
      <HeroSection />

      {/* Black Friday 2026 hero band (only during the sale) */}
      <BlackFridayHero />

      {/* Scouting Camp promo: Barcelona dates, CTA to the camp page */}
      <ScoutingCampBand />

      <div className={SECTION_STACK}>
        {/* Competition logo cards → /tournament/[id] */}
        <TrendingTournaments />
      </div>

      <StatsBand />

      <div className={SECTION_STACK}>
        {/* FTN-style tabbed fixture list, live from GET /events */}
        <PopularMatchesSection />
      </div>

      {/* VIP Hospitality entry (Figma 352:2691: "after What fans are
          booking now") */}
      <VipEntryBand />

      {/* Golafly Travel cross-sell: flights, stays, eSIM */}
      <TravelCtaBand />

      <div className={SECTION_STACK}>
        {/* Card grid of the next fixtures (after the ones listed above) */}
        <UpcomingFixturesSection />

        {/* Club crest cards → /team/[id] */}
        <FeaturedTeams />

        {/* Why Golafly */}
        <WhySection />
      </div>

      {/* The rest of the family, for players: Academy and the Scouting Camp */}
      <GolaflyFamilyBand />

      <div className='page-container py-20 sm:py-24 lg:py-28'>
        {/* FAQ preview + 24/7 support */}
        <SupportSection />
      </div>
    </main>
  )
}
