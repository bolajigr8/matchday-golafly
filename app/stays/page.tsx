import type { Metadata } from "next";
import { StaysClient } from "./client";
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'
import { PageTitleBand } from '@/components/shared/page-title-band'

export const metadata: Metadata = {
  alternates: canonical('/stays'),
  title: "Hotels Near Football Stadiums: Matchday Stays | Golafly",
  description: "Find and book hotels near football stadiums. Compare matchday stays by location and price, and add a room to your match ticket booking on Golafly.",
};

function StaysPageView() {
  return <StaysClient />;
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function StaysPage() {
  const schema = simplePageSchema({ path: '/stays', pageName: 'Stays', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      {/* SEO only (user-approved, Nov 2026): the page's <h1>, rendered on
          the server. Nothing else in Stays is changed. */}
      <PageTitleBand
        title='Hotels near football stadiums'
        subtitle='Find a place to stay close to the ground on matchday.'
      />
      <StaysPageView />
    </>
  )
}
