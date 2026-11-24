import type { Metadata } from "next";
import { Suspense } from "react";
import TicketsClient from "./client";

export const metadata: Metadata = {
  title: "Tickets | Golafly",
};

export default function FanTicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsClient />
    </Suspense>
  );
}
