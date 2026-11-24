import { Suspense } from "react";
import type { Metadata } from "next";
import { FlightsClient } from "./client";
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'
import { PageTitleBand } from '@/components/shared/page-title-band'
import { BlackFridayCard } from '@/components/promo/black-friday'

export const metadata: Metadata = {
  alternates: canonical('/flights'),
  title: "Flights to Football Matches: Compare & Book | Golafly",
  description: "Search and compare flights to your next football match. Book your flight alongside tickets and a hotel on Golafly for one simple matchday trip.",
};

function FlightsPageView() {
  return (
    <Suspense fallback={<div className="page-container py-10"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>}>
      <FlightsClient />
    </Suspense>
  );
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function FlightsPage() {
  const schema = simplePageSchema({ path: '/flights', pageName: 'Flights', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      {/* Outside the Suspense boundary: the <h1> is in the server HTML. */}
      <PageTitleBand
        title='Flights to football matches'
        subtitle='Compare fares and book your flight to the next match.'
      />
      {/* Black Friday 2026 card (only during the sale) */}
      <BlackFridayCard className='page-container pt-6' />
      <FlightsPageView />
    </>
  )
}
