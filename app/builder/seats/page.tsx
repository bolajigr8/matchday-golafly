import { Suspense } from "react";
import type { Metadata } from "next";
import { SeatsClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Choose Your Seats | Golafly",
  description: "Select your seat category and number of tickets for your football matchday experience.",
};

export default function SeatsPage() {
  return (
    <Suspense fallback={
      <div className="page-container py-10 sm:py-12">
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    }>
      <SeatsClient />
    </Suspense>
  );
}
