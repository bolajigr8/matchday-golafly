import type { Metadata } from "next";
import ScoutDashboardClient from "./client";

export const metadata: Metadata = {
  title: "Dashboard | Golafly Scouting",
  description: "Assigned players, evaluations in progress and reports awaiting review.",
};

export default function ScoutDashboardPage() {
  return <ScoutDashboardClient />;
}
