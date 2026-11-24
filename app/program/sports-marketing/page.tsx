import type { Metadata } from 'next'
import { SportsMarketingClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, serviceSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/program/sports-marketing'),
  title: 'Football Sports Marketing: Sponsorship & Brands | Golafly',
  description:
    "Reach football fans with Golafly sports marketing: sponsorship, stadium advertising, matchday activations and digital partnerships for brands. Enquire now.",
}

function SportsMarketingPageView() {
  return <SportsMarketingClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function SportsMarketingPage() {
  const schema = serviceSchema({ path: '/program/sports-marketing', serviceName: 'Sports Marketing', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <SportsMarketingPageView />
      <PageFaq path='/program/sports-marketing' />
    </>
  )
}
