import type { Metadata } from 'next'
import { InternationalDirectoryClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, hubSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/international'),
  title: 'International Football Tickets: National Teams | Golafly',
  description:
    'Buy tickets for national team matches, from Nations League games to qualifiers and friendlies. Verified sellers, secure checkout and easy booking.',
}

function InternationalPageView() {
  return <InternationalDirectoryClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function InternationalPage() {
  const schema = hubSchema({ path: '/international', name: 'International', ...metaText(metadata), items: [] }) // list loads in the browser → no ItemList (plan §9)
  return (
    <>
      <JsonLd data={schema} />
      <InternationalPageView />
      <PageFaq path='/international' />
    </>
  )
}
