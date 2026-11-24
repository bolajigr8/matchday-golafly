import type { Metadata } from "next";
import { Suspense } from "react";
import AssignedPlayersClient from "./client";

export const metadata: Metadata = {
  title: "Assigned players | Golafly Scouting",
  description: "Every player assigned to you, with evaluation and report status.",
};

export default function ScoutPlayersPage() {
  /* The client reads ?tab= via useSearchParams, so it needs a boundary. */
  return (
    <Suspense fallback={null}>
      <AssignedPlayersClient />
    </Suspense>
  );
}
