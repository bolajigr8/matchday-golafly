// features/tickets/api.ts
//
// Mock-backed. See types.ts for why this is shaped like a real product
// API. When a real ticketing endpoint exists on api.golafly.com, replace
// only the body of createTicketOrder below — every caller (the cart, the
// checkout sequencer) already expects this exact return shape and needs
// no changes.

import type { TicketOrderPayload, TicketOrderResult } from './types'

function mockReference(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `GFT-${rand}`
}

/**
 * Fakes an instant "order" for a ticket selection. Resolves immediately
 * (no network call) with a same-origin checkout_url pointing at the
 * confirmed step directly, since there is no real payment to collect for
 * this leg yet — the checkout sequencer treats this exactly like a
 * completed real leg and moves on to the next one.
 */
export async function createTicketOrder(
  payload: TicketOrderPayload,
  priceTotal: number,
  currency: string = 'EUR',
): Promise<TicketOrderResult> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // mimic latency, keeps the sequencer's loading UI honest

  const session_id = `mock_ticket_${Date.now()}`

  return {
    checkout_url: `/builder/confirmed?ticketSession=${session_id}`,
    session_id,
    ticket_reference: mockReference(),
    price: priceTotal,
    currency,
  }
}
