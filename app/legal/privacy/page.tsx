import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PrivacyPolicyClient } from './client'
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/legal/privacy'),
  title: 'Privacy Policy: How Golafly Protects Your Personal Data',
  description:
    'How Golafly collects, uses and protects your personal data across ticket, hotel, flight and eSIM bookings, and how you can manage your choices.',
}

function PrivacyPolicyPageView() {
  return (
    <Suspense fallback={null}>
      <PrivacyPolicyClient />
    </Suspense>
  )
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function PrivacyPolicyPage() {
  const schema = simplePageSchema({ path: '/legal/privacy', pageName: 'Privacy Policy', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <PrivacyPolicyPageView />
    </>
  )
}
