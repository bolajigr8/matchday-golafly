import type { Metadata } from "next";
import MatchesClient from "./client";
import { canonical } from '@/lib/seo'
import { PageFaq } from '@/components/shared/page-faq'
import { JsonLd, hubSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/matches'),
  title: "Football Match Tickets: Upcoming Fixtures & Prices | Golafly",
  description:
    "Browse upcoming football fixtures across Europe's top leagues and cups. Compare prices, pick verified seats and book match tickets with Golafly.",
};

function MatchesPageView() {
  // The Suspense boundary for useSearchParams() lives INSIDE MatchesClient,
  // around LiveFixturesSection only. Wrapping the whole client here made the
  // server send an empty page (fallback={null}), so the hero's <h1> and the
  // other static sections were missing from the raw HTML (SEO re-crawl,
  // Nov 2026).
  return <MatchesClient />;
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function MatchesPage() {
  const schema = hubSchema({ path: '/matches', name: 'Matches', ...metaText(metadata), items: [] }) // fixtures load in the browser → no ItemList (plan §9)
  return (
    <>
      <JsonLd data={schema} />
      <MatchesPageView />
      <PageFaq path='/matches' />
    </>
  )
}
