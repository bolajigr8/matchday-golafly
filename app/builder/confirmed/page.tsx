import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmedClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Booking Confirmed! | Golafly",
  description: "Your football matchday experience is booked. Download your e-tickets.",
};

export default function ConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmedClient />
    </Suspense>
  );
}
