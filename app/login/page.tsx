import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Sign in | Golafly",
  description: "Sign in to your Golafly account.",
};

/* Suspense because the client reads useSearchParams for `next` — the path the
   route guard bounced them from. */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
