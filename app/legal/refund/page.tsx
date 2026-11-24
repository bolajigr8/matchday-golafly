import { Suspense } from 'react'
import type { Metadata } from 'next'
import { RefundPolicyClient } from './client'
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/legal/refund'),
  title: 'Refund Policy: Ticket Cancellations & Rescheduled Matches',
  description:
    'Golafly refund rules for match tickets, hotels, flights and eSIMs: cancellation windows, rescheduled matches, processing times and how to request a refund.',
}

function RefundPolicyPageView() {
  return (
    <Suspense fallback={null}>
      <RefundPolicyClient />
    </Suspense>
  )
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function RefundPolicyPage() {
  const schema = simplePageSchema({ path: '/legal/refund', pageName: 'Refund Policy', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <RefundPolicyPageView />
    </>
  )
}
