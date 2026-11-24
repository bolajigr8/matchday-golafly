'use client'

import { Suspense } from 'react'
import { MatchHero, type HeroSearch } from '@/components/matches/match-hero'
import { TrendingTournaments } from '@/components/home/featured-clubs'
import { useMatchesSearchNavigate } from '@/features/matchday/use-matches-search'
import { useLiveMatchCache } from '@/store/live-match-cache'
import { WorldCupSection } from '@/components/matches/world-cup-section'
import { EliteMatchesSection } from '@/components/matches/elite-matches-section'
import { LiveFixturesSection } from '@/components/matches/live-fixtures-section'
import { TeamsStrip } from '@/components/matches/teams-strip'
import { WhyGolafly, TrustStrip } from '@/components/matches/why-trust'
import { MatchCta } from '@/components/matches/match-cta'
import { VipEntryBand } from '@/components/vip/entry-band'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { priceToNumber } from '@/features/cart/context'
import { enterBuilder } from '@/features/builder/enter'
import { isMatchdayLive } from '@/features/matchday/config'
import type { WcMatch, ClubMatch } from '@/store/matches'
import type { MatchdayEvent } from '@/features/matchday/types'

export default function MatchesClient() {
  const router = useRouter()
  const live = isMatchdayLive()

  // Hero search -> /matches?… (shared with the home hero search).
  const navigateToSearch = useMatchesSearchNavigate()

  /* Booking a match opens the matchday builder (Seats → Extras →
     Checkout → Confirmed), carrying the fixture through every step. */
  const handleBook = (m: WcMatch | ClubMatch) => {
    const price = priceToNumber(m.priceFrom)
    if (!price) {
      toast('This fixture is sold out', {
        description: `${m.home} vs ${m.away}`,
      })
      return
    }
    enterBuilder(router, m.id)
  }

  /* Live equivalent: the id IS the real MatchDay event_id (as a string),
     already seeded into store/live-match-cache.ts by LiveFixturesSection
     as it loaded, so useBuilderMatch() resolves it instantly on the next
     page. See features/builder/use-builder-match.ts. */
  const handleBookLive = (event: MatchdayEvent) => {
    if (event.postponed) {
      toast('This fixture has been postponed', {
        description: `${event.team1.name} vs ${event.team2.name}`,
      })
      return
    }
    enterBuilder(router, String(event.id), {
      title: `${event.team1.name} vs ${event.team2.name}`,
    })
  }

  // Hero search: results update in place in LiveFixturesSection, which
  // reads the params from the URL (see features/matchday/use-matches-search).
  const handleSearch = (search: HeroSearch) => {
    const { q, date } = search
    navigateToSearch(search)
    if (!q.trim() && !date) toast('Showing all matches')
    // Same-route navigation does not scroll — bring the results into view.
    requestAnimationFrame(() =>
      document
        .getElementById('matches')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  const upsertLive = useLiveMatchCache((s) => s.upsert)
  const handleHeroBook = (event: MatchdayEvent) => {
    upsertLive(event)
    handleBookLive(event)
  }

  /* Scrolls down to the live fixtures / matches grid. Falls back to a
     URL navigation with the #matches hash if the section isn't mounted
     yet for some reason (e.g. called before hydration settles). */
  const handleCheckAvailability = () => {
    const el = document.getElementById('matches')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push('/matches#matches')
    }
  }

  return (
    <div className='relative min-h-screen bg-background'>
      <MatchHero onSearch={handleSearch} onBook={handleHeroBook} />
      {live && (
        <div className='page-container pt-12 pb-4 sm:pt-16'>
          <TrendingTournaments />
        </div>
      )}
      <div id='matches'>
        {live ? (
          // Reads its filters with useSearchParams(), which needs a Suspense
          // boundary. Kept to this section so the rest of the page (hero
          // <h1> included) is in the server HTML.
          <Suspense fallback={<div className='min-h-[60vh]' />}>
            <LiveFixturesSection onBook={handleBookLive} />
          </Suspense>
        ) : (
          <>
            <WorldCupSection onBook={handleBook} />
            <EliteMatchesSection onBook={handleBook} />
          </>
        )}
      </div>
      {/* VIP Hospitality entry: the old /matches VIP section's slot. */}
      <VipEntryBand />
      <TeamsStrip />
      <WhyGolafly />
      <TrustStrip />
      <MatchCta onCheckAvailability={handleCheckAvailability} />
    </div>
  )
}
