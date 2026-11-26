'use client'

// Whether the Black Friday banners show right now (./black-friday.ts), and the
// promo dates to print on them. Closed on the server and during hydration, so
// the banners never cause a mismatch.

import { useSyncExternalStore } from 'react'
import { blackFridayOffer, blackFridayOpen } from './black-friday'
import { promoDatesLabel } from './pricing'
import { useMatchPromo } from './use-match-promo'

const noopSubscribe = () => () => {}

export function useBlackFriday(): { open: boolean; offer: boolean; dates: string | null } {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const promo = useMatchPromo()
  return {
    open: mounted && blackFridayOpen(promo),
    offer: mounted && blackFridayOffer(promo),
    dates: promoDatesLabel(promo),
  }
}
