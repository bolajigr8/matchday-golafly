// lib/support/send-support-email.ts
//
// Sends a support query to the Golafly inboxes through Brevo's transactional
// email API (the project already has BREVO_API_KEY). Server-only.
//
// Sender: contact@golafly.com (verified in Brevo). Override with SUPPORT_FROM_EMAIL;
// any other address must also be a verified Brevo sender or Brevo rejects it.

import { brevoFetch } from '@/lib/brevo/client'
import { SUPPORT_TOPICS, type SupportInput } from '@/schema/support'

export const SUPPORT_RECIPIENTS = [
  { email: 'support@golafly.com', name: 'Golafly Support' },
  { email: 'contact@golafly.com', name: 'Golafly Contact' },
]

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export async function sendSupportEmail(
  input: SupportInput,
  meta: { sourcePage?: string; ip?: string },
) {
  const topic =
    SUPPORT_TOPICS.find((t) => t.value === input.topic)?.label ?? input.topic
  // Strip CR/LF so user input can never inject extra headers.
  const subject = `[Support] ${topic} — ${input.name}`.replace(/[\r\n]+/g, ' ')

  const htmlContent = `
    <h2>New support query</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${esc(input.name)}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(input.email)}</td></tr>
      <tr><td><b>Topic</b></td><td>${esc(topic)}</td></tr>
      <tr><td><b>Order / booking ref</b></td><td>${esc(input.orderRef || '—')}</td></tr>
      <tr><td><b>Sent from</b></td><td>${esc(meta.sourcePage || '—')}</td></tr>
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${esc(input.message)}</p>
    <hr/><small>Hit Reply to answer the customer directly (Reply-To is set to their email).</small>`

  await brevoFetch('/smtp/email', {
    method: 'POST',
    body: JSON.stringify({
      sender: {
        email: process.env.SUPPORT_FROM_EMAIL || 'contact@golafly.com',
        name: 'Golafly Website',
      },
      to: SUPPORT_RECIPIENTS,
      replyTo: { email: input.email, name: input.name },
      subject,
      htmlContent,
      tags: ['support-form'],
    }),
  })
}
