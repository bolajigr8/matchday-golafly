import type { Metadata } from "next";
import PlayerScoutReportClient from "./client";

export const metadata: Metadata = {
  title: "Scout report | Golafly",
};

export default function PlayerScoutReportPage() {
  return <PlayerScoutReportClient />;
}
