'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import fanAxios from '@/services/fan-axios'
import { QueryKeys } from '@/models/query'
import { getFanToken } from '@/features/fan/session'
import type { FanApiResponse } from '@/features/fan/types'
import type { FanTone } from '@/features/fan/ledgers'
import { blobErrorMessage, blobFileName, saveBlob } from '@/lib/blob-download'
import type {
  PriceBreakdown,
  PriceDiscount,
} from '@/features/price-breakdown/types'

/* MATCH TICKETS — the fan's football ticket orders.
 *
 *   GET  /v1/auth/matchday-orders                        list (paginated)
 *   GET  /v1/auth/matchday-orders/{id}                   one order
 *   GET  /v1/auth/matchday-orders/{id}/tickets           files + phone links
 *   GET  {download_url}                                  one file (Bearer)
 *   POST /v1/auth/matchday-orders/{id}/attendees         ticket-holder details
 *
 * All customer-scoped: another fan's order answers 404, never 403, so a 404
 * always reads "not found" and is never retried. */

export type MatchdayOrderStatus =
  | 'processing'
  | 'action_required'
  | 'confirmed'
  | 'tickets_sent'
  | 'refunded'

export interface AttendeeField {
  field_name: string
  value_type: 'TEXT' | 'DATE' | 'EMAIL' | 'PHONE' | 'SELECT' | string
  options: string[]
}

export interface MatchdayOrder {
  id: number
  /** Golafly booking reference, e.g. "GO00000812LY" (Ticket dashboards
   *  contract §3). Optional: older backends don't send it. */
  reference?: string | null
  status: MatchdayOrderStatus | string
  event: {
    name: string
    date: string | null
    home_team: string | null
    away_team: string | null
    venue_name: string | null
    venue_city: string | null
  }
  ticket: {
    category_name: string | null
    ticket_type: string | null
    quantity: number
    block: string | null
    row: string | null
  }
  currency: string
  amount_paid: number
  /** Price-breakdown contract. `total` is BEFORE the discount: total paid
   *  = total − discount (see savedOrderTotalPaid). */
  price_breakdown?: PriceBreakdown | null
  discount?: PriceDiscount | null
  attendees_required: AttendeeField[]
  tickets_sent_at: string | null
  tickets_available: boolean
  created_at: string
  paid_at: string | null
}

export interface MatchdayOrdersPage {
  current_page: number
  per_page: number
  total: number
  last_page: number
  data: MatchdayOrder[]
}

export type OrderTicket =
  | {
      type: 'file'
      label: string
      holder: string | null
      format: string
      checksum: string
      download_url: string
    }
  | {
      type: 'link'
      label: string
      holder: string | null
      os: 'ios' | 'android' | null
      url: string | null
      ios: string | null
      android: string | null
    }

export interface OrderInstruction {
  format: string
  checksum: string
  download_url: string
}

export interface OrderTickets {
  order_id: number
  reference?: string | null
  available: boolean
  tickets_sent_at: string | null
  tickets: OrderTicket[]
  instructions: OrderInstruction[]
}

/* ── Calls ─────────────────────────────────────────────────────────────── */

export async function listMatchdayOrders(page: number, perPage = 15) {
  const { data } = await fanAxios.get<FanApiResponse<MatchdayOrdersPage>>(
    '/v1/auth/matchday-orders',
    { params: { page, per_page: perPage } },
  )
  return data
}

export async function getMatchdayOrder(id: number) {
  const { data } = await fanAxios.get<FanApiResponse<MatchdayOrder>>(
    `/v1/auth/matchday-orders/${id}`,
  )
  return data
}

export async function getOrderTickets(id: number) {
  const { data } = await fanAxios.get<FanApiResponse<OrderTickets>>(
    `/v1/auth/matchday-orders/${id}/tickets`,
  )
  return data
}

/* A ticket file needs the Bearer token, so a plain link would 401. Fetch it
   through fanAxios (which adds the token), then hand the browser a blob.
   `download_url` is used exactly as returned — a full URL, never rebuilt.
   Throws an Error whose message is ready to show (404 "Ticket file not
   found.", 429 throttled at 30 a minute, offline …). */
export async function downloadTicketFile(downloadUrl: string, fallbackName: string) {
  try {
    const res = await fanAxios.get<Blob>(downloadUrl, {
      responseType: 'blob',
      headers: { Accept: '*/*' },
    })
    saveBlob(res.data, blobFileName(res, fallbackName))
  } catch (error: unknown) {
    throw new Error(await blobErrorMessage(error))
  }
}

export async function submitAttendees(id: number, attendees: Record<string, string>[]) {
  const { data } = await fanAxios.post<FanApiResponse<unknown>>(
    `/v1/auth/matchday-orders/${id}/attendees`,
    { attendees },
  )
  return data
}

/* ── Hooks ─────────────────────────────────────────────────────────────── */

const signedIn = () => typeof window !== 'undefined' && !!getFanToken()

export function useMatchdayOrders(page: number) {
  return useQuery({
    queryKey: [QueryKeys.Fan_Matchday_Orders, page],
    queryFn: () => listMatchdayOrders(page),
    enabled: signedIn(),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useMatchdayOrder(id: number) {
  return useQuery({
    queryKey: [QueryKeys.Fan_Matchday_Order, id],
    queryFn: () => getMatchdayOrder(id),
    enabled: signedIn() && Number.isFinite(id),
    staleTime: 60 * 1000,
    retry: false,
  })
}

/** Only a ready order asks for its tickets. */
export function useOrderTickets(id: number, ready: boolean) {
  return useQuery({
    queryKey: [QueryKeys.Fan_Matchday_Tickets, id],
    queryFn: () => getOrderTickets(id),
    enabled: signedIn() && Number.isFinite(id) && ready,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useSubmitAttendees(id: number) {
  const qc = useQueryClient()
  const refresh = () => {
    qc.invalidateQueries({ queryKey: [QueryKeys.Fan_Matchday_Order, id] })
    qc.invalidateQueries({ queryKey: [QueryKeys.Fan_Matchday_Orders] })
  }
  return useMutation({
    mutationFn: (attendees: Record<string, string>[]) => submitAttendees(id, attendees),
    onSuccess: response => {
      toast.success('Details received', { description: response.message })
      refresh()
    },
    onError: (error: unknown) => {
      // 409 means it's already in, or a double click — just re-read the order.
      if ((error as { response?: { status?: number } })?.response?.status === 409) {
        toast.info('Details already received', {
          description: 'We already have the ticket-holder details for this order.',
        })
        refresh()
      }
    },
  })
}

/* ── Presentation ──────────────────────────────────────────────────────── */

const STATUS: Record<string, { label: string; tone: FanTone; body: string }> = {
  processing: {
    label: 'Securing seats',
    tone: 'info',
    body: 'You’ve paid, and we’re securing your seats. Tickets appear here once they’re issued.',
  },
  action_required: {
    label: 'Details needed',
    tone: 'warn',
    body: 'The stadium needs the name of everyone attending before tickets can be issued.',
  },
  confirmed: {
    label: 'Booked',
    tone: 'good',
    body: 'Your seats are booked. Tickets are issued closer to the match and appear here.',
  },
  tickets_sent: {
    label: 'Tickets ready',
    tone: 'good',
    body: 'Your tickets are ready.',
  },
  refunded: {
    label: 'Refunded',
    tone: 'neutral',
    body: 'This order was refunded, so no tickets will be issued.',
  },
}

/** Status wording. `tickets_available` wins: a supplier-cancelled order can
 *  still read tickets_sent, but it has no tickets. */
export function orderStatus(o: Pick<MatchdayOrder, 'status' | 'tickets_available'>) {
  if (o.status === 'tickets_sent' && !o.tickets_available) {
    return {
      label: 'Tickets unavailable',
      tone: 'danger' as FanTone,
      body: 'These tickets are no longer available. Contact support and we’ll sort it out.',
    }
  }
  return STATUS[o.status] ?? { label: o.status, tone: 'neutral' as FanTone, body: '' }
}

export function orderMoney(o: Pick<MatchdayOrder, 'amount_paid' | 'currency'>) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: o.currency }).format(o.amount_paid)
  } catch {
    return `${o.currency} ${o.amount_paid}`
  }
}

/** "Best Available · Blk 21 · Row 6 · ×2" — only the parts that exist. */
export function seatLine(t: MatchdayOrder['ticket']) {
  return [
    t.category_name,
    t.block ? `Blk ${t.block}` : null,
    t.row ? `Row ${t.row}` : null,
    `×${t.quantity}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export const isPastMatch = (o: MatchdayOrder, now = new Date()) =>
  !!o.event.date && new Date(o.event.date).getTime() < now.getTime()

/* "first_name" → "First name". Field names are sent as-is; this is display. */
export const fieldLabel = (name: string) =>
  name
    .replace(/_/g, ' ')
    .replace(/^./, c => c.toUpperCase())
