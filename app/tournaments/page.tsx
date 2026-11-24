import type { Metadata } from 'next'
import { TournamentsDirectoryClient } from './client'
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, hubSchema } from '@/lib/golafly-schema'
import { metaText, tournamentDirectoryEntries } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/tournaments'),
  title: 'Football Leagues & Cups Tickets: All Tournaments | Golafly',
  description:
    'Find tickets for every league and cup on Golafly, from the Premier League and La Liga to the Champions League. Pick a competition and see all fixtures.',
}

function TournamentsPageView() {
  return <TournamentsDirectoryClient />
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default async function TournamentsPage() {
  const schema = hubSchema({ path: '/tournaments', name: 'Tournaments', ...metaText(metadata), items: await tournamentDirectoryEntries() })
  return (
    <>
      <JsonLd data={schema} />
      <TournamentsPageView />
      <PageFaq path='/tournaments' />
    </>
  )
}
