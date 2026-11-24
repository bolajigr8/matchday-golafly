import { Suspense } from "react";
import type { Metadata } from "next";
import { ExtrasClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Build Your Bundle | Golafly",
  description: "Add a hotel and flights to complete your football matchday experience.",
};

export default function ExtrasPage() {
  return (
    <Suspense fallback={
      <div className="page-container py-10 sm:py-12">
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-16 rounded-xl bg-muted" />
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    }>
      <ExtrasClient />
    </Suspense>
  );
}
