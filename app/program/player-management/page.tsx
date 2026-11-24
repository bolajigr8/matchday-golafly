import type { Metadata } from 'next'
import { PlayerManagementClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, serviceSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/program/player-management'),
  title: 'Football Player Management & Agent Services | Golafly',
  description:
    'Golafly supports aspiring footballers with club pathways, professional representation and ongoing career guidance. Apply to start your journey today.',
}

function PlayerManagementPageView() {
  return <PlayerManagementClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function PlayerManagementPage() {
  const schema = serviceSchema({ path: '/program/player-management', serviceName: 'Player Management', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <PlayerManagementPageView />
      <PageFaq path='/program/player-management' />
    </>
  )
}
