import { Suspense } from "react";
import type { Metadata } from "next";
import { ManageBookingClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Manage booking | Golafly",
  description: "View your flight booking, check refundability, and request a cancellation.",
};

export default function ManageBookingPage() {
  return (
    <Suspense fallback={<div className="page-container py-12"><div className="h-40 animate-pulse rounded-xl bg-muted" /></div>}>
      <ManageBookingClient />
    </Suspense>
  );
}
