import type { Metadata } from 'next'
import { TrialShowcaseClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, serviceSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/tourism/trials'),
  title: 'Football Trials & Scouting Camp in Barcelona | Golafly',
  description:
    "Join a football trial and showcase in Barcelona. Train, compete and get seen by scouts with Golafly's scouting camp. Check dates and apply online today.",
}

function TrialShowcasePageView() {
  return <TrialShowcaseClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function TrialShowcasePage() {
  const schema = serviceSchema({ path: '/tourism/trials', serviceName: 'Football Trials & Scouting Camp', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <TrialShowcasePageView />
      <PageFaq path='/tourism/trials' />
    </>
  )
}
