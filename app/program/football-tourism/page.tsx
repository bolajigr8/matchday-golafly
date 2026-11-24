import type { Metadata } from 'next'
import { FootballTourismClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, serviceSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/program/football-tourism'),
  title: 'Football Tourism in Europe: Match Trips & Tours | Golafly',
  description:
    'Plan a football trip to Europe with Golafly. Match tickets, stadium tours and club experiences managed for fans, families and groups. Enquire today.',
}

function FootballTourismPageView() {
  return <FootballTourismClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function FootballTourismPage() {
  const schema = serviceSchema({ path: '/program/football-tourism', serviceName: 'Football Tourism', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <FootballTourismPageView />
      <PageFaq path='/program/football-tourism' />
    </>
  )
}
