import type { Metadata } from "next";
import { Suspense } from "react";
import AcademyClient from "./client";

export const metadata: Metadata = {
  title: "Academy | Golafly Admin",
  description: "Academies, intake windows, pricing and registrations.",
};

export default function AdminAcademyPage() {
  return (
    <Suspense fallback={null}>
      <AcademyClient />
    </Suspense>
  );
}
