'use client'

// Ported from golafly-main/components/shared/cookiebot-third-party-scripts.tsx
// (Cookiebot + Google Consent Mode v2). Differences for Matchday:
//  • Google tags are loaded via Google Tag Manager (app/layout.tsx); this
//    file relays the consent decision to them and loads the Meta Pixel only
//    after marketing consent (lib/consent.ts holds the ids).
//  • When Cookiebot is switched off (lib/consent.ts) every consent check
//    returns true, so nothing that depends on it changes behaviour.

import { useEffect } from 'react'
import { isConsentCarried, isConsentOpen } from '@/lib/site-runtime'
import {
  cookiebotEnabled,
  FACEBOOK_PIXEL_ID,
  type ConsentCategory,
} from '@/lib/consent'

function hasConsent(category: ConsentCategory) {
  if (!cookiebotEnabled) return true
  // A landing hostname in a testing build (NEXT_PUBLIC_LANDING_CONSENT=open,
  // see lib/sites.ts). Never true on golafly.com or in a normal build.
  if (isConsentOpen()) return true
  // golafly.com payment page, buyer sent back from an 'open' landing page.
  if (isConsentCarried()) return true
  return Boolean(window.Cookiebot?.consent?.[category])
}

function loadScript(src: string, id: string, onLoad?: () => void) {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing) {
    if (onLoad && existing.dataset.loaded === 'true') onLoad()
    return existing
  }
  const script = document.createElement('script')
  script.id = id
  script.src = src
  script.async = true
  script.dataset.cookiebotManaged = 'true'
  script.onload = () => {
    script.dataset.loaded = 'true'
    onLoad?.()
  }
  document.head.appendChild(script)
  return script
}

/** Relays the visitor's real choice to Google Consent Mode. Harmless when
 *  no Google tag is on the page (it only pushes to dataLayer). */
function updateGoogleConsent() {
  window.dataLayer = window.dataLayer || []
  // gtag.js only understands the `arguments` object, not an array, so the
  // fallback must push `arguments` (pushing an array is silently ignored).
  window.gtag =
    window.gtag ||
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments as unknown as unknown[])
    }
  const marketing = hasConsent('marketing') ? 'granted' : 'denied'
  window.gtag('consent', 'update', {
    analytics_storage: hasConsent('statistics') ? 'granted' : 'denied',
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  })
}

/* Google tags are not loaded from here: app/layout.tsx loads golafly.com's
   GTM container (GA4 runs inside it) or a landing site's own container.
   Consent Mode v2 defaults ("denied") are set before them, and
   updateGoogleConsent() above passes the visitor's real Cookiebot choice on
   to Google. */

function loadFacebook() {
  // No consent-mode equivalent — fully gated behind marketing consent.
  if (!FACEBOOK_PIXEL_ID || !hasConsent('marketing')) return
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args)
      else ((fbq.queue ??= []) as unknown[][]).push(args)
    }) as NonNullable<Window['fbq']>
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = (...args: unknown[]) => fbq(...args)
    window.fbq = fbq
  }
  loadScript(
    'https://connect.facebook.net/en_US/fbevents.js',
    'facebook-pixel-script',
    () => {
      if (window.__golaflyFacebookPixelInitialised) return
      window.__golaflyFacebookPixelInitialised = true
      window.fbq?.('init', FACEBOOK_PIXEL_ID)
      window.fbq?.('track', 'PageView')
    },
  )
}

export default function CookiebotThirdPartyScripts() {
  useEffect(() => {
    const sync = () => {
      updateGoogleConsent()
      loadFacebook()
    }
    // Run once on mount too — Cookiebot may already hold a stored decision.
    sync()
    const events = [
      'CookiebotOnConsentReady',
      'CookiebotOnAccept',
      'CookiebotOnDecline',
      'CookiebotOnTagsExecuted',
    ]
    events.forEach((e) => window.addEventListener(e, sync))
    return () => events.forEach((e) => window.removeEventListener(e, sync))
  }, [])
  return null
}

export function hasCookiebotConsent(category: ConsentCategory) {
  if (typeof window === 'undefined') return !cookiebotEnabled
  return hasConsent(category)
}

/** Reopens the Cookiebot dialog (e.g. a "Cookie settings" footer link). */
export function openCookiebotPreferences() {
  if (typeof window === 'undefined') return
  window.Cookiebot?.renew?.()
}

declare global {
  interface Window {
    Cookiebot?: {
      renew?: () => void
      consent?: {
        necessary?: boolean
        preferences?: boolean
        statistics?: boolean
        marketing?: boolean
      }
    }
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[][]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    __golaflyGoogleAnalyticsInitialised?: boolean
    __golaflyFacebookPixelInitialised?: boolean
  }
}
