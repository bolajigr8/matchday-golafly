import type { Metadata } from "next";
import { Suspense } from "react";
import MerchantsClient from "./client";

export const metadata: Metadata = {
  title: "Merchants | Golafly Admin",
  description: "Golafly API merchants: review, approve, disable and add.",
};

export default function AdminMerchantsPage() {
  return (
    <Suspense fallback={null}>
      <MerchantsClient />
    </Suspense>
  );
}
