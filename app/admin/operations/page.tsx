import type { Metadata } from "next";
import { Suspense } from "react";
import OperationsClient from "./client";

export const metadata: Metadata = {
  title: "Operations | Golafly Admin",
  description: "Stays back-office — cancellation requests and supplier reconciliation.",
};

/* Suspense because the client reads useSearchParams for its tab — without it
   prerendering bails out and the build fails, same as every other admin page. */
export default function AdminOperationsPage() {
  return (
    <Suspense fallback={null}>
      <OperationsClient />
    </Suspense>
  );
}
