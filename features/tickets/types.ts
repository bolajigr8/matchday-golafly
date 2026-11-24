// features/tickets/types.ts
//
// No real backend exists for match tickets yet (confirmed — no Sanity
// schema, no service file, no API route anywhere in this codebase). This
// layer is deliberately shaped to match the {checkout_url, session_id}
// contract every other real product (flights/stays/esim) already uses,
// so it slots into the same checkout sequencer as a fourth leg with zero
// rework the moment a real ticketing endpoint exists — only the function
// body of createTicketOrder in api.ts needs to change, nothing else.

export interface TicketSelection {
  matchId: string
  listingId: string
  category: string
  block: string
  row: string
  quantity: number
  priceEach: number
  currency: string
}

export interface TicketOrderPayload {
  matchId: string
  listingId: string
  quantity: number
  email: string
  full_name: string
  phone: string
}

/** Mirrors CreateOrderResult (flights) / BookingCheckoutResult (stays) /
 *  EsimOrderResult (esim) exactly, so the checkout sequencer can treat
 *  all four products uniformly. `checkout_url` is a same-origin mock
 *  route today (see api.ts) rather than a real Stripe session. */
export interface TicketOrderResult {
  checkout_url: string
  session_id: string
  ticket_reference: string
  price: number
  currency: string
}
