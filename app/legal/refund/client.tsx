'use client'

import Link from 'next/link'
import { Routes } from '@/routes'
import { CONTACT } from '@/store/data'

const REFUND_ROWS: [string, string, string][] = [
  [
    'Flexible tickets & stadium tours',
    'Up to 48 hours before the event',
    'Full credit',
  ],
  [
    'Category-1 & hospitality tickets',
    'Per the club’s terms, shown before you pay',
    'As per club terms',
  ],
  [
    'Match postponed or rescheduled',
    'Automatic',
    'Tickets valid for the new date; rebook or refund where the club permits',
  ],
  ['Match cancelled', 'Automatic', 'Full refund of the ticket value'],
  ['Stays — free cancellation', 'Until the property deadline', 'Full refund'],
  [
    'Stays — after deadline / non-refundable',
    'Not cancellable for refund',
    'No refund',
  ],
  [
    'Flights — refundable fare',
    'Up to departure, per fare rules',
    'Full refund minus any airline fee',
  ],
  [
    'Flights — non-refundable fare',
    'Not cancellable for refund',
    'Refundable taxes only, where applicable',
  ],
  ['eSIM — not activated', 'Within 30 days of purchase', 'Full refund'],
  ['eSIM — activated', 'Not returnable', 'No refund'],
]

function RefundSummaryTable() {
  return (
    <div className='-mx-5 my-5 overflow-x-auto border-y border-border sm:mx-0 sm:my-6 sm:rounded-xl sm:border-x'>
      <table className='w-full min-w-[560px] border-collapse text-sm sm:min-w-0'>
        <thead>
          <tr className='border-b border-border bg-muted/30'>
            <th className='whitespace-nowrap px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
              Product
            </th>
            <th className='whitespace-nowrap px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
              Cancellation window
            </th>
            <th className='whitespace-nowrap px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
              Refund
            </th>
          </tr>
        </thead>
        <tbody>
          {REFUND_ROWS.map((row, i) => (
            <tr
              key={row[0]}
              className={
                i !== REFUND_ROWS.length - 1 ? 'border-b border-border' : ''
              }
            >
              <td className='px-4 py-3.5 align-top font-semibold text-foreground'>
                {row[0]}
              </td>
              <td className='px-4 py-3.5 align-top text-muted-foreground'>
                {row[1]}
              </td>
              <td
                className={`px-4 py-3.5 align-top ${row[2].startsWith('Full') ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
              >
                {row[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SECTIONS: { heading: string; content: string }[] = [
  {
    heading: '1. Overview',
    content: `Refunds on Golafly Match Day depend on the product you booked, the club’s terms and the rules shown at checkout. The exact conditions for your booking always appear before you pay and again in your confirmation email — those conditions are the ones that apply.
The table below summarises the standard rules; sections 2–5 explain each product in detail.`,
  },
  {
    heading: '2. Match Tickets & Hospitality',
    content: `• Flexible tickets and stadium tours can be changed or cancelled up to 48 hours before the event for a full credit.
- Category-1 and hospitality tickets follow the club’s terms, which are shown clearly before you pay and in your confirmation. Where a club’s terms do not allow cancellation, the ticket is not refundable.
- If a match is postponed or rescheduled, your tickets remain valid for the new date. If you cannot attend the new date, we will rebook you for an alternative fixture or refund the ticket value where the club permits.
- If a match is cancelled and not replayed, you are entitled to a refund of the ticket value.
- Tickets are not refundable for reasons such as a change of plans, team line-up changes, kickoff time changes announced by the league or broadcaster, or refused entry for breaching stadium rules.
- If we cannot deliver your ticket or the club cannot honour your booked category, we will offer a comparable alternative or refund the ticket in full.`,
  },
  {
    heading: '3. Stays',
    content: `• Each property sets its own cancellation policy, displayed before checkout and in your confirmation.
- Free-cancellation rates refund in full when cancelled before the property’s deadline (typically 24–72 hours before check-in, local property time).
- Cancellations after the deadline, non-refundable rates and no-shows are not refunded.
- If a property cannot honour a confirmed reservation, we rebook you in comparable accommodation or refund the stay in full.`,
  },
  {
    heading: '4. Flights',
    content: `• Every fare is sold under the airline’s fare rules, shown before checkout. Refundable fares can be cancelled up to departure; the airline may deduct a cancellation fee set in the fare rules.
- Non-refundable fares are not eligible for a refund of the fare. Where regulations allow, refundable taxes and charges are returned on request.
- If the airline cancels your flight or makes a significant schedule change, you are entitled to a full refund or free rebooking — we will contact you with the options.`,
  },
  {
    heading: '5. Transfers & eSIMs',
    content: `• Transfers can be cancelled free of charge until the deadline shown at booking; after that they are not refundable.
- An eSIM that has not been activated can be refunded in full within 30 days of purchase.
- Once activated, an eSIM cannot be returned or refunded, including partially used data plans.
- If the eSIM fails to work on a compatible, unlocked device, contact support first — most issues are fixed in minutes. Where our partner operator confirms a technical fault we cannot resolve, we refund in full even after activation.`,
  },
  {
    heading: '6. Processing Times',
    content: `Approved refunds are returned to the original payment method within 5–10 business days. Your bank or card issuer may take additional days to post the amount. Refunds are made in the currency of the original payment; exchange-rate differences are outside our control.
For bookings paid in instalments, refunds are based on the amount actually paid and the terms of the booking.`,
  },
  {
    heading: '7. How to Request a Refund',
    content: `1. Sign in and open My Bookings.
2. Select the booking and choose “Request refund” — eligible options are shown with the amount before you confirm.
3. Prefer email? Write to ${CONTACT.email} with your booking reference and we will handle it for you. For hospitality and group bookings, you can also use the priority WhatsApp concierge.
You will receive a confirmation when the request is submitted and another when the refund is processed.`,
  },
  {
    heading: '8. Contact',
    content: `For refund questions, please contact:
Email: ${CONTACT.email}
Phone: ${CONTACT.phone}
We typically reply within a few hours, and faster on matchdays.`,
  },
]

export function RefundPolicyClient() {
  return (
    <div className='min-h-screen bg-background'>
      <section className='mx-auto w-full max-w-[800px] px-5 pt-20 pb-14 sm:px-6 sm:pt-32 sm:pb-20 lg:px-8'>
        <div className='inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary'>
          <span className='size-1.5 shrink-0 rounded-full bg-primary' />
          Golafly Match Day · Legal
        </div>
        <h1 className='mt-4 mb-2 font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-5xl'>
          Refund Policy
        </h1>
        <p className='mb-8 text-sm text-muted-foreground sm:mb-12'>
          Last updated: September 2026
        </p>

        <div className='mb-8 sm:mb-10'>
          <h2 className='mb-3 font-heading text-lg font-semibold text-foreground sm:mb-4 sm:text-xl'>
            {SECTIONS[0].heading}
          </h2>
          <p className='whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            {SECTIONS[0].content}
          </p>
        </div>

        <RefundSummaryTable />

        {SECTIONS.slice(1).map((s) => (
          <div key={s.heading} className='mb-8 sm:mb-10'>
            <h2 className='mb-3 font-heading text-lg font-semibold text-foreground sm:mb-4 sm:text-xl'>
              {s.heading}
            </h2>
            <p className='whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
              {s.content}
            </p>
          </div>
        ))}

        <div className='mt-12 rounded-xl border border-border bg-muted/30 p-5 sm:mt-16 sm:p-6'>
          <p className='text-[15px] text-foreground/90 sm:text-base'>
            Not sure which rule applies to your booking? Write to{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className='text-primary hover:underline'
            >
              {CONTACT.email}
            </a>{' '}
            or visit{' '}
            <Link
              href={Routes.helpFaqs}
              className='text-primary hover:underline'
            >
              Help &amp; FAQs
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
