import type { Metadata } from "next";
import { Suspense } from "react";
import ScoutsClient from "./client";

export const metadata: Metadata = {
  title: "Scouts | Golafly Admin",
  description: "Scout accounts and the players assigned to each of them.",
};

export default function AdminScoutsPage() {
  /* Suspense because the client reads useSearchParams for its tab — without it
     prerendering bails out and the build fails, same as every other admin page
     with tabs. (Players has no boundary because its client has no tabs.) */
  return (
    <Suspense fallback={null}>
      <ScoutsClient />
    </Suspense>
  );
}
