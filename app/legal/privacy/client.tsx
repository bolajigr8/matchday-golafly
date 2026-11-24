'use client'

import Link from 'next/link'
import { Routes } from '@/routes'
import { CONTACT } from '@/store/data'

const SECTIONS: { heading: string; content: string }[] = [
  {
    heading: '1. Introduction',
    content: `This Privacy Policy explains how Golafly Match Day (“we”, “our”, “us”) collects, uses and protects your personal data when you use our website and booking services for match tickets, hospitality and matchday travel.
Golafly Match Day is operated by Golafly Ltd, which acts as the data controller for the processing described here. Data collected through Golafly’s football programme applications (trials, player management, internships) is covered by the notices shown on those forms.`,
  },
  {
    heading: '2. Data We Collect',
    content: `• Account data: name, email address, phone number, country and communication preferences.
- Attendee details: names of everyone on a ticket booking and, where a club or stadium requires it for restricted fixtures, date of birth and photo ID details.
- Travel details: names, dates of birth and passport or ID details where an airline or authority requires them for ticketing.
- Booking data: matches, seat categories, hospitality packages, stays, flights, transfers, eSIM plans, booking references and support history.
- Payment data: processed by our payment providers. We receive only tokenised references and the last four digits of the card — never full card numbers.
- Device & usage data: IP address, browser type, pages visited and interactions, collected through cookies and similar technologies.`,
  },
  {
    heading: '3. How We Use Your Data',
    content: `We process your data to:
- Complete and manage your bookings (contract performance)
- Send booking confirmations, e-tickets, travel documents and matchday updates
- Provide customer support and resolve disputes
- Verify attendees where a club or venue requires it, and prevent ticket fraud and misuse
- Personalise offers and send our matchday briefing, where you have consented
- Comply with legal obligations (tax, aviation and border regulations)`,
  },
  {
    heading: '4. Who We Share It With',
    content: `We share personal data only as needed to deliver what you booked:
- Clubs, venues and hospitality partners — attendee names and, where required, ID details for ticketing, entry and security
- Airlines — traveller names and documents required for ticketing and check-in
- Properties and transfer providers — guest names and trip details for your reservation
- eSIM network operators — the details needed to provision your data plan
- Payment processors — to process and, where applicable, refund payments
- Authorities — where required by law (for example, advance passenger information or stadium safety requirements)
We never sell your personal data, and providers may use the data we pass on only to deliver the booked service.`,
  },
  {
    heading: '5. Cookies',
    content: `We use essential cookies to keep the site working (sessions, cart, security, theme preference) and analytics cookies to understand how the platform is used. You can control non-essential cookies from your browser settings; blocking essential cookies may prevent checkout from working.`,
  },
  {
    heading: '6. Marketing',
    content: `If you subscribe to the Golafly briefing or opt in at checkout, we send offers, fixture news and football insights. You can unsubscribe at any time using the link in any email. Service messages about your bookings — such as confirmations and ticket delivery — are not marketing and will continue.`,
  },
  {
    heading: '7. Your Rights',
    content: `Under the GDPR and equivalent laws, you can:
- Access a copy of the personal data we hold about you
- Correct inaccurate data
- Request deletion of your data (“right to be forgotten”)
- Receive your data in a portable format
- Object to or restrict certain processing, including marketing
To exercise any of these rights, email ${CONTACT.email}. We respond within 30 days. You may also complain to your local data protection authority.`,
  },
  {
    heading: '8. Data Retention',
    content: `We keep booking records for as long as needed to provide the service and meet legal obligations (typically up to 7 years for financial records). Account data is deleted or anonymised when you close your account, except where retention is legally required.`,
  },
  {
    heading: '9. Security',
    content: `Data is encrypted in transit (TLS) and at rest. Access to personal data is limited to staff who need it, under confidentiality obligations. Payments use 3-D Secure authentication through certified processors.`,
  },
  {
    heading: '10. International Transfers',
    content: `Because matches and travel are international, your data may be transferred to clubs, venues and providers outside your country. Where data leaves the UK or EEA, we rely on adequacy decisions or standard contractual clauses.`,
  },
  {
    heading: '11. Changes to This Policy',
    content: `We may update this policy as the platform evolves. Material changes are announced by email or on the site before they take effect. The “Last updated” date at the top always reflects the current version.`,
  },
  {
    heading: '12. Contact',
    content: `For privacy questions or to exercise your rights:
Email: ${CONTACT.email}
Golafly Match Day is operated by Golafly Ltd, 128 City Road, London EC1V 2NX, United Kingdom.`,
  },
]

export function PrivacyPolicyClient() {
  return (
    <div className='min-h-screen bg-background'>
      <section className='mx-auto w-full max-w-[800px] px-5 pt-20 pb-14 sm:px-6 sm:pt-32 sm:pb-20 lg:px-8'>
        <div className='inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary'>
          <span className='size-1.5 shrink-0 rounded-full bg-primary' />
          Golafly Match Day · Legal
        </div>
        <h1 className='mt-4 mb-2 font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-5xl'>
          Privacy Policy
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
            Questions about your data? Write to{' '}
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
