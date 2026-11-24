import type { Metadata } from "next";
import { Suspense } from "react";
import OffersClient from "./client";

export const metadata: Metadata = {
  title: "Offers | Golafly Admin",
  description: "Create and manage offers, offer categories and candidate applications.",
};

export default function AdminOffersPage() {
  /* The client reads ?tab= via useSearchParams, so it needs a boundary. */
  return (
    <Suspense fallback={null}>
      <OffersClient />
    </Suspense>
  );
}
