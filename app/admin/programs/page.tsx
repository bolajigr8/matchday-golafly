import type { Metadata } from "next";
import { Suspense } from "react";
import ProgramsClient from "./client";

export const metadata: Metadata = {
  title: "Programs | Golafly Admin",
  description: "Program categories, subcategories and published programs.",
};

export default function AdminProgramsPage() {
  return (
    <Suspense fallback={null}>
      <ProgramsClient />
    </Suspense>
  );
}
