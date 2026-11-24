import type { Metadata } from "next";
import { Suspense } from "react";
import LedgersClient from "./client";

export const metadata: Metadata = {
  title: "Ledgers | Golafly",
  description: "Every flight, stay and eSIM on your account.",
};

/* Suspense because the client reads its tab and type filter from
   useSearchParams — without a boundary, prerendering bails out. */
export default function FanLedgersPage() {
  return (
    <Suspense fallback={null}>
      <LedgersClient />
    </Suspense>
  );
}
