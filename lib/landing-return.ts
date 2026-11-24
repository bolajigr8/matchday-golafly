// lib/landing-return.ts
//
// Stripe always sends the buyer back to golafly.com/payment-success, whichever
// address the booking started on. Browser storage is per address, so by then
// golafly.com has forgotten that this buyer came from championsleague.golafly.com.
//
// This file leaves two small notes in cookies that every *.golafly.com address
// can read, and nothing else about the booking changes:
//
//   gf_lp  "<site>.<open|banner>"   which landing page the buyer came from and
//                                    which consent policy applied there.
//                                    Used only to report the sale to Google/Meta.
//                                    Written only when that policy allows
//                                    analytics (open build, or Cookiebot
//                                    "statistics" accepted).
//   gf_ct  the guest cart token      lets golafly.com empty the cart that the
//                                    landing page filled, after payment.
//                                    Needed to finish the booking, not analytics.
//
// Both expire on their own and are deleted once used. Every function here
// swallows its own errors: it must never be able to break a booking.

import { LANDING_ROOTS, siteByKey } from '@/lib/sites'
import { getCartToken } from '@/lib/cart-token'
import { currentSiteKey, isConsentOpen } from '@/lib/site-runtime'

export const LANDING_SITE_COOKIE = 'gf_lp'
export const LANDING_CART_COOKIE = 'gf_ct'

const SITE_COOKIE_DAYS = 2
const CART_COOKIE_DAYS = 1

export interface LandingReturn {
  /** Landing site key, e.g. "championsleague", or null. */
  site: string | null
  consent: 'open' | 'banner' | null
  /** Guest cart token the landing page was using, or null. */
  cartToken: string | null
}

/** "golafly.com" for championsleague.golafly.com and for golafly.com itself. */
function rootForHostname(hostname: string): string | null {
  const h = hostname.toLowerCase()
  for (const root of LANDING_ROOTS) {
    if (h === root || h.endsWith(`.${root}`)) return root
  }
  return null
}

function attrs(maxAgeSeconds: number): string {
  const root = rootForHostname(location.hostname)
  // Browsers refuse a Domain on plain "localhost"; the cookie then stays on
  // the exact host, which is fine for development.
  const domain = root && root !== 'localhost' ? `; Domain=.${root}` : ''
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  return `; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${domain}${secure}`
}

function writeCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}${attrs(days * 86400)}`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=${attrs(0)}`
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  for (const part of document.cookie.split(';')) {
    const p = part.trim()
    if (p.startsWith(prefix)) {
      try {
        return decodeURIComponent(p.slice(prefix.length))
      } catch {
        return null
      }
    }
  }
  return null
}

/** Runs on a landing address while a booking is in progress. Safe to call as
 *  often as you like. Does nothing on golafly.com. */
export function syncLandingReturn(): void {
  try {
    if (typeof window === 'undefined') return
    const site = currentSiteKey()
    if (!site) return

    const token = getCartToken()
    if (!token) return // nothing in the cart yet: no booking to follow

    writeCookie(LANDING_CART_COOKIE, token, CART_COOKIE_DAYS)

    // The attribution note is analytics: only when the visitor's policy says so.
    const consent: 'open' | 'banner' | null = isConsentOpen()
      ? 'open'
      : window.Cookiebot?.consent?.statistics
        ? 'banner'
        : null
    if (consent) writeCookie(LANDING_SITE_COOKIE, `${site}.${consent}`, SITE_COOKIE_DAYS)
  } catch {
    /* never break the page */
  }
}

/** Runs on golafly.com (payment pages). Reads what the landing page left. */
export function readLandingReturn(): LandingReturn {
  const empty: LandingReturn = { site: null, consent: null, cartToken: null }
  try {
    if (typeof window === 'undefined') return empty
    let site: string | null = null
    let consent: LandingReturn['consent'] = null
    const note = readCookie(LANDING_SITE_COOKIE)
    if (note) {
      const [key, mode] = note.split('.')
      if (siteByKey(key) && (mode === 'open' || mode === 'banner')) {
        site = key
        consent = mode
      }
    }
    const token = readCookie(LANDING_CART_COOKIE)
    return { site, consent, cartToken: token && token.length < 512 ? token : null }
  } catch {
    return empty
  }
}

/** The sale has been reported: do not let this note label a later order. */
export function clearLandingSiteNote(): void {
  try {
    deleteCookie(LANDING_SITE_COOKIE)
  } catch {
    /* ignore */
  }
}

/** The landing cart has been emptied: forget both notes. */
export function clearLandingReturn(): void {
  try {
    deleteCookie(LANDING_SITE_COOKIE)
    deleteCookie(LANDING_CART_COOKIE)
  } catch {
    /* ignore */
  }
}
