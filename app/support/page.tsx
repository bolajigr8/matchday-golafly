import type { Metadata } from 'next'
import { SupportClient } from './client'
import { canonical } from '@/lib/seo'
import { SUPPORT_TOPICS } from '@/schema/support'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/support'),
  title: 'Contact Golafly Support: Tickets, Bookings & Refunds',
  description:
    'Need help with a payment, booking, ticket or refund? Send Golafly support a message and we will reply by email. Include your order number for faster help.',
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const { topic } = await searchParams
  const initialTopic = SUPPORT_TOPICS.some((t) => t.value === topic)
    ? (topic as (typeof SUPPORT_TOPICS)[number]['value'])
    : 'other'
  // JSON-LD (SEO schema plan §11.4): ContactPage about the Organization.
  const schema = simplePageSchema({
    path: '/support',
    pageName: 'Support',
    type: 'ContactPage',
    ...metaText(metadata),
  })
  return (
    <>
      <JsonLd data={schema} />
      <SupportClient initialTopic={initialTopic} />
    </>
  )
}
