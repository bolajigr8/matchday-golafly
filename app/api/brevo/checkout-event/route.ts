import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { brevoFetch } from '@/lib/brevo/client'
import { matchdayDetails } from '@/lib/brevo/matchday'
import type { SyncOrderPayload } from '@/lib/brevo/types'

/* Abandoned-checkout signals for Brevo (25 Nov 2026).
 *
 *   matchday_checkout_started    the buyer pressed Pay and is sent to Stripe
 *   matchday_checkout_abandoned  the buyer came back from Stripe without
 *                                paying (cancelled / failed / expired)
 *
 * Deliberately kept apart from /api/brevo/sync-order: a started or abandoned
 * checkout is NOT an order, so it never touches the contact's LAST_ORDER_*
 * fields, the MATCH_* fields or the Brevo eCommerce order (a buyer with a
 * confirmed booking who starts a second checkout keeps their booking data).
 * The reminder workflow in Brevo should start on one of these events and
 * exit when the contact gets matchday_order_paid / matchday_order_confirmed.
 *
 * When BREVO_API_KEY isn't set it answers 200 {skipped}, like sync-order. */

const schema = z.object({
  event: z.enum(['started', 'abandoned']),
  /** Stripe session id: one checkout attempt (used to tie the two events
   *  together in Brevo and to avoid duplicates). */
  checkout_id: z.string().min(1).max(200),
  email: z.string().email(),
  first_name: z.string().max(100).nullish(),
  last_name: z.string().max(100).nullish(),
  event_id: z.union([z.string(), z.number()]).nullish(),
  match: z.string().max(200).nullish(),
  home_team: z.string().max(100).nullish(),
  away_team: z.string().max(100).nullish(),
  match_date: z.string().max(40).nullish(),
  amount: z.number().finite().nonnegative().nullish(),
  currency: z.string().length(3).nullish(),
  quantity: z.number().int().positive().max(50).nullish(),
  ticket_category: z.string().max(200).nullish(),
  /** Why the checkout ended (abandoned only): cancelled | failed | expired. */
  reason: z.enum(['cancelled', 'failed', 'expired']).nullish(),
  has_flight: z.boolean().nullish(),
  has_esim: z.boolean().nullish(),
})

/** Only what a reminder email can use (match, stadium, date, crests, link). */
const KEEP_FROM_DETAILS = [
  'stadium',
  'city',
  'country',
  'competition',
  'home_team',
  'away_team',
  'match_day',
  'match_date_text',
  'kickoff_time',
  'kickoff_utc',
  'home_crest_url',
  'away_crest_url',
  'match_url',
  'site_url',
] as const

export async function POST(req: NextRequest) {
  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json({ skipped: 'BREVO_API_KEY not configured' })
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid checkout-event payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const b = parsed.data

  /* Stadium, city, kick-off, crests and the match link from the event
     itself (same helper as the booking emails). Never throws. */
  const props: Record<string, string | number | boolean> = {}
  const details = await matchdayDetails({
    product: 'matchday',
    status: 'pending',
    order: { id: b.checkout_id, amount: b.amount ?? 0, currency: b.currency ?? 'EUR', createdAt: '', updatedAt: '' },
    customer: { email: b.email },
    meta: {
      event_id: b.event_id ?? undefined,
      match_date: b.match_date ?? undefined,
      home_team: b.home_team ?? undefined,
      away_team: b.away_team ?? undefined,
    },
  } satisfies SyncOrderPayload).catch(() => null)
  for (const key of KEEP_FROM_DETAILS) {
    const v = details?.meta[key]
    if (v !== undefined) props[key] = v
  }
  const put = (k: string, v: string | number | boolean | null | undefined) => {
    if (v !== undefined && v !== null && v !== '') props[k] = v
  }
  put('checkout_id', b.checkout_id)
  put('event_id', b.event_id != null ? String(b.event_id) : undefined)
  put('match', b.match || [props.home_team, props.away_team].filter(Boolean).join(' vs ') || undefined)
  put('home_team', b.home_team)
  put('away_team', b.away_team)
  put('amount', b.amount)
  put('currency', b.currency?.toUpperCase())
  put('quantity', b.quantity)
  put('ticket_category', b.ticket_category)
  put('first_name', b.first_name)
  put('reason', b.event === 'abandoned' ? (b.reason ?? 'cancelled') : undefined)
  put('has_flight', b.has_flight ?? undefined)
  put('has_esim', b.has_esim ?? undefined)

  const result: { contact: 'ok' | 'error'; event: 'ok' | 'error'; errors?: Record<string, string> } = {
    contact: 'ok',
    event: 'ok',
  }
  const errors: Record<string, string> = {}

  /* The contact must exist before an event can be attached to it. Name only:
     no list, no order fields (see the note at the top). */
  try {
    const attributes: Record<string, string> = {}
    if (b.first_name) attributes.FIRSTNAME = b.first_name
    if (b.last_name) attributes.LASTNAME = b.last_name
    await brevoFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ email: b.email, attributes, updateEnabled: true }),
    })
  } catch (e) {
    result.contact = 'error'
    errors.contact = e instanceof Error ? e.message : 'Unknown error'
  }

  try {
    await brevoFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: `matchday_checkout_${b.event}`,
        identifiers: { email_id: b.email },
        event_properties: props,
      }),
    })
  } catch (e) {
    result.event = 'error'
    errors.event = e instanceof Error ? e.message : 'Unknown error'
  }

  if (Object.keys(errors).length) {
    result.errors = errors
    console.error('[brevo] checkout-event:', errors)
  }
  return NextResponse.json(result, { status: result.event === 'error' ? 502 : 200 })
}
