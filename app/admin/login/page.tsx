import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoginClient from "./client";

export const metadata: Metadata = {
  title: "Sign in | Golafly Admin",
  description: "Sign in to the Golafly admin dashboard.",
};

export default function AdminLoginPage() {
  /* The client reads ?next= via useSearchParams, so it needs a Suspense
     boundary — same as app/apply-now/page.tsx. */
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <AdminLoginClient />
    </Suspense>
  );
}
