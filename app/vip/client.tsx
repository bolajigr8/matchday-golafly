'use client'

import { useState } from 'react'
import { VipCabinSection } from '@/components/vip/cabin-section'
import { VipCompleteTrip } from '@/components/vip/complete-trip'
import { VipHospitalityPackages } from '@/components/vip/hospitality-packages'
import { VipConciergeCta } from '@/components/vip/concierge-cta'
import { VipHero } from '@/components/vip/hero'
import { vipMatchKey } from '@/components/vip/hero-match-picker'
import { VipHowItWorks } from '@/components/vip/how-it-works'
import { VipPickMatch } from '@/components/vip/pick-match'
import { VipTrustStrip } from '@/components/vip/trust-strip'
import { VipWhy } from '@/components/vip/why-vip'
import { vipEventView } from '@/features/vip/clubs'
import { useVipAllEvents, useVipClubs, useVipListings } from '@/features/vip/hooks'
import { hospitalityCards } from '@/features/vip/landing'
import { vipFlowHref } from '@/features/vip/routes'

/* VIP Hospitality landing page, in Figma order: Hero → Trust strip → Pick
   your match → Hospitality → Cabin → Complete & summary → How it works →
   Why Golafly VIP → Concierge CTA. The matches, dates and "from" prices are
   the backend's (GET /hospitality/clubs, then each club's events). Steps
   2–4 are built on the soonest match: its real hospitality tickets (GET
   …/listings), the customer's cabin/airport/guests from the hero. A 404 on
   clubs means VIP packages are switched off. The site header and footer
   come from the root layout. */
export function VipClient({ initialClub }: { initialClub: string | null }) {
  const clubs = useVipClubs()
  const { events, loading, error } = useVipAllEvents(clubs.data)
  const matches = events.map(vipEventView)
  /* The hero's MATCH picker chooses the match steps 2–4 are built on;
     until then, the soonest. */
  const [picked, setPicked] = useState<string | null>(null)
  const featured = matches.find((m) => vipMatchKey(m) === picked) ?? matches[0] ?? null
  const listings = useVipListings(featured?.club ?? '', featured?.eventId ?? 0, !!featured)
  const cards = hospitalityCards(listings.data?.data ?? [])
  const [chosen, setChosen] = useState<string | null>(null)
  const pickMatch = (m: (typeof matches)[number]) => {
    setPicked(vipMatchKey(m))
    setChosen(null)
  }
  const selected = cards.find((c) => c.name === chosen) ?? cards[0] ?? null

  const failure = clubs.error ?? error
  const message = failure
    ? failure.status === 404
      ? 'VIP packages aren’t available right now. Check back soon.'
      : failure.message
    : null

  return (
    /* leading-[normal]: Figma's default line height, inherited by every
       section unless a component sets its own. */
    <div className='min-h-screen bg-vip-ink leading-[normal] text-vip-fg'>
      <VipHero match={featured} matches={matches} onPickMatch={pickMatch} />
      <VipTrustStrip />
      <VipPickMatch
        clubs={clubs.data ?? []}
        matches={matches}
        loading={!failure && (clubs.isLoading || loading)}
        message={message}
        initialClub={initialClub}
      />
      <VipHospitalityPackages
        match={featured}
        cards={cards}
        loading={listings.isLoading}
        selected={selected?.name ?? null}
        onSelect={setChosen}
      />
      <VipCabinSection
        match={featured}
        seatsHref={
          featured
            ? `${vipFlowHref(featured.club, featured.eventId, 'seats')}${selected ? `?category=${encodeURIComponent(selected.name)}` : ''}`
            : null
        }
      />
      <VipCompleteTrip match={featured} card={selected} />
      <VipHowItWorks className='border-t border-vip-line/7' />
      <VipWhy />
      <VipConciergeCta />
    </div>
  )
}
