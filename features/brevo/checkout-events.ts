'use client'

// features/brevo/checkout-events.ts
//
// Abandoned-checkout signals (25 Nov 2026). Sent through our own
// /api/brevo/checkout-event route (the Brevo key stays on the server):
//   • started   — just before the buyer is sent to Stripe (pay step)
//   • abandoned — the buyer is back from Stripe and the payment page shows
//                 "Payment not completed" (cancelled / failed / expired)
// Fire-and-forget like sync.ts: never awaited, never throws, never toasts,
// and each (event, checkout) pair is sent once per browser.

export interface CheckoutEventPayload {
  event: 'started' | 'abandoned'
  checkout_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  event_id?: string | number | null
  match?: string | null
  home_team?: string | null
  away_team?: string | null
  match_date?: string | null
  amount?: number | null
  currency?: string | null
  quantity?: number | null
  ticket_category?: string | null
  reason?: 'cancelled' | 'failed' | 'expired' | null
  has_flight?: boolean
  has_esim?: boolean
}

const SENT_PREFIX = 'golafly:brevo-checkout:'

export function sendCheckoutEventOnce(payload: CheckoutEventPayload | null): void {
  try {
    if (!payload || typeof window === 'undefined') return
    if (!payload.checkout_id || !/^\S+@\S+\.\S+$/.test(payload.email)) return
    const key = `${SENT_PREFIX}${payload.event}:${payload.checkout_id}`
    try {
      if (window.localStorage.getItem(key)) return
      window.localStorage.setItem(key, '1')
    } catch {
      /* storage blocked — still send once */
    }
    // Drop empty values so the server's checks see only real ones.
    const body = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    )
    fetch('/api/brevo/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // keepalive: the started event is sent right before leaving for Stripe.
      keepalive: true,
    })
      .then(async (res) => {
        if (!res.ok) console.error('[brevo] checkout-event failed', res.status, await res.text().catch(() => ''))
      })
      .catch((err) => console.error('[brevo] checkout-event failed', err))
  } catch {
    /* never let CRM tracking affect checkout */
  }
}

/** "Ada Lovelace" → { first_name: "Ada", last_name: "Lovelace" }. */
export function splitBuyerName(fullName: string | null | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') || undefined }
}
