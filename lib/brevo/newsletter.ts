// lib/brevo/newsletter.ts
//
// Newsletter sign-ups → Brevo, alongside HubSpot in app/api/newsletter.
//
// Two modes, picked by the environment:
//   • Double opt-in (recommended for UK/EU): when BREVO_NEWSLETTER_DOI_TEMPLATE_ID
//     is set, Brevo emails a "confirm your subscription" link and only adds
//     the contact to BREVO_LIST_NEWSLETTER once it is clicked.
//   • Direct: otherwise the contact is added to the list straight away.
// Either way an event "newsletter_signup" { source, site } is recorded for
// automations (best effort).

import { brevoFetch } from './client'

export interface BrevoNewsletterInput {
  email: string
  /** Where the form was: 'footer', 'landing-footer' … */
  source: string
  /** Landing site key ('epl', 'laliga' …) or undefined on golafly.com. */
  site?: string
}

function numberEnv(name: string): number | undefined {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Resolves to 'confirm' when the visitor must click the email link first. */
export async function subscribeBrevoNewsletter(
  input: BrevoNewsletterInput,
  origin: string,
): Promise<'subscribed' | 'confirm'> {
  const listId = numberEnv('BREVO_LIST_NEWSLETTER')
  const doiTemplate = numberEnv('BREVO_NEWSLETTER_DOI_TEMPLATE_ID')
  let outcome: 'subscribed' | 'confirm'

  if (doiTemplate && listId) {
    await brevoFetch('/contacts/doubleOptinConfirmation', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        includeListIds: [listId],
        templateId: doiTemplate,
        redirectionUrl:
          process.env.BREVO_NEWSLETTER_DOI_REDIRECT_URL || `${origin}/?subscribed=1`,
      }),
    })
    outcome = 'confirm'
  } else {
    await brevoFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        listIds: listId ? [listId] : undefined,
        updateEnabled: true,
      }),
    })
    outcome = 'subscribed'
  }

  await brevoFetch('/events', {
    method: 'POST',
    body: JSON.stringify({
      event_name: 'newsletter_signup',
      identifiers: { email_id: input.email },
      event_properties: { source: input.source, site: input.site ?? 'main' },
    }),
  }).catch((err) => console.error('[brevo] newsletter event failed', err))

  return outcome
}
