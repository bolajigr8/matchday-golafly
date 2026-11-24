import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TermsAndConditionsClient } from './client'
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/legal/terms'),
  title: 'Terms & Conditions: Booking Football Tickets with Golafly',
  description:
    'Golafly terms and conditions for match tickets, hospitality, payments, changes, stadium entry and liability. Read before you book your matchday.',
}

function TermsAndConditionsPageView() {
  return (
    <Suspense fallback={null}>
      <TermsAndConditionsClient />
    </Suspense>
  )
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function TermsAndConditionsPage() {
  const schema = simplePageSchema({ path: '/legal/terms', pageName: 'Terms & Conditions', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <TermsAndConditionsPageView />
    </>
  )
}
