import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { brevoFetch, BREVO_LISTS } from '@/lib/brevo/client'
import type { SyncOrderPayload, SyncOrderResult } from '@/lib/brevo/types'
import { MATCH_EXTRA_ATTRS, matchContactAttributes, matchdayDetails } from '@/lib/brevo/matchday'

// Ported from travels/app/api/brevo/sync-order/route.ts (same three calls:
// contact upsert → eCommerce order status → lifecycle event), plus:
//  • `matchday` ticket orders as a product;
//  • the body is validated, so a malformed call can't write junk to Brevo;
//  • when BREVO_API_KEY isn't configured it answers 200 {skipped} instead of
//    500, so environments without Brevo never show errors.

/** Contact attributes that already exist in the Brevo account (travels
 *  writes them). Matchday's match name goes in order/event metadata only, so
 *  no new Brevo contact attribute is required for this to work. */
const PRODUCT_ATTR_KEY: Partial<Record<SyncOrderPayload['product'], string>> = {
  flight: 'FLIGHT_LAST_ROUTE',
  stays: 'STAYS_LAST_HOTEL',
  esim: 'ESIM_LAST_PACKAGE',
}

const metaValue = z.union([z.string(), z.number(), z.boolean()]).optional()
const schema = z.object({
  product: z.enum(['flight', 'stays', 'esim', 'matchday']),
  status: z.enum(['created', 'pending', 'paid', 'confirmed', 'failed', 'expired', 'cancelled']),
  order: z.object({
    id: z.union([z.string().min(1), z.number()]),
    amount: z.number().finite().nonnegative(),
    currency: z.string().min(3).max(3),
    createdAt: z.string().min(10),
    updatedAt: z.string().min(10),
  }),
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  meta: z.record(z.string(), metaValue).optional(),
})

export async function POST(req: NextRequest) {
  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json({ skipped: 'BREVO_API_KEY not configured' })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid sync-order payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data as SyncOrderPayload

  /* Ticket orders: fill in the match details for the email journey. */
  let matchDay: string | null = null
  if (body.product === 'matchday') {
    const extra = await matchdayDetails(body)
    body.meta = { ...body.meta, ...extra.meta }
    matchDay = extra.matchDay
  }

  const result: SyncOrderResult = { contact: 'ok', order: 'ok', event: 'ok' }
  const errors: SyncOrderResult['errors'] = {}

  // 1. Upsert contact
  try {
    const attributes: Record<string, unknown> = {
      LAST_PRODUCT_TYPE: body.product,
      LAST_ORDER_ID: String(body.order.id),
      LAST_ORDER_STATUS: body.status,
      LAST_ORDER_DATE: body.order.updatedAt.slice(0, 10),
      LAST_ORDER_AMOUNT: body.order.amount,
      LAST_ORDER_CURRENCY: body.order.currency,
    }
    if (body.customer.firstName) attributes.FIRSTNAME = body.customer.firstName
    if (body.customer.lastName) attributes.LASTNAME = body.customer.lastName
    if (body.customer.phone) attributes.SMS = body.customer.phone
    const attrKey = PRODUCT_ATTR_KEY[body.product]
    if (attrKey && body.meta?.[attrKey] !== undefined) attributes[attrKey] = body.meta[attrKey]
    /* The "X days before the match" automations start from this date. Only
       a paid/confirmed booking with a real date sets it. */
    const matchAttrs = matchContactAttributes(body, matchDay)
    Object.assign(attributes, matchAttrs)

    const listId = BREVO_LISTS[body.product]
    const upsert = (attrs: Record<string, unknown>) =>
      brevoFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          email: body.customer.email,
          attributes: attrs,
          listIds: listId ? [listId] : undefined,
          updateEnabled: true,
        }),
      })
    const without = (names: string[]) =>
      Object.fromEntries(Object.entries(attributes).filter(([k]) => !names.includes(k)))
    try {
      await upsert(attributes)
    } catch (e) {
      /* A missing/misnamed match attribute in Brevo must not lose the whole
         contact update. First drop only the newest ones (countdown, city
         guide), then all match attributes; report which were left out. */
      const names = Object.keys(matchAttrs)
      if (!names.length) throw e
      const extra = names.filter((n) => n in MATCH_EXTRA_ATTRS)
      const why = e instanceof Error ? e.message : 'Unknown error'
      let saved = false
      if (extra.length) {
        try {
          await upsert(without(extra))
          saved = true
          errors.contact = `Match attributes not saved (check they exist in Brevo: ${extra.join(', ')}): ${why}`
        } catch {
          /* fall through to saving without any match attributes */
        }
      }
      if (!saved) {
        await upsert(without(names))
        errors.contact = `Match attributes not saved (check they exist in Brevo: ${names.join(', ')}): ${why}`
      }
      console.error('[brevo] sync-order:', errors.contact)
    }
  } catch (e) {
    result.contact = 'error'
    errors.contact = e instanceof Error ? e.message : 'Unknown error'
  }

  // 2. Upsert order (Brevo eCommerce — powers order-status automations)
  try {
    await brevoFetch('/orders/status', {
      method: 'POST',
      body: JSON.stringify({
        id: String(body.order.id),
        status: body.status,
        amount: body.order.amount,
        createdAt: body.order.createdAt,
        updatedAt: body.order.updatedAt,
        products: [{ productId: body.product, price: body.order.amount }],
        identifiers: { email_id: body.customer.email },
        metaInfo: body.meta as Record<string, string> | undefined,
      }),
    })
  } catch (e) {
    result.order = 'error'
    errors.order = e instanceof Error ? e.message : 'Unknown error'
  }

  // 3. Lifecycle event (behaviour-based automations), e.g. matchday_order_confirmed
  try {
    await brevoFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: `${body.product}_order_${body.status}`,
        identifiers: { email_id: body.customer.email },
        event_properties: {
          order_id: String(body.order.id),
          amount: body.order.amount,
          currency: body.order.currency,
          ...body.meta,
        },
      }),
    })
  } catch (e) {
    result.event = 'error'
    errors.event = e instanceof Error ? e.message : 'Unknown error'
  }

  if (Object.keys(errors).length) result.errors = errors
  return NextResponse.json(result, { status: result.contact === 'error' ? 502 : 200 })
}
