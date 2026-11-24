import type { Metadata } from "next";
import { Suspense } from "react";
import InternshipsClient from "./client";

export const metadata: Metadata = {
  title: "Internships | Golafly Admin",
  description: "Internship applications from the Golafly Internship page.",
};

export default function AdminInternshipsPage() {
  return (
    <Suspense fallback={null}>
      <InternshipsClient />
    </Suspense>
  );
}
