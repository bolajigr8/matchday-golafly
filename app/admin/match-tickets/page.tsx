import type { Metadata } from "next";
import { Suspense } from "react";
import MatchTicketsClient from "./client";

export const metadata: Metadata = {
  title: "MatchTickets | Golafly Admin",
  description: "Matchday ticket orders.",
};

/* The client reads its filters from the URL (useSearchParams), so it sits in
   a Suspense boundary (next/dist/docs … use-search-params.md, Prerendering). */
export default function AdminMatchTicketsPage() {
  return (
    <Suspense fallback={null}>
      <MatchTicketsClient />
    </Suspense>
  );
}
