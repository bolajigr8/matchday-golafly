import type { Metadata } from "next";
import ReportsClient from "./client";

export const metadata: Metadata = {
  title: "Reports | Golafly Scouting",
  description: "Submitted, approved and published scouting reports.",
};

export default function ScoutReportsPage() {
  return <ReportsClient />;
}
