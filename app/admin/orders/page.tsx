import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersClient from "./client";

export const metadata: Metadata = {
  title: "Orders | Golafly Admin",
  description: "Flight, eSIM and stays orders across the travel products.",
};

/* Suspense because the client reads useSearchParams for its tab — without it
   prerendering bails out and the build fails, same as every other admin page. */
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersClient />
    </Suspense>
  );
}
