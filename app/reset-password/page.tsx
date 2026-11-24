import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Enter your code | Golafly",
};

/* Suspense because the client reads `email` (and, from an older emailed
   link, `token`) from the query string. */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
