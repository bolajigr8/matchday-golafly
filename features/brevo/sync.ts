'use client'

// features/brevo/sync.ts
//
// Client side of the Brevo transaction sync (ported from travels'
// features/brevo/{api,hooks,mappers}.ts and extended to MatchDay tickets).
//
// • Calls our own /api/brevo/sync-order route — never Brevo directly (the
//   API key stays on the server).
// • Fire-and-forget: never awaited by the UI, never throws, never toasts —
//   a Brevo outage can't affect a booking confirmation screen.
// • Each (order, status) pair is sent once per browser (localStorage key),
//   so refreshes and polling don't create duplicates, while a later status
//   change (paid → confirmed) is still recorded.

import { useEffect } from 'react'
import type { TransactionResult } from '@/features/payment/types'
import { getTransactionProduct } from '@/features/payment/types'
import type { MatchdayOrder } from '@/features/matchday/types'
import type { BrevoOrderStatus, SyncOrderPayload } from '@/lib/brevo/types'

const SYNCED_PREFIX = 'golafly:brevo-synced:'

export function syncOrderToBrevoOnce(payload: SyncOrderPayload | null): void {
  if (!payload || typeof window === 'undefined') return
  const key = `${SYNCED_PREFIX}${payload.product}:${payload.order.id}:${payload.status}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    /* storage blocked — still send once for this render cycle */
  }
  fetch('/api/brevo/sync-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then(async (res) => {
      if (!res.ok) console.error('[brevo] sync-order failed', res.status, await res.text().catch(() => ''))
    })
    .catch((err) => console.error('[brevo] sync-order failed', err))
}

function splitName(fullName: string | null | undefined) {
  if (!fullName) return {}
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/* ── Ledger transactions (flights / stays / eSIM) — from travels ──────── */

function mapLedgerStatus(tx: TransactionResult): BrevoOrderStatus {
  if (tx.status === 'confirmed') return 'confirmed'
  if (tx.status === 'cancelled') return 'cancelled'
  if (tx.status === 'expired' || tx.payment_status === 'expired') return 'expired'
  if (
    tx.status === 'failed' ||
    tx.status === 'payment_received_booking_failed' ||
    tx.payment_status === 'failed'
  )
    return 'failed'
  if (tx.payment_status === 'paid') return 'paid'
  return 'pending'
}

function mapTransactionUnsafe(
  tx: TransactionResult | null | undefined,
  sessionId: string | null | undefined,
): SyncOrderPayload[] {
  const email = tx?.customer?.email
  if (!tx || !sessionId || !email) return []
  /* A cart checkout can carry several products (flight + eSIM + stay …).
     Each one is sent on its own, so the buyer joins EVERY product's list
     and gets every product's event — not just the first product found
     (getTransactionProduct picks one). */
  const products = (['stays', 'flight', 'esim'] as const).filter((p) => !!tx[p])
  if (products.length === 0) {
    const single = getTransactionProduct(tx)
    if (single === 'unknown') return []
    products.push(single)
  }
  const basketTotal = (Number(tx.pricing?.amount_paid_minor) || 0) / 100
  return products.map((product) =>
    payloadFor(tx, sessionId, email, product, productAmount(tx, product, products.length, basketTotal)),
  )
}

/** What this product cost: its own lines in the basket's price summary.
 *  A single-product purchase is the whole amount paid. In a basket with no
 *  summary the split is unknown, so the order is recorded at 0 (with the
 *  basket total in its details) rather than counting the total twice. */
function productAmount(
  tx: TransactionResult,
  product: 'stays' | 'flight' | 'esim',
  productCount: number,
  basketTotal: number,
): number {
  const lines = tx.price_summary?.lines?.filter((l) => l.item_type === product) ?? []
  if (lines.length) return lines.reduce((sum, l) => sum + (Number(l.amount_minor) || 0), 0) / 100
  return productCount === 1 ? basketTotal : 0
}

function payloadFor(
  tx: TransactionResult,
  sessionId: string,
  email: string,
  product: 'stays' | 'flight' | 'esim',
  amount: number,
): SyncOrderPayload {
  const meta: NonNullable<SyncOrderPayload['meta']> = {}
  if (product === 'flight' && tx.flight) {
    meta.FLIGHT_LAST_ROUTE = `${tx.flight.origin} → ${tx.flight.destination}`
    meta.pnr_reference = tx.flight.pnr_reference
    meta.airline_name = tx.flight.airline_name
    meta.departure_date = tx.flight.departure_date
  }
  if (product === 'stays' && tx.stays) {
    meta.STAYS_LAST_HOTEL = tx.stays.hotel_name
    meta.checkin = tx.stays.checkin
    meta.checkout = tx.stays.checkout
    meta.booking_reference = tx.stays.booking_reference
  }
  if (product === 'esim' && tx.esim) {
    meta.ESIM_LAST_PACKAGE = tx.esim.package
    meta.quantity = tx.esim.quantity
  }
  meta.source = 'matchday'
  meta.basket_total = (Number(tx.pricing?.amount_paid_minor) || 0) / 100

  return {
    product,
    status: mapLedgerStatus(tx),
    order: {
      // One Stripe session can carry several legs in a cart checkout.
      id: `${sessionId}-${product}`,
      amount,
      currency: (tx.pricing?.currency || 'EUR').toUpperCase(),
      createdAt: tx.created_at || new Date().toISOString(),
      updatedAt: tx.confirmed_at ?? tx.paid_at ?? tx.created_at ?? new Date().toISOString(),
    },
    customer: {
      email,
      ...splitName(tx.customer.full_name),
      phone: tx.customer.phone ?? undefined,
    },
    meta,
  }
}

/* ── MatchDay ticket orders ───────────────────────────────────────────── */

/** Only these are worth recording — earlier states are still moving. */
const MATCHDAY_SYNC_STATES: Partial<Record<MatchdayOrder['status'], BrevoOrderStatus>> = {
  confirmed: 'confirmed',
  failed: 'failed',
  cancelled: 'cancelled',
  // Money taken, seats still being secured by the supplier.
  needs_reconciliation: 'paid',
  manual_review: 'paid',
  awaiting_attendees: 'paid',
}

export interface BuyerContact {
  fullName?: string | null
  email?: string | null
  phone?: string | null
}

/** What else the same checkout bought (a cart can hold a flight / eSIM next
 *  to the tickets), and a buyer to fall back on when the travellers store is
 *  empty (e.g. the payment page opened in a fresh tab). */
export interface MatchdaySyncExtras {
  hasFlight?: boolean
  hasEsim?: boolean
  fallbackBuyer?: BuyerContact | null
}

function mapMatchdayOrderUnsafe(
  order: MatchdayOrder | null | undefined,
  storeBuyer: BuyerContact | null | undefined,
  extras: MatchdaySyncExtras = {},
): SyncOrderPayload | null {
  const buyer = storeBuyer?.email ? storeBuyer : extras.fallbackBuyer
  if (!order || !buyer?.email) return null
  const status = MATCHDAY_SYNC_STATES[order.status]
  if (!status) return null
  const now = new Date().toISOString()
  const ev = order.event
  const match =
    ev?.event_name ||
    [ev?.home_team, ev?.away_team].filter(Boolean).join(' vs ') ||
    undefined
  const name = splitName(buyer.fullName)

  return {
    product: 'matchday',
    status,
    order: {
      id: `matchday-${order.order_id}`,
      amount: Number(order.amount_paid) || 0,
      currency: (order.currency || 'EUR').toUpperCase(),
      createdAt: now,
      updatedAt: now,
    },
    customer: {
      email: buyer.email,
      ...name,
      phone: buyer.phone || undefined,
    },
    /* Event properties for the Brevo email journey (the server adds the
       stadium, city and kickoff time from the event id). */
    meta: {
      source: 'matchday',
      match,
      home_team: ev?.home_team ?? undefined,
      away_team: ev?.away_team ?? undefined,
      match_date: ev?.event_date ?? undefined,
      event_id: ev?.event_id,
      booking_reference: String(order.order_id),
      first_name: name.firstName,
      ticket_category: order.ticket?.category_name,
      ticket_type: order.ticket?.ticket_type,
      quantity: order.quantity,
      order_status: order.status,
      has_flight: extras.hasFlight ?? false,
      has_esim: extras.hasEsim ?? false,
    },
  }
}

/* ── Public, crash-proof wrappers ──────────────────────────────────────
   These run during render on the payment/confirmation pages. Whatever
   shape the backend returns, they return a payload or null — they can
   never throw and take a confirmation page down with them. */

/** One payload per product in the purchase (a cart can hold several). */
export function mapTransactionToSyncPayloads(
  tx: TransactionResult | null | undefined,
  sessionId: string | null | undefined,
): SyncOrderPayload[] {
  try {
    return mapTransactionUnsafe(tx, sessionId)
  } catch (err) {
    console.error('[brevo] could not map transaction', err)
    return []
  }
}

export function mapMatchdayOrderToSyncPayload(
  order: MatchdayOrder | null | undefined,
  buyer: BuyerContact | null | undefined,
  extras?: MatchdaySyncExtras,
): SyncOrderPayload | null {
  try {
    return mapMatchdayOrderUnsafe(order, buyer, extras)
  } catch (err) {
    console.error('[brevo] could not map ticket order', err)
    return null
  }
}

/** Convenience hook: sync whenever the payload(s) become available/change. */
export function useBrevoOrderSync(payload: SyncOrderPayload | SyncOrderPayload[] | null): void {
  const list = payload ? (Array.isArray(payload) ? payload : [payload]) : []
  const key = list.map((p) => `${p.product}:${p.order.id}:${p.status}`).join('|')
  useEffect(() => {
    try {
      // Sent one after another, so the contact's "last order" details end
      // on the last product rather than racing.
      for (const p of list) syncOrderToBrevoOnce(p)
    } catch {
      /* never let analytics/CRM sync affect the page */
    }
    // payload identity changes every render; the key captures what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
