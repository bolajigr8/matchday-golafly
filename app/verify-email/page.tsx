import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Verify your email | Golafly",
};

/* Suspense because the client reads `email` and `next` from the query string. */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}
