import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AboutClient } from './client'
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/about'),
  title: 'About Golafly: Football Tickets & Matchday Travel Platform',
  description:
    'Golafly is the home of authentic football match tickets and matchday travel. Book tickets, stays and flights together. Offices in London and Barcelona.',
}

function AboutPageView() {
  return (
    <Suspense fallback={null}>
      <AboutClient />
    </Suspense>
  )
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function AboutPage() {
  const schema = simplePageSchema({ path: '/about', pageName: 'About', ...metaText(metadata), type: 'AboutPage' })
  return (
    <>
      <JsonLd data={schema} />
      <AboutPageView />
    </>
  )
}
