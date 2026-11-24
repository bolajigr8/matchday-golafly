// features/vip/routes.ts
//
// Addresses of the VIP pages, shaped like the backend (club + match id):
//   /vip                                          landing page
//   /vip/<club>/<eventId>                         match page
//   /vip/<club>/<eventId>/seats|extras|checkout   the builder steps
//   /vip/confirmed?session_id=…                   after payment (handed over
//                                                 by /payment-success)

import { VIP_GOLD_SITE_CHROME } from './config'

export const VIP_FLOW_STEPS = [
  { id: 'seats', label: 'Seats' },
  { id: 'extras', label: 'Extras' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'confirmed', label: 'Confirmed' },
] as const

export type VipFlowStep = (typeof VIP_FLOW_STEPS)[number]['id']

/** /vip/<club>/<eventId>, or one of its builder steps. Confirmed has its
 *  own address (it is reached from Stripe, by session id). */
export function vipFlowHref(
  club: string,
  eventId: number | string,
  step?: Exclude<VipFlowStep, 'confirmed'>,
): string {
  const base = `/vip/${encodeURIComponent(club)}/${eventId}`
  return step ? `${base}/${step}` : base
}

export function vipConfirmedHref(sessionId: string): string {
  return `/vip/confirmed?session_id=${encodeURIComponent(sessionId)}`
}

/** True on /vip/<…> pages (not the /vip landing page). These pages bring
 *  their own VIP header and footer, so the site's ConditionalHeader /
 *  ConditionalFooter render nothing there. */
export function isVipFlowPath(pathname: string): boolean {
  return /^\/vip\/[^/]+/.test(pathname)
}

/** True on every VIP page: the /vip landing page and the booking flow. */
export function isVipPath(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/vip(\/|$)/.test(pathname)
}

/** Inline <head> script (app/layout.tsx): adds the `vip-theme` class on
 *  <html> before the first paint on a VIP page, so the header and footer
 *  never flash lime before turning gold. Same rule as isVipPath. Empty when
 *  the gold site chrome is switched off (features/vip/config.ts). */
export function vipThemeBootScript(): string {
  if (!VIP_GOLD_SITE_CHROME) return ''
  return `(function(){try{if(/^\\/vip(\\/|$)/.test(location.pathname))document.documentElement.classList.add('vip-theme')}catch(e){}})();`
}
