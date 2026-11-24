import type { Metadata } from "next";
import { Suspense } from "react";
import TicketsClient from "./client";

export const metadata: Metadata = {
  title: "Tickets | Golafly Admin",
  description: "Match-ticket inventory: fixtures, listings and allocations.",
};

/* Suspense because the client reads useSearchParams for its tab — without it
   prerendering bails out and the build fails, same as every other admin page. */
export default function AdminTicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsClient />
    </Suspense>
  );
}
