// lib/analytics.ts
//
// The shopping events ad platforms need: a ticket was viewed, added to the
// cart, checkout started, paid. Until now the site only told Google and
// Meta "a page was opened", so no sale could ever be attributed to an ad.
//
// Where they go:
//   • GA4 + Google Ads  → window.gtag, which pushes to dataLayer for the
//                         landing site's GTM container (app/layout.tsx)
//                         (behind Consent Mode: while a visitor has not
//                         consented, Google receives consent-denied pings,
//                         which is what its conversion modelling works from).
//   • Meta              → window.fbq, which only exists once the Meta Pixel
//                         has been loaded (after marketing consent, or
//                         immediately on a landing host in 'open' testing mode).
//
// This file never decides consent. It only calls what is there: if the pixel
// is not loaded, the Meta call is silently skipped.
//
// Scope: events are sent from golafly.com AND from the landing hostnames
// (championsleague.golafly.com …). Golafly.com was switched on in Nov 2026 so
// the Google Ads campaign (which sends people to golafly.com) sees purchases
// with their real value. NEXT_PUBLIC_TRACK_MAIN_EVENTS=false turns golafly.com
// off again (landing sites always send).
//
// Google Ads purchase conversion: the send-to value below (the same for all
// three landing sites) comes from the Google Ads "Purchase" conversion.
// NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL overrides it if ever needed.
//
// Since Nov 2026 GA4 and Google Ads load only through GTM: golafly.com's
// container (GTM-WSLHVTPM) or the landing site's own one. There is no gtag.js
// script and no gtag('config') on the page. window.gtag only pushes to
// dataLayer, and GTM's Google tag reads it. On golafly.com/payment-success a
// landing buyer gets the landing site's container instead of the main one
// (gtmBootScript() in lib/sites.ts).

import { readLandingReturn } from '@/lib/landing-return'
import { currentSiteKey } from '@/lib/site-runtime'

export interface TrackItem {
  id: string
  name: string
  category?: string
  price?: number
  quantity?: number
}

interface Money {
  value: number
  currency: string
  items: TrackItem[]
}

type Gtag = (...args: unknown[]) => void
type Fbq = (...args: unknown[]) => void

/** On by default; only an explicit 'false' turns golafly.com events off. */
const TRACK_MAIN = process.env.NEXT_PUBLIC_TRACK_MAIN_EVENTS !== 'false'
const ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL ||
  'AW-18513535119/bnDOCPjLkrIdEI_B-PtE'

function enabled(site?: string | null): boolean {
  if (typeof window === 'undefined') return false
  return currentSiteKey() !== null || Boolean(site) || TRACK_MAIN
}

function ga4Items(items: TrackItem[]) {
  return items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    item_category: i.category,
    price: i.price,
    quantity: i.quantity ?? 1,
  }))
}

function send(
  gaName: string,
  gaParams: Record<string, unknown>,
  meta?: { name: string; params: Record<string, unknown>; eventId?: string },
  /** Landing site to report when this runs on golafly.com (a buyer returning
   *  from Stripe). Only trackPurchase passes it. */
  siteOverride?: string | null,
) {
  if (!enabled(siteOverride)) return
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq }

  try {
    w.gtag?.('event', gaName, {
      ...gaParams,
      landing_site: currentSiteKey() ?? siteOverride ?? 'main',
    })
  } catch {
    /* tracking must never break a purchase */
  }

  try {
    if (meta && typeof w.fbq === 'function') {
      w.fbq(
        'track',
        meta.name,
        meta.params,
        meta.eventId ? { eventID: meta.eventId } : undefined,
      )
    }
  } catch {
    /* same */
  }
}

/** The landing page's match list was shown. */
export function trackViewItemList(listName: string, items: TrackItem[]) {
  if (!items.length) return
  send('view_item_list', {
    item_list_name: listName,
    items: ga4Items(items),
  })
}

/** A match was picked (tile, row, search result, carousel slide). */
export function trackSelectItem(item: TrackItem, listName?: string) {
  send(
    'select_item',
    { item_list_name: listName, items: ga4Items([item]) },
    {
      name: 'ViewContent',
      params: {
        content_type: 'product',
        content_ids: [item.id],
        content_name: item.name,
      },
    },
  )
}

/** Tickets were added to the cart (the Seats step). */
export function trackAddToCart({ value, currency, items }: Money) {
  send(
    'add_to_cart',
    { value, currency, items: ga4Items(items) },
    {
      name: 'AddToCart',
      params: {
        value,
        currency,
        content_type: 'product',
        content_ids: items.map((i) => i.id),
      },
    },
  )
}

/** Checkout started. */
export function trackBeginCheckout({ value, currency, items }: Money) {
  send(
    'begin_checkout',
    { value, currency, items: ga4Items(items) },
    {
      name: 'InitiateCheckout',
      params: {
        value,
        currency,
        num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
        content_ids: items.map((i) => i.id),
      },
    },
  )
}

/** Paid. `transactionId` must be the order id: Google and Meta both use it to
 *  ignore a repeat of the same sale (a refresh of the confirmation page). */
export function trackPurchase({
  transactionId,
  value,
  currency,
  items,
}: Money & { transactionId: string }) {
  // On golafly.com/payment-success this is the buyer coming back from Stripe:
  // the landing page they started on is in a cookie (lib/landing-return.ts).
  const returnedFrom = currentSiteKey() ? null : readLandingReturn().site
  send(
    'purchase',
    {
      transaction_id: transactionId,
      value,
      currency,
      items: ga4Items(items),
    },
    {
      name: 'Purchase',
      params: {
        value,
        currency,
        content_type: 'product',
        content_ids: items.map((i) => i.id),
      },
      eventId: transactionId,
    },
    returnedFrom,
  )

  if (!enabled(returnedFrom) || !ADS_PURCHASE_LABEL) return
  try {
    ;(window as unknown as { gtag?: Gtag }).gtag?.('event', 'conversion', {
      send_to: ADS_PURCHASE_LABEL,
      value,
      currency,
      transaction_id: transactionId,
    })
  } catch {
    /* see above */
  }
}
