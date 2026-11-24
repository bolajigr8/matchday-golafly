import type { Metadata } from "next";
import { HelpFaqsClient } from "./client";
import { canonical } from '@/lib/seo'
import { JsonLd, faqSchema } from '@/lib/golafly-schema'
import { FAQ_CATEGORIES } from '@/store/faqs'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/help-faqs'),
  title: "Help & FAQs: Football Tickets, Payments & Refunds | Golafly",
  description:
    "Answers on ticket authenticity and delivery, payments, cancellations and refunds, travel and stadium entry. Find help for your Golafly booking here.",
};

function HelpFaqsPageView() {
  return <HelpFaqsClient />;
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function HelpFaqsPage() {
  const schema = faqSchema({
    path: '/help-faqs',
    pageName: 'Help & FAQs',
    ...metaText(metadata),
    // Word for word what the page renders (store/faqs.ts), one Question each.
    faqs: FAQ_CATEGORIES.flatMap((c) => c.items),
  })
  return (
    <>
      <JsonLd data={schema} />
      <HelpFaqsPageView />
    </>
  )
}
