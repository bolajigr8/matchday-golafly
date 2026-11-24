import type { Metadata } from "next";
import DashboardClient from "./client";

export const metadata: Metadata = {
  title: "Overview | Golafly Admin",
  description: "Applications, approvals, revenue and recent activity across every Golafly program.",
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
