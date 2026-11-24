import type { Metadata } from "next";
import MatchdayClient from "./client";
import { canonical } from "@/lib/seo";
import { JsonLd, homeSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

// https://golafly.com/ — the only canonical with a trailing slash.
export const metadata: Metadata = {
  alternates: canonical("/"),
  title: "Football Tickets, Flights & Hotels for Matchday | Golafly",
  description:
    "Buy football match tickets, flights, hotels and an eSIM in one checkout. Verified sellers and a 150% order guarantee for Europe's biggest matches.",
};

function HomeView() {
  return (
    <MatchdayClient/>
  );
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function Home() {
  const schema = homeSchema(metaText(metadata))
  return (
    <>
      <JsonLd data={schema} />
      <HomeView />
    </>
  )
}
