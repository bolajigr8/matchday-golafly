import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Create account | Golafly",
  description: "One account for tickets, flights, stays and eSIM.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
