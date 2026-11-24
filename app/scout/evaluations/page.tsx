import type { Metadata } from "next";
import { Suspense } from "react";
import EvaluationsClient from "./client";

export const metadata: Metadata = {
  title: "Evaluations | Golafly Scouting",
  description: "Open evaluations, and the ones an admin has approved.",
};

export default function ScoutEvaluationsPage() {
  /* The client reads ?tab= via useSearchParams. Without a boundary,
     prerendering bails out and the build fails — same as every other tabbed
     screen in the app (app/scout/players, app/admin/scouts, and the rest).
     This page only needed one once the tabs were added to it. */
  return (
    <Suspense fallback={null}>
      <EvaluationsClient />
    </Suspense>
  );
}
