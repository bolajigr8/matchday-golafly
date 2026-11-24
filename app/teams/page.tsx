import type { Metadata } from 'next'
import { TeamsDirectoryClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, hubSchema } from '@/lib/golafly-schema'
import { metaText, teamDirectoryEntries } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/teams'),
  title: 'Football Club Tickets: Match Tickets for Any Team | Golafly',
  description:
    'Search every club on Golafly and find match tickets for any team, league or fixture. Compare seats from verified sellers and book securely online.',
}

function TeamsPageView() {
  return <TeamsDirectoryClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default async function TeamsPage() {
  const schema = hubSchema({ path: '/teams', name: 'Teams', ...metaText(metadata), items: await teamDirectoryEntries() })
  return (
    <>
      <JsonLd data={schema} />
      <TeamsPageView />
      <PageFaq path='/teams' />
    </>
  )
}
