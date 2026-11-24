import type { Metadata } from "next";
import { Suspense } from "react";
import SettingsClient from "./client";

export const metadata: Metadata = {
  title: "Settings | Golafly Admin",
  description: "Profile, security and notification preferences.",
};

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsClient />
    </Suspense>
  );
}
