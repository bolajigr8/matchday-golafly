// lib/brevo/leads.ts
//
// Sends an exit-popup (or package-inquiry) lead to Brevo, alongside the
// HubSpot submission in app/api/hubspot/exit-intent/route.ts.
//
// Segmentation uses Brevo LISTS and an EVENT — not custom contact
// attributes — so it works with no setup beyond creating the lists:
//   • BREVO_LIST_LEADS_FAN     → fan leads
//   • BREVO_LIST_LEADS_PLAYER  → player leads
//   • BREVO_LIST_LEADS         → leads with no fan/player choice (inquiry card)
//   • event "exit_popup_lead" with { lead_type, source_page } for automations
// Every list id is optional; a missing one is simply skipped.

import { brevoFetch } from './client'

export interface BrevoLeadInput {
  firstName: string
  email: string
  phone?: string
  leadType?: 'fan' | 'player'
  sourcePage?: string
  /** Landing site key when the lead came from a landing page. */
  site?: string
}

function listId(name: string): number | undefined {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Brevo only accepts SMS numbers in international format (+2348012345678). */
function toE164(phone?: string): string | undefined {
  if (!phone) return undefined
  const cleaned = phone.replace(/[\s().-]/g, '')
  return /^\+\d{8,15}$/.test(cleaned) ? cleaned : undefined
}

export async function upsertBrevoLead(input: BrevoLeadInput): Promise<void> {
  const lists = [
    input.leadType === 'fan'
      ? listId('BREVO_LIST_LEADS_FAN')
      : input.leadType === 'player'
        ? listId('BREVO_LIST_LEADS_PLAYER')
        : listId('BREVO_LIST_LEADS'),
  ].filter((x): x is number => x !== undefined)

  const sms = toE164(input.phone)
  const send = (withSms: boolean) =>
    brevoFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        attributes: {
          FIRSTNAME: input.firstName,
          ...(withSms && sms ? { SMS: sms } : {}),
        },
        listIds: lists.length ? lists : undefined,
        updateEnabled: true,
      }),
    })

  // Brevo rejects the whole contact if the phone number already belongs to
  // another contact (or is otherwise invalid) — retry without it so the lead
  // itself is never lost.
  try {
    await send(true)
  } catch (err) {
    if (!sms) throw err
    await send(false)
  }

  // Event for automations (e.g. "send the player-trials email"). Best effort.
  await brevoFetch('/events', {
    method: 'POST',
    body: JSON.stringify({
      event_name: 'exit_popup_lead',
      identifiers: { email_id: input.email },
      event_properties: {
        lead_type: input.leadType ?? 'unspecified',
        first_name: input.firstName,
        source_page: input.sourcePage ?? '',
        site: input.site ?? 'main',
      },
    }),
  }).catch((err) => console.error('[brevo] lead event failed', err))
}
