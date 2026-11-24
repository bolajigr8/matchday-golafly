// features/vip/status.ts
//
// The words the customer sees after payment (contract §7). Only these
// words: no "delayed" or "failed" state is ever invented. A held item's
// own status_message is shown as written when the backend sends one.

import type { VipPackageStatus, VipPaidItem, VipTicketStatus } from './contract'

export type VipTone = 'progress' | 'done' | 'refunded' | 'action'

export const PACKAGE_WORDS: Record<VipPackageStatus, { title: string; body: string; tone: VipTone }> = {
  building: { title: 'Still being built', body: 'Your package has not been paid yet.', tone: 'progress' },
  checkout_started: { title: 'Payment page open', body: 'Your payment has not been completed yet.', tone: 'progress' },
  paid: {
    title: 'Payment received',
    body: 'We’re booking your package now: your match tickets first, then the rest.',
    tone: 'progress',
  },
  ticket_secured: {
    title: 'Match tickets secured',
    body: 'Your match tickets are secured. Your flight, hotel and eSIM are being booked.',
    tone: 'progress',
  },
  completed: { title: 'Your package is booked', body: 'Everything is booked. Confirmations are in your email.', tone: 'done' },
  refunded: {
    title: 'Refunded',
    body: 'We couldn’t secure your match tickets, so your payment has been returned. We’ve emailed you the details.',
    tone: 'refunded',
  },
  abandoned: { title: 'Package removed', body: 'This package was removed before payment.', tone: 'refunded' },
}

export const TICKET_WORDS: Record<VipTicketStatus, { label: string; tone: VipTone }> = {
  processing: { label: 'Being confirmed', tone: 'progress' },
  action_required: { label: 'Attendee details needed', tone: 'action' },
  confirmed: { label: 'Confirmed', tone: 'done' },
  tickets_sent: { label: 'Tickets sent', tone: 'done' },
  refunded: { label: 'Refunded', tone: 'refunded' },
}

/** Flight / hotel / eSIM status → the word to show. */
export function itemWord(item: VipPaidItem): { label: string; tone: VipTone } {
  const s = item.status
  if (s === 'confirmed') return { label: 'Confirmed', tone: 'done' }
  if (s === 'refunded') return { label: 'Refunded', tone: 'refunded' }
  if (item.type === 'esim' || item.type === 'esim_topup') return { label: 'Being prepared', tone: 'progress' }
  return { label: 'Being booked', tone: 'progress' }
}

export const ITEM_NAMES: Record<VipPaidItem['type'], string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  esim: 'eSIM',
  esim_topup: 'eSIM top-up',
}

/** Stop polling the success page once the package is settled. */
export function isFinalPackageStatus(s: VipPackageStatus | undefined): boolean {
  return s === 'completed' || s === 'refunded'
}
