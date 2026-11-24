'use client'

import Link from 'next/link'
import { Routes } from '@/routes'
import { CONTACT } from '@/store/data'

const SECTIONS: { heading: string; content: string }[] = [
  {
    heading: '1. Introduction',
    content: `Welcome to Golafly Match Day (“we”, “our”, or “us”), the matchday ticketing and travel platform operated by Golafly Ltd. By accessing our website and using our services, you agree to be bound by these Terms and Conditions.
These terms govern match tickets, hospitality, stadium tours and the travel products sold alongside them — stays, flights, transfers and eSIMs. Golafly’s football tourism, trials, sports marketing and player management programmes are governed by their own agreements.
If you do not agree to these terms, please do not use our services.`,
  },
  {
    heading: '2. Our Services',
    content: `Golafly Match Day is a booking platform for:
- Match tickets and hospitality: seats and packages sourced from independent ticket sellers (secondary market). Your admission is also subject to the club’s and stadium’s own ticket terms and stadium regulations.
- Stadium tours and experiences: guided tours and matchday experiences provided by clubs or venue partners.
- Stays: reservations at hotels and apartments operated by third parties.
- Flights: bookings on flights operated by third-party airlines, governed by the airline’s conditions of carriage in addition to these terms.
- Transfers and eSIMs: private or shared transfers, and digital eSIM data plans supplied by partner providers.
We act as an intermediary between you and the clubs, venues and travel providers. All services are subject to availability, and we may modify, suspend or discontinue any service.`,
  },
  {
    heading: '3. Your Account',
    content: `You can browse freely. An account is created at checkout so you can manage bookings, download e-tickets and track every order in one place.
You must provide accurate, current information and keep your credentials confidential. You are responsible for activity under your account.
You must be at least 18 years old to book. If you book for other attendees, you confirm you have their consent to share their details with us, the club and other relevant providers.`,
  },
  {
    heading: '4. Bookings & Payments',
    content: `• A booking is confirmed only when payment is received and a confirmation email with a booking reference is issued.
- Prices are shown in your selected currency. The amount shown at checkout is the amount charged, including taxes and platform fees unless clearly stated otherwise. We add no hidden conversion fees, though your bank may.
- We accept major credit and debit cards, Apple Pay and Google Pay. Bank transfer is available for hospitality and group bookings over €2,000.
- Selected packages over €600 may offer a split-payment plan: a deposit to confirm, with the balance due 30 days before the match. Missing a balance payment may lead to cancellation of the booking under the terms shown at checkout.
- Payments are processed by PCI-DSS compliant providers with 3-D Secure authentication. We do not store full card details on our servers.
- If an obvious pricing error occurs, we may cancel the affected booking and refund the amount paid in full.`,
  },
  {
    heading: '5. Tickets & Delivery',
    content: `• Ticket category and stand are shown before you pay. Exact seat numbers are assigned by the club closer to the match and are always within the category you purchased.
- Mobile and e-tickets are delivered to your account and email around 3–7 days before kickoff. Where a club requires physical or collection tickets, we arrange this and confirm the details in writing.
- You are responsible for checking that names, fixture, date and category on your booking are correct as soon as you receive your confirmation.
- Tickets remain the property of the issuing club or venue and are issued subject to their terms.`,
  },
  {
    heading: '6. Ticket Use & Resale',
    content: `• Tickets are for your personal use, or the use of the attendees named on your booking. Some fixtures require matching photo ID at the gate.
- Tickets must not be resold, transferred or advertised for profit, or used for advertising, promotions or competitions, unless the club’s terms and the law allow it.
- A club or venue may cancel or refuse entry to any ticket that has been resold or transferred in breach of its rules, and we are not liable for the consequences.
- We may cancel a booking where we reasonably suspect fraud or misuse.`,
  },
  {
    heading: '7. Changes, Cancellations & Rescheduled Matches',
    content: `• Stadium tours and flexible tickets can be changed or cancelled up to 48 hours before the event for a full credit.
- Category-1 and hospitality tickets follow the club’s terms, shown before you pay and in your confirmation.
- If a match is postponed or rescheduled, your tickets remain valid for the new date. If you cannot attend, we will offer to rebook you for an alternative fixture or refund the ticket value where the club permits.
- Flights and stays are governed by the fare rules and property cancellation windows shown before checkout.
Refund amounts and timelines are described in our Refund Policy, which forms part of these terms.`,
  },
  {
    heading: '8. Stadium Entry & Conduct',
    content: `• You must follow the stadium’s entry conditions and code of conduct, including the bag policy and list of prohibited items provided with your booking.
- Arrive at least 60–90 minutes before kickoff to clear security.
- Clubs and stadium staff may refuse or revoke entry, without refund, for breach of stadium rules or unsafe or abusive behaviour.
- Accessible seating is available at partner venues. Add accessibility requirements during booking and your concierge will confirm arrangements.`,
  },
  {
    heading: '9. Travel Documents & Requirements',
    content: `You are responsible for ensuring that all attendees hold valid passports, visas and any required documentation for the journey, including transit points.
Names on bookings must match travel and ID documents exactly. We can provide booking confirmations and invitation letters to support visa applications, but visa decisions rest with the destination authorities. We are not liable for denied boarding or entry resulting from missing or incorrect documentation.`,
  },
  {
    heading: '10. Liability',
    content: `Golafly Match Day acts as an intermediary between you and clubs, venues and travel providers (airlines, properties, transfer and network operators, payment processors). We are not liable for:
- Acts or omissions of third-party providers, including delays, cancellations, overbooking or service quality
- Changes to fixtures, kickoff times, venues or line-ups decided by clubs, leagues or authorities
- Matches played behind closed doors, or with reduced capacity, where the organiser’s rules apply
- Failure to obtain visas or meet entry requirements
- Losses caused by force majeure events
Nothing in these terms limits liability that cannot be limited by law. Our total liability is otherwise limited to the amount paid for the specific booking in question.`,
  },
  {
    heading: '11. Intellectual Property',
    content: `All content on this site — including text, graphics, logos and design — is owned by Golafly Ltd or its licensors. Club names, crests and competition marks belong to their respective owners and are used only to identify fixtures. Reproduction without written permission is prohibited.`,
  },
  {
    heading: '12. Governing Law',
    content: `These Terms & Conditions are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
For international customers, we agree to seek resolution through arbitration before pursuing legal action.`,
  },
  {
    heading: '13. Contact',
    content: `For questions regarding these terms, please contact:
Email: ${CONTACT.email}
Phone: ${CONTACT.phone}
Golafly Match Day is operated by Golafly Ltd, 128 City Road, London EC1V 2NX, United Kingdom.`,
  },
]

export function TermsAndConditionsClient() {
  return (
    <div className='min-h-screen bg-background'>
      <section className='mx-auto w-full max-w-[800px] px-5 pt-20 pb-14 sm:px-6 sm:pt-32 sm:pb-20 lg:px-8'>
        <div className='inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary'>
          <span className='size-1.5 shrink-0 rounded-full bg-primary' />
          Golafly Match Day · Legal
        </div>
        <h1 className='mt-4 mb-2 font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-5xl'>
          Terms &amp; Conditions
        </h1>
        <p className='mb-8 text-sm text-muted-foreground sm:mb-12'>
          Last updated: September 2026
        </p>

        {SECTIONS.map((s) => (
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
            Questions about these terms? Write to{' '}
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
            </Link>{' '}
            — we typically reply within a few hours, and faster on matchdays.
          </p>
        </div>
      </section>
    </div>
  )
}
