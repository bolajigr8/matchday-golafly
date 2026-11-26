// features/promo/black-friday.ts
//
// When the Black Friday banners (components/promo/black-friday) show:
//
//   1. Match Promo (Admin → Settings → Match Promo) is switched on and today
//      is inside its dates. The daily slot count does not hide the banner;
//      it only decides whether a checkout still gets the discount.
//   2. Switch NEXT_PUBLIC_BLACK_FRIDAY:
//        unset / anything else → follow the Match Promo dates (live behaviour)
//        'off'                 → never show
//        'preview'             → always show (to review the design)
//   Never 'preview' on live. NEXT_PUBLIC_ values are fixed at build time:
//   redeploy after changing it.

import type { MatchPromo } from './types'

type Mode = 'auto' | 'off' | 'preview'
const RAW_MODE = process.env.NEXT_PUBLIC_BLACK_FRIDAY
export const BLACK_FRIDAY_MODE: Mode =
  RAW_MODE === 'off' ? 'off' : RAW_MODE === 'preview' ? 'preview' : 'auto'

export function blackFridayOpen(promo: MatchPromo | null): boolean {
  if (BLACK_FRIDAY_MODE === 'off') return false
  if (BLACK_FRIDAY_MODE === 'preview') return true
  return Boolean(promo?.is_running)
}

/** The free eSIM line on checkout. It still stops when today's slots are used up. */
export function blackFridayOffer(promo: MatchPromo | null): boolean {
  if (BLACK_FRIDAY_MODE === 'off') return false
  if (BLACK_FRIDAY_MODE === 'preview') return true
  return Boolean(promo?.applies_discount)
}
